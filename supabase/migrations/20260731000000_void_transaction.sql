-- ================================================================
-- Migration: 20260731000000_void_transaction.sql
-- Description: Adds void_transaction RPC and fixes v_account_balances
-- ================================================================

-- 1. Create the void_transaction function
CREATE OR REPLACE FUNCTION public.void_transaction(
  p_transaction_id UUID,
  p_void_reason TEXT DEFAULT 'User voided transaction'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_status transaction_status;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated request';
  END IF;

  -- Verify ownership and current status
  SELECT status INTO v_status
  FROM public.ledger_transactions
  WHERE id = p_transaction_id AND user_id = v_user_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Transaction not found or you do not have permission';
  END IF;

  IF v_status = 'voided' THEN
    RAISE EXCEPTION 'Transaction is already voided';
  END IF;

  -- Update the transaction status to voided
  UPDATE public.ledger_transactions
  SET 
    status = 'voided',
    description = COALESCE(description, '') || ' [VOIDED: ' || p_void_reason || ']'
  WHERE id = p_transaction_id;

  RETURN json_build_object('success', true);
END;
$$;

-- 2. Update v_account_balances to only include 'posted' transactions
DROP VIEW IF EXISTS public.v_account_balances CASCADE;

CREATE OR REPLACE VIEW public.v_account_balances
WITH (security_invoker = true) AS
SELECT
  fa.id              AS account_id,
  fa.user_id,
  fa.name,
  fa.account_type,
  fa.account_class,
  fa.institution,
  fa.currency_code,
  fa.credit_limit::TEXT,
  fa.include_in_total,
  fa.include_in_net_worth,
  fa.is_active,
  fa.is_archived,
  CASE fa.account_class
    WHEN 'asset' THEN (
      fa.opening_balance + COALESCE((
        SELECT SUM(CASE
          WHEN le.entry_role IN ('asset_debit', 'transfer_in')  THEN  le.amount
          WHEN le.entry_role IN ('asset_credit','transfer_out','fee_expense') THEN -le.amount
          ELSE 0
        END)
        FROM public.ledger_entries le
        JOIN public.ledger_transactions lt ON lt.id = le.ledger_transaction_id
        WHERE le.financial_account_id = fa.id AND lt.status = 'posted'
      ), 0)
    )
    WHEN 'liability' THEN (
      fa.opening_balance + COALESCE((
        SELECT SUM(CASE
          WHEN le.entry_role = 'liability_credit'  THEN  le.amount
          WHEN le.entry_role = 'liability_debit'   THEN -le.amount
          ELSE 0
        END)
        FROM public.ledger_entries le
        JOIN public.ledger_transactions lt ON lt.id = le.ledger_transaction_id
        WHERE le.financial_account_id = fa.id AND lt.status = 'posted'
      ), 0)
    )
    ELSE fa.opening_balance
  END::TEXT AS balance
FROM public.financial_accounts fa;
