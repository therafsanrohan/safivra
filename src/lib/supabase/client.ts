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
