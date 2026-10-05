import { supabase } from '@/lib/supabase/client';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Converts a base64 string to a Uint8Array for VAPID key subscription.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks whether Web Push & Service Workers are supported by the current browser environment.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Returns current permission state: 'granted' | 'denied' | 'default' | 'unsupported'.
 */
export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests browser notification permission.
 * MUST be invoked on explicit user interaction (e.g. clicking "Enable Notifications").
 */
export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[PushManager] Error requesting notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Subscribes the device to Web Push and saves the subscription to Supabase.
 */
export async function subscribeUserToPush(userId: string): Promise<boolean> {
  if (!userId || !isPushSupported()) return false;

  try {
    const permission = await requestPushPermission();
    if (permission !== 'granted') {
      console.warn('[PushManager] Permission not granted:', permission);
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      console.warn('[PushManager] Service Worker registration not ready');
      return false;
    }

    // Default VAPID key fallback (production VAPID public key via import.meta.env or safe fallback)
    const vapidPublicKey =
      import.meta.env.VITE_VAPID_PUBLIC_KEY ||
      'BEl62iUYgUivxIkv69yViEuiBIa-m9GYvH2g_v06p-8nC9l74nN66E9ZJ99zQ66u5J_Jv5177J77v8J6-J58';

    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
    }

    const subJson = subscription.toJSON();

    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      console.warn('[PushManager] Invalid subscription payload generated');
      return false;
    }

    // Detect device type
    const ua = navigator.userAgent;
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
      deviceType = 'tablet';
    } else if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
      deviceType = 'mobile';
    }

    // Upsert subscription into Supabase
    const { error } = await (supabase.from('push_subscriptions') as any).upsert(
      {
        user_id: userId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        user_agent: ua,
        device_type: deviceType,
        is_active: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id, endpoint' }
    );

    if (error) {
      console.error('[PushManager] Failed to save push subscription to DB:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[PushManager] Error subscribing to push:', err);
    return false;
  }
}

/**
 * Checks if quiet hours are currently active based on user settings (e.g. 22:30 -> 08:00).
 */
export function isQuietHoursActive(startStr: string = '22:30', endStr: string = '08:00'): boolean {
  try {
    const now = new Date();
    const curMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes > endMinutes) {
      // Overnight (e.g., 22:30 to 08:00)
      return curMinutes >= startMinutes || curMinutes < endMinutes;
    } else {
      // Same day (e.g., 13:00 to 15:00)
      return curMinutes >= startMinutes && curMinutes < endMinutes;
    }
  } catch {
    return false;
  }
}

/**
 * Displays a local browser system notification if in-foreground and permitted.
 */
export function showLocalSystemNotification(title: string, options?: NotificationOptions): void {
  if (!isPushSupported() || Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          ...options,
        });
      });
    } else {
      new Notification(title, {
        icon: '/icons/icon-192.png',
        ...options,
      });
    }
  } catch (err) {
    console.warn('[PushManager] Error displaying local system notification:', err);
  }
}
