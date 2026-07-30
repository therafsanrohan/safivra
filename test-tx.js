import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: 'test@example.com', // Need a valid user. I'll just query the first user using the service role key instead!
  });
}
run();
