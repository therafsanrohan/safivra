-- ================================================================
-- Migration: 20260731000004_delete_rpc.sql
-- Description: Adds a safe, atomic RPC for deleting financial records
-- ensuring no orphaned transactions are left behind.
-- ================================================================

CREATE OR REPLACE FUNCTION public.delete_financial_record(
  p_record_type TEXT,
  p_record_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_count INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_record_type = 'account' THEN
    -- Delete all transactions where this account is involved in the entries
    DELETE FROM public.ledger_transactions
    WHERE id IN (
      SELECT ledger_transaction_id FROM public.ledger_entries
      WHERE financial_account_id = p_record_id
    ) AND user_id = v_user_id;

    -- Now delete the account itself
    DELETE FROM public.financial_accounts
    WHERE id = p_record_id AND user_id = v_user_id;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count = 0 THEN
      RAISE EXCEPTION 'Account not found or access denied';
    END IF;

  ELSIF p_record_type = 'transaction' THEN
    -- Deleting ledger_transaction automatically cascades to ledger_entries
    DELETE FROM public.ledger_transactions
    WHERE id = p_record_id AND user_id = v_user_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count = 0 THEN
      RAISE EXCEPTION 'Transaction not found or access denied';
    END IF;

  ELSIF p_record_type = 'loan' THEN
    -- Delete all transactions where the loan account is involved
    DELETE FROM public.ledger_transactions
    WHERE id IN (
      SELECT e.ledger_transaction_id FROM public.ledger_entries e
      JOIN public.loans l ON e.financial_account_id = l.account_id
      WHERE l.id = p_record_id
    ) AND user_id = v_user_id;

    -- Also delete the loan's financial account (will cascade to loan if ON DELETE CASCADE, else delete loan first)
    DELETE FROM public.financial_accounts
    WHERE id IN (SELECT account_id FROM public.loans WHERE id = p_record_id) AND user_id = v_user_id;

    -- Delete the loan itself (in case account_id was null or cascade wasn't set)
    DELETE FROM public.loans
    WHERE id = p_record_id AND user_id = v_user_id;

  ELSIF p_record_type = 'credit_card' THEN
    DELETE FROM public.ledger_transactions
    WHERE id IN (
      SELECT e.ledger_transaction_id FROM public.ledger_entries e
      JOIN public.credit_cards c ON e.financial_account_id = c.linked_account_id
      WHERE c.id = p_record_id
    ) AND user_id = v_user_id;

    DELETE FROM public.financial_accounts
    WHERE id IN (SELECT linked_account_id FROM public.credit_cards WHERE id = p_record_id) AND user_id = v_user_id;

    DELETE FROM public.credit_cards
    WHERE id = p_record_id AND user_id = v_user_id;

  ELSIF p_record_type = 'budget' THEN
    DELETE FROM public.budgets
    WHERE id = p_record_id AND user_id = v_user_id;

  ELSIF p_record_type = 'goal' THEN
    DELETE FROM public.financial_goals
    WHERE id = p_record_id AND user_id = v_user_id;

  ELSIF p_record_type = 'recurring' THEN
    DELETE FROM public.recurring_templates
    WHERE id = p_record_id AND user_id = v_user_id;

  ELSE
    RAISE EXCEPTION 'Unknown record type: %', p_record_type;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;
