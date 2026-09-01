import { SafivraPlatformAdapter } from './types';
import { WebPlatformAdapter } from './adapters/web.adapter';
import { CapacitorPlatformAdapter } from './adapters/capacitor.adapter';
import { TauriPlatformAdapter } from './adapters/tauri.adapter';
import { detectPlatform } from './detect-platform';

let activeAdapter: SafivraPlatformAdapter | null = null;

export const getPlatform = (): SafivraPlatformAdapter => {
  if (activeAdapter) return activeAdapter;

  const currentPlatform = detectPlatform();

  if (currentPlatform === 'android' || currentPlatform === 'ios') {
    activeAdapter = new CapacitorPlatformAdapter();
  } else if (currentPlatform === 'windows' || currentPlatform === 'macos' || currentPlatform === 'linux') {
    activeAdapter = new TauriPlatformAdapter();
  } else {
    activeAdapter = new WebPlatformAdapter();
  }

  return activeAdapter;
};

export const initializePlatform = async (): Promise<SafivraPlatformAdapter> => {
  const adapter = getPlatform();
  await adapter.initialize();
  return adapter;
};

export * from './types';
export * from './detect-platform';
