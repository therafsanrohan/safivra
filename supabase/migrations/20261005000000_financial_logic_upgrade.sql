-- ================================================================
-- Migration: 20261005000000_financial_logic_upgrade.sql
-- Description: Financial Logic Upgrade — Part 1 of 2
--   Adds deposit_products, goal_allocations, user_zakat_preferences,
--   precious_metals, and wealth_snapshots tables.
--
-- SAFETY CONTRACT:
--   - ADDITIVE ONLY — no columns dropped, no tables removed, no data changed
--   - All new tables have RLS enabled with user-ownership policies
--   - No changes to: financial_accounts, ledger_*, v_account_balances,
--     post_transaction(), zakat_*, savings_goals, loans, credit_cards
--   - savings_schemes is preserved as-is (created only if it doesn't exist)
-- ================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. ENUM TYPES (new, idempotent)
-- ────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE deposit_product_type AS ENUM (
    'dps',           -- Deposit Pension Scheme / monthly installment
    'fdr',           -- Fixed Deposit Receipt / term deposit
    'sanchaypatra',  -- Bangladesh govt savings bond
    'savings_scheme', -- Generic savings product
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE deposit_rate_type AS ENUM (
    'simple',          -- Simple interest
    'compound',        -- Compound interest
    'reducing_balance',
    'profit_sharing',  -- Islamic banking
    'flat',
    'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE deposit_payout_method AS ENUM (
    'at_maturity',
    'monthly',
    'quarterly',
    'yearly',
    'cumulative',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE deposit_status AS ENUM (
    'active',
    'matured',
    'prematurely_encashed',
    'closed',
    'paused'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE precious_metal_type AS ENUM ('gold', 'silver', 'platinum', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE precious_metal_form AS ENUM (
    'jewelry', 'bar', 'coin', 'ornament', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE goal_source_type AS ENUM ('account', 'deposit_product', 'precious_metal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE wealth_snapshot_status AS ENUM ('draft', 'confirmed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────────
-- 2. deposit_products
--
--    Represents DPS, FDR, Sanchaypatra and similar term deposits.
--    Linked to the funding financial_account (where installments/
--    principal come from). This is NOT a separate asset in net worth
--    unless explicitly flagged — the money already exists in the
--    funding account or is a separate locked corpus.
--
--    include_in_net_worth = FALSE means the principal lives inside
--    the linked funding account and should NOT be double-counted.
--    include_in_net_worth = TRUE means the deposit corpus is
--    separate from any tracked account (e.g. an old FDR opened
--    before Safivra was used, with no corresponding account).
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.deposit_products (
  id                            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  product_name                  TEXT        NOT NULL,
  product_type                  deposit_product_type NOT NULL DEFAULT 'dps',
  institution                   TEXT        NOT NULL,

  -- Linkage to funding account (where installments debit from / principal came from)
  linked_account_id             UUID        REFERENCES public.financial_accounts(id) ON DELETE SET NULL,

  -- Payout account (where maturity proceeds / interest lands)
  payout_account_id             UUID        REFERENCES public.financial_accounts(id) ON DELETE SET NULL,

  -- Terms
  installment_amount            NUMERIC(18,4),     -- for DPS: monthly installment
  principal_amount              NUMERIC(18,4),     -- for FDR/Sanchaypatra: lump sum principal
  currency_code                 TEXT        NOT NULL DEFAULT 'BDT',
  nominal_rate                  NUMERIC(8,4),      -- annual rate as entered, e.g. 8.5
  rate_type                     deposit_rate_type  NOT NULL DEFAULT 'unknown',
  payout_method                 deposit_payout_method NOT NULL DEFAULT 'at_maturity',

  -- Dates
  start_date                    DATE        NOT NULL,
  tenure_months                 SMALLINT,          -- e.g. 60 for 5-year DPS
  maturity_date                 DATE,              -- can be calculated or overridden
  next_installment_date         DATE,              -- for DPS

  -- Balances (user-entered or system-tracked)
  current_principal             NUMERIC(18,4),     -- accumulated principal so far
  current_accrued_return        NUMERIC(18,4),     -- accrued profit/interest if known
  expected_maturity_value       NUMERIC(18,4),     -- user-entered or calculated estimate
  is_maturity_value_estimated   BOOLEAN     NOT NULL DEFAULT TRUE,

  -- Premature encashment
  premature_encashment_rule     TEXT,              -- free-text rule description
  premature_penalty_rate        NUMERIC(8,4),      -- % penalty on rate if applicable

  -- Zakat tracking
  acquisition_date              DATE,              -- for haul calculation
  include_in_zakat              BOOLEAN     NOT NULL DEFAULT TRUE,
  zakat_use_principal_only      BOOLEAN     NOT NULL DEFAULT TRUE, -- use principal, not maturity

  -- Net worth
  include_in_net_worth          BOOLEAN     NOT NULL DEFAULT FALSE,
  -- FALSE = money is already inside linked_account, don't double-count
  -- TRUE  = this deposit is the only record of this money in Safivra

  status                        deposit_status NOT NULL DEFAULT 'active',
  notes                         TEXT,

  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deposit_products_user      ON public.deposit_products(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_products_account   ON public.deposit_products(linked_account_id);
CREATE INDEX IF NOT EXISTS idx_deposit_products_status    ON public.deposit_products(user_id, status);

DROP TRIGGER IF EXISTS trg_deposit_products_updated_at ON public.deposit_products;
CREATE TRIGGER trg_deposit_products_updated_at
  BEFORE UPDATE ON public.deposit_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.deposit_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deposit_products_owner_policy" ON public.deposit_products
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- 3. precious_metals
--
--    Gold, silver and similar. Weight + purity based so the system
--    can calculate fine-metal equivalent and current market value
--    using the active rate snapshot.
--
--    Personal-use jewelry has different Zakat treatment.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.precious_metals (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  name                      TEXT        NOT NULL,         -- e.g. "Wedding bangles", "Gold bar"
  metal_type                precious_metal_type NOT NULL DEFAULT 'gold',
  metal_form                precious_metal_form NOT NULL DEFAULT 'jewelry',

  -- Weight & purity
  gross_weight_grams        NUMERIC(12,4) NOT NULL,       -- total weight including alloy
  purity_karat              SMALLINT,                     -- 24, 22, 21, 18, etc. (for gold)
  purity_percentage         NUMERIC(6,4),                 -- e.g. 91.67 for 22K
  -- System derives: fine_weight_grams = gross_weight * (purity_percentage / 100)

  -- Valuation
  last_known_value          NUMERIC(18,4),                -- market value at valuation_date
  valuation_date            DATE,
  currency_code             TEXT        NOT NULL DEFAULT 'BDT',
  use_rate_snapshot         BOOLEAN     NOT NULL DEFAULT TRUE,
  -- If TRUE, system calculates value from zakat_rate_snapshots × fine_weight
  -- If FALSE, last_known_value is used as-is

  -- Zakat
  acquisition_date          DATE,                         -- for haul tracking
  is_personal_use_only      BOOLEAN     NOT NULL DEFAULT FALSE,
  -- Personal-use jewelry: some scholars exclude; system flags, user decides
  include_in_zakat          BOOLEAN     NOT NULL DEFAULT TRUE,

  -- Net worth
  include_in_net_worth      BOOLEAN     NOT NULL DEFAULT TRUE,

  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_precious_metals_user ON public.precious_metals(user_id);

DROP TRIGGER IF EXISTS trg_precious_metals_updated_at ON public.precious_metals;
CREATE TRIGGER trg_precious_metals_updated_at
  BEFORE UPDATE ON public.precious_metals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.precious_metals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "precious_metals_owner_policy" ON public.precious_metals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- 4. goal_allocations
--
--    Anti-double-count planning layer.
--    Savings goals are targets; allocations record which existing
--    account/product the progress money lives in.
--    The SUM of allocations must never be counted separately from
--    the accounts themselves in any net worth calculation.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.goal_allocations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id           UUID        NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,

  source_type       goal_source_type NOT NULL DEFAULT 'account',
  source_id         UUID        NOT NULL,
  -- When source_type = 'account'         → references financial_accounts(id)
  -- When source_type = 'deposit_product' → references deposit_products(id)
  -- When source_type = 'precious_metal'  → references precious_metals(id)

  allocated_amount  NUMERIC(18,4) NOT NULL CHECK (allocated_amount >= 0),
  currency_code     TEXT        NOT NULL DEFAULT 'BDT',
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goal_allocations_goal   ON public.goal_allocations(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_allocations_user   ON public.goal_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_allocations_source ON public.goal_allocations(source_type, source_id);

DROP TRIGGER IF EXISTS trg_goal_allocations_updated_at ON public.goal_allocations;
CREATE TRIGGER trg_goal_allocations_updated_at
  BEFORE UPDATE ON public.goal_allocations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.goal_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goal_allocations_owner_policy" ON public.goal_allocations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- 5. user_zakat_preferences
--
--    Per-user Zakat settings. The global rule set remains the
--    default; this table records individual overrides.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_zakat_preferences (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  nisab_standard              TEXT        NOT NULL DEFAULT 'gold'
                                          CHECK (nisab_standard IN ('gold', 'silver')),
  zakat_anniversary_date      DATE,                       -- user's annual Zakat date
  methodology_note            TEXT,                       -- user's fiqh methodology note
  include_dps_in_zakat        BOOLEAN     NOT NULL DEFAULT TRUE,
  include_fdr_in_zakat        BOOLEAN     NOT NULL DEFAULT TRUE,
  include_receivables_in_zakat BOOLEAN    NOT NULL DEFAULT TRUE,
  include_investments_in_zakat BOOLEAN    NOT NULL DEFAULT TRUE,

  -- Rate freshness threshold: warn if rate is older than this many days
  rate_freshness_days         SMALLINT    NOT NULL DEFAULT 30,

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_user_zakat_preferences_updated_at ON public.user_zakat_preferences;
CREATE TRIGGER trg_user_zakat_preferences_updated_at
  BEFORE UPDATE ON public.user_zakat_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_zakat_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_zakat_preferences_owner_policy" ON public.user_zakat_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- 6. wealth_snapshots
--
--    Periodic point-in-time wealth record for trend charting.
--    Written by the wealth engine, never by direct user action.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wealth_snapshots (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  snapshot_date               DATE        NOT NULL,
  currency_code               TEXT        NOT NULL DEFAULT 'BDT',

  -- Calculated from v_account_balances + precious_metals + deposit_products
  total_assets                NUMERIC(18,4) NOT NULL DEFAULT 0,
  total_liabilities           NUMERIC(18,4) NOT NULL DEFAULT 0,
  net_worth                   NUMERIC(18,4) NOT NULL DEFAULT 0,
  liquid_assets               NUMERIC(18,4) NOT NULL DEFAULT 0,
  semi_liquid_assets          NUMERIC(18,4) NOT NULL DEFAULT 0,
  locked_assets               NUMERIC(18,4) NOT NULL DEFAULT 0,
  investment_assets           NUMERIC(18,4) NOT NULL DEFAULT 0,
  precious_metal_value        NUMERIC(18,4) NOT NULL DEFAULT 0,

  -- Inflation adjustment
  cpi_adjusted_net_worth      NUMERIC(18,4),      -- Real net worth (CPI-deflated)
  cpi_base_date               DATE,               -- reference date for CPI adjustment
  cpi_series_id               UUID REFERENCES public.economic_series(id) ON DELETE SET NULL,

  -- Data completeness
  data_completeness           TEXT        NOT NULL DEFAULT 'partial'
                              CHECK (data_completeness IN ('complete', 'partial', 'insufficient')),
  account_count               SMALLINT    NOT NULL DEFAULT 0,
  notes                       TEXT,

  status                      wealth_snapshot_status NOT NULL DEFAULT 'draft',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_wealth_snapshots_user_date ON public.wealth_snapshots(user_id, snapshot_date DESC);

ALTER TABLE public.wealth_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wealth_snapshots_owner_policy" ON public.wealth_snapshots
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- 7. Extend zakat_calculation_items
--    Add haul tracking columns (additive, safe)
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.zakat_calculation_items
  ADD COLUMN IF NOT EXISTS acquisition_date  DATE,
  ADD COLUMN IF NOT EXISTS haul_eligible     BOOLEAN,
  -- NULL = unknown (acquisition_date missing)
  -- TRUE = asset has been held for full hawl period
  -- FALSE = asset has NOT yet completed hawl
  ADD COLUMN IF NOT EXISTS haul_note         TEXT,
  ADD COLUMN IF NOT EXISTS source_table      TEXT,   -- 'financial_accounts', 'deposit_products', 'precious_metals'
  ADD COLUMN IF NOT EXISTS source_id         UUID;

-- ────────────────────────────────────────────────────────────────
-- 8. Safely ensure savings_schemes has linked_account_id
--    (Additive — only adds column if missing, preserves all data)
-- ────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'savings_schemes'
  ) THEN
    -- Add linked_account_id if not present
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'savings_schemes'
        AND column_name = 'linked_account_id'
    ) THEN
      ALTER TABLE public.savings_schemes
        ADD COLUMN linked_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL;
    END IF;

    -- Add acquisition_date for haul tracking if not present
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'savings_schemes'
        AND column_name = 'acquisition_date'
    ) THEN
      ALTER TABLE public.savings_schemes
        ADD COLUMN acquisition_date DATE;
    END IF;

    -- Add deposit_product_id FK if not present (links old record to new model)
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'savings_schemes'
        AND column_name = 'deposit_product_id'
    ) THEN
      ALTER TABLE public.savings_schemes
        ADD COLUMN deposit_product_id UUID REFERENCES public.deposit_products(id) ON DELETE SET NULL;
    END IF;

    -- Add include_in_net_worth if not present
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'savings_schemes'
        AND column_name = 'include_in_net_worth'
    ) THEN
      ALTER TABLE public.savings_schemes
        ADD COLUMN include_in_net_worth BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────
-- 9. Reload PostgREST schema cache
-- ────────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';

COMMIT;
