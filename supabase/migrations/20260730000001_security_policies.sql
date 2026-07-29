-- ================================================================
-- Migration: 20260730000001_security_policies.sql
-- Description: Enable Row Level Security (RLS) and define user ownership policies
-- ================================================================

-- 1. Enable RLS on all public tables
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_payments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;

-- 2. Clean existing policies (idempotence helper)
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 3. Define RLS Policies for Authenticated Users

-- profiles (id acts as user_id)
CREATE POLICY "profiles_owner_policy" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- user_preferences
CREATE POLICY "user_preferences_owner_policy" ON public.user_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- financial_accounts
CREATE POLICY "financial_accounts_owner_policy" ON public.financial_accounts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- transaction_categories (read system categories + own, write own)
CREATE POLICY "categories_read_policy" ON public.transaction_categories
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "categories_insert_policy" ON public.transaction_categories
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_update_policy" ON public.transaction_categories
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND is_system = FALSE)
  WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "categories_delete_policy" ON public.transaction_categories
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND is_system = FALSE);

-- ledger_transactions
CREATE POLICY "ledger_transactions_owner_policy" ON public.ledger_transactions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ledger_entries
CREATE POLICY "ledger_entries_owner_policy" ON public.ledger_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- budgets
CREATE POLICY "budgets_owner_policy" ON public.budgets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- budget_categories
CREATE POLICY "budget_categories_owner_policy" ON public.budget_categories
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- loans
CREATE POLICY "loans_owner_policy" ON public.loans
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- loan_payments
CREATE POLICY "loan_payments_owner_policy" ON public.loan_payments
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- credit_cards
CREATE POLICY "credit_cards_owner_policy" ON public.credit_cards
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- credit_card_payments
CREATE POLICY "credit_card_payments_owner_policy" ON public.credit_card_payments
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- receivables
CREATE POLICY "receivables_owner_policy" ON public.receivables
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- recurring_templates
CREATE POLICY "recurring_templates_owner_policy" ON public.recurring_templates
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- savings_goals
CREATE POLICY "savings_goals_owner_policy" ON public.savings_goals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- notifications
CREATE POLICY "notifications_owner_policy" ON public.notifications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
