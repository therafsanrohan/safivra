import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isPlaceholderConfig =
  !rawUrl ||
  !rawKey ||
  rawUrl.includes('placeholder-project') ||
  rawKey.includes('placeholder');

const supabaseUrl = isPlaceholderConfig ? 'https://placeholder-project.supabase.co' : rawUrl;
const supabaseAnonKey = isPlaceholderConfig ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder' : rawKey;

if (isPlaceholderConfig) {
  console.warn(
    '[Safivra] Operating in Demo/Placeholder mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment for real Supabase database access.'
  );
}

// Custom fetch wrapper with fast-timeout to eliminate long loading hangs
const fastFetch: typeof fetch = (input, init) => {
  if (isPlaceholderConfig) {
    return Promise.reject(new TypeError('Offline placeholder configuration'));
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  const combinedSignal = init?.signal ? init.signal : controller.signal;

  return fetch(input, { ...init, signal: combinedSignal }).finally(() => {
    clearTimeout(timeoutId);
  });
};

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: !isPlaceholderConfig,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: fastFetch,
    },
  }
);
