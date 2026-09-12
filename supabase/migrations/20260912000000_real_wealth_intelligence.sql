-- ================================================================
-- Migration: 20260912000000_real_wealth_intelligence.sql
-- Description: Additive tables for Real Wealth Intelligence module.
-- Includes economic data ingestion, historical asset valuation, and projections.
-- ================================================================

-- 1. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE valuation_source_type AS ENUM (
    'user_entered', 'appraisal', 'verified_external', 'manual', 'system_derived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. TABLES

-- economic_series
CREATE TABLE IF NOT EXISTS public.economic_series (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  provider            TEXT NOT NULL,
  series_code         TEXT UNIQUE,
  base_period         TEXT,
  currency_code       TEXT DEFAULT 'BDT',
  frequency           TEXT DEFAULT 'monthly', -- monthly, yearly
  description         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_economic_series_updated_at ON public.economic_series;
CREATE TRIGGER trg_economic_series_updated_at
  BEFORE UPDATE ON public.economic_series
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- economic_observations
CREATE TABLE IF NOT EXISTS public.economic_observations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id           UUID NOT NULL REFERENCES public.economic_series(id) ON DELETE CASCADE,
  period_date         DATE NOT NULL,
  index_value         NUMERIC(18,6),
  growth_rate         NUMERIC(10,6), -- e.g., inflation rate percentage if supplied directly
  status              TEXT NOT NULL DEFAULT 'current', -- current, stale, provisional
  fetched_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_reference    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(series_id, period_date)
);

DROP TRIGGER IF EXISTS trg_economic_observations_updated_at ON public.economic_observations;
CREATE TRIGGER trg_economic_observations_updated_at
  BEFORE UPDATE ON public.economic_observations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- asset_valuation_snapshots
CREATE TABLE IF NOT EXISTS public.asset_valuation_snapshots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id            UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  valuation_date      DATE NOT NULL,
  amount              NUMERIC(18,4) NOT NULL,
  currency_code       TEXT NOT NULL DEFAULT 'BDT',
  source_type         valuation_source_type NOT NULL DEFAULT 'user_entered',
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(asset_id, valuation_date)
);

CREATE INDEX IF NOT EXISTS idx_asset_valuation_snapshots_user ON public.asset_valuation_snapshots(user_id);

DROP TRIGGER IF EXISTS trg_asset_valuation_snapshots_updated_at ON public.asset_valuation_snapshots;
CREATE TRIGGER trg_asset_valuation_snapshots_updated_at
  BEFORE UPDATE ON public.asset_valuation_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- asset_projection_profiles
CREATE TABLE IF NOT EXISTS public.asset_projection_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id                  UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  growth_assumption         NUMERIC(7,4), -- expected growth rate
  inflation_assumption      NUMERIC(7,4), -- expected inflation rate
  horizon_years             SMALLINT DEFAULT 10,
  is_active                 BOOLEAN DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(asset_id)
);

CREATE INDEX IF NOT EXISTS idx_asset_projection_profiles_user ON public.asset_projection_profiles(user_id);

DROP TRIGGER IF EXISTS trg_asset_projection_profiles_updated_at ON public.asset_projection_profiles;
CREATE TRIGGER trg_asset_projection_profiles_updated_at
  BEFORE UPDATE ON public.asset_projection_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- saved_asset_projections
CREATE TABLE IF NOT EXISTS public.saved_asset_projections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  inputs_json         JSONB NOT NULL DEFAULT '{}',
  results_json        JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_asset_projections_user ON public.saved_asset_projections(user_id);

DROP TRIGGER IF EXISTS trg_saved_asset_projections_updated_at ON public.saved_asset_projections;
CREATE TRIGGER trg_saved_asset_projections_updated_at
  BEFORE UPDATE ON public.saved_asset_projections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.economic_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_valuation_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_projection_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_asset_projections ENABLE ROW LEVEL SECURITY;

-- Economic data is read-only for public/authenticated, writeable only by admin/service role
CREATE POLICY "Public read access to economic_series"
  ON public.economic_series FOR SELECT USING (TRUE);

CREATE POLICY "Public read access to economic_observations"
  ON public.economic_observations FOR SELECT USING (TRUE);

-- User data is strictly isolated
CREATE POLICY "Users manage their own asset_valuation_snapshots"
  ON public.asset_valuation_snapshots
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own asset_projection_profiles"
  ON public.asset_projection_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own saved_asset_projections"
  ON public.saved_asset_projections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
