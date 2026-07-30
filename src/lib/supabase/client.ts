import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getPlatform } from '@/platform';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isDemoMode = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

export const isPlaceholderConfig =
  !rawUrl ||
  !rawKey ||
  rawUrl.includes('placeholder-project') ||
  rawUrl.includes('your-project-id') ||
  rawKey.includes('placeholder') ||
  rawKey.includes('your-supabase-anon-key');

// Use placeholder values to avoid createClient throwing immediately on empty strings.
// But we will block operation and show errors if isPlaceholderConfig && !isDemoMode.
const supabaseUrl = isPlaceholderConfig ? 'https://placeholder-project.supabase.co' : rawUrl;
const supabaseAnonKey = isPlaceholderConfig ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder' : rawKey;

if (isPlaceholderConfig) {
  console.warn(
    `[Safivra] Supabase config is placeholder. Demo mode is ${isDemoMode ? 'ENABLED' : 'DISABLED'}.`
  );
}

const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof document === 'undefined') return null;
    const name = encodeURIComponent(key) + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) === 0) {
        return decodeURIComponent(c.substring(name.length, c.length));
      }
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; Secure; SameSite=Lax`;
  },
  removeItem: (key: string): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${encodeURIComponent(key)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax`;
  }
};

const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const adapter = getPlatform();
    const isNative = ['android', 'ios', 'windows', 'macos', 'linux'].includes(adapter.platform);
    
    if (isNative && adapter.secureStorage) {
      try {
        return await adapter.secureStorage.get(key);
      } catch (err) {
        console.error('[Storage] secureStorage.get error:', err);
      }
    }
    return cookieStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const adapter = getPlatform();
    const isNative = ['android', 'ios', 'windows', 'macos', 'linux'].includes(adapter.platform);
    
    if (isNative && adapter.secureStorage) {
      try {
        await adapter.secureStorage.set(key, value);
        return;
      } catch (err) {
        console.error('[Storage] secureStorage.set error:', err);
      }
    }
    cookieStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    const adapter = getPlatform();
    const isNative = ['android', 'ios', 'windows', 'macos', 'linux'].includes(adapter.platform);
    
    if (isNative && adapter.secureStorage) {
      try {
        await adapter.secureStorage.remove(key);
        return;
      } catch (err) {
        console.error('[Storage] secureStorage.remove error:', err);
      }
    }
    cookieStorage.removeItem(key);
  }
};

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: !isPlaceholderConfig,
      persistSession: true,
      detectSessionInUrl: true,
      storage: customStorage,
    },
  }
);
