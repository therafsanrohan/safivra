import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient(authHeader?: string) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing on server');
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
    auth: {
      persistSession: false,
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  try {
    const supabase = getSupabaseClient(authHeader);

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return res.status(401).json({ error: 'Unauthorized token or expired session' });
    }

    const { data, error } = await supabase
      .from('v_account_balances')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('is_archived', false);

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Server error fetching account balances',
      message: err.message || 'Internal error',
    });
  }
}
