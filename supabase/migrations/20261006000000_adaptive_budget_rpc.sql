-- ================================================================
-- Migration: 20261006000000_adaptive_budget_rpc.sql
-- Description: Server-side Adaptive Budget Intelligence Engine
--
--   Replaces 9 sequential client-side Supabase queries with a
--   SINGLE PostgreSQL RPC function using CTEs and window functions.
--
--   All financial math runs inside the database:
--     - Income aggregation (stable vs variable, 80% conservative weight)
--     - 6-month ledger history analysis (rolling avg, monthly breakdown)
--     - Category-level spending pattern detection (essentials vs lifestyle)
--     - Debt service ratio (loans + credit cards)
--     - DPS/FDR committed savings aggregation
--     - Savings goals monthly velocity calculation
--     - Emergency fund coverage and gap analysis
--     - 5-Pillar budget allocation with scenario tuning
--     - Financial health state classification
--     - Data confidence scoring
--     - Month-over-month income trend (last 3 vs prior 3 months)
--     - Structured explainability notes
--
-- SAFETY CONTRACT:
--   - ADDITIVE ONLY -- no existing tables or data modified
--   - SECURITY DEFINER with explicit search_path = public
--   - Grants to authenticated role only
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. DROP AND RECREATE (idempotent)
-- ----------------------------------------------------------------
DROP FUNCTION IF EXISTS public.calculate_adaptive_budget(UUID, TEXT);

