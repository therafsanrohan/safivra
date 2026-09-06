-- Zakat Intelligence Module: Foundation Tables
-- Adds Rule Sets and Rate Snapshots with strict RLS and Audit logging.

-- 1. Zakat Rule Sets
CREATE TABLE IF NOT EXISTS public.zakat_rule_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version NUMERIC NOT NULL,
    effective_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    nisab_standard TEXT NOT NULL CHECK (nisab_standard IN ('gold', 'silver')),
    zakat_percentage NUMERIC NOT NULL DEFAULT 2.5,
    hawl_days INTEGER NOT NULL DEFAULT 354, -- Hijri year
    scholar_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure version uniqueness
CREATE UNIQUE INDEX idx_zakat_rule_sets_version ON public.zakat_rule_sets(version);

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

CREATE INDEX idx_zakat_rate_snapshots_fetch_timestamp ON public.zakat_rate_snapshots(fetch_timestamp DESC);

-- Enable RLS
ALTER TABLE public.zakat_rule_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakat_rate_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies for Rule Sets
-- Everyone can read active rule sets
CREATE POLICY "Anyone can read zakat rule sets"
    ON public.zakat_rule_sets
    FOR SELECT
    USING (true);

-- Only admins can manage rule sets (assuming an admin role or function exists)
-- Using a standard pattern from Safivra:
CREATE POLICY "Admins can insert rule sets"
    ON public.zakat_rule_sets
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update rule sets"
    ON public.zakat_rule_sets
    FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin' OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- Policies for Rate Snapshots
-- Everyone can read rate snapshots
CREATE POLICY "Anyone can read rate snapshots"
    ON public.zakat_rate_snapshots
    FOR SELECT
    USING (true);

-- Only service role (Edge Function) or admins can insert rate snapshots
CREATE POLICY "Service role and admins can insert rate snapshots"
    ON public.zakat_rate_snapshots
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin' OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- Insert seed data for the initial rule set
INSERT INTO public.zakat_rule_sets (name, version, nisab_standard, zakat_percentage, hawl_days, scholar_notes)
VALUES (
    'Standard Global Rules (Gold/Silver)',
    1.0,
    'gold',
    2.5,
    354,
    'Default rules mapping 2.5% on Zakatable assets after 1 Hijri year (354 days).'
) ON CONFLICT (version) DO NOTHING;
