-- ================================================================
-- Migration: 20260901000000_phase1_safety_foundation.sql
-- Description:
--   Phase 1 Safety Foundation
--   1. Adds check_financial_integrity() — on-demand reconciliation RPC
--      Verifies double-entry correctness without touching any data.
--   2. Adds composite indexes for v_account_balances performance.
--   3. Explicit execute privilege lock-down on financial RPCs.
--
-- APPLY TO STAGING FIRST. Verify output. Then apply to production.
-- This migration is ADDITIVE ONLY — no data changes, no drops.
-- ================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. Financial Integrity Check Function
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_financial_integrity()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_orphaned_txns          INT := 0;
  v_unbalanced_txns        INT := 0;
  v_cross_user_entries     INT := 0;
  v_nonzero_opening_bal    INT := 0;
  v_invalid_void_state     INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check 1: Orphaned transactions (< 2 ledger entries = broken double-entry)
  SELECT COUNT(*) INTO v_orphaned_txns
  FROM public.ledger_transactions lt
  WHERE lt.user_id = v_user_id
    AND lt.status = 'posted'
    AND (SELECT COUNT(*) FROM public.ledger_entries le WHERE le.ledger_transaction_id = lt.id) < 2;

  -- Check 2: Unbalanced transactions (debit != credit)
  SELECT COUNT(*) INTO v_unbalanced_txns
  FROM public.ledger_transactions lt
  WHERE lt.user_id = v_user_id
    AND lt.status = 'posted'
    AND lt.transaction_type NOT IN ('opening_balance', 'balance_adjustment')
    AND (
      SELECT SUM(CASE
        WHEN le.entry_role IN ('asset_debit', 'transfer_in', 'liability_credit')       THEN  le.amount
        WHEN le.entry_role IN ('asset_credit', 'transfer_out', 'fee_expense',
                               'liability_debit', 'income_credit', 'expense_debit')    THEN -le.amount
        ELSE 0
      END)
      FROM public.ledger_entries le
      WHERE le.ledger_transaction_id = lt.id
    ) != 0;

  -- Check 3: Entries referencing an account owned by a different user
  SELECT COUNT(*) INTO v_cross_user_entries
  FROM public.ledger_entries le
  JOIN public.financial_accounts fa ON fa.id = le.financial_account_id
  WHERE le.user_id = v_user_id
    AND fa.user_id != v_user_id;

  -- Check 4: Accounts with non-zero opening_balance column
  -- (after fix_double_calc migration, this should always be 0)
  SELECT COUNT(*) INTO v_nonzero_opening_bal
  FROM public.financial_accounts
  WHERE user_id = v_user_id
    AND is_archived = FALSE
    AND opening_balance != 0;

  -- Check 5: Voided transactions still showing as posted
  SELECT COUNT(*) INTO v_invalid_void_state
  FROM public.ledger_transactions
  WHERE user_id = v_user_id
    AND voided_at IS NOT NULL
    AND status = 'posted';

  RETURN json_build_object(
    'user_id',   v_user_id,
    'checked_at', NOW(),
    'status', CASE
      WHEN (v_orphaned_txns + v_unbalanced_txns + v_cross_user_entries +
            v_nonzero_opening_bal + v_invalid_void_state) = 0
      THEN 'healthy'
      ELSE 'violations_found'
    END,
    'checks', json_build_object(
      'orphaned_transactions',          v_orphaned_txns,
      'unbalanced_transactions',        v_unbalanced_txns,
      'cross_user_entry_violations',    v_cross_user_entries,
      'nonzero_opening_balance_accts',  v_nonzero_opening_bal,
      'invalid_void_state_txns',        v_invalid_void_state
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_financial_integrity() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.check_financial_integrity() TO authenticated, service_role;

-- ────────────────────────────────────────────────────────────────
-- 2. Composite Indexes (Performance — Phase 0 bottleneck fixes)
-- ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_role
  ON public.ledger_entries (financial_account_id, entry_role);

CREATE INDEX IF NOT EXISTS idx_ledger_transactions_user_status_date
  ON public.ledger_transactions (user_id, status, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_loans_user_status
  ON public.loans (user_id, status);

CREATE INDEX IF NOT EXISTS idx_credit_cards_user_status
  ON public.credit_cards (user_id, status);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_txn_account
  ON public.ledger_entries (ledger_transaction_id, financial_account_id);

-- ────────────────────────────────────────────────────────────────
-- 3. Ensure post_transaction execute privileges are explicit
-- ────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.post_transaction(JSON) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.post_transaction(JSON) TO authenticated, service_role;

COMMIT;

-- ================================================================
-- POST-APPLY VERIFICATION
-- Run this in Supabase SQL editor after applying the migration:
--
--   SELECT public.check_financial_integrity();
--
-- Expected healthy response:
--   { "status": "healthy", "checks": { all zeros } }
--
-- If any check shows non-zero, investigate before proceeding.
-- ================================================================