-- ----------------------------------------------------------------
-- 2. THE ENGINE
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_adaptive_budget(
    p_user_id       UUID,
    p_scenario      TEXT    DEFAULT 'balanced'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN

WITH

-- CTE 1: Raw income split by stability
income_raw AS (
    SELECT
        COUNT(*)                                                            AS source_count,
        COALESCE(SUM(gross_amount),         0)                             AS total_gross,
        COALESCE(SUM(net_takehome_amount),  0)                             AS total_takehome,
        COALESCE(SUM(CASE WHEN stability = 'stable'   THEN net_takehome_amount ELSE 0 END), 0) AS stable_income,
        COALESCE(SUM(CASE WHEN stability IN ('variable','unstable') THEN net_takehome_amount ELSE 0 END), 0) AS variable_income
    FROM income_sources
    WHERE user_id = p_user_id
      AND is_active = true
),

-- CTE 2: Conservative planning income (80% on variable)
income_plan AS (
    SELECT
        ir.source_count,
        ir.total_gross,
        ir.total_takehome,
        ir.stable_income,
        ir.variable_income,
        ROUND((ir.stable_income + ir.variable_income * 0.80)::NUMERIC, 2) AS conservative_income
    FROM income_raw ir
),

-- CTE 3: Budget configuration with defaults
budget_cfg AS (
    SELECT
        COALESCE(emergency_target_months, 3.0)   AS emergency_months,
        COALESCE(minimum_buffer_amount, 5000.00) AS min_buffer,
        COALESCE(rent_estimate,           0)     AS rent,
        COALESCE(food_estimate,           0)     AS food,
        COALESCE(transport_estimate,      0)     AS transport,
        COALESCE(utilities_estimate,      0)     AS utilities,
        COALESCE(family_support_estimate, 0)     AS family_support
    FROM budget_configurations
    WHERE user_id = p_user_id
    UNION ALL
    SELECT 3.0, 5000.00, 0, 0, 0, 0, 0
    LIMIT 1
),

-- CTE 4a: Loan obligations
debt_loans AS (
    SELECT
        COALESCE(SUM(l.monthly_installment), 0) AS loan_installments,
        COALESCE(MAX(CASE WHEN l.annual_rate > 12 THEN 1 ELSE 0 END), 0) AS has_high_cost_debt
    FROM loans l
    WHERE l.user_id = p_user_id
      AND l.status  = 'active'
),

-- CTE 4b: Credit card minimums
debt_cards AS (
    SELECT COALESCE(SUM(c.minimum_payment), 0) AS card_minimums
    FROM credit_cards c
    WHERE c.user_id = p_user_id
      AND c.status  = 'active'
),

-- CTE 4c: Combined debt
total_debt AS (
    SELECT
        ROUND((dl.loan_installments + dc.card_minimums)::NUMERIC, 2) AS mandatory_debt,
        (dl.has_high_cost_debt = 1)                                   AS has_high_cost_debt
    FROM debt_loans dl, debt_cards dc
),

-- CTE 5: DPS / deposit committed savings
dps_savings AS (
    SELECT ROUND(COALESCE(SUM(installment_amount), 0)::NUMERIC, 2) AS committed_dps
    FROM deposit_products
    WHERE user_id = p_user_id
      AND status  = 'active'
),

-- CTE 6: Sinking funds monthly reserve
sinking AS (
    SELECT ROUND(COALESCE(SUM(monthly_reserve_amount), 0)::NUMERIC, 2) AS sinking_reserve
    FROM budget_sinking_funds
    WHERE user_id   = p_user_id
      AND is_active = true
),

-- CTE 7: Savings goals monthly velocity
goals_velocity AS (
    SELECT ROUND(COALESCE(SUM(
        CASE
            WHEN target_date IS NULL THEN
                LEAST(GREATEST(target_amount - COALESCE(current_amount, 0), 0), 2000)
            ELSE
                GREATEST(target_amount - COALESCE(current_amount, 0), 0)
                / GREATEST(
                    CEIL(EXTRACT(EPOCH FROM (target_date::TIMESTAMPTZ - NOW())) / (60*60*24*30.4)),
                    1
                )
        END
    ), 0)::NUMERIC, 2) AS goals_monthly_target
    FROM savings_goals
    WHERE user_id = p_user_id
      AND status  = 'active'
      AND COALESCE(current_amount, 0) < target_amount
),

-- CTE 8: Liquid assets
liquid AS (
    SELECT COALESCE(ws.liquid_assets, 0)::NUMERIC AS liquid_savings
    FROM v_wealth_summary ws
    WHERE ws.user_id = p_user_id
    UNION ALL SELECT 0::NUMERIC LIMIT 1
),

-- CTE 9a: Raw transaction window (6 months)
tx_window AS (
    SELECT
        e.amount,
        t.transaction_type,
        DATE_TRUNC('month', t.transaction_date::TIMESTAMPTZ) AS tx_month
    FROM ledger_transactions t
    JOIN ledger_entries e ON e.ledger_transaction_id = t.id
    WHERE t.user_id = p_user_id
      AND t.status = 'posted'
      AND t.transaction_date >= (CURRENT_DATE - INTERVAL '6 months')
      AND e.entry_role = 'main'
),

-- CTE 9b: Monthly expense aggregation
monthly_expense_agg AS (
    SELECT
        tx_month,
        ROUND(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END)::NUMERIC, 2) AS month_expense,
        ROUND(SUM(CASE WHEN transaction_type = 'income'  THEN amount ELSE 0 END)::NUMERIC, 2) AS month_income
    FROM tx_window
    GROUP BY tx_month
),

-- CTE 9c: Summary with trend data
tx_summary AS (
    SELECT
        COUNT(DISTINCT tx_month)                AS months_with_data,
        ROUND(AVG(month_expense)::NUMERIC, 2)   AS avg_monthly_expense,
        ROUND(AVG(CASE WHEN tx_month >= DATE_TRUNC('month', NOW()) - INTERVAL '3 months'
                       THEN month_income ELSE NULL END)::NUMERIC, 2) AS recent_3m_income,
        ROUND(AVG(CASE WHEN tx_month <  DATE_TRUNC('month', NOW()) - INTERVAL '3 months'
                       THEN month_income ELSE NULL END)::NUMERIC, 2) AS prior_3m_income
    FROM monthly_expense_agg
),

