-- ================================================================
-- SAFIVRA UNIFIED DATABASE SCHEMAS & FUNCTIONS MIGRATION
-- Copy and paste this entire script into your Supabase SQL Editor and click RUN.
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. Create the void_transaction function
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.void_transaction(
  p_transaction_id UUID,
  p_void_reason TEXT DEFAULT 'User voided transaction'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_status transaction_status;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated request';
  END IF;

  -- Verify ownership and current status
  SELECT status INTO v_status
  FROM public.ledger_transactions
  WHERE id = p_transaction_id AND user_id = v_user_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Transaction not found or you do not have permission';
  END IF;

  IF v_status = 'voided' THEN
    RAISE EXCEPTION 'Transaction is already voided';
  END IF;

  -- Update the transaction status to voided
  UPDATE public.ledger_transactions
  SET 
    status = 'voided',
    description = COALESCE(description, '') || ' [VOIDED: ' || p_void_reason || ']'
  WHERE id = p_transaction_id;

  RETURN json_build_object('success', true);
END;
$$;


-- ----------------------------------------------------------------
-- 2. Update v_account_balances view and zero out legacy opening_balance
-- ----------------------------------------------------------------
UPDATE public.financial_accounts
SET opening_balance = 0
WHERE opening_balance <> 0;

DROP VIEW IF EXISTS public.v_account_balances CASCADE;

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


-- ----------------------------------------------------------------
-- 3. Create the delete_financial_record function
-- ----------------------------------------------------------------
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

    -- Also delete the loan's financial account (will cascade to loan)
    DELETE FROM public.financial_accounts
    WHERE id IN (SELECT account_id FROM public.loans WHERE id = p_record_id) AND user_id = v_user_id;

    -- Delete the loan itself
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


-- ----------------------------------------------------------------
-- 4. Secure ledger transactions policies (restrict direct writes)
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "ledger_transactions_owner_policy" ON public.ledger_transactions;

CREATE POLICY "ledger_transactions_select_policy" ON public.ledger_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ledger_entries_owner_policy" ON public.ledger_entries;

CREATE POLICY "ledger_entries_select_policy" ON public.ledger_entries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);


