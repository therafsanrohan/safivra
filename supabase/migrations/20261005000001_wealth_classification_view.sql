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
-- ================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. v_wealth_summary
--
--    Classifies all of a user's financial accounts into wealth
--    categories. This is the canonical wealth calculation layer.
--
--    net_worth = SUM(asset balances include_in_net_worth=true)
--              + SUM(precious_metal values include_in_net_worth=true)
--              - SUM(liability balances include_in_net_worth=true)
--
--    Savings Goals and Goal Allocations are EXCLUDED — they are
--    planning tags on money that already lives in accounts.
-- ────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS public.v_wealth_summary CASCADE;

CREATE OR REPLACE VIEW public.v_wealth_summary
WITH (security_invoker = true) AS
WITH account_balances AS (
  -- Use existing v_account_balances view (live balance from ledger entries)
  SELECT
    vab.account_id,
    vab.user_id,
    vab.name,
    vab.account_type,
    vab.account_class,
    vab.institution,
    vab.currency_code,
    vab.include_in_net_worth,
    vab.is_active,
    vab.is_archived,
    CAST(vab.balance AS NUMERIC(18,4)) AS balance,
    -- Classify into wealth layers
    CASE
      WHEN vab.account_class = 'liability' THEN 'liability'
      WHEN vab.account_type IN ('cash', 'mobile_financial_service') THEN 'liquid'
      WHEN vab.account_type IN ('bank', 'savings') THEN 'liquid'
      WHEN vab.account_type = 'investment' THEN 'investment'
      WHEN vab.account_type = 'receivable' THEN 'semi_liquid'
      WHEN vab.account_type IN ('credit_card', 'loan', 'other_liability') THEN 'liability'
      ELSE 'other'
    END AS wealth_class
  FROM public.v_account_balances vab
  WHERE vab.is_active = true
    AND vab.is_archived = false
),
metal_values AS (
  -- Precious metals: use rate snapshot if flagged, otherwise last_known_value
  SELECT
    pm.user_id,
    pm.id,
    pm.name,
    pm.metal_type,
    pm.include_in_net_worth,
    pm.include_in_zakat,
    pm.is_personal_use_only,
    pm.acquisition_date,
    COALESCE(pm.purity_percentage, 
      CASE pm.purity_karat
        WHEN 24 THEN 99.9
        WHEN 22 THEN 91.67
        WHEN 21 THEN 87.5
        WHEN 18 THEN 75.0
        WHEN 14 THEN 58.33
        ELSE NULL
      END
    ) AS effective_purity_pct,
    pm.gross_weight_grams,
    -- Fine weight for Zakat calculation
    pm.gross_weight_grams * COALESCE(
      pm.purity_percentage,
      CASE pm.purity_karat
        WHEN 24 THEN 99.9  WHEN 22 THEN 91.67 WHEN 21 THEN 87.5
        WHEN 18 THEN 75.0  WHEN 14 THEN 58.33 ELSE NULL
      END
    ) / 100.0 AS fine_weight_grams,
    -- Market value
    CASE
      WHEN pm.use_rate_snapshot = true THEN (
        SELECT
          CASE pm.metal_type
            WHEN 'gold'   THEN zrs.gold_rate_per_gram
            WHEN 'silver' THEN zrs.silver_rate_per_gram
            ELSE NULL
          END
          * pm.gross_weight_grams
          * COALESCE(pm.purity_percentage,
              CASE pm.purity_karat
                WHEN 24 THEN 99.9  WHEN 22 THEN 91.67 WHEN 21 THEN 87.5
                WHEN 18 THEN 75.0  WHEN 14 THEN 58.33 ELSE NULL
              END
            ) / 100.0
        FROM public.zakat_rate_snapshots zrs
        ORDER BY zrs.fetch_timestamp DESC
        LIMIT 1
      )
      ELSE pm.last_known_value
    END AS market_value,
    pm.currency_code
  FROM public.precious_metals pm
),
user_totals AS (
  SELECT
    ab.user_id,

    -- Total assets (account-based)
    SUM(CASE WHEN ab.account_class = 'asset' AND ab.include_in_net_worth THEN GREATEST(ab.balance, 0) ELSE 0 END) AS total_account_assets,

    -- Liquid
    SUM(CASE WHEN ab.wealth_class = 'liquid' AND ab.include_in_net_worth THEN GREATEST(ab.balance, 0) ELSE 0 END) AS liquid_assets,

    -- Semi-liquid (receivables)
    SUM(CASE WHEN ab.wealth_class = 'semi_liquid' AND ab.include_in_net_worth THEN GREATEST(ab.balance, 0) ELSE 0 END) AS semi_liquid_assets,

    -- Investments
    SUM(CASE WHEN ab.wealth_class = 'investment' AND ab.include_in_net_worth THEN GREATEST(ab.balance, 0) ELSE 0 END) AS investment_assets,

    -- Liabilities
    SUM(CASE WHEN ab.account_class = 'liability' AND ab.include_in_net_worth THEN GREATEST(ab.balance, 0) ELSE 0 END) AS total_liabilities,

    -- Account count
    COUNT(*) AS account_count

  FROM account_balances ab
  GROUP BY ab.user_id
),
metal_totals AS (
  SELECT
    mv.user_id,
    SUM(CASE WHEN mv.include_in_net_worth THEN COALESCE(mv.market_value, mv.gross_weight_grams) ELSE 0 END) AS precious_metal_value,
    SUM(CASE WHEN mv.include_in_zakat AND NOT mv.is_personal_use_only THEN COALESCE(mv.fine_weight_grams, 0) ELSE 0 END) AS zakatable_fine_gold_grams,
    SUM(CASE WHEN mv.include_in_zakat AND NOT mv.is_personal_use_only THEN COALESCE(mv.market_value, 0) ELSE 0 END) AS zakatable_metal_value,
    COUNT(*) AS metal_count
  FROM metal_values mv
  GROUP BY mv.user_id
),
deposit_totals AS (
  -- Deposits that are flagged include_in_net_worth = TRUE
  -- (those NOT linked to a tracked account — old deposits, offline FDRs, etc.)
  SELECT
    dp.user_id,
    SUM(CASE WHEN dp.include_in_net_worth AND dp.status = 'active' THEN COALESCE(dp.current_principal, dp.principal_amount, 0) ELSE 0 END) AS standalone_deposit_value,
    COUNT(CASE WHEN dp.status = 'active' THEN 1 END) AS active_deposit_count
  FROM public.deposit_products dp
  GROUP BY dp.user_id
)
SELECT
  ut.user_id,

  -- Assets
  COALESCE(ut.total_account_assets, 0)
    + COALESCE(mt.precious_metal_value, 0)
    + COALESCE(dt.standalone_deposit_value, 0) AS total_assets,

  -- Liabilities
  COALESCE(ut.total_liabilities, 0) AS total_liabilities,

  -- Net Worth
  COALESCE(ut.total_account_assets, 0)
    + COALESCE(mt.precious_metal_value, 0)
    + COALESCE(dt.standalone_deposit_value, 0)
    - COALESCE(ut.total_liabilities, 0) AS net_worth,

  -- Classification breakdown
  COALESCE(ut.liquid_assets, 0)                 AS liquid_assets,
  COALESCE(ut.semi_liquid_assets, 0)            AS semi_liquid_assets,
  COALESCE(ut.investment_assets, 0)             AS investment_assets,
  COALESCE(mt.precious_metal_value, 0)          AS precious_metal_value,
  COALESCE(dt.standalone_deposit_value, 0)      AS standalone_deposit_value,

  -- Locked assets (deposits flagged for net worth)
  COALESCE(dt.standalone_deposit_value, 0) AS locked_assets,

  -- Counts (for data completeness assessment)
  COALESCE(ut.account_count, 0)                 AS account_count,
  COALESCE(mt.metal_count, 0)                   AS metal_count,
  COALESCE(dt.active_deposit_count, 0)          AS active_deposit_count,

  -- Zakat helpers
  COALESCE(mt.zakatable_fine_gold_grams, 0)     AS zakatable_fine_gold_grams,
  COALESCE(mt.zakatable_metal_value, 0)         AS zakatable_metal_value,

  -- Data completeness
  CASE
    WHEN COALESCE(ut.account_count, 0) = 0 THEN 'insufficient'
    WHEN COALESCE(ut.account_count, 0) < 2 THEN 'partial'
    ELSE 'complete'
  END AS data_completeness

