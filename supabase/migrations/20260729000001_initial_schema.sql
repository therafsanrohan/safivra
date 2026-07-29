-- =============================================================================
-- Safivra — Initial Database Schema
-- Migration: 001_initial_schema
-- =============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE account_type AS ENUM (
  'cash', 'bank', 'savings', 'mobile_financial_service',
  'credit_card', 'loan', 'investment', 'receivable',
  'other_asset', 'other_liability'
);

CREATE TYPE account_class AS ENUM ('asset', 'liability');

CREATE TYPE transaction_type AS ENUM (
  'income', 'expense', 'transfer',
  'loan_received', 'loan_payment',
  'credit_card_purchase', 'credit_card_payment',
  'refund', 'balance_adjustment', 'opening_balance', 'fee'
);

CREATE TYPE transaction_status AS ENUM ('posted', 'pending', 'voided', 'failed');

CREATE TYPE category_type AS ENUM ('income', 'expense', 'system');

CREATE TYPE entry_role AS ENUM (
  'asset_debit', 'asset_credit',
  'liability_debit', 'liability_credit',
  'income_credit', 'expense_debit',
  'equity_credit',
  'transfer_out', 'transfer_in',
  'fee_expense'
);

CREATE TYPE loan_type AS ENUM (
  'personal', 'bank', 'business', 'education',
  'family_friend', 'installment', 'other'
);

CREATE TYPE interest_type AS ENUM (
  'fixed', 'reducing_balance', 'interest_free', 'manual', 'unknown'
);

CREATE TYPE loan_status AS ENUM (
  'active', 'paid', 'overdue', 'paused', 'restructured', 'archived'
);

CREATE TYPE payment_frequency AS ENUM (
  'weekly', 'monthly', 'quarterly', 'yearly', 'custom'
);

CREATE TYPE card_status AS ENUM ('active', 'frozen', 'closed', 'archived');

CREATE TYPE budget_period AS ENUM ('monthly', 'weekly', 'custom');

CREATE TYPE recurring_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');

CREATE TYPE receivable_status AS ENUM (
  'active', 'partially_repaid', 'repaid', 'overdue', 'written_off'
);

CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused', 'cancelled');

CREATE TYPE notification_type AS ENUM (
  'upcoming_loan_payment', 'upcoming_card_payment', 'upcoming_bill',
  'budget_warning', 'budget_exceeded', 'overdue_payment', 'recurring_pending'
);

-- ─── Profiles ────────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT NOT NULL DEFAULT '',
  preferred_currency   TEXT NOT NULL DEFAULT 'BDT',
  timezone             TEXT NOT NULL DEFAULT 'Asia/Dhaka',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_preferences (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance_privacy              BOOLEAN NOT NULL DEFAULT FALSE,
  start_of_week                SMALLINT NOT NULL DEFAULT 0 CHECK (start_of_week BETWEEN 0 AND 6),
  default_account_id           UUID,
  notification_upcoming_days   SMALLINT NOT NULL DEFAULT 7 CHECK (notification_upcoming_days BETWEEN 1 AND 30),
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ─── Financial Accounts ──────────────────────────────────────────────────────

CREATE TABLE financial_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  account_type          account_type NOT NULL,
  account_class         account_class NOT NULL,
  institution           TEXT,
  currency_code         TEXT NOT NULL DEFAULT 'BDT',
  opening_balance       NUMERIC(18, 2) NOT NULL DEFAULT 0,
  opening_balance_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  last_four             CHAR(4) CHECK (last_four ~ '^\d{4}$'),
  credit_limit          NUMERIC(18, 2) CHECK (credit_limit IS NULL OR credit_limit >= 0),
  include_in_total      BOOLEAN NOT NULL DEFAULT TRUE,
  include_in_net_worth  BOOLEAN NOT NULL DEFAULT TRUE,
  notes                 TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  is_archived           BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order            INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Transaction Categories ───────────────────────────────────────────────────

CREATE TABLE transaction_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,  -- NULL = system category
  name          TEXT NOT NULL,
  category_type category_type NOT NULL,
  icon          TEXT,
  color         TEXT,
  is_system     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Ledger Transactions ─────────────────────────────────────────────────────

CREATE TABLE ledger_transactions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type        transaction_type NOT NULL,
  transaction_date        DATE NOT NULL,
  transaction_time        TIME,
  timezone                TEXT NOT NULL DEFAULT 'Asia/Dhaka',
  title                   TEXT NOT NULL,
  description             TEXT,
  merchant                TEXT,
  status                  transaction_status NOT NULL DEFAULT 'posted',
  reference_number        TEXT,
  recurring_template_id   UUID,
  related_transaction_id  UUID REFERENCES ledger_transactions(id),
  voided_at               TIMESTAMPTZ,
  void_reason             TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Ledger Entries ───────────────────────────────────────────────────────────

CREATE TABLE ledger_entries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ledger_transaction_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE CASCADE,
  financial_account_id  UUID REFERENCES financial_accounts(id),
  category_id           UUID REFERENCES transaction_categories(id),
  amount                NUMERIC(18, 2) NOT NULL,  -- positive = debit, negative = credit
  currency_code         TEXT NOT NULL DEFAULT 'BDT',
  entry_role            entry_role NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Every entry must reference either an account or a category, not both null
  CHECK (financial_account_id IS NOT NULL OR category_id IS NOT NULL)
);

