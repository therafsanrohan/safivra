-- ================================================================
-- Migration: 20260731000005_security_and_schemes_fix.sql
-- Description: 
--   1. Restricts direct writes to ledger tables (SELECT only for users)
--   2. Secures EXECUTE privileges for void_transaction and delete_financial_record
--   3. Creates the missing savings_schemes table and configures its RLS policies
-- ================================================================

BEGIN;

-- 1. Harden ledger_transactions policies (SELECT only for authenticated, block direct write)
DROP POLICY IF EXISTS "ledger_transactions_owner_policy" ON public.ledger_transactions;

CREATE POLICY "ledger_transactions_select_policy" ON public.ledger_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. Harden ledger_entries policies (SELECT only for authenticated, block direct write)
DROP POLICY IF EXISTS "ledger_entries_owner_policy" ON public.ledger_entries;

CREATE POLICY "ledger_entries_select_policy" ON public.ledger_entries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);


-- 3. Secure void_transaction execute privileges
REVOKE EXECUTE ON FUNCTION public.void_transaction(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.void_transaction(UUID, TEXT) TO authenticated, service_role;

-- 4. Secure delete_financial_record execute privileges
REVOKE EXECUTE ON FUNCTION public.delete_financial_record(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_financial_record(TEXT, UUID) TO authenticated, service_role;


-- 5. Create savings_schemes table
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

-- Enable RLS on savings_schemes
ALTER TABLE public.savings_schemes ENABLE ROW LEVEL SECURITY;

-- Enable trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trg_savings_schemes_updated_at ON public.savings_schemes;
CREATE TRIGGER trg_savings_schemes_updated_at
  BEFORE UPDATE ON public.savings_schemes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Configure RLS Policies for savings_schemes
CREATE POLICY "savings_schemes_owner_policy" ON public.savings_schemes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMIT;