FROM user_totals ut
LEFT JOIN metal_totals mt ON mt.user_id = ut.user_id
LEFT JOIN deposit_totals dt ON dt.user_id = ut.user_id;

-- ────────────────────────────────────────────────────────────────
-- 2. v_zakat_assets
--
--    Aggregates all zakatable assets for the Zakat calculator,
--    with per-item haul eligibility and source traceability.
-- ────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS public.v_zakat_assets CASCADE;

CREATE OR REPLACE VIEW public.v_zakat_assets
WITH (security_invoker = true) AS
-- Cash & bank accounts
SELECT
  fa.user_id,
  fa.id                     AS source_id,
  'financial_account'       AS source_type,
  fa.name                   AS asset_name,
  CASE
    WHEN fa.account_type IN ('cash', 'mobile_financial_service') THEN 'cash'
    WHEN fa.account_type IN ('bank', 'savings') THEN 'bank'
    WHEN fa.account_type = 'investment' THEN 'investment'
    ELSE 'other'
  END                       AS zakat_category,
  CAST(vab.balance AS NUMERIC(18,4)) AS amount,
  fa.currency_code,
  fa.opening_balance_date   AS acquisition_date,
  -- Haul eligibility: NULL if no acquisition date
  CASE
    WHEN fa.opening_balance_date IS NULL THEN NULL
    WHEN fa.opening_balance_date <= (CURRENT_DATE - INTERVAL '354 days') THEN TRUE
    ELSE FALSE
  END                       AS haul_eligible,
  CASE
    WHEN fa.opening_balance_date IS NULL THEN 'Acquisition date unknown — verify haul manually'
    WHEN fa.opening_balance_date <= (CURRENT_DATE - INTERVAL '354 days') THEN 'Held for full hawl period'
    ELSE 'Not yet held for full hawl period'
  END                       AS haul_note,
  fa.is_active,
  NULL::BOOLEAN             AS is_personal_use_only,
  TRUE                      AS include_in_zakat
