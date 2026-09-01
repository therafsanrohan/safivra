import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { cacheGet, cacheSet } from '../../lib/redis';
import { checkRateLimit } from '../../lib/rateLimit';

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
  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allowed = await checkRateLimit(req, res);
  if (!allowed) return;

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  try {
    const supabase = getSupabaseClient(authHeader);

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ error: 'Unauthorized token or expired session' });
    }

    const startDate = (req.query.start_date as string) || null;
    const endDate = (req.query.end_date as string) || null;
    const format = (req.query.format as string) || 'json';

    // ── CSV Export Stream ───────────────────────────────────────────────────
    if (format === 'csv') {
      const { data: txns, error: txErr } = await supabase
        .from('ledger_transactions')
        .select(`
          transaction_date, title, transaction_type, merchant, description, status,
          ledger_entries(amount, entry_role, financial_account:financial_accounts(name), category:transaction_categories(name))
        `)
        .eq('user_id', user.id)
        .eq('status', 'posted')
        .order('transaction_date', { ascending: false });

      if (txErr) throw txErr;

      const csvRows = [
        ['Date', 'Title', 'Type', 'Category', 'Account', 'Merchant', 'Amount', 'Notes', 'Status'].join(','),
      ];

      (txns || []).forEach((tx: any) => {
        const primaryEntry = tx.ledger_entries?.[0];
        const amount = primaryEntry ? Number(primaryEntry.amount).toFixed(2) : '0.00';
        const cat = (primaryEntry?.category?.name || 'Uncategorized').replace(/"/g, '""');
        const acc = (primaryEntry?.financial_account?.name || 'General').replace(/"/g, '""');
        const title = (tx.title || '').replace(/"/g, '""');
        const merchant = (tx.merchant || '').replace(/"/g, '""');
        const notes = (tx.description || '').replace(/"/g, '""');

        csvRows.push(
          [
            tx.transaction_date,
            `"${title}"`,
            tx.transaction_type,
            `"${cat}"`,
            `"${acc}"`,
            `"${merchant}"`,
            amount,
            `"${notes}"`,
            tx.status,
          ].join(',')
        );
      });

      const csvString = '\uFEFF' + csvRows.join('\n'); // UTF-8 BOM for Excel/Bangles support

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="safivra_report_${new Date().toISOString().slice(0, 10)}.csv"`
      );
      return res.status(200).send(csvString);
    }

    // ── JSON Analytics Response (Redis Cached) ──────────────────────────────
    const cacheKey = `analytics:${user.id}:${startDate}:${endDate}`;
    const cachedData = await cacheGet<any>(cacheKey);

    if (cachedData) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
      return res.status(200).json({ success: true, data: cachedData, source: 'cache' });
    }

    const { data, error } = await supabase.rpc('get_analytics_report', {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) throw error;

    if (data) {
      await cacheSet(cacheKey, data, 300);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');

    return res.status(200).json({ success: true, data, source: 'database' });
  } catch (err: any) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: 'Server error generating analytics report',
      message: err.message || 'Internal error',
    });
  }
}
