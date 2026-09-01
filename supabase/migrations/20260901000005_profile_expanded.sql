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
