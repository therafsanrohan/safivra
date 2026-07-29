-- ================================================================
-- Migration: 20260730000000_initial_schema.sql
-- Description: Create basic schema (extensions, enums, tables, indexes, triggers)
-- ================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE account_type AS ENUM (
    'cash','bank','savings','mobile_financial_service','credit_card',
    'loan','investment','receivable','other_asset','other_liability'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE account_class AS ENUM ('asset','liability');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM (
    'income','expense','transfer','loan_received','loan_payment',
    'credit_card_purchase','credit_card_payment','refund',
    'balance_adjustment','opening_balance','fee'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('posted','pending','voided','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE category_type AS ENUM ('income','expense','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE entry_role AS ENUM (
    'asset_debit','asset_credit','liability_debit','liability_credit',
    'income_credit','expense_debit','equity_credit',
    'transfer_out','transfer_in','fee_expense'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE loan_type AS ENUM (
    'personal','bank','business','education','family_friend','installment','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE interest_type AS ENUM (
    'fixed','reducing_balance','interest_free','manual','unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE loan_status AS ENUM (
    'active','paid','overdue','paused','restructured','archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_frequency AS ENUM (
    'weekly','monthly','quarterly','yearly','custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE card_status AS ENUM ('active','frozen','closed','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE budget_period AS ENUM ('monthly','weekly','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE recurring_frequency AS ENUM ('weekly','monthly','quarterly','yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE receivable_status AS ENUM (
    'active','partially_repaid','repaid','overdue','written_off'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE goal_status AS ENUM ('active','completed','paused','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'upcoming_loan_payment','upcoming_card_payment','upcoming_bill',
    'budget_warning','budget_exceeded','overdue_payment','recurring_pending'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. AUTO-UPDATE TIMESTAMPTZ FUNCTION
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. TABLES

-- profiles
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

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_privacy             BOOLEAN NOT NULL DEFAULT FALSE,
  start_of_week               SMALLINT NOT NULL DEFAULT 0,
  default_account_id          UUID,
  notification_upcoming_days  SMALLINT NOT NULL DEFAULT 3,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- financial_accounts
CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  account_type          account_type NOT NULL,
  account_class         account_class NOT NULL,
  institution           TEXT,
  currency_code         TEXT NOT NULL DEFAULT 'BDT',
  opening_balance       NUMERIC(18,4) NOT NULL DEFAULT 0,
  opening_balance_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  last_four             TEXT,
  credit_limit          NUMERIC(18,4),
  include_in_total      BOOLEAN NOT NULL DEFAULT TRUE,
  include_in_net_worth  BOOLEAN NOT NULL DEFAULT TRUE,
  notes                 TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  is_archived           BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order            INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_accounts_user ON public.financial_accounts(user_id);

DROP TRIGGER IF EXISTS trg_financial_accounts_updated_at ON public.financial_accounts;
CREATE TRIGGER trg_financial_accounts_updated_at
  BEFORE UPDATE ON public.financial_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- transaction_categories
CREATE TABLE IF NOT EXISTS public.transaction_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category_type category_type NOT NULL,
  icon          TEXT,
  color         TEXT,
  is_system     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_categories_user ON public.transaction_categories(user_id);

-- ledger_transactions
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type      transaction_type NOT NULL,
  transaction_date      DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date,
  transaction_time      TIME,
  timezone              TEXT NOT NULL DEFAULT 'Asia/Dhaka',
  title                 TEXT NOT NULL,
  description           TEXT,
  merchant              TEXT,
  status                transaction_status NOT NULL DEFAULT 'posted',
  reference_number      TEXT,
  recurring_template_id UUID,
  related_transaction_id UUID,
  voided_at             TIMESTAMPTZ,
  void_reason           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_transactions_user_date ON public.ledger_transactions(user_id, transaction_date DESC);

DROP TRIGGER IF EXISTS trg_ledger_transactions_updated_at ON public.ledger_transactions;
CREATE TRIGGER trg_ledger_transactions_updated_at
  BEFORE UPDATE ON public.ledger_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ledger_entries
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ledger_transaction_id UUID NOT NULL REFERENCES public.ledger_transactions(id) ON DELETE CASCADE,
  financial_account_id  UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  category_id           UUID REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
  amount                NUMERIC(18,4) NOT NULL CHECK (amount >= 0),
  currency_code         TEXT NOT NULL DEFAULT 'BDT',
  entry_role            entry_role NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction ON public.ledger_entries(ledger_transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON public.ledger_entries(financial_account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_user ON public.ledger_entries(user_id);

-- budgets
CREATE TABLE IF NOT EXISTS public.budgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  period_type     budget_period NOT NULL DEFAULT 'monthly',
  total_limit     NUMERIC(18,4) NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE,
  alert_threshold NUMERIC(5,2) NOT NULL DEFAULT 80.00,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets(user_id);

DROP TRIGGER IF EXISTS trg_budgets_updated_at ON public.budgets;
CREATE TRIGGER trg_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- budget_categories
CREATE TABLE IF NOT EXISTS public.budget_categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id    UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES public.transaction_categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(18,4) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(budget_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_budget_categories_budget ON public.budget_categories(budget_id);

-- loans
CREATE TABLE IF NOT EXISTS public.loans (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  loan_type            loan_type NOT NULL DEFAULT 'personal',
  lender_name          TEXT NOT NULL,
  original_principal   NUMERIC(18,4) NOT NULL,
  opening_outstanding  NUMERIC(18,4),
  interest_type        interest_type NOT NULL DEFAULT 'unknown',
  annual_rate          NUMERIC(7,4),
  monthly_installment  NUMERIC(18,4),
  payment_frequency    payment_frequency NOT NULL DEFAULT 'monthly',
  start_date           DATE NOT NULL,
  first_payment_date   DATE,
  next_payment_date    DATE,
  expected_completion  DATE,
  linked_account_id    UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  notes                TEXT,
  status               loan_status NOT NULL DEFAULT 'active',
  include_in_net_worth BOOLEAN NOT NULL DEFAULT TRUE,
  account_id           UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_user ON public.loans(user_id);

DROP TRIGGER IF EXISTS trg_loans_updated_at ON public.loans;
CREATE TRIGGER trg_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- loan_payments
CREATE TABLE IF NOT EXISTS public.loan_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_id               UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  ledger_transaction_id UUID NOT NULL REFERENCES public.ledger_transactions(id) ON DELETE CASCADE,
  payment_date          DATE NOT NULL,
  total_amount          NUMERIC(18,4) NOT NULL,
  principal_amount      NUMERIC(18,4) NOT NULL,
  interest_amount       NUMERIC(18,4) NOT NULL DEFAULT 0,
  fee_amount            NUMERIC(18,4) NOT NULL DEFAULT 0,
  payment_account_id    UUID NOT NULL REFERENCES public.financial_accounts(id),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON public.loan_payments(loan_id);

-- credit_cards
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname            TEXT NOT NULL,
  issuer              TEXT NOT NULL,
  last_four           TEXT,
  credit_limit        NUMERIC(18,4) NOT NULL,
  opening_outstanding NUMERIC(18,4) NOT NULL DEFAULT 0,
  statement_day       SMALLINT CHECK (statement_day BETWEEN 1 AND 31),
  payment_due_day     SMALLINT CHECK (payment_due_day BETWEEN 1 AND 31),
  minimum_payment     NUMERIC(18,4),
  annual_fee_date     DATE,
  linked_account_id   UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  notes               TEXT,
  status              card_status NOT NULL DEFAULT 'active',
  account_id          UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_cards_user ON public.credit_cards(user_id);

DROP TRIGGER IF EXISTS trg_credit_cards_updated_at ON public.credit_cards;
CREATE TRIGGER trg_credit_cards_updated_at
  BEFORE UPDATE ON public.credit_cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- credit_card_payments
CREATE TABLE IF NOT EXISTS public.credit_card_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_card_id        UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  ledger_transaction_id UUID NOT NULL REFERENCES public.ledger_transactions(id) ON DELETE CASCADE,
  payment_date          DATE NOT NULL,
  amount                NUMERIC(18,4) NOT NULL,
  payment_account_id    UUID NOT NULL REFERENCES public.financial_accounts(id),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_card_payments_card ON public.credit_card_payments(credit_card_id);

-- receivables
CREATE TABLE IF NOT EXISTS public.receivables (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name        TEXT NOT NULL,
  amount_lent        NUMERIC(18,4) NOT NULL,
  amount_remaining   NUMERIC(18,4) NOT NULL,
  date_lent          DATE NOT NULL,
  expected_repayment DATE,
  linked_account_id  UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  notes              TEXT,
  status             receivable_status NOT NULL DEFAULT 'active',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receivables_user ON public.receivables(user_id);

DROP TRIGGER IF EXISTS trg_receivables_updated_at ON public.receivables;
CREATE TRIGGER trg_receivables_updated_at
  BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- recurring_templates
CREATE TABLE IF NOT EXISTS public.recurring_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  transaction_type transaction_type NOT NULL,
  amount           NUMERIC(18,4) NOT NULL,
  account_id       UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
  frequency        recurring_frequency NOT NULL DEFAULT 'monthly',
  start_date       DATE NOT NULL,
  next_occurrence  DATE NOT NULL,
  end_date         DATE,
  reminder_days    SMALLINT NOT NULL DEFAULT 3,
  auto_post        BOOLEAN NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_templates_user ON public.recurring_templates(user_id);

DROP TRIGGER IF EXISTS trg_recurring_templates_updated_at ON public.recurring_templates;
CREATE TRIGGER trg_recurring_templates_updated_at
  BEFORE UPDATE ON public.recurring_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- savings_goals
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  target_amount     NUMERIC(18,4) NOT NULL,
  current_amount    NUMERIC(18,4) NOT NULL DEFAULT 0,
  target_date       DATE,
  linked_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  notes             TEXT,
  status            goal_status NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON public.savings_goals(user_id);

DROP TRIGGER IF EXISTS trg_savings_goals_updated_at ON public.savings_goals;
CREATE TRIGGER trg_savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  related_id        UUID,
  related_type      TEXT,
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
