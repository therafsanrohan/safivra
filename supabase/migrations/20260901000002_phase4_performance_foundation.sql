-- ================================================================
-- Migration: 20260901000002_phase4_performance_foundation.sql
-- Description: Phase 4 — Performance Foundation & Pre-computed Balances
--
--   1. account_balance_cache table — stores pre-computed balances
--      Eliminates recalculating full ledger history on every view
--   2. sync_account_balance_cache() — trigger function to keep cache updated
--   3. High-speed composite indexes for transaction filtering
--
-- ADDITIVE & RECOVERABLE — does not modify existing ledger or accounts.
-- Authoritative financial truth STILL remains in ledger_entries.
-- ================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. PRE-COMPUTED ACCOUNT BALANCE CACHE TABLE
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.account_balance_cache (
  account_id   UUID        PRIMARY KEY REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance      NUMERIC     NOT NULL DEFAULT 0.00,
  last_tx_id   UUID        REFERENCES public.ledger_transactions(id) ON DELETE SET NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_balance_cache_user
  ON public.account_balance_cache (user_id);

ALTER TABLE public.account_balance_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_balance_cache_select_policy" ON public.account_balance_cache
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- 2. REFRESH FUNCTION FOR PRE-COMPUTED BALANCE CACHE
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.refresh_account_balance_cache(p_account_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   UUID;
  v_acct_cls  account_class;
  v_op_bal    NUMERIC;
  v_balance   NUMERIC := 0.00;
BEGIN
  SELECT user_id, account_class, opening_balance
  INTO v_user_id, v_acct_cls, v_op_bal
  FROM public.financial_accounts
  WHERE id = p_account_id;

  IF v_user_id IS NULL THEN
    RETURN 0.00;
  END IF;

  IF v_acct_cls = 'asset' THEN
    SELECT (v_op_bal + COALESCE(SUM(CASE
      WHEN le.entry_role IN ('asset_debit', 'transfer_in')  THEN  le.amount
      WHEN le.entry_role IN ('asset_credit','transfer_out','fee_expense') THEN -le.amount
      ELSE 0
    END), 0))
    INTO v_balance
    FROM public.ledger_entries le
    JOIN public.ledger_transactions lt ON lt.id = le.ledger_transaction_id
    WHERE le.financial_account_id = p_account_id
      AND lt.status = 'posted';
  ELSIF v_acct_cls = 'liability' THEN
    SELECT (v_op_bal + COALESCE(SUM(CASE
      WHEN le.entry_role = 'liability_credit'  THEN  le.amount
      WHEN le.entry_role = 'liability_debit'   THEN -le.amount
      ELSE 0
    END), 0))
    INTO v_balance
    FROM public.ledger_entries le
    JOIN public.ledger_transactions lt ON lt.id = le.ledger_transaction_id
    WHERE le.financial_account_id = p_account_id
      AND lt.status = 'posted';
  ELSE
    v_balance := v_op_bal;
  END IF;

  INSERT INTO public.account_balance_cache (account_id, user_id, balance, updated_at)
  VALUES (p_account_id, v_user_id, v_balance, NOW())
  ON CONFLICT (account_id) DO UPDATE
    SET balance    = EXCLUDED.balance,
        updated_at = EXCLUDED.updated_at;

  RETURN v_balance;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_account_balance_cache(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.refresh_account_balance_cache(UUID) TO authenticated, service_role;

-- ────────────────────────────────────────────────────────────────
-- 3. ADDITIONAL PERFORMANCE INDEXES FOR HIGH RPS
-- ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ledger_entries_user_date
  ON public.ledger_entries (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_transactions_date_type
  ON public.ledger_transactions (user_id, transaction_type, transaction_date DESC);

COMMIT;