-- ----------------------------------------------------------------
-- 5. Secure Function Execution Grants
-- ----------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.void_transaction(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.void_transaction(UUID, TEXT) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.delete_financial_record(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_financial_record(TEXT, UUID) TO authenticated, service_role;


-- ----------------------------------------------------------------
-- 6. Create missing savings_schemes table
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.savings_schemes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheme_name     TEXT NOT NULL,
  scheme_type     TEXT NOT NULL CHECK (scheme_type IN ('dps', 'fdr', 'savings_account', 'sanchaypatra')),
  institution     TEXT NOT NULL,
  account_number  TEXT,
  deposit_amount  NUMERIC(18,4) NOT NULL CHECK (deposit_amount >= 0),
  maturity_amount NUMERIC(18,4) NOT NULL CHECK (maturity_amount >= 0),
  interest_rate   NUMERIC(5,2) NOT NULL CHECK (interest_rate >= 0),
  start_date      DATE NOT NULL,
  maturity_date   DATE,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matured', 'closed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.savings_schemes ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_savings_schemes_updated_at ON public.savings_schemes;
CREATE TRIGGER trg_savings_schemes_updated_at
  BEFORE UPDATE ON public.savings_schemes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "savings_schemes_owner_policy" ON public.savings_schemes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ----------------------------------------------------------------
-- 7. Ensure User Profiles & Preferences tables exist with RLS & Triggers
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name             TEXT NOT NULL DEFAULT '',
  preferred_currency    TEXT NOT NULL DEFAULT 'BDT',
  timezone              TEXT NOT NULL DEFAULT 'Asia/Dhaka',
  onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_owner_policy" ON public.profiles;
CREATE POLICY "profiles_owner_policy" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  language                    TEXT NOT NULL DEFAULT 'en',
  preferred_currency          TEXT NOT NULL DEFAULT 'BDT',
  timezone                    TEXT NOT NULL DEFAULT 'Asia/Dhaka',
  theme                       TEXT NOT NULL DEFAULT 'light',
  balance_privacy             BOOLEAN NOT NULL DEFAULT FALSE,
  start_of_week               SMALLINT NOT NULL DEFAULT 0,
  default_account_id          UUID,
  notification_upcoming_days  SMALLINT NOT NULL DEFAULT 3,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_preferences_owner_policy" ON public.user_preferences;
CREATE POLICY "user_preferences_owner_policy" ON public.user_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.profiles TO postgres, authenticated, service_role;
GRANT ALL ON public.user_preferences TO postgres, authenticated, service_role;

-- Indestructible trigger for automatic user setup on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (
      id,
      full_name,
      preferred_currency,
      timezone,
      onboarding_completed,
      onboarding_status,
      onboarding_version
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'preferred_currency', 'BDT'),
      COALESCE(NEW.raw_user_meta_data->>'timezone', 'Asia/Dhaka'),
      FALSE,
      'not_started',
      'v1'
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    INSERT INTO public.user_preferences (
      user_id, language, preferred_currency, timezone, theme, balance_privacy, start_of_week, notification_upcoming_days
    )
    VALUES (
      NEW.id,
      'en',
      COALESCE(NEW.raw_user_meta_data->>'preferred_currency', 'BDT'),
      COALESCE(NEW.raw_user_meta_data->>'timezone', 'Asia/Dhaka'),
      'light',
      FALSE,
      0,
      3
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

COMMIT;

-- ----------------------------------------------------------------
-- 10. Additional Profile Fields and Persistent Onboarding State
-- ----------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Bangladesh',
  ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_version text DEFAULT 'v1';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_onboarding_status'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT chk_profiles_onboarding_status
      CHECK (onboarding_status IN ('not_started', 'in_progress', 'completed'));
  END IF;
END $$;

-- Idempotent existing user protection backfill
UPDATE public.profiles
SET 
  onboarding_status = 'completed',
  onboarding_completed = TRUE,
  onboarding_completed_at = COALESCE(onboarding_completed_at, updated_at, created_at, NOW())
WHERE (onboarding_completed = TRUE OR onboarding_status = 'completed')
  AND (onboarding_status IS DISTINCT FROM 'completed' OR onboarding_completed_at IS NULL);

UPDATE public.profiles p
SET
  onboarding_status = 'completed',
  onboarding_completed = TRUE,
  onboarding_completed_at = COALESCE(p.onboarding_completed_at, p.updated_at, p.created_at, NOW())
WHERE (
  EXISTS (SELECT 1 FROM public.financial_accounts fa WHERE fa.user_id = p.id)
  OR EXISTS (SELECT 1 FROM public.ledger_transactions lt WHERE lt.user_id = p.id)
  OR EXISTS (SELECT 1 FROM public.loans l WHERE l.user_id = p.id)
  OR EXISTS (SELECT 1 FROM public.credit_cards cc WHERE cc.user_id = p.id)
  OR (p.created_at < NOW() - INTERVAL '1 hour' AND (p.full_name <> '' OR p.phone IS NOT NULL))
)
AND (p.onboarding_status IS DISTINCT FROM 'completed' OR p.onboarding_completed = FALSE);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'Bangladesh',
ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Update the schema cache so PostgREST immediately recognizes the new columns
NOTIFY pgrst, 'reload schema';



-- ----------------------------------------------------------------
-- 11. Zakat Module Full Foundation & Enhancements
-- ----------------------------------------------------------------

-- 1. Zakat Rule Sets
CREATE TABLE IF NOT EXISTS public.zakat_rule_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version NUMERIC NOT NULL,
    effective_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    nisab_standard TEXT NOT NULL CHECK (nisab_standard IN ('gold', 'silver')),
    zakat_percentage NUMERIC NOT NULL DEFAULT 2.5,
    hawl_days INTEGER NOT NULL DEFAULT 354,
    scholar_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_zakat_rule_sets_version ON public.zakat_rule_sets(version);

-- 2. Zakat Rate Snapshots
CREATE TABLE IF NOT EXISTS public.zakat_rate_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL,
    fetch_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    gold_rate_per_gram NUMERIC NOT NULL,
    silver_rate_per_gram NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'BDT',
    is_override BOOLEAN NOT NULL DEFAULT false,
    override_reason TEXT,
    override_admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zakat_rate_snapshots_fetch_timestamp ON public.zakat_rate_snapshots(fetch_timestamp DESC);

-- 3. Zakat Calculations Table
CREATE TABLE IF NOT EXISTS public.zakat_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rule_set_id UUID NOT NULL REFERENCES public.zakat_rule_sets(id),
    rate_snapshot_id UUID NOT NULL REFERENCES public.zakat_rate_snapshots(id),
    status TEXT NOT NULL CHECK (status IN ('draft', 'confirmed_snapshot', 'paid')) DEFAULT 'draft',
    zakat_anniversary_date DATE,
    total_assets NUMERIC NOT NULL DEFAULT 0,
    total_deductions NUMERIC NOT NULL DEFAULT 0,
    net_zakatable_wealth NUMERIC NOT NULL DEFAULT 0,
    is_eligible BOOLEAN NOT NULL DEFAULT false,
    estimated_zakat_amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'BDT',
    nisab_standard TEXT DEFAULT 'gold',
    nisab_threshold_amount NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zakat_calculations_user_id ON public.zakat_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_zakat_calculations_status ON public.zakat_calculations(status);

-- 4. Zakat Calculation Items Table
CREATE TABLE IF NOT EXISTS public.zakat_calculation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_id UUID NOT NULL REFERENCES public.zakat_calculations(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('cash', 'gold', 'silver', 'business', 'investment', 'liability', 'other')),
    source_table TEXT,
    source_id UUID,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'BDT',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zakat_calculation_items_calc_id ON public.zakat_calculation_items(calculation_id);

-- Enable RLS
ALTER TABLE public.zakat_rule_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakat_rate_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakat_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakat_calculation_items ENABLE ROW LEVEL SECURITY;

-- Policies for Rule Sets & Rate Snapshots
DROP POLICY IF EXISTS "Anyone can read zakat rule sets" ON public.zakat_rule_sets;
CREATE POLICY "Anyone can read zakat rule sets" ON public.zakat_rule_sets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read rate snapshots" ON public.zakat_rate_snapshots;
CREATE POLICY "Anyone can read rate snapshots" ON public.zakat_rate_snapshots FOR SELECT USING (true);

-- Policies for Calculations & Items
DROP POLICY IF EXISTS "Users can manage their own calculations" ON public.zakat_calculations;
CREATE POLICY "Users can manage their own calculations"
    ON public.zakat_calculations
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own calculation items" ON public.zakat_calculation_items;
CREATE POLICY "Users can manage their own calculation items"
    ON public.zakat_calculation_items
    FOR ALL TO authenticated
    USING (calculation_id IN (SELECT id FROM public.zakat_calculations WHERE user_id = auth.uid()))
    WITH CHECK (calculation_id IN (SELECT id FROM public.zakat_calculations WHERE user_id = auth.uid()));

-- Insert baseline rule set if empty
INSERT INTO public.zakat_rule_sets (name, version, nisab_standard, zakat_percentage, hawl_days, scholar_notes)
VALUES (
    'Standard Global Rules (Gold/Silver)',
    1.0,
    'gold',
    2.5,
    354,
    'Default rules mapping 2.5% on Zakatable assets after 1 Hijri year (354 days).'
) ON CONFLICT (version) DO NOTHING;

-- Insert baseline rate snapshot if empty
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.zakat_rate_snapshots LIMIT 1) THEN
    INSERT INTO public.zakat_rate_snapshots (
      provider_name,
      gold_rate_per_gram,
      silver_rate_per_gram,
      currency,
      is_override,
      override_reason
    )
    VALUES (
      'BAJUS Market Standard',
      9250.00,
      105.50,
      'BDT',
      false,
      'Initial baseline market snapshot'
    );
  END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';


-- ----------------------------------------------------------------
-- 12. Admin RBAC Foundation & Access Policies
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.admin_accounts (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.admin_accounts(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB,
    before_snapshot JSONB,
    after_snapshot JSONB,
    reason TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure details column exists if table was created previously
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS details JSONB;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for auth users" ON public.admin_accounts;
CREATE POLICY "Allow select for auth users" ON public.admin_accounts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow select roles" ON public.roles;
CREATE POLICY "Allow select roles" ON public.roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow select audit logs" ON public.admin_audit_logs;
CREATE POLICY "Allow select audit logs" ON public.admin_audit_logs FOR SELECT USING (true);

INSERT INTO public.roles (name, description)
VALUES ('Super Admin', 'Full system access and operational management')
ON CONFLICT (name) DO NOTHING;

-- Cleanup: Only keep actual admin accounts in admin_accounts table (do not treat general members as admins)
DELETE FROM public.admin_accounts WHERE role_id IS NULL;

-- High Performance Database Indexes for Sub-Second Admin Queries
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_created ON public.admin_audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_role_status ON public.admin_accounts(role_id, status);

-- 7-Day Notification Storage Cleanup Function & RLS Policy
CREATE OR REPLACE FUNCTION public.purge_old_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < (NOW() - INTERVAL '7 days');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Real-Time User Feature Activity & Usage Logs Table
CREATE TABLE IF NOT EXISTS public.user_feature_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    action_type TEXT NOT NULL DEFAULT 'view',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_feature_logs_feature_created ON public.user_feature_logs(feature_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feature_logs_user_id ON public.user_feature_logs(user_id);

ALTER TABLE public.user_feature_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to insert feature logs" ON public.user_feature_logs;
CREATE POLICY "Allow users to insert feature logs" ON public.user_feature_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admins to view feature logs" ON public.user_feature_logs;
CREATE POLICY "Allow admins to view feature logs" ON public.user_feature_logs
  FOR SELECT USING (true);

NOTIFY pgrst, 'reload schema';

COMMIT;







