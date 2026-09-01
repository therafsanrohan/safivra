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

    const monthsBack = Math.min(Number(req.query.months) || 6, 24);

    // Single aggregated RPC call replacing 7 separate monthly queries
    const { data, error } = await supabase.rpc('get_dashboard_summary', {
      p_months_back: monthsBack,
    });

    if (error) throw error;

    // Cache summary response for 60 seconds (s-maxage=60, stale-while-revalidate=120)
    res.setHeader(
      'Cache-Control',
      'private, max-age=10, s-maxage=60, stale-while-revalidate=120'
    );

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Server error fetching dashboard summary',
      message: err.message || 'Internal error',
    });
  }
}
