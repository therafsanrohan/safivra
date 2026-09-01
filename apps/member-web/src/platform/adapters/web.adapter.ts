import { SafivraPlatformAdapter, SafivraPlatform, PlatformCapabilities } from '../types';
import { detectPlatform } from '../detect-platform';

class WebStorage implements PreferenceStorageAdapter {
  async get(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }
  async set(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }
  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
  async clear(): Promise<void> {
    localStorage.clear();
  }
}

class WebSecureStorage implements SecureStorageAdapter {
  async get(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }
  async set(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }
  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

class WebFiles implements FileAdapter {
  async save(filename: string, content: string, mimeType: string): Promise<void> {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

class WebSharing implements ShareAdapter {
  async share(title: string, text: string, url?: string): Promise<void> {
    if (navigator.share) {
      await navigator.share({ title, text, url });
    } else {
      // Fallback: Copy to clipboard
      const shareUrl = url || window.location.href;
      await navigator.clipboard.writeText(`${text} ${shareUrl}`.trim());
      alert('Link copied to clipboard!');
    }
  }
}

class WebNotifications implements NotificationAdapter {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async schedule(title: string, body: string, delaySeconds: number): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    setTimeout(() => {
      new Notification(title, { body });
    }, delaySeconds * 1000);
  }
}

class WebNetwork implements NetworkAdapter {
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  onStatusChange(callback: (online: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

class WebLifecycle implements LifecycleAdapter {
  onPause(callback: () => void): () => void {
    const handleVisibility = () => {
      if (document.hidden) callback();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }

  onResume(callback: () => void): () => void {
    const handleVisibility = () => {
      if (!document.hidden) callback();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }
}

class WebDeepLinks implements DeepLinkAdapter {
  onLinkReceived(): () => void {
    // Web handles deep links via standard React Router paths / URLs on launch.
    return () => {};
  }
}

// ─── Interfaces ──────────────────────────────────────────────────────────────
import {
  PreferenceStorageAdapter,
  SecureStorageAdapter,
  FileAdapter,
  ShareAdapter,
  NotificationAdapter,
  NetworkAdapter,
  LifecycleAdapter,
  DeepLinkAdapter,
} from '../types';

export class WebPlatformAdapter implements SafivraPlatformAdapter {
  platform: SafivraPlatform;
  capabilities: PlatformCapabilities;

  storage = new WebStorage();
  secureStorage = new WebSecureStorage();
  files = new WebFiles();
  sharing = new WebSharing();
  notifications = new WebNotifications();
  network = new WebNetwork();
  lifecycle = new WebLifecycle();
  deepLinks = new WebDeepLinks();

  constructor() {
    this.platform = detectPlatform();
    this.capabilities = {
      nativeContainer: false,
      biometricAuthentication: false,
      localNotifications: 'Notification' in window,
      nativeFileSave: false,
      nativeShare: !!navigator.share,
      deepLinks: false,
      secureStorage: false,
      haptics: false,
      desktopWindow: false,
    };
  }

  async initialize(): Promise<void> {
    // No-op for web.
  }
}
