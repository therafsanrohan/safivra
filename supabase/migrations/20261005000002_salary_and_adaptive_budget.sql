-- ================================================================
-- Migration: 20261005000002_salary_and_adaptive_budget.sql
-- Description: Salary Management & Adaptive Budget Intelligence
--   Adds income_sources, budget_configurations, and budget_sinking_funds tables.
--
-- SAFETY CONTRACT:
--   - ADDITIVE ONLY — no tables dropped, no existing columns changed
--   - All new tables have RLS enabled with user-ownership policies
--   - No changes to existing transactions, financial accounts, or ledger tables
-- ================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. ENUMS (idempotent)
-- ────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE income_type AS ENUM (
    'primary_salary',
    'secondary_salary',
    'freelance',
    'business',
    'commission',
    'bonus',
    'rental',
    'recurring_other',
    'irregular'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE income_frequency AS ENUM (
    'monthly',
    'weekly',
    'biweekly',
    'quarterly',
    'yearly',
    'one_time'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE income_stability AS ENUM (
    'stable',
    'variable',
    'unstable'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE budget_scenario_type AS ENUM (
    'balanced',
    'savings_focused',
    'debt_focused',
    'goal_focused',
    'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────────
-- 2. income_sources
--
--    Stores planned/recurring income definitions for budget planning.
--    Actual received income remains tracked in ledger_transactions.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.income_sources (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name                    TEXT        NOT NULL,              -- e.g. "Primary Salary at Tech Corp", "Upwork Freelancing"
  income_type             income_type NOT NULL DEFAULT 'primary_salary',
  frequency               income_frequency NOT NULL DEFAULT 'monthly',
  stability               income_stability NOT NULL DEFAULT 'stable',

  -- Financials
  gross_amount            NUMERIC(18,4),                     -- Optional gross salary
  deductions_amount       NUMERIC(18,4),                     -- Optional tax/PF/payroll deductions
  net_takehome_amount     NUMERIC(18,4) NOT NULL CHECK (net_takehome_amount >= 0),

  currency_code           TEXT        NOT NULL DEFAULT 'BDT',
  payment_day             SMALLINT    CHECK (payment_day BETWEEN 1 AND 31), -- e.g. 5th of month
  receiving_account_id    UUID        REFERENCES public.financial_accounts(id) ON DELETE SET NULL,

  is_expected             BOOLEAN     NOT NULL DEFAULT TRUE,
  is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
  start_date              DATE        NOT NULL DEFAULT CURRENT_DATE,
  end_date                DATE,

  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_income_sources_user ON public.income_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_account ON public.income_sources(receiving_account_id);

DROP TRIGGER IF EXISTS trg_income_sources_updated_at ON public.income_sources;
CREATE TRIGGER trg_income_sources_updated_at
  BEFORE UPDATE ON public.income_sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "income_sources_owner_policy" ON public.income_sources
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- 3. budget_configurations
--
--    Stores adaptive budget configuration and benchmark parameters.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.budget_configurations (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  household_size              SMALLINT    NOT NULL DEFAULT 1,
  dependents_count            SMALLINT    NOT NULL DEFAULT 0,
  emergency_target_months     NUMERIC(4,1) NOT NULL DEFAULT 3.0,
  minimum_buffer_amount       NUMERIC(18,4) NOT NULL DEFAULT 5000.00,
  target_scenario             budget_scenario_type NOT NULL DEFAULT 'balanced',

  -- User-specified essential estimates (used when transaction history is sparse)
  rent_estimate               NUMERIC(18,4),
  food_estimate               NUMERIC(18,4),
  transport_estimate          NUMERIC(18,4),
  utilities_estimate          NUMERIC(18,4),
  family_support_estimate     NUMERIC(18,4),

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_budget_configurations_updated_at ON public.budget_configurations;
CREATE TRIGGER trg_budget_configurations_updated_at
  BEFORE UPDATE ON public.budget_configurations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.budget_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_configurations_owner_policy" ON public.budget_configurations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- 4. budget_sinking_funds
--
--    Stores flex/irregular sinking fund reserves (Eid, insurance, repairs, medical, etc.)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.budget_sinking_funds (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name                        TEXT        NOT NULL,          -- e.g. "Eid Expenses", "Car Insurance", "Medical Reserve"
  annual_estimated_cost       NUMERIC(18,4) NOT NULL CHECK (annual_estimated_cost >= 0),
  monthly_reserve_amount      NUMERIC(18,4) NOT NULL CHECK (monthly_reserve_amount >= 0),
  target_month                SMALLINT    CHECK (target_month BETWEEN 1 AND 12),
  category_id                 UUID        REFERENCES public.transaction_categories(id) ON DELETE SET NULL,

  notes                       TEXT,
  is_active                   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_sinking_funds_user ON public.budget_sinking_funds(user_id);

DROP TRIGGER IF EXISTS trg_budget_sinking_funds_updated_at ON public.budget_sinking_funds;
CREATE TRIGGER trg_budget_sinking_funds_updated_at
  BEFORE UPDATE ON public.budget_sinking_funds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.budget_sinking_funds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_sinking_funds_owner_policy" ON public.budget_sinking_funds
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- 5. Reload PostgREST schema cache
-- ────────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';

COMMIT;
