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

export class CapacitorPlatformAdapter implements SafivraPlatformAdapter {
  platform: SafivraPlatform;
  capabilities: PlatformCapabilities;

  private Preferences: any;
  private Filesystem: any;
  private Share: any;
  private LocalNotifications: any;
  private AppPlugin: any;
  private NetworkPlugin: any;

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
      biometricAuthentication: true, // Optional capability supported on mobile
      localNotifications: true,
      nativeFileSave: true,
      nativeShare: true,
      deepLinks: true,
      secureStorage: true,
      haptics: true,
      desktopWindow: false,
    };
  }

  async initialize(): Promise<void> {
    // Dynamically import Capacitor plugins to avoid importing them on Web / desktop
    const [{ Preferences }, { Filesystem }, { Share }, { LocalNotifications }, { App }, { Network }] =
      await Promise.all([
        import('@capacitor/preferences'),
        import('@capacitor/filesystem'),
        import('@capacitor/share'),
        import('@capacitor/local-notifications'),
        import('@capacitor/app'),
        import('@capacitor/network'),
      ]);

    this.Preferences = Preferences;
    this.Filesystem = Filesystem;
    this.Share = Share;
    this.LocalNotifications = LocalNotifications;
    this.AppPlugin = App;
    this.NetworkPlugin = Network;

    // Initialize adapters mapping to dynamic plugins
    const self = this;

    this.storage = {
      async get(key: string): Promise<string | null> {
        const { value } = await self.Preferences.get({ key });
        return value;
      },
      async set(key: string, value: string): Promise<void> {
        await self.Preferences.set({ key, value });
      },
      async remove(key: string): Promise<void> {
        await self.Preferences.remove({ key });
      },
      async clear(): Promise<void> {
        await self.Preferences.clear();
      },
    };

    // For standard Capacitor, we map secure storage to Preferences as a baseline fallback
    // (In production, an encrypted database plugin like SQLite or secure Keychain plugin is preferred).
    this.secureStorage = {
      async get(key: string): Promise<string | null> {
        const { value } = await self.Preferences.get({ key: `secure_${key}` });
        return value;
      },
      async set(key: string, value: string): Promise<void> {
        await self.Preferences.set({ key: `secure_${key}`, value });
      },
      async remove(key: string): Promise<void> {
        await self.Preferences.remove({ key: `secure_${key}` });
      },
    };

    this.files = {
      async save(filename: string, content: string, mimeType: string): Promise<void> {
        // We write to Documents or Data folder, or use Filesystem plugin to save a file
        const { Directory, Encoding } = await import('@capacitor/filesystem');
        await self.Filesystem.writeFile({
          path: filename,
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
      },
    };

    this.sharing = {
      async share(title: string, text: string, url?: string): Promise<void> {
        await self.Share.share({ title, text, url, dialogTitle: 'Share with' });
      },
    };

    this.notifications = {
      async requestPermission(): Promise<boolean> {
        const { display } = await self.LocalNotifications.requestPermissions();
        return display === 'granted';
      },
      async schedule(title: string, body: string, delaySeconds: number, route?: string): Promise<void> {
        await self.LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Math.floor(Math.random() * 100000),
              schedule: { at: new Date(Date.now() + delaySeconds * 1000) },
              extra: { route },
            },
          ],
        });
      },
    };

    this.network = {
      isOnline(): boolean {
        // Synchronous check is not native, we fallback to browser check
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
      },
      onStatusChange(callback: (online: boolean) => void): () => void {
        const listenerPromise = self.NetworkPlugin.addListener('networkStatusChange', (status: any) => {
          callback(status.connected);
        });

        return () => {
          listenerPromise.then((listener: any) => listener.remove());
        };
      },
    };

    this.lifecycle = {
      onPause(callback: () => void): () => void {
        const listenerPromise = self.AppPlugin.addListener('appStateChange', (state: any) => {
          if (!state.isActive) callback();
        });
        return () => {
          listenerPromise.then((listener: any) => listener.remove());
        };
      },
      onResume(callback: () => void): () => void {
        const listenerPromise = self.AppPlugin.addListener('appStateChange', (state: any) => {
          if (state.isActive) callback();
        });
        return () => {
          listenerPromise.then((listener: any) => listener.remove());
        };
      },
      onBackButton(callback: (canGoBack: boolean) => void): () => void {
        const listenerPromise = self.AppPlugin.addListener('backButton', (data: any) => {
          callback(data.canGoBack);
        });
        return () => {
          listenerPromise.then((listener: any) => listener.remove());
        };
      },
    };

    this.deepLinks = {
      onLinkReceived(callback: (url: string) => void): () => void {
        const listenerPromise = self.AppPlugin.addListener('appUrlOpen', (data: any) => {
          callback(data.url);
        });
        return () => {
          listenerPromise.then((listener: any) => listener.remove());
        };
      },
    };
  }
}
