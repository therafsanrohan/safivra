-- ================================================================
-- Migration: 20260731000002_fix_double_calc.sql
-- Description: Fixes double calculation in v_account_balances and cleans up broken data
-- ================================================================

-- 1. Fix v_account_balances to not add opening_balance twice
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
      COALESCE((
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
      COALESCE((
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
    ELSE 0
  END::TEXT AS balance
FROM public.financial_accounts fa;

-- 2. Clean up broken "Personal" loan
DELETE FROM public.ledger_transactions WHERE title = 'Opening Loan Principal — Personal';
DELETE FROM public.financial_accounts WHERE name = 'Loan: Personal';
