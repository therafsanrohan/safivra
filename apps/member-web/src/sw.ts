/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

// ── Workbox Precache + Routing ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
precacheAndRoute((self as any).__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();

self.addEventListener('install', () => {
  self.skipWaiting();
});

// ── Navigate fallback (SPA) ───────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html').then(r => r ?? new Response('', { status: 503 }))
      )
    );
  }
});

// ── Web Push Received ─────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data: Record<string, string> = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: 'Safivra',
      body: event.data ? event.data.text() : 'New notification',
    };
  }

  const title = data.title || 'Safivra';
  const options: NotificationOptions = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.deduplicationKey || `safivra-${Date.now()}`,
    data: { url: data.url || '/dashboard/notifications', notificationId: data.notificationId },
    requireInteraction: data.priority === 'critical',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data as { url?: string })?.url || '/dashboard/notifications';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'NOTIFICATION_CLICKED', url: targetUrl });
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Push Subscription Change ──────────────────────────────────────────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      clientList.forEach((client) =>
        client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' })
      );
    })
  );
});
