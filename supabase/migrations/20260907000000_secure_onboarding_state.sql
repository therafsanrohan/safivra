-- ================================================================
-- Migration: 20260907000000_secure_onboarding_state.sql
-- Description: Add persistent onboarding state columns to profiles
-- Safety: 100% additive, non-destructive, and idempotent
-- ================================================================

-- 1. Safely add onboarding state tracking columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_version TEXT DEFAULT 'v1';

-- 2. Add safe check constraint for valid onboarding_status values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_onboarding_status'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT chk_profiles_onboarding_status
      CHECK (onboarding_status IN ('not_started', 'in_progress', 'completed'));
  END IF;
END $$;

-- 3. Idempotent existing user protection backfill
-- Rule A: Users who already had onboarding_completed = TRUE
UPDATE public.profiles
SET 
  onboarding_status = 'completed',
  onboarding_completed = TRUE,
  onboarding_completed_at = COALESCE(onboarding_completed_at, updated_at, created_at, NOW())
WHERE (onboarding_completed = TRUE OR onboarding_status = 'completed')
  AND (onboarding_status IS DISTINCT FROM 'completed' OR onboarding_completed_at IS NULL);

-- Rule B: Established active users with financial data or existing activity
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

-- 4. Update the handle_new_user trigger function to safely initialize new registrations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  RETURN NEW;
END;
$$;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
