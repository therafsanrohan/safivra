-- ================================================================
-- Migration: 20260909000001_guidance_scenarios.sql
-- Description: Guidance preferences and saved scenarios tables.
--
-- SAFETY NOTES:
--   - These tables contain hypothetical planning data only.
--   - They have NO foreign keys to financial records (transactions,
--     accounts, balances). A saved scenario cannot affect the ledger.
--   - Row-level security ensures strict user isolation.
--   - Saving a scenario does NOT modify budgets, transactions, or balances.
-- ================================================================

-- ─── 1. GUIDANCE PREFERENCES ────────────────────────────────────────────────
-- One row per user. Stores optional category flexibility preferences.
-- Not a mandatory onboarding step — row may not exist.

CREATE TABLE IF NOT EXISTS public.guidance_preferences (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Category flexibility: arrays of category UUIDs
  essential_categories      UUID[] NOT NULL DEFAULT '{}',
  flexible_categories       UUID[] NOT NULL DEFAULT '{}',
  do_not_reduce_categories  UUID[] NOT NULL DEFAULT '{}',

  -- Guardrails stored as JSONB: { "category_uuid": { "min_allocation": "500.00", "max_reduction": "200.00" } }
  category_guardrails       JSONB NOT NULL DEFAULT '{}',

  -- Planning horizon preference (days)
  planning_period_days      SMALLINT NOT NULL DEFAULT 7 CHECK (planning_period_days BETWEEN 1 AND 90),

  -- Optional user-entered cash buffer (overrides protected_reserves when set)
  -- NULL means "use protected_reserves as-is from the finance engine"
  cash_buffer_override      NUMERIC(18,4) CHECK (cash_buffer_override >= 0),

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT guidance_preferences_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_guidance_preferences_user ON public.guidance_preferences(user_id);

ALTER TABLE public.guidance_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own guidance_preferences"
  ON public.guidance_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_guidance_preferences_updated_at ON public.guidance_preferences;
CREATE TRIGGER trg_guidance_preferences_updated_at
  BEFORE UPDATE ON public.guidance_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─── 2. SAVED SCENARIOS ──────────────────────────────────────────────────────
-- User-saved hypothetical planning scenarios.
-- Contains only planning data — never modifies financial records.

CREATE TABLE IF NOT EXISTS public.saved_scenarios (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Scenario identity
  label                 TEXT,                        -- user-provided name
  currency              TEXT NOT NULL DEFAULT 'BDT',
  planning_days         SMALLINT NOT NULL DEFAULT 7,

  -- Integrity: snapshot_revision from the finance engine at save time.
  -- When financial records change, the new revision will differ → scenario is stale.
  snapshot_revision     TEXT NOT NULL,

  -- Full inputs and computed result, stored as JSONB (hypothetical data only)
  inputs_json           JSONB NOT NULL DEFAULT '{}',
  result_json           JSONB NOT NULL DEFAULT '{}',

  -- Staleness tracking (NOT DELETE — preserve the user's plan)
  invalidated_at        TIMESTAMPTZ,                 -- NULL = valid, non-NULL = stale
  invalidation_reason   TEXT,                        -- e.g. "Account balance changed"

  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_scenarios_user ON public.saved_scenarios(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_scenarios_valid ON public.saved_scenarios(user_id, invalidated_at)
  WHERE invalidated_at IS NULL;

ALTER TABLE public.saved_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own saved_scenarios"
  ON public.saved_scenarios
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_saved_scenarios_updated_at ON public.saved_scenarios;
CREATE TRIGGER trg_saved_scenarios_updated_at
  BEFORE UPDATE ON public.saved_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
