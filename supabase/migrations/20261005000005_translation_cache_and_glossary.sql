-- ============================================================
-- SAFIVRA
-- Auto-Translation Cache & Glossary Schema
-- ============================================================
-- This migration adds the required tables for the dynamic,
-- context-aware translation engine. It does not modify existing
-- data or users.
-- ============================================================

-- ============================================================
-- 1. TRANSLATION GLOSSARY
-- Holds approved English -> Bangla terminology for financial terms
-- ============================================================
CREATE TABLE IF NOT EXISTS public.translation_glossary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_locale TEXT NOT NULL DEFAULT 'en',
    target_locale TEXT NOT NULL DEFAULT 'bn',
    
    english_term TEXT NOT NULL,
    translated_term TEXT NOT NULL,
    
    -- Optional context (e.g., 'financial', 'button', 'notification')
    context TEXT,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(source_locale, target_locale, english_term, context)
);

CREATE INDEX IF NOT EXISTS idx_glossary_search 
    ON public.translation_glossary(source_locale, target_locale, is_active);

-- ============================================================
-- 2. TRANSLATION CACHE
-- Stores cached translations to prevent redundant API calls
-- ============================================================
CREATE TABLE IF NOT EXISTS public.translation_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    source_locale TEXT NOT NULL DEFAULT 'en',
    target_locale TEXT NOT NULL,
    
    source_text TEXT NOT NULL,
    -- Deterministic hash of source_text for faster lookups (e.g., SHA256)
    source_hash TEXT NOT NULL,
    
    translated_text TEXT NOT NULL,
    
    -- Optional context (e.g., 'dashboard', 'dps_notification')
    context TEXT DEFAULT 'global',
    namespace TEXT DEFAULT 'common',
    
    provider TEXT NOT NULL DEFAULT 'ai',
    glossary_version INTEGER DEFAULT 1,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure we don't duplicate cache entries
    UNIQUE(source_locale, target_locale, source_hash, context)
);

CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup 
    ON public.translation_cache(source_locale, target_locale, source_hash, context);

CREATE INDEX IF NOT EXISTS idx_translation_cache_text 
    ON public.translation_cache(source_text);

-- ============================================================
-- 3. RLS POLICIES
-- Both tables should be readable by anyone (authenticated or anon)
-- but only writable by service roles (the Edge Function / Admin)
-- ============================================================

ALTER TABLE public.translation_glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access so the client app can fetch cached translations
CREATE POLICY "translation_glossary_read_policy" 
    ON public.translation_glossary 
    FOR SELECT 
    USING (true);

CREATE POLICY "translation_cache_read_policy" 
    ON public.translation_cache 
    FOR SELECT 
    USING (true);

-- No insert/update policies for normal users.
-- The Supabase service_role key (used in Edge Functions) will bypass RLS
-- to insert new translations into the cache. Admins will bypass RLS.

-- ============================================================
-- 4. SEED FINANCIAL GLOSSARY
-- Initial baseline of critical Safivra terms
-- ============================================================
INSERT INTO public.translation_glossary (english_term, translated_term, context)
VALUES 
    ('Account', 'অ্যাকাউন্ট', 'financial'),
    ('Balance', 'ব্যালেন্স', 'financial'),
    ('Savings', 'সঞ্চয়', 'financial'),
    ('Savings Goal', 'সঞ্চয় লক্ষ্য', 'financial'),
    ('DPS', 'DPS', 'financial'),
    ('FDR', 'FDR', 'financial'),
    ('Maturity', 'মেয়াদপূর্তি', 'financial'),
    ('Installment', 'কিস্তি', 'financial'),
    ('Loan', 'ঋণ', 'financial'),
    ('Credit Card', 'ক্রেডিট কার্ড', 'financial'),
    ('Income', 'আয়', 'financial'),
    ('Expense', 'ব্যয়', 'financial'),
    ('Budget', 'বাজেট', 'financial'),
    ('Net Worth', 'নিট সম্পদ', 'financial'),
    ('Emergency Fund', 'জরুরি তহবিল', 'financial'),
    ('Zakat', 'যাকাত', 'financial'),
    ('Nisab', 'নিসাব', 'financial')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_translation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_translation_glossary_updated_at ON public.translation_glossary;
CREATE TRIGGER trg_translation_glossary_updated_at
    BEFORE UPDATE ON public.translation_glossary
    FOR EACH ROW EXECUTE FUNCTION public.set_translation_updated_at();

DROP TRIGGER IF EXISTS trg_translation_cache_updated_at ON public.translation_cache;
CREATE TRIGGER trg_translation_cache_updated_at
    BEFORE UPDATE ON public.translation_cache
    FOR EACH ROW EXECUTE FUNCTION public.set_translation_updated_at();
