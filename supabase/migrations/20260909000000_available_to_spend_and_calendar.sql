-- ================================================================
-- Migration: 20260909000000_available_to_spend_and_calendar.sql
-- Description: Additive tables & fields for Available to Spend and Money Calendar
-- ================================================================

-- 1. ADD OPTIONAL PAYDAY TO USER_PREFERENCES
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' AND column_name = 'payday_day_of_month'
  ) THEN
    ALTER TABLE public.user_preferences ADD COLUMN payday_day_of_month SMALLINT CHECK (payday_day_of_month BETWEEN 1 AND 31);
  END IF;
END $$;

-- 2. CALENDAR EVENTS TABLE (Ad-hoc planned financial calendar items)
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('income', 'bill', 'loan', 'card', 'transfer', 'savings')),
  amount NUMERIC(18,4) NOT NULL CHECK (amount >= 0),
  currency_code TEXT NOT NULL DEFAULT 'BDT',
  due_date DATE NOT NULL,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'paid', 'partially_paid', 'skipped', 'cancelled')),
  is_estimated BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON public.calendar_events(user_id, due_date);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their calendar_events" ON public.calendar_events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER trg_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. COMMITMENT PAYMENTS TABLE (Links posted ledger transactions to specific commitment occurrences)
CREATE TABLE IF NOT EXISTS public.commitment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commitment_type TEXT NOT NULL CHECK (commitment_type IN ('recurring_template', 'loan_instalment', 'credit_card', 'custom_event')),
  commitment_id UUID NOT NULL,
  occurrence_date DATE NOT NULL,
  ledger_transaction_id UUID NOT NULL REFERENCES public.ledger_transactions(id) ON DELETE CASCADE,
  amount_paid NUMERIC(18,4) NOT NULL CHECK (amount_paid > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT idx_commitment_payment_unique UNIQUE (user_id, commitment_type, commitment_id, occurrence_date, ledger_transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_commitment_payments_lookup ON public.commitment_payments(user_id, commitment_type, commitment_id, occurrence_date);
CREATE INDEX IF NOT EXISTS idx_commitment_payments_tx ON public.commitment_payments(ledger_transaction_id);

ALTER TABLE public.commitment_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their commitment_payments" ON public.commitment_payments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. OCCURRENCE OVERRIDES TABLE (Skipping or modifying individual recurring template occurrences)
CREATE TABLE IF NOT EXISTS public.occurrence_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.recurring_templates(id) ON DELETE CASCADE,
  occurrence_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'skipped' CHECK (status IN ('skipped', 'cancelled', 'modified')),
  override_amount NUMERIC(18,4),
  override_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT idx_occurrence_override_unique UNIQUE (user_id, template_id, occurrence_date)
);

CREATE INDEX IF NOT EXISTS idx_occurrence_overrides_lookup ON public.occurrence_overrides(user_id, template_id);

ALTER TABLE public.occurrence_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their occurrence_overrides" ON public.occurrence_overrides
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_occurrence_overrides_updated_at ON public.occurrence_overrides;
CREATE TRIGGER trg_occurrence_overrides_updated_at
  BEFORE UPDATE ON public.occurrence_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. PROTECTED RESERVES TABLE (Earmarked funds held inside included spending accounts)
CREATE TABLE IF NOT EXISTS public.protected_reserves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(18,4) NOT NULL CHECK (amount > 0),
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  linked_commitment_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_protected_reserves_user ON public.protected_reserves(user_id);

ALTER TABLE public.protected_reserves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their protected_reserves" ON public.protected_reserves
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_protected_reserves_updated_at ON public.protected_reserves;
CREATE TRIGGER trg_protected_reserves_updated_at
  BEFORE UPDATE ON public.protected_reserves
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