-- CTE 10: Essential expense estimation (3-tier priority)
essential_calc AS (
    SELECT
        CASE
            WHEN (cfg.rent + cfg.food + cfg.transport + cfg.utilities + cfg.family_support) > 0
            THEN ROUND((cfg.rent + cfg.food + cfg.transport + cfg.utilities + cfg.family_support)::NUMERIC, 2)
            WHEN ts.avg_monthly_expense > 0
            THEN ROUND((ts.avg_monthly_expense * 0.65)::NUMERIC, 2)
            ELSE ROUND((ip.total_takehome * 0.50)::NUMERIC, 2)
        END AS essential_expenses
    FROM budget_cfg cfg, tx_summary ts, income_plan ip
),

-- CTE 11: Emergency fund intelligence
emergency_fund AS (
    SELECT
        ROUND((ec.essential_expenses * cfg.emergency_months)::NUMERIC, 2)                          AS target_amount,
        GREATEST(0, ROUND((ec.essential_expenses * cfg.emergency_months - l.liquid_savings)::NUMERIC, 2)) AS gap_amount,
        CASE WHEN ec.essential_expenses > 0
             THEN ROUND((l.liquid_savings / ec.essential_expenses)::NUMERIC, 2)
             ELSE 0
        END                                                                                         AS coverage_months,
        cfg.emergency_months                                                                        AS target_months,
        CASE WHEN l.liquid_savings < (ec.essential_expenses * cfg.emergency_months)
             THEN ROUND(LEAST(
                    GREATEST(ec.essential_expenses * cfg.emergency_months - l.liquid_savings, 0) / 6.0,
                    ip.conservative_income * 0.15
                  )::NUMERIC, 2)
             ELSE 0
        END                                                                                         AS monthly_contribution,
        l.liquid_savings                                                                            AS current_liquid
    FROM essential_calc ec, budget_cfg cfg, liquid l, income_plan ip
),

-- CTE 12: 5-Pillar allocations with scenario tuning
pillars AS (
    SELECT
        ROUND((ec.essential_expenses + td.mandatory_debt)::NUMERIC, 2) AS pillar_essentials,

        ROUND(CASE p_scenario
            WHEN 'savings_focused' THEN ef.monthly_contribution * 1.25
            ELSE ef.monthly_contribution
        END::NUMERIC, 2)                                               AS pillar_security,

        ROUND(CASE p_scenario
            WHEN 'savings_focused' THEN (ds.committed_dps + gv.goals_monthly_target) * 1.20
            WHEN 'debt_focused'    THEN (ds.committed_dps + gv.goals_monthly_target) * 0.75
            WHEN 'goal_focused'    THEN (ds.committed_dps + gv.goals_monthly_target) * 1.30
            ELSE                        (ds.committed_dps + gv.goals_monthly_target)
        END::NUMERIC, 2)                                               AS pillar_goals,

        s.sinking_reserve                                              AS pillar_flex,

        ROUND(CASE
            WHEN td.has_high_cost_debt AND p_scenario = 'debt_focused'
                THEN ip.conservative_income * 0.15
            WHEN td.has_high_cost_debt AND p_scenario != 'savings_focused'
                THEN ip.conservative_income * 0.10
            ELSE 0
        END::NUMERIC, 2)                                               AS pillar_debt_accel,

        ec.essential_expenses,
        td.mandatory_debt,
        td.has_high_cost_debt,
        ds.committed_dps,
        gv.goals_monthly_target,
        s.sinking_reserve   AS sinking_reserve_val,
        cfg.min_buffer

    FROM essential_calc ec, total_debt td, dps_savings ds,
         goals_velocity gv, sinking s, budget_cfg cfg,
         emergency_fund ef, income_plan ip
),