-- ─── Transaction Tags ────────────────────────────────────────────────────────

CREATE TABLE transaction_tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE TABLE transaction_tag_links (
  ledger_transaction_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE CASCADE,
  tag_id                UUID NOT NULL REFERENCES transaction_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (ledger_transaction_id, tag_id)
);

-- ─── Budgets ─────────────────────────────────────────────────────────────────

CREATE TABLE budgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  period_type     budget_period NOT NULL DEFAULT 'monthly',
  total_limit     NUMERIC(18, 2) NOT NULL CHECK (total_limit > 0),
  start_date      DATE NOT NULL,
  end_date        DATE,
  alert_threshold SMALLINT NOT NULL DEFAULT 85 CHECK (alert_threshold BETWEEN 50 AND 100),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE budget_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id     UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES transaction_categories(id),
  limit_amount  NUMERIC(18, 2) NOT NULL CHECK (limit_amount > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (budget_id, category_id)
);

-- ─── Loans ───────────────────────────────────────────────────────────────────

CREATE TABLE loans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id          UUID REFERENCES financial_accounts(id),  -- linked liability account
  name                TEXT NOT NULL,
  loan_type           loan_type NOT NULL,
  lender_name         TEXT NOT NULL,
  original_principal  NUMERIC(18, 2) NOT NULL CHECK (original_principal > 0),
  opening_outstanding NUMERIC(18, 2) CHECK (opening_outstanding IS NULL OR opening_outstanding >= 0),
  interest_type       interest_type NOT NULL DEFAULT 'unknown',
  annual_rate         NUMERIC(6, 4) CHECK (annual_rate IS NULL OR annual_rate BETWEEN 0 AND 100),
  monthly_installment NUMERIC(18, 2) CHECK (monthly_installment IS NULL OR monthly_installment >= 0),
  payment_frequency   payment_frequency NOT NULL DEFAULT 'monthly',
  start_date          DATE NOT NULL,
  first_payment_date  DATE,
  next_payment_date   DATE,
  expected_completion DATE,
  linked_account_id   UUID REFERENCES financial_accounts(id),  -- bank account for payments
  notes               TEXT,
  status              loan_status NOT NULL DEFAULT 'active',
  include_in_net_worth BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loan_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  loan_id               UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  ledger_transaction_id UUID NOT NULL REFERENCES ledger_transactions(id),
  payment_date          DATE NOT NULL,
  total_amount          NUMERIC(18, 2) NOT NULL CHECK (total_amount > 0),
  principal_amount      NUMERIC(18, 2) NOT NULL CHECK (principal_amount >= 0),
  interest_amount       NUMERIC(18, 2) NOT NULL CHECK (interest_amount >= 0),
  fee_amount            NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  payment_account_id    UUID NOT NULL REFERENCES financial_accounts(id),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Credit Cards ────────────────────────────────────────────────────────────

