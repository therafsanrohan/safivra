-- Migration: 20260729000005_savings_dps_fdr.sql
-- Description: Creates savings_schemes table for DPS, FDR, Sanchaypatra, and Savings accounts.

CREATE TABLE IF NOT EXISTS public.savings_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheme_name TEXT NOT NULL,
  scheme_type TEXT NOT NULL CHECK (scheme_type IN ('dps', 'fdr', 'savings_account', 'sanchaypatra', 'matir_bank')),
  institution TEXT NOT NULL,
  account_number TEXT,
  deposit_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  maturity_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  interest_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  maturity_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matured', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Security Policies
ALTER TABLE public.savings_schemes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own savings schemes"
  ON public.savings_schemes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_savings_schemes_user_id ON public.savings_schemes(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_schemes_type ON public.savings_schemes(scheme_type);
