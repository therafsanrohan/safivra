-- ================================================================
-- Migration: 20261005000001_wealth_classification_view.sql
-- Description: Financial Logic Upgrade — Part 2 of 2
--   Adds v_wealth_summary view (wealth classification layer)
--   and v_zakat_assets view (Zakat-eligible assets with haul info).
--
-- SAFETY CONTRACT:
--   - No existing tables, columns or policies modified
--   - Views are additive; CASCADE dropped only if view existed before
--   - All views use security_invoker = true (respects RLS automatically)
--   - Uses v_account_balances (existing view) — NOT financial_accounts directly
-- ================================================================

BEGIN;

DROP VIEW IF EXISTS public.v_zakat_assets CASCADE;
DROP VIEW IF EXISTS public.v_wealth_summary CASCADE;

-- ────────────────────────────────────────────────────────────────
-- 1. v_wealth_summary
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_wealth_summary
WITH (security_invoker = true)
AS
SELECT
  vab.user_id,

  COALESCE(SUM(CASE
    WHEN vab.account_class = 'asset' AND vab.include_in_net_worth
    THEN vab.balance::NUMERIC ELSE 0
  END), 0) AS total_assets,

  COALESCE(SUM(CASE
    WHEN vab.account_class = 'liability' AND vab.include_in_net_worth
    THEN ABS(vab.balance::NUMERIC) ELSE 0
  END), 0) AS total_liabilities,

  COALESCE(SUM(CASE
    WHEN vab.include_in_net_worth THEN
      CASE vab.account_class
        WHEN 'asset'     THEN  vab.balance::NUMERIC
        WHEN 'liability' THEN -ABS(vab.balance::NUMERIC)
        ELSE 0
      END
    ELSE 0
  END), 0) AS net_worth,

  -- Liquid: cash, bank, savings, mobile_financial_service
  COALESCE(SUM(CASE
    WHEN vab.account_class = 'asset'
      AND vab.account_type::TEXT IN ('cash', 'bank', 'savings', 'mobile_financial_service')
      AND vab.include_in_net_worth
    THEN vab.balance::NUMERIC ELSE 0
  END), 0) AS liquid_assets,

  -- Investment
  COALESCE(SUM(CASE
    WHEN vab.account_class = 'asset'
      AND vab.account_type::TEXT IN ('investment')
      AND vab.include_in_net_worth
    THEN vab.balance::NUMERIC ELSE 0
  END), 0) AS investment_assets

FROM public.v_account_balances vab
WHERE vab.is_active = true
  AND vab.is_archived = false
GROUP BY vab.user_id;

-- ────────────────────────────────────────────────────────────────
-- 2. v_zakat_assets
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_zakat_assets
WITH (security_invoker = true)
AS
SELECT
  vab.user_id,
  vab.account_id,
  vab.name               AS account_name,
  vab.account_type::TEXT AS account_type,
  vab.balance::NUMERIC   AS balance,
  vab.currency_code      AS currency,
  'account'              AS asset_source,
  NOW()                  AS price_updated_at
FROM public.v_account_balances vab
WHERE vab.account_class = 'asset'
  AND vab.include_in_net_worth = true
  AND vab.is_active = true
  AND vab.is_archived = false
  AND vab.balance::NUMERIC > 0

UNION ALL

SELECT
  pm.user_id,
  pm.id                  AS account_id,
  COALESCE(pm.label, pm.metal_type) AS account_name,
  pm.metal_type::TEXT    AS account_type,
  pm.weight_grams * COALESCE(pm.current_price_per_gram, 0) AS balance,
  'BDT'                  AS currency,
  'precious_metal'       AS asset_source,
  pm.price_updated_at
FROM public.precious_metals pm
WHERE pm.include_in_zakat = true;

COMMIT;