FROM public.financial_accounts fa
JOIN public.v_account_balances vab ON vab.account_id = fa.id
WHERE fa.account_class = 'asset'
  AND fa.account_type NOT IN ('loan', 'credit_card', 'other_liability')
  AND fa.is_active = true
  AND fa.is_archived = false
  AND CAST(vab.balance AS NUMERIC(18,4)) > 0

UNION ALL

-- Deposit products (DPS/FDR)
SELECT
  dp.user_id,
  dp.id,
  'deposit_product',
  dp.product_name,
  CASE dp.product_type
    WHEN 'dps' THEN 'dps'
    WHEN 'fdr' THEN 'fdr'
    WHEN 'sanchaypatra' THEN 'investment'
    ELSE 'other'
  END,
  COALESCE(dp.current_principal, dp.principal_amount, 0),
  dp.currency_code,
  dp.acquisition_date,
  CASE
    WHEN dp.acquisition_date IS NULL THEN NULL
    WHEN dp.acquisition_date <= (CURRENT_DATE - INTERVAL '354 days') THEN TRUE
    ELSE FALSE
  END,
  CASE
    WHEN dp.acquisition_date IS NULL THEN 'Acquisition date unknown — verify haul manually'
    WHEN dp.acquisition_date <= (CURRENT_DATE - INTERVAL '354 days') THEN 'Held for full hawl period'
    ELSE 'Not yet held for full hawl period'
  END,
  dp.status = 'active',
  NULL::BOOLEAN,
  dp.include_in_zakat
FROM public.deposit_products dp
WHERE dp.status = 'active'
  AND dp.include_in_zakat = true
  AND dp.include_in_net_worth = false  -- avoid double-counting with linked account
  AND COALESCE(dp.current_principal, dp.principal_amount, 0) > 0

UNION ALL

-- Precious metals
SELECT
  pm.user_id,
  pm.id,
  'precious_metal',
  pm.name,
  CASE pm.metal_type WHEN 'gold' THEN 'gold' WHEN 'silver' THEN 'silver' ELSE 'other' END,
  COALESCE(
    CASE
      WHEN pm.use_rate_snapshot = true THEN (
        SELECT
          CASE pm.metal_type
            WHEN 'gold'   THEN zrs.gold_rate_per_gram
            WHEN 'silver' THEN zrs.silver_rate_per_gram
            ELSE NULL
          END
          * pm.gross_weight_grams
          * COALESCE(pm.purity_percentage,
              CASE pm.purity_karat
                WHEN 24 THEN 99.9  WHEN 22 THEN 91.67 WHEN 21 THEN 87.5
                WHEN 18 THEN 75.0  WHEN 14 THEN 58.33 ELSE NULL
              END
            ) / 100.0
        FROM public.zakat_rate_snapshots zrs
        ORDER BY zrs.fetch_timestamp DESC
        LIMIT 1
      )
      ELSE pm.last_known_value
    END,
    0
  ),
  pm.currency_code,
  pm.acquisition_date,
  CASE
    WHEN pm.acquisition_date IS NULL THEN NULL
    WHEN pm.acquisition_date <= (CURRENT_DATE - INTERVAL '354 days') THEN TRUE
    ELSE FALSE
  END,
  CASE
    WHEN pm.acquisition_date IS NULL THEN 'Acquisition date unknown — verify haul manually'
    WHEN pm.acquisition_date <= (CURRENT_DATE - INTERVAL '354 days') THEN 'Held for full hawl period'
    ELSE 'Not yet held for full hawl period'
  END,
  NOT pm.is_personal_use_only,
  pm.is_personal_use_only,
  pm.include_in_zakat
FROM public.precious_metals pm
WHERE pm.include_in_zakat = true;

-- ────────────────────────────────────────────────────────────────
-- 3. Reload PostgREST schema cache
-- ────────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';

COMMIT;