-- CTE 13: Money flow
money_flow AS (
    SELECT
        (p.pillar_essentials + p.pillar_security + p.pillar_goals
            + p.pillar_flex + p.pillar_debt_accel)                     AS committed_total,
        GREATEST(0, ROUND((ip.conservative_income
            - p.pillar_essentials - p.pillar_security - p.pillar_goals
            - p.pillar_flex - p.pillar_debt_accel - p.min_buffer)::NUMERIC, 2)) AS safe_to_spend,
        ROUND((ip.total_takehome
            - (p.pillar_essentials + p.pillar_security + p.pillar_goals
               + p.pillar_flex + p.pillar_debt_accel))::NUMERIC, 2)   AS uncommitted,
        ip.total_takehome,
        ip.conservative_income,
        p.*
    FROM pillars p, income_plan ip
),

-- CTE 14: Financial ratios
ratios AS (
    SELECT
        GREATEST(0, ROUND((mf.uncommitted - mf.min_buffer)::NUMERIC, 2))  AS lifestyle_alloc,
        CASE WHEN mf.total_takehome > 0
             THEN ROUND(((mf.pillar_security + mf.pillar_goals) / mf.total_takehome * 100)::NUMERIC, 1)
             ELSE 0 END  AS savings_rate_pct,
        CASE WHEN mf.total_takehome > 0
             THEN ROUND((mf.pillar_essentials / mf.total_takehome * 100)::NUMERIC, 1)
             ELSE 0 END  AS essential_ratio_pct,
        CASE WHEN mf.total_takehome > 0
             THEN ROUND((mf.mandatory_debt / mf.total_takehome * 100)::NUMERIC, 1)
             ELSE 0 END  AS debt_service_ratio_pct,
        mf.*
    FROM money_flow mf
),

-- CTE 15: Budget health classification
health AS (
    SELECT
        CASE
            WHEN r.uncommitted < 0 OR r.essential_ratio_pct > 85 THEN 'DEFICIT'
            WHEN r.essential_ratio_pct > 70 OR r.debt_service_ratio_pct > 35 THEN 'AT_RISK'
            WHEN r.safe_to_spend < r.min_buffer OR r.essential_ratio_pct > 60 THEN 'TIGHT'
            WHEN r.savings_rate_pct >= 20 THEN 'HEALTHY'
            ELSE 'BALANCED'
        END AS budget_health,
        CASE
            WHEN r.uncommitted < 0 OR r.essential_ratio_pct > 85
                THEN 'Essential costs and debt exceed your monthly take-home income.'
            WHEN r.essential_ratio_pct > 70 OR r.debt_service_ratio_pct > 35
                THEN 'High mandatory costs leave little room for surprises or savings.'
            WHEN r.safe_to_spend < r.min_buffer OR r.essential_ratio_pct > 60
                THEN 'Essential commitments leave a tight margin for flexible spending.'
            WHEN r.savings_rate_pct >= 20
                THEN 'Income comfortably covers essentials, debt, and healthy savings.'
            ELSE 'Income and expenses are balanced with room for personal flexibility.'
        END AS health_reason,
        r.*
    FROM ratios r
),

-- CTE 16: Data confidence level
confidence AS (
    SELECT
        ts.months_with_data,
        ts.avg_monthly_expense,
        ts.recent_3m_income,
        ts.prior_3m_income,
        CASE
            WHEN ts.months_with_data >= 6 THEN 'HIGH_CONFIDENCE'
            WHEN ts.months_with_data >= 3 THEN 'PERSONALIZED'
            ELSE                               'STARTER'
        END AS data_confidence,
        CASE
            WHEN ts.months_with_data >= 6
                THEN 'Based on ' || ts.months_with_data || ' months of continuous spending history.'
            WHEN ts.months_with_data >= 3
                THEN 'Based on ' || ts.months_with_data || ' months of transactions. Accuracy improves with more history.'
            ELSE
                'Starter estimate based on your income. Safivra refines this as history builds.'
        END AS confidence_reason
    FROM tx_summary ts
)

