-- ================================================================
-- SAFIVRA  -  Complete Supabase Schema
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query
-- Order matters - run top to bottom, once.
-- ================================================================

-- Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------
DO $$ BEGIN CREATE TYPE account_type AS ENUM ('cash','bank','savings','mobile_financial_service','credit_card','loan','investment','receivable','other_asset','other_liability'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE account_class AS ENUM ('asset','liability'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE transaction_type AS ENUM ('income','expense','transfer','loan_received','loan_payment','credit_card_purchase','credit_card_payment','refund','balance_adjustment','opening_balance','fee'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE transaction_status AS ENUM ('posted','pending','voided','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE category_type AS ENUM ('income','expense','system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE entry_role AS ENUM ('asset_debit','asset_credit','liability_debit','liability_credit','income_credit','expense_debit','equity_credit','transfer_out','transfer_in','fee_expense'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE loan_type AS ENUM ('personal','bank','business','education','family_friend','installment','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE interest_type AS ENUM ('fixed','reducing_balance','interest_free','manual','unknown'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE loan_status AS ENUM ('active','paid','overdue','paused','restructured','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_frequency AS ENUM ('weekly','monthly','quarterly','yearly','custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE card_status AS ENUM ('active','frozen','closed','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE budget_period AS ENUM ('monthly','weekly','custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE recurring_frequency AS ENUM ('weekly','monthly','quarterly','yearly'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE receivable_status AS ENUM ('active','partially_repaid','repaid','overdue','written_off'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE goal_status AS ENUM ('active','completed','paused','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('upcoming_loan_payment','upcoming_card_payment','upcoming_bill','budget_warning','budget_exceeded','overdue_payment','recurring_pending'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------
-- 2. HELPER - auto-update updated_at
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

-- ----------------------------------------------------------------
-- 3. TABLES
-- ----------------------------------------------------------------

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT NOT NULL DEFAULT '',
  preferred_currency   TEXT NOT NULL DEFAULT 'BDT',
  timezone             TEXT NOT NULL DEFAULT 'Asia/Dhaka',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_privacy            BOOLEAN NOT NULL DEFAULT FALSE,
  start_of_week              SMALLINT NOT NULL DEFAULT 0,
  default_account_id         UUID,
  notification_upcoming_days SMALLINT NOT NULL DEFAULT 3,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE TRIGGER trg_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- financial_accounts
CREATE TABLE IF NOT EXISTS financial_accounts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  account_type         account_type NOT NULL,
  account_class        account_class NOT NULL,
  institution          TEXT,
  currency_code        TEXT NOT NULL DEFAULT 'BDT',
  opening_balance      NUMERIC(18,4) NOT NULL DEFAULT 0,
  opening_balance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_four            TEXT,
  credit_limit         NUMERIC(18,4),
  include_in_total     BOOLEAN NOT NULL DEFAULT TRUE,
  include_in_net_worth BOOLEAN NOT NULL DEFAULT TRUE,
  notes                TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  is_archived          BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_user ON financial_accounts(user_id);
CREATE OR REPLACE TRIGGER trg_financial_accounts_updated_at BEFORE UPDATE ON financial_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- transaction_categories
CREATE TABLE IF NOT EXISTS transaction_categories (
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
CREATE INDEX IF NOT EXISTS idx_transaction_categories_user ON transaction_categories(user_id);

-- ledger_transactions
CREATE TABLE IF NOT EXISTS ledger_transactions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type       transaction_type NOT NULL,
  transaction_date       DATE NOT NULL,
  transaction_time       TIME,
  timezone               TEXT NOT NULL DEFAULT 'Asia/Dhaka',
  title                  TEXT NOT NULL,
  description            TEXT,
  merchant               TEXT,
  status                 transaction_status NOT NULL DEFAULT 'posted',
  reference_number       TEXT,
  recurring_template_id  UUID,
  related_transaction_id UUID,
  voided_at              TIMESTAMPTZ,
  void_reason            TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_user_date ON ledger_transactions(user_id, transaction_date DESC);
CREATE OR REPLACE TRIGGER trg_ledger_transactions_updated_at BEFORE UPDATE ON ledger_transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ledger_entries
CREATE TABLE IF NOT EXISTS ledger_entries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ledger_transaction_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE CASCADE,
  financial_account_id  UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
  category_id           UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
  amount                NUMERIC(18,4) NOT NULL CHECK (amount >= 0),
  currency_code         TEXT NOT NULL DEFAULT 'BDT',
  entry_role            entry_role NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction ON ledger_entries(ledger_transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON ledger_entries(financial_account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_user ON ledger_entries(user_id);

-- budgets
CREATE TABLE IF NOT EXISTS budgets (
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
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
CREATE OR REPLACE TRIGGER trg_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- budget_categories
CREATE TABLE IF NOT EXISTS budget_categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id    UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES transaction_categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(18,4) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(budget_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_budget_categories_budget ON budget_categories(budget_id);

-- loans
CREATE TABLE IF NOT EXISTS loans (
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
  linked_account_id    UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
  notes                TEXT,
  status               loan_status NOT NULL DEFAULT 'active',
  include_in_net_worth BOOLEAN NOT NULL DEFAULT TRUE,
  account_id           UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);
CREATE OR REPLACE TRIGGER trg_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- loan_payments
CREATE TABLE IF NOT EXISTS loan_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_id               UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  ledger_transaction_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE CASCADE,
  payment_date          DATE NOT NULL,
  total_amount          NUMERIC(18,4) NOT NULL,
  principal_amount      NUMERIC(18,4) NOT NULL,
  interest_amount       NUMERIC(18,4) NOT NULL DEFAULT 0,
  fee_amount            NUMERIC(18,4) NOT NULL DEFAULT 0,
  payment_account_id    UUID NOT NULL REFERENCES financial_accounts(id),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON loan_payments(loan_id);

-- credit_cards
CREATE TABLE IF NOT EXISTS credit_cards (
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
  linked_account_id   UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
  notes               TEXT,
  status              card_status NOT NULL DEFAULT 'active',
  account_id          UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user ON credit_cards(user_id);
CREATE OR REPLACE TRIGGER trg_credit_cards_updated_at BEFORE UPDATE ON credit_cards FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- credit_card_payments
CREATE TABLE IF NOT EXISTS credit_card_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_card_id        UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  ledger_transaction_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE CASCADE,
  payment_date          DATE NOT NULL,
  amount                NUMERIC(18,4) NOT NULL,
  payment_account_id    UUID NOT NULL REFERENCES financial_accounts(id),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credit_card_payments_card ON credit_card_payments(credit_card_id);

-- receivables
CREATE TABLE IF NOT EXISTS receivables (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name        TEXT NOT NULL,
  amount_lent        NUMERIC(18,4) NOT NULL,
  amount_remaining   NUMERIC(18,4) NOT NULL,
  date_lent          DATE NOT NULL,
  expected_repayment DATE,
  linked_account_id  UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
  notes              TEXT,
  status             receivable_status NOT NULL DEFAULT 'active',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_receivables_user ON receivables(user_id);
CREATE OR REPLACE TRIGGER trg_receivables_updated_at BEFORE UPDATE ON receivables FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- recurring_templates
CREATE TABLE IF NOT EXISTS recurring_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  transaction_type transaction_type NOT NULL,
  amount           NUMERIC(18,4) NOT NULL,
  account_id       UUID NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_recurring_templates_user ON recurring_templates(user_id);
CREATE OR REPLACE TRIGGER trg_recurring_templates_updated_at BEFORE UPDATE ON recurring_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- savings_goals
CREATE TABLE IF NOT EXISTS savings_goals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  target_amount     NUMERIC(18,4) NOT NULL,
  current_amount    NUMERIC(18,4) NOT NULL DEFAULT 0,
  target_date       DATE,
  linked_account_id UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
  notes             TEXT,
  status            goal_status NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);
CREATE OR REPLACE TRIGGER trg_savings_goals_updated_at BEFORE UPDATE ON savings_goals FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
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
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ----------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ----------------------------------------------------------------
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences       ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets                ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards           ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_payments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables            ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe for re-runs)
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY "profiles: own" ON profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "user_preferences: own" ON user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "financial_accounts: own" ON financial_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories: read system or own" ON transaction_categories FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "categories: insert own" ON transaction_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories: update own" ON transaction_categories FOR UPDATE USING (auth.uid() = user_id AND is_system = FALSE);
CREATE POLICY "categories: delete own" ON transaction_categories FOR DELETE USING (auth.uid() = user_id AND is_system = FALSE);
CREATE POLICY "ledger_transactions: own" ON ledger_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ledger_entries: own" ON ledger_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets: own" ON budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budget_categories: own" ON budget_categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "loans: own" ON loans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "loan_payments: own" ON loan_payments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "credit_cards: own" ON credit_cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "credit_card_payments: own" ON credit_card_payments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "receivables: own" ON receivables FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurring_templates: own" ON recurring_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "savings_goals: own" ON savings_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications: own" ON notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 5. AUTO-CREATE PROFILE ON SIGNUP
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name, preferred_currency, timezone, onboarding_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_currency', 'BDT'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Asia/Dhaka'),
    FALSE
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO user_preferences (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ----------------------------------------------------------------
-- 6. VIEW: v_account_balances
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW v_account_balances AS
SELECT
  fa.id AS account_id,
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
      fa.opening_balance + COALESCE((
        SELECT SUM(CASE
          WHEN le.entry_role IN ('asset_debit','transfer_in')             THEN  le.amount
          WHEN le.entry_role IN ('asset_credit','transfer_out','fee_expense') THEN -le.amount
          ELSE 0 END)
        FROM ledger_entries le WHERE le.financial_account_id = fa.id
      ), 0)
    )
    WHEN 'liability' THEN (
      fa.opening_balance + COALESCE((
        SELECT SUM(CASE
          WHEN le.entry_role = 'liability_credit' THEN  le.amount
          WHEN le.entry_role = 'liability_debit'  THEN -le.amount
          ELSE 0 END)
        FROM ledger_entries le WHERE le.financial_account_id = fa.id
      ), 0)
    )
    ELSE fa.opening_balance
  END::TEXT AS balance
FROM financial_accounts fa;

-- ----------------------------------------------------------------
-- 7. FUNCTION: post_transaction
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION post_transaction(
  p_transaction_type       transaction_type,
  p_transaction_date       DATE,
  p_title                  TEXT,
  p_amount                 NUMERIC,
  p_account_id             UUID,
  p_category_id            UUID    DEFAULT NULL,
  p_destination_account_id UUID    DEFAULT NULL,
  p_merchant               TEXT    DEFAULT NULL,
  p_description            TEXT    DEFAULT NULL,
  p_transaction_time       TIME    DEFAULT NULL,
  p_principal_amount       NUMERIC DEFAULT NULL,
  p_interest_amount        NUMERIC DEFAULT NULL,
  p_fee_amount             NUMERIC DEFAULT NULL,
  p_loan_id                UUID    DEFAULT NULL,
  p_credit_card_id         UUID    DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_tx_id      UUID;
  v_principal  NUMERIC := COALESCE(p_principal_amount, p_amount);
  v_interest   NUMERIC := COALESCE(p_interest_amount, 0);
  v_fee        NUMERIC := COALESCE(p_fee_amount, 0);
  v_acct_class account_class;
BEGIN
  INSERT INTO ledger_transactions (user_id, transaction_type, transaction_date, transaction_time, title, merchant, description, status)
  VALUES (v_user_id, p_transaction_type, p_transaction_date, p_transaction_time, p_title, p_merchant, p_description, 'posted')
  RETURNING id INTO v_tx_id;

  CASE p_transaction_type
    WHEN 'income' THEN
      INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, category_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, NULL, p_amount, 'asset_debit'),
               (v_user_id, v_tx_id, NULL, p_category_id, p_amount, 'income_credit');
    WHEN 'expense' THEN
      INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, category_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, NULL, p_amount, 'asset_credit'),
               (v_user_id, v_tx_id, NULL, p_category_id, p_amount, 'expense_debit');
    WHEN 'transfer' THEN
      INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'transfer_out'),
               (v_user_id, v_tx_id, p_destination_account_id, p_amount, 'transfer_in');
    WHEN 'loan_received' THEN
      INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_debit'),
               (v_user_id, v_tx_id, (SELECT account_id FROM loans WHERE id = p_loan_id AND user_id = v_user_id), p_amount, 'liability_credit');
    WHEN 'loan_payment' THEN
      INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_credit');
      IF v_principal > 0 THEN
        INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, (SELECT account_id FROM loans WHERE id = p_loan_id AND user_id = v_user_id), v_principal, 'liability_debit');
      END IF;
      IF v_interest > 0 THEN
        INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, category_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, NULL, p_category_id, v_interest, 'expense_debit');
      END IF;
      IF v_fee > 0 THEN
        INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_account_id, v_fee, 'fee_expense');
      END IF;
    WHEN 'credit_card_purchase' THEN
      INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, category_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, NULL, p_category_id, p_amount, 'expense_debit'),
               (v_user_id, v_tx_id, p_account_id, NULL, p_amount, 'liability_credit');
    WHEN 'credit_card_payment' THEN
      INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_credit'),
               (v_user_id, v_tx_id, (SELECT account_id FROM credit_cards WHERE id = p_credit_card_id AND user_id = v_user_id), p_amount, 'liability_debit');
    WHEN 'refund' THEN
      INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, category_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, NULL, p_amount, 'asset_debit'),
               (v_user_id, v_tx_id, NULL, p_category_id, p_amount, 'income_credit');
    WHEN 'fee' THEN
      INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_credit'),
               (v_user_id, v_tx_id, p_account_id, p_amount, 'fee_expense');
    WHEN 'opening_balance' THEN
      SELECT account_class INTO v_acct_class FROM financial_accounts WHERE id = p_account_id AND user_id = v_user_id;
      IF v_acct_class = 'asset' THEN
        INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_debit'),
                 (v_user_id, v_tx_id, p_account_id, p_amount, 'equity_credit');
      ELSE
        INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'liability_credit'),
                 (v_user_id, v_tx_id, p_account_id, p_amount, 'equity_credit');
      END IF;
    WHEN 'balance_adjustment' THEN
      SELECT account_class INTO v_acct_class FROM financial_accounts WHERE id = p_account_id AND user_id = v_user_id;
      IF v_acct_class = 'asset' THEN
        INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_debit');
      ELSE
        INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'liability_debit');
      END IF;
      INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'equity_credit');
    ELSE
      RAISE EXCEPTION 'Unknown transaction type: %', p_transaction_type;
  END CASE;

  RETURN json_build_object('transaction_id', v_tx_id);
END; $$;

-- ----------------------------------------------------------------
-- 8. FUNCTION: get_monthly_summary
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_monthly_summary(p_year INT, p_month INT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_income  NUMERIC;
  v_expense NUMERIC;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN le.entry_role = 'income_credit' THEN le.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN le.entry_role IN ('expense_debit','fee_expense') THEN le.amount ELSE 0 END), 0)
  INTO v_income, v_expense
  FROM ledger_entries le
  JOIN ledger_transactions lt ON lt.id = le.ledger_transaction_id
  WHERE le.user_id = v_user_id
    AND lt.status = 'posted'
    AND EXTRACT(YEAR  FROM lt.transaction_date) = p_year
    AND EXTRACT(MONTH FROM lt.transaction_date) = p_month;
  RETURN json_build_object('income', v_income, 'expense', v_expense, 'net', v_income - v_expense);
END; $$;

-- ----------------------------------------------------------------
-- 9. SEED DATA - System transaction categories
-- ----------------------------------------------------------------
INSERT INTO transaction_categories (id, user_id, name, category_type, icon, color, is_system, is_active, sort_order) VALUES
  (gen_random_uuid(), NULL, 'Salary',             'income',  '💼', '#22c55e', TRUE, TRUE,  1),
  (gen_random_uuid(), NULL, 'Freelance',           'income',  '💻', '#10b981', TRUE, TRUE,  2),
  (gen_random_uuid(), NULL, 'Business Income',     'income',  '🏪', '#059669', TRUE, TRUE,  3),
  (gen_random_uuid(), NULL, 'Investment Returns',  'income',  '📈', '#16a34a', TRUE, TRUE,  4),
  (gen_random_uuid(), NULL, 'Rental Income',       'income',  '🏠', '#15803d', TRUE, TRUE,  5),
  (gen_random_uuid(), NULL, 'Gift Received',       'income',  '🎁', '#84cc16', TRUE, TRUE,  6),
  (gen_random_uuid(), NULL, 'Bonus',               'income',  '🎉', '#65a30d', TRUE, TRUE,  7),
  (gen_random_uuid(), NULL, 'Other Income',        'income',  '💰', '#4ade80', TRUE, TRUE,  8),
  (gen_random_uuid(), NULL, 'Food & Dining',       'expense', '🍽️','#ef4444', TRUE, TRUE, 10),
  (gen_random_uuid(), NULL, 'Groceries',           'expense', '🛒', '#f97316', TRUE, TRUE, 11),
  (gen_random_uuid(), NULL, 'Transport',           'expense', '🚌', '#f59e0b', TRUE, TRUE, 12),
  (gen_random_uuid(), NULL, 'Fuel',                'expense', '⛽', '#eab308', TRUE, TRUE, 13),
  (gen_random_uuid(), NULL, 'Utilities',           'expense', '💡', '#84cc16', TRUE, TRUE, 14),
  (gen_random_uuid(), NULL, 'Internet & Phone',    'expense', '📱', '#06b6d4', TRUE, TRUE, 15),
  (gen_random_uuid(), NULL, 'Rent',                'expense', '🏠', '#8b5cf6', TRUE, TRUE, 16),
  (gen_random_uuid(), NULL, 'Healthcare',          'expense', '🏥', '#ec4899', TRUE, TRUE, 17),
  (gen_random_uuid(), NULL, 'Education',           'expense', '📚', '#6366f1', TRUE, TRUE, 18),
  (gen_random_uuid(), NULL, 'Shopping',            'expense', '🛍️','#f43f5e', TRUE, TRUE, 19),
  (gen_random_uuid(), NULL, 'Entertainment',       'expense', '🎬', '#a855f7', TRUE, TRUE, 20),
  (gen_random_uuid(), NULL, 'Personal Care',       'expense', '💄', '#ec4899', TRUE, TRUE, 21),
  (gen_random_uuid(), NULL, 'Clothing',            'expense', '👕', '#14b8a6', TRUE, TRUE, 22),
  (gen_random_uuid(), NULL, 'Travel',              'expense', '✈️', '#0ea5e9', TRUE, TRUE, 23),
  (gen_random_uuid(), NULL, 'Insurance',           'expense', '🛡️','#64748b', TRUE, TRUE, 24),
  (gen_random_uuid(), NULL, 'Subscriptions',       'expense', '📺', '#7c3aed', TRUE, TRUE, 25),
  (gen_random_uuid(), NULL, 'Charity & Donations', 'expense', '❤️', '#f43f5e', TRUE, TRUE, 26),
  (gen_random_uuid(), NULL, 'Bank Charges',        'expense', '🏦', '#475569', TRUE, TRUE, 27),
  (gen_random_uuid(), NULL, 'Tax',                 'expense', '📋', '#334155', TRUE, TRUE, 28),
  (gen_random_uuid(), NULL, 'EMI',                 'expense', '💳', '#9333ea', TRUE, TRUE, 29),
  (gen_random_uuid(), NULL, 'Other Expense',       'expense', '💸', '#94a3b8', TRUE, TRUE, 30),
  (gen_random_uuid(), NULL, 'Opening Balance',     'system',  '🏁', '#64748b', TRUE, TRUE, 100),
  (gen_random_uuid(), NULL, 'Transfer',            'system',  '↔️', '#64748b', TRUE, TRUE, 101),
  (gen_random_uuid(), NULL, 'Loan Interest',       'system',  '📊', '#64748b', TRUE, TRUE, 102),
  (gen_random_uuid(), NULL, 'Loan Fee',            'system',  '📑', '#64748b', TRUE, TRUE, 103)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------
-- 10. TEST/DEMO USER
--  Email:    admin@safivra.com
--  Password: Safivra@2025
-- ----------------------------------------------------------------
DO $$
DECLARE v_uid UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@safivra.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, role, aud,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token, recovery_token,
      email_change_token_new, email_change, created_at, updated_at
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000',
      'admin@safivra.com', crypt('Safivra@2025', gen_salt('bf')),
      NOW(), 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Safivra Admin","preferred_currency":"BDT","timezone":"Asia/Dhaka"}',
      FALSE, '', '', '', '', NOW(), NOW()
    );
    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_uid::TEXT, v_uid,
      json_build_object('sub', v_uid::TEXT, 'email', 'admin@safivra.com')::jsonb,
      'email', NOW(), NOW(), NOW()
    );
    UPDATE profiles
    SET full_name = 'Safivra Admin', preferred_currency = 'BDT', timezone = 'Asia/Dhaka', onboarding_completed = TRUE
    WHERE id = v_uid;
  END IF;
END $$;

-- Done!
-- Login: admin@safivra.com / Safivra@2025
