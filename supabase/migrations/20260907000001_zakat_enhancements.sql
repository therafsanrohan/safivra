-- ================================================================
-- Migration: 20260907000001_zakat_enhancements.sql
-- Description: Add additive columns to zakat_calculations and ensure baseline rates
-- Safety: 100% additive, non-destructive, and idempotent
-- ================================================================

-- 1. Safely add additive columns to zakat_calculations
ALTER TABLE public.zakat_calculations
  ADD COLUMN IF NOT EXISTS nisab_standard TEXT DEFAULT 'gold',
  ADD COLUMN IF NOT EXISTS nisab_threshold_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Add safe check constraint for nisab_standard values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_zakat_calculations_nisab_standard'
  ) THEN
    ALTER TABLE public.zakat_calculations
      ADD CONSTRAINT chk_zakat_calculations_nisab_standard
      CHECK (nisab_standard IN ('gold', 'silver'));
  END IF;
END $$;

-- 3. Ensure baseline rate snapshot exists if table is empty
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

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