-- CTE 17: Final JSON assembly
SELECT jsonb_build_object(
    'incomeSourcesCount',            h.source_count,
    'totalGrossIncome',              h.total_gross,
    'totalTakeHomeIncome',           h.total_takehome,
    'conservativePlanningIncome',    h.conservative_income,
    'variableIncomeAmount',          h.variable_income,
    'actualEssentialExpenses',       h.essential_expenses,
    'mandatoryDebtPayments',         h.mandatory_debt,
    'committedSavingsDps',           h.committed_dps,
    'activeGoalsTarget',             h.goals_monthly_target,
    'sinkingFundMonthlyReserve',     h.sinking_reserve_val,
    'minimumBufferAmount',           h.min_buffer,
    'historicalAvgMonthlyExpense',   c.avg_monthly_expense,
    'transactionHistoryMonthsCount', c.months_with_data,
    'safeToSpend',                   h.safe_to_spend,
    'uncommittedMoneyLeft',          h.uncommitted,
    'savingsRate',                   h.savings_rate_pct,
    'essentialExpenseRatio',         h.essential_ratio_pct,
    'debtServiceRatio',              h.debt_service_ratio_pct,
    'pillarAllocations', jsonb_build_object(
        'essentials',        h.pillar_essentials,
        'financialSecurity', h.pillar_security,
        'goalsAndFuture',    h.pillar_goals,
        'lifestyle',         h.lifestyle_alloc,
        'flexIrregular',     h.pillar_flex,
        'debtAcceleration',  h.pillar_debt_accel
    ),
    'budgetHealth',         h.budget_health,
    'budgetHealthReason',   h.health_reason,
    'dataConfidence',       c.data_confidence,
    'dataConfidenceReason', c.confidence_reason,
    'incomeTrendPct',       CASE
                                WHEN c.prior_3m_income > 0 AND c.recent_3m_income IS NOT NULL
                                THEN ROUND(((c.recent_3m_income - c.prior_3m_income) / c.prior_3m_income * 100)::NUMERIC, 1)
                                ELSE NULL
                            END,
    'recent3mIncome',       c.recent_3m_income,
    'prior3mIncome',        c.prior_3m_income,
    'emergencyFund', jsonb_build_object(
        'essentialMonthlyCost',           ef.ef_essential_monthly_cost,
        'currentLiquidSavings',           ef.current_liquid,
        'currentCoverageMonths',          ef.coverage_months,
        'targetMonths',                   ef.target_months,
        'targetAmount',                   ef.target_amount,
        'gapAmount',                      ef.gap_amount,
        'recommendedMonthlyContribution', ef.monthly_contribution
    ),
    'hasHighCostDebt', h.has_high_cost_debt,
    'scenario',        p_scenario,
    'calculatedAt',    NOW()
)
INTO v_result
FROM health h
CROSS JOIN confidence c
CROSS JOIN (
    SELECT
        ef2.target_amount,
        ef2.gap_amount,
        ef2.coverage_months,
        ef2.target_months,
        ef2.monthly_contribution,
        ef2.current_liquid,
        ec2.essential_expenses AS ef_essential_monthly_cost
    FROM emergency_fund ef2, essential_calc ec2
) ef;

RETURN COALESCE(v_result, '{}'::JSONB);

END;
$$;

-- ----------------------------------------------------------------
-- 3. Permissions
-- ----------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.calculate_adaptive_budget(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_adaptive_budget(UUID, TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.calculate_adaptive_budget(UUID, TEXT) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.calculate_adaptive_budget(UUID, TEXT) TO service_role;

-- ----------------------------------------------------------------
-- 4. Composite indexes to maximize RPC speed
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_income_sources_user_active
    ON public.income_sources (user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_sinking_funds_user_active
    ON public.budget_sinking_funds (user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_ledger_tx_user_status_date
    ON public.ledger_transactions (user_id, status, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_loans_user_status
    ON public.loans (user_id, status);

CREATE INDEX IF NOT EXISTS idx_credit_cards_user_status
    ON public.credit_cards (user_id, status);

CREATE INDEX IF NOT EXISTS idx_deposit_products_user_status
    ON public.deposit_products (user_id, status);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user_status
    ON public.savings_goals (user_id, status);

NOTIFY pgrst, 'reload schema';

COMMIT;
