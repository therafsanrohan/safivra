export type SafivraPlatform =
  | 'web'
  | 'pwa'
  | 'android'
  | 'ios'
  | 'windows'
  | 'macos'
  | 'linux';

export interface PlatformCapabilities {
  nativeContainer: boolean;
  biometricAuthentication: boolean;
  localNotifications: boolean;
  nativeFileSave: boolean;
  nativeShare: boolean;
  deepLinks: boolean;
  secureStorage: boolean;
  haptics: boolean;
  desktopWindow: boolean;
}

export interface PreferenceStorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface SecureStorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface FileAdapter {
  save(filename: string, content: string, mimeType: string): Promise<void>;
}

export interface ShareAdapter {
  share(title: string, text: string, url?: string): Promise<void>;
}

export interface NotificationAdapter {
  requestPermission(): Promise<boolean>;
  schedule(title: string, body: string, delaySeconds: number, route?: string): Promise<void>;
}

export interface NetworkAdapter {
  isOnline(): boolean;
  onStatusChange(callback: (online: boolean) => void): () => void;
}

export interface LifecycleAdapter {
  onPause(callback: () => void): () => void;
  onResume(callback: () => void): () => void;
  onBackButton?(callback: (canGoBack: boolean) => void): () => void;
}

export interface DeepLinkAdapter {
  onLinkReceived(callback: (url: string) => void): () => void;
}

export interface SafivraPlatformAdapter {
  platform: SafivraPlatform;
  capabilities: PlatformCapabilities;
  storage: PreferenceStorageAdapter;
  secureStorage: SecureStorageAdapter;
  files: FileAdapter;
  sharing: ShareAdapter;
  notifications: NotificationAdapter;
  network: NetworkAdapter;
  lifecycle: LifecycleAdapter;
  deepLinks: DeepLinkAdapter;
  initialize(): Promise<void>;
}
