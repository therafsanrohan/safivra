import { createClient } from '@supabase/supabase-js';
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
    '[Safivra] Operating in Offline/Demo mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env for production database access.'
  );
}

// Custom fetch wrapper with 2500ms fast-timeout to eliminate 30-second loading hangs
const fastFetch: typeof fetch = (input, init) => {
  if (isPlaceholderConfig) {
    // Instant rejection in placeholder mode so components fallback to sample data in 0ms
    return Promise.reject(new TypeError('Offline placeholder configuration'));
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  const combinedSignal = init?.signal
    ? init.signal
    : controller.signal;

  return fetch(input, { ...init, signal: combinedSignal }).finally(() => {
    clearTimeout(timeoutId);
  });
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: !isPlaceholderConfig,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: fastFetch,
  },
});
