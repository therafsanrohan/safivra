import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { cacheInvalidateUser } from '../lib/redis';
import { checkRateLimit } from '../lib/rateLimit';

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

  // Rate Limiting Check
  const allowed = await checkRateLimit(req, res);
  if (!allowed) return;

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

    // ── GET: Fetch transactions list ──────────────────────────────────────────
    if (req.method === 'GET') {
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const offset = Number(req.query.offset) || 0;

      const { data, error, count } = await supabase
        .from('ledger_transactions')
        .select(`
          id, title, transaction_type, transaction_date, transaction_time,
          merchant, description, status, created_at,
          ledger_entries(id, amount, entry_role, financial_account_id, category_id)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return res.status(200).json({ data, count, limit, offset });
    }

    // ── POST: Record new financial transaction (with Idempotency + Cache Invalidation)
    if (req.method === 'POST') {
      const body = req.body || {};
      const {
        transaction_type,
        transaction_date,
        title,
        amount,
        account_id,
        category_id,
        destination_account_id,
        merchant,
        description,
        transaction_time,
        principal_amount,
        interest_amount,
        fee_amount,
        loan_id,
        credit_card_id,
        idempotency_key,
      } = body;

      if (!transaction_type || !transaction_date || !title || !amount) {
        return res.status(400).json({ error: 'Missing required transaction fields' });
      }

      const { data, error } = await supabase.rpc('post_transaction', {
        p_transaction_type: transaction_type,
        p_transaction_date: transaction_date,
        p_title: title,
        p_amount: amount,
        p_account_id: account_id || null,
        p_category_id: category_id || null,
        p_destination_account_id: destination_account_id || null,
        p_merchant: merchant || null,
        p_description: description || null,
        p_transaction_time: transaction_time || null,
        p_principal_amount: principal_amount || null,
        p_interest_amount: interest_amount || null,
        p_fee_amount: fee_amount || null,
        p_loan_id: loan_id || null,
        p_credit_card_id: credit_card_id || null,
        p_idempotency_key: idempotency_key || req.headers['x-idempotency-key'] || null,
      });

      if (error) throw error;

      // Invalidate user's cached read models in Redis after successful mutation
      await cacheInvalidateUser(user.id);

      return res.status(201).json({ success: true, data });
    }

    // ── DELETE: Archive financial transaction (Soft-delete + Cache Invalidation) 
    if (req.method === 'DELETE') {
      const id = req.query.id as string || req.body?.id;
      const reason = req.body?.reason || 'API Archive request';

      if (!id) {
        return res.status(400).json({ error: 'Missing transaction id' });
      }

      const { data, error } = await supabase.rpc('archive_financial_record', {
        p_record_type: 'transaction',
        p_record_id: id,
        p_reason: reason,
      });

      if (error) throw error;

      // Invalidate user's cached read models in Redis
      await cacheInvalidateUser(user.id);

      return res.status(200).json({ success: true, data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Server error processing transaction request',
      message: err.message || 'Internal error',
    });
  }
}
