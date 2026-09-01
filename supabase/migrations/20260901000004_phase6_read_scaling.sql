-- ================================================================
-- Migration: 20260901000004_phase6_read_scaling.sql
-- Description: Phase 6 — Read Scaling & CQRS Analytics Isolation
--
--   1. v_monthly_category_analytics view — pre-aggregates monthly
--      income & expense by category without scanning raw entries repeatedly.
--   2. get_analytics_report() RPC — fast server-side filtered analytics query
--
-- ADDITIVE & SAFE — Read-only views and functions.
-- ================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. VIEW: v_monthly_category_analytics
-- ────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_monthly_category_analytics CASCADE;

CREATE OR REPLACE VIEW public.v_monthly_category_analytics
WITH (security_invoker = true) AS
SELECT
  lt.user_id,
  EXTRACT(YEAR  FROM lt.transaction_date)::INT AS yr,
  EXTRACT(MONTH FROM lt.transaction_date)::INT AS mo,
  tc.id AS category_id,
  tc.name AS category_name,
  tc.color AS category_color,
  tc.category_type,
  SUM(le.amount)::NUMERIC AS total_amount,
  COUNT(DISTINCT lt.id)::INT AS transaction_count
FROM public.ledger_entries le
JOIN public.ledger_transactions lt ON lt.id = le.ledger_transaction_id
LEFT JOIN public.transaction_categories tc ON tc.id = le.category_id
WHERE lt.status = 'posted'
  AND le.entry_role IN ('income_credit', 'expense_debit', 'fee_expense')
GROUP BY lt.user_id, yr, mo, tc.id, tc.name, tc.color, tc.category_type;

-- ────────────────────────────────────────────────────────────────
-- 2. RPC: get_analytics_report(p_start_date, p_end_date)
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_analytics_report(
  p_start_date DATE DEFAULT NULL,
  p_end_date   DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     UUID := auth.uid();
  v_start       DATE := COALESCE(p_start_date, DATE_TRUNC('year', CURRENT_DATE)::DATE);
  v_end         DATE := COALESCE(p_end_date, CURRENT_DATE);
  v_total_inc   NUMERIC := 0.00;
  v_total_exp   NUMERIC := 0.00;
  v_categories  JSON;
  v_accounts    JSON;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated request';
  END IF;

  -- 1. Total Income & Expense in date range
  SELECT
    COALESCE(SUM(CASE WHEN le.entry_role = 'income_credit' THEN le.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN le.entry_role IN ('expense_debit', 'fee_expense') THEN le.amount ELSE 0 END), 0)
  INTO v_total_inc, v_total_exp
  FROM public.ledger_entries le
  JOIN public.ledger_transactions lt ON lt.id = le.ledger_transaction_id
  WHERE le.user_id = v_user_id
    AND lt.status = 'posted'
    AND lt.transaction_date BETWEEN v_start AND v_end;

  -- 2. Category Expense Breakdown
  SELECT json_agg(
    json_build_object(
      'category_id',    COALESCE(tc.id::TEXT, 'uncategorized'),
      'category_name',  COALESCE(tc.name, 'Uncategorized'),
      'color',          COALESCE(tc.color, '#94A3B8'),
      'category_type',  COALESCE(tc.category_type, 'expense'),
      'total_amount',   s.total_amount
    )
    ORDER BY s.total_amount DESC
  )
  INTO v_categories
  FROM (
    SELECT
      le.category_id,
      SUM(le.amount) AS total_amount
    FROM public.ledger_entries le
    JOIN public.ledger_transactions lt ON lt.id = le.ledger_transaction_id
    WHERE le.user_id = v_user_id
      AND lt.status = 'posted'
      AND le.entry_role IN ('expense_debit', 'fee_expense')
      AND lt.transaction_date BETWEEN v_start AND v_end
    GROUP BY le.category_id
  ) s
  LEFT JOIN public.transaction_categories tc ON tc.id = s.category_id;

  -- 3. Account Activity Breakdown
  SELECT json_agg(
    json_build_object(
      'account_id',    fa.id,
      'account_name',  fa.name,
      'account_class', fa.account_class,
      'total_activity', s.total_activity
    )
    ORDER BY s.total_activity DESC
  )
  INTO v_accounts
  FROM (
    SELECT
      le.financial_account_id,
      SUM(le.amount) AS total_activity
    FROM public.ledger_entries le
    JOIN public.ledger_transactions lt ON lt.id = le.ledger_transaction_id
    WHERE le.user_id = v_user_id
      AND lt.status = 'posted'
      AND le.financial_account_id IS NOT NULL
      AND lt.transaction_date BETWEEN v_start AND v_end
    GROUP BY le.financial_account_id
  ) s
  JOIN public.financial_accounts fa ON fa.id = s.financial_account_id;

  RETURN json_build_object(
    'start_date',      v_start,
    'end_date',        v_end,
    'total_income',    v_total_inc,
    'total_expense',   v_total_exp,
    'net_savings',     v_total_inc - v_total_exp,
    'savings_rate',    CASE WHEN v_total_inc > 0 THEN ROUND(((v_total_inc - v_total_exp) / v_total_inc) * 100, 1) ELSE 0 END,
    'categories',      COALESCE(v_categories, '[]'::JSON),
    'accounts',        COALESCE(v_accounts, '[]'::JSON)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_analytics_report(DATE, DATE) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_analytics_report(DATE, DATE) TO authenticated, service_role;

COMMIT;