CREATE TABLE credit_cards (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id          UUID REFERENCES financial_accounts(id),  -- linked liability account
  nickname            TEXT NOT NULL,
  issuer              TEXT NOT NULL,
  last_four           CHAR(4) CHECK (last_four IS NULL OR last_four ~ '^\d{4}$'),
  credit_limit        NUMERIC(18, 2) NOT NULL CHECK (credit_limit > 0),
  opening_outstanding NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (opening_outstanding >= 0),
  statement_day       SMALLINT CHECK (statement_day IS NULL OR statement_day BETWEEN 1 AND 31),
  payment_due_day     SMALLINT CHECK (payment_due_day IS NULL OR payment_due_day BETWEEN 1 AND 31),
  minimum_payment     NUMERIC(18, 2) CHECK (minimum_payment IS NULL OR minimum_payment >= 0),
  annual_fee_date     DATE,
  linked_account_id   UUID REFERENCES financial_accounts(id),
  notes               TEXT,
  status              card_status NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE credit_card_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credit_card_id        UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  ledger_transaction_id UUID NOT NULL REFERENCES ledger_transactions(id),
  payment_date          DATE NOT NULL,
  amount                NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  payment_account_id    UUID NOT NULL REFERENCES financial_accounts(id),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Receivables ─────────────────────────────────────────────────────────────

CREATE TABLE receivables (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  person_name         TEXT NOT NULL,
  amount_lent         NUMERIC(18, 2) NOT NULL CHECK (amount_lent > 0),
  amount_remaining    NUMERIC(18, 2) NOT NULL CHECK (amount_remaining >= 0),
  date_lent           DATE NOT NULL,
  expected_repayment  DATE,
  linked_account_id   UUID REFERENCES financial_accounts(id),
  notes               TEXT,
  status              receivable_status NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Recurring Templates ──────────────────────────────────────────────────────

CREATE TABLE recurring_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  transaction_type transaction_type NOT NULL,
  amount           NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  account_id       UUID NOT NULL REFERENCES financial_accounts(id),
  category_id      UUID REFERENCES transaction_categories(id),
  frequency        recurring_frequency NOT NULL,
  start_date       DATE NOT NULL,
  next_occurrence  DATE NOT NULL,
  end_date         DATE,
  reminder_days    SMALLINT NOT NULL DEFAULT 3 CHECK (reminder_days BETWEEN 0 AND 30),
  auto_post        BOOLEAN NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Savings Goals ───────────────────────────────────────────────────────────

CREATE TABLE savings_goals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  target_amount     NUMERIC(18, 2) NOT NULL CHECK (target_amount > 0),
  current_amount    NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date       DATE,
  linked_account_id UUID REFERENCES financial_accounts(id),
  notes             TEXT,
  status            goal_status NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Notifications ───────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  related_id        UUID,
  related_type      TEXT,
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Account Reconciliations ─────────────────────────────────────────────────

CREATE TABLE account_reconciliations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  financial_account_id  UUID NOT NULL REFERENCES financial_accounts(id),
  reconciled_date       DATE NOT NULL,
  expected_balance      NUMERIC(18, 2) NOT NULL,
  actual_balance        NUMERIC(18, 2) NOT NULL,
  adjustment_amount     NUMERIC(18, 2) NOT NULL,
  ledger_transaction_id UUID REFERENCES ledger_transactions(id),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Audit Logs ──────────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id  UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Account Deletion Requests ───────────────────────────────────────────────

CREATE TABLE account_deletion_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at  TIMESTAMPTZ
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

-- Financial accounts
CREATE INDEX idx_financial_accounts_user ON financial_accounts(user_id);
CREATE INDEX idx_financial_accounts_type ON financial_accounts(user_id, account_type);
CREATE INDEX idx_financial_accounts_active ON financial_accounts(user_id, is_active, is_archived);

-- Transactions
CREATE INDEX idx_ledger_tx_user ON ledger_transactions(user_id);
CREATE INDEX idx_ledger_tx_date ON ledger_transactions(user_id, transaction_date DESC);
CREATE INDEX idx_ledger_tx_type ON ledger_transactions(user_id, transaction_type);
CREATE INDEX idx_ledger_tx_status ON ledger_transactions(user_id, status);

-- Ledger entries
CREATE INDEX idx_ledger_entries_tx ON ledger_entries(ledger_transaction_id);
CREATE INDEX idx_ledger_entries_account ON ledger_entries(financial_account_id);
CREATE INDEX idx_ledger_entries_category ON ledger_entries(category_id);
CREATE INDEX idx_ledger_entries_user ON ledger_entries(user_id);

-- Categories
CREATE INDEX idx_categories_user ON transaction_categories(user_id);
CREATE INDEX idx_categories_type ON transaction_categories(category_type);

-- Budgets
CREATE INDEX idx_budgets_user ON budgets(user_id, is_active);

-- Loans
CREATE INDEX idx_loans_user ON loans(user_id, status);
CREATE INDEX idx_loans_due ON loans(next_payment_date) WHERE status = 'active';

-- Credit cards
CREATE INDEX idx_cards_user ON credit_cards(user_id, status);

-- Recurring templates
CREATE INDEX idx_recurring_next ON recurring_templates(next_occurrence) WHERE is_active = TRUE;
CREATE INDEX idx_recurring_user ON recurring_templates(user_id, is_active);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ─── Updated_at Trigger Function ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_prefs_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON financial_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ledger_tx_updated_at
  BEFORE UPDATE ON ledger_transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cards_updated_at
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_receivables_updated_at
  BEFORE UPDATE ON receivables
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_recurring_updated_at
  BEFORE UPDATE ON recurring_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON savings_goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
