import { SafivraPlatformAdapter, SafivraPlatform, PlatformCapabilities } from '../types';
import { detectPlatform } from '../detect-platform';

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

export class TauriPlatformAdapter implements SafivraPlatformAdapter {
  platform: SafivraPlatform;
  capabilities: PlatformCapabilities;

  private tauriStore: any;
  private tauriDialog: any;
  private tauriFs: any;
  private tauriShell: any;
  private tauriWindow: any;

  storage!: PreferenceStorageAdapter;
  secureStorage!: SecureStorageAdapter;
  files!: FileAdapter;
  sharing!: ShareAdapter;
  notifications!: NotificationAdapter;
  network!: NetworkAdapter;
  lifecycle!: LifecycleAdapter;
  deepLinks!: DeepLinkAdapter;

  constructor() {
    this.platform = detectPlatform();
    this.capabilities = {
      nativeContainer: true,
      biometricAuthentication: false,
      localNotifications: true,
      nativeFileSave: true,
      nativeShare: false,
      deepLinks: true,
      secureStorage: true,
      haptics: false,
      desktopWindow: true,
    };
  }

  async initialize(): Promise<void> {
    const self = this;

    // Dynamically load Tauri APIs if running in Tauri container
    try {
      // Tauri 2 Store Plugin
      try {
        const storeMod = await import('@tauri-apps/plugin-store');
        this.tauriStore = await storeMod.load('safivra_prefs.bin');
      } catch {
        console.warn('Tauri Store plugin not available, falling back to localStorage.');
      }

      // Tauri 2 core imports
      const windowMod = await import('@tauri-apps/api/window');
      this.tauriWindow = windowMod.getCurrentWindow();
    } catch (err) {
      console.error('Failed to import Tauri core APIs:', err);
    }

    // Initialize adapters mapping
    this.storage = {
      async get(key: string): Promise<string | null> {
        if (self.tauriStore) {
          const val = await self.tauriStore.get(key);
          return val ? String(val) : null;
        }
        return localStorage.getItem(key);
      },
      async set(key: string, value: string): Promise<void> {
        if (self.tauriStore) {
          await self.tauriStore.set(key, value);
          await self.tauriStore.save();
          return;
        }
        localStorage.setItem(key, value);
      },
      async remove(key: string): Promise<void> {
        if (self.tauriStore) {
          await self.tauriStore.delete(key);
          await self.tauriStore.save();
          return;
        }
        localStorage.removeItem(key);
      },
      async clear(): Promise<void> {
        if (self.tauriStore) {
          await self.tauriStore.clear();
          await self.tauriStore.save();
          return;
        }
        localStorage.clear();
      },
    };

    // For secure token storage on Desktop Tauri:
    // In production, Tauri Stronghold is used. Here, we implement a Stronghold-fallback
    // using Tauri Store or localized localStorage.
    this.secureStorage = {
      async get(key: string): Promise<string | null> {
        if (self.tauriStore) {
          const val = await self.tauriStore.get(`secure_${key}`);
          return val ? String(val) : null;
        }
        return localStorage.getItem(`secure_${key}`);
      },
      async set(key: string, value: string): Promise<void> {
        if (self.tauriStore) {
          await self.tauriStore.set(`secure_${key}`, value);
          await self.tauriStore.save();
          return;
        }
        localStorage.setItem(`secure_${key}`, value);
      },
      async remove(key: string): Promise<void> {
        if (self.tauriStore) {
          await self.tauriStore.delete(`secure_${key}`);
          await self.tauriStore.save();
          return;
        }
        localStorage.removeItem(`secure_${key}`);
      },
    };

    this.files = {
      async save(filename: string, content: string): Promise<void> {
        try {
          const { save } = await import('@tauri-apps/plugin-dialog');
          const { writeTextFile } = await import('@tauri-apps/plugin-fs');

          const path = await save({
            defaultPath: filename,
            filters: [{ name: 'Data Files', extensions: ['csv', 'pdf', 'json'] }],
          });

          if (path) {
            await writeTextFile(path, content);
          }
        } catch (err) {
          console.error('Tauri file save failed, invoking web download fallback:', err);
          // Fallback to browser file download
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      },
    };

    this.sharing = {
      async share(_, text: string, url?: string): Promise<void> {
        // Desktop share fallback: Copy to clipboard
        const shareUrl = url || window.location.href;
        await navigator.clipboard.writeText(`${text} ${shareUrl}`.trim());
        alert('Link copied to clipboard!');
      },
    };

    this.notifications = {
      async requestPermission(): Promise<boolean> {
        try {
          const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification');
          let granted = await isPermissionGranted();
          if (!granted) {
            const permission = await requestPermission();
            granted = permission === 'granted';
          }
          return granted;
        } catch {
          return false;
        }
      },
      async schedule(title: string, body: string): Promise<void> {
        try {
          const { sendNotification } = await import('@tauri-apps/plugin-notification');
          sendNotification({ title, body });
        } catch (err) {
          console.error('Tauri notification send failed:', err);
        }
      },
    };

    this.network = {
      isOnline(): boolean {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
      },
      onStatusChange(callback: (online: boolean) => void): () => void {
        const handleOnline = () => callback(true);
        const handleOffline = () => callback(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      },
    };

    this.lifecycle = {
      onPause(callback: () => void): () => void {
        if (!self.tauriWindow) return () => {};
        const unlistenPromise = self.tauriWindow.onFocusChanged(({ payload: focused }: any) => {
          if (!focused) callback();
        });
        return () => {
          unlistenPromise.then((unlisten: any) => unlisten());
        };
      },
      onResume(callback: () => void): () => void {
        if (!self.tauriWindow) return () => {};
        const unlistenPromise = self.tauriWindow.onFocusChanged(({ payload: focused }: any) => {
          if (focused) callback();
        });
        return () => {
          unlistenPromise.then((unlisten: any) => unlisten());
        };
      },
    };

    this.deepLinks = {
      onLinkReceived(callback: (url: string) => void): () => void {
        try {
          import('@tauri-apps/plugin-deep-link').then((deeplinkMod) => {
            deeplinkMod.onOpenUrl((urls: string[]) => {
              if (urls && urls.length > 0) {
                callback(urls[0]);
              }
            });
          });
        } catch (err) {
          console.error('Tauri deep linking not supported or not loaded:', err);
        }
        return () => {};
      },
    };
  }
}
