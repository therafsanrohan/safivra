import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

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

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: !isPlaceholderConfig,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
