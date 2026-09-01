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
    INSERT INTO public.profiles (id, full_name, preferred_currency, timezone, onboarding_completed)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'preferred_currency', 'BDT'),
      COALESCE(NEW.raw_user_meta_data->>'timezone', 'Asia/Dhaka'),
      FALSE
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
-- Migration: Add extra profile fields (Phase 10)
-- Safety: These are additive non-destructive changes. We use IF NOT EXISTS to prevent errors.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'Bangladesh';

-- Update the schema cache so PostgREST immediately recognizes the new columns
NOTIFY pgrst, 'reload schema';
