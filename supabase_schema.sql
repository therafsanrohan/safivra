-- =====================================================================
-- SAFIVRA PRODUCTION DATABASE SCHEMA FOR SUPABASE
-- Run this complete script in your Supabase Dashboard -> SQL Editor
-- =====================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing types if recreating
DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('cash', 'bank', 'savings', 'mobile_financial_service', 'credit_card', 'loan', 'investment', 'receivable', 'other_asset', 'other_liability');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE account_class AS ENUM ('asset', 'liability');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer', 'loan_received', 'loan_payment', 'credit_card_purchase', 'credit_card_payment', 'refund', 'balance_adjustment', 'opening_balance', 'fee');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('posted', 'pending', 'voided', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE category_type AS ENUM ('income', 'expense', 'system');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE entry_role AS ENUM ('asset_debit', 'asset_credit', 'liability_debit', 'liability_credit', 'income_credit', 'expense_debit', 'equity_credit', 'transfer_out', 'transfer_in', 'fee_expense');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE loan_type AS ENUM ('personal', 'bank', 'business', 'education', 'family_friend', 'installment', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE interest_type AS ENUM ('fixed', 'reducing_balance', 'interest_free', 'manual', 'unknown');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE loan_status AS ENUM ('active', 'paid', 'overdue', 'paused', 'restructured', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly', 'custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE card_status AS ENUM ('active', 'frozen', 'closed', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE budget_period AS ENUM ('monthly', 'weekly', 'custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE recurring_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE receivable_status AS ENUM ('active', 'partially_repaid', 'repaid', 'overdue', 'written_off');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('upcoming_loan_payment', 'upcoming_card_payment', 'upcoming_bill', 'budget_warning', 'budget_exceeded', 'overdue_payment', 'recurring_pending');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TABLES

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    preferred_currency TEXT NOT NULL DEFAULT 'BDT',
    timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    balance_privacy BOOLEAN NOT NULL DEFAULT false,
    start_of_week INT NOT NULL DEFAULT 0,
    default_account_id UUID,
    notification_upcoming_days INT NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Financial Accounts
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    account_type account_type NOT NULL,
    account_class account_class NOT NULL,
    institution TEXT,
    currency_code TEXT NOT NULL DEFAULT 'BDT',
    opening_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    opening_balance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_four TEXT,
    credit_limit NUMERIC(15,2),
    include_in_total BOOLEAN NOT NULL DEFAULT true,
    include_in_net_worth BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transaction Categories
CREATE TABLE IF NOT EXISTS public.transaction_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category_type category_type NOT NULL,
    icon TEXT,
    color TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ledger Transactions
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_type transaction_type NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_time TIME,
    timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    title TEXT NOT NULL,
    description TEXT,
    merchant TEXT,
    status transaction_status NOT NULL DEFAULT 'posted',
    reference_number TEXT,
    recurring_template_id UUID,
    related_transaction_id UUID,
    voided_at TIMESTAMPTZ,
    void_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ledger Entries
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ledger_transaction_id UUID NOT NULL REFERENCES public.ledger_transactions(id) ON DELETE CASCADE,
    financial_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
    amount NUMERIC(15,2) NOT NULL,
    currency_code TEXT NOT NULL DEFAULT 'BDT',
    entry_role entry_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Budgets
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    period_type budget_period NOT NULL DEFAULT 'monthly',
    total_limit NUMERIC(15,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    alert_threshold INT NOT NULL DEFAULT 80,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Budget Categories
CREATE TABLE IF NOT EXISTS public.budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.transaction_categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loans
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    loan_type loan_type NOT NULL,
    lender_name TEXT NOT NULL,
    original_principal NUMERIC(15,2) NOT NULL,
    opening_outstanding NUMERIC(15,2),
    interest_type interest_type NOT NULL DEFAULT 'interest_free',
    annual_rate NUMERIC(5,2),
    monthly_installment NUMERIC(15,2),
    payment_frequency payment_frequency NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    first_payment_date DATE,
    next_payment_date DATE,
    expected_completion DATE,
    linked_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    notes TEXT,
    status loan_status NOT NULL DEFAULT 'active',
    include_in_net_worth BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loan Payments
CREATE TABLE IF NOT EXISTS public.loan_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    ledger_transaction_id UUID NOT NULL REFERENCES public.ledger_transactions(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    total_amount NUMERIC(15,2) NOT NULL,
    principal_amount NUMERIC(15,2) NOT NULL,
    interest_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    fee_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    payment_account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credit Cards
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    issuer TEXT NOT NULL,
    last_four TEXT,
    credit_limit NUMERIC(15,2) NOT NULL,
    opening_outstanding NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    statement_day INT,
    payment_due_day INT,
    minimum_payment NUMERIC(15,2),
    annual_fee_date DATE,
    linked_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    notes TEXT,
    status card_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credit Card Payments
CREATE TABLE IF NOT EXISTS public.credit_card_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    credit_card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    ledger_transaction_id UUID NOT NULL REFERENCES public.ledger_transactions(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    payment_account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Receivables
CREATE TABLE IF NOT EXISTS public.receivables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    person_name TEXT NOT NULL,
    amount_lent NUMERIC(15,2) NOT NULL,
    amount_remaining NUMERIC(15,2) NOT NULL,
    date_lent DATE NOT NULL,
    expected_repayment DATE,
    linked_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    notes TEXT,
    status receivable_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recurring Templates
CREATE TABLE IF NOT EXISTS public.recurring_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    transaction_type transaction_type NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
    frequency recurring_frequency NOT NULL,
    start_date DATE NOT NULL,
    next_occurrence DATE NOT NULL,
    end_date DATE,
    reminder_days INT NOT NULL DEFAULT 3,
    auto_post BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Savings Goals
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(15,2) NOT NULL,
    current_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    target_date DATE,
    linked_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    notes TEXT,
    status goal_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    related_id UUID,
    related_type TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SYSTEM VIEWS

CREATE OR REPLACE VIEW public.v_account_balances AS
SELECT 
    fa.id AS account_id,
    fa.user_id,
    fa.name,
    fa.account_type,
    fa.account_class,
    fa.institution,
    fa.currency_code,
    fa.credit_limit,
    fa.include_in_total,
    fa.include_in_net_worth,
    fa.is_active,
    fa.is_archived,
    COALESCE(fa.opening_balance, 0) + COALESCE(SUM(
        CASE 
            WHEN le.entry_role IN ('asset_debit', 'liability_debit', 'transfer_in') THEN le.amount
            WHEN le.entry_role IN ('asset_credit', 'liability_credit', 'transfer_out') THEN -le.amount
            ELSE 0
        END
    ), 0) AS balance
FROM public.financial_accounts fa
LEFT JOIN public.ledger_entries le ON fa.id = le.financial_account_id
GROUP BY fa.id;

-- 4. SYSTEM SEED CATEGORIES
INSERT INTO public.transaction_categories (name, category_type, icon, color, is_system, sort_order) VALUES
('Salary & Income', 'income', 'Briefcase', '#10B981', true, 1),
('Freelance / Business', 'income', 'DollarSign', '#059669', true, 2),
('Investment Return', 'income', 'TrendingUp', '#047857', true, 3),
('Food & Dining', 'expense', 'Utensils', '#EF4444', true, 10),
('Shopping & Retail', 'expense', 'ShoppingBag', '#F59E0B', true, 11),
('Housing & Utilities', 'expense', 'Home', '#3B82F6', true, 12),
('Transportation', 'expense', 'Car', '#8B5CF6', true, 13),
('Bills & Subscriptions', 'expense', 'FileText', '#EC4899', true, 14),
('Health & Medical', 'expense', 'HeartPulse', '#14B8A6', true, 15),
('Education & Learning', 'expense', 'BookOpen', '#6366F1', true, 16),
('Entertainment & Leisure', 'expense', 'Film', '#D97706', true, 17),
('Other Expense', 'expense', 'MoreHorizontal', '#6B7280', true, 99)
ON CONFLICT DO NOTHING;

-- 5. AUTOMATIC USER CREATION TRIGGER

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, full_name, preferred_currency, timezone, onboarding_completed)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        'BDT',
        'Asia/Dhaka',
        false
    );

    -- Create user preferences
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper policies
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own accounts" ON public.financial_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view system or own categories" ON public.transaction_categories FOR SELECT USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage own categories" ON public.transaction_categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own transactions" ON public.ledger_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own ledger entries" ON public.ledger_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own budget categories" ON public.budget_categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own loans" ON public.loans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own loan payments" ON public.loan_payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own credit cards" ON public.credit_cards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own credit card payments" ON public.credit_card_payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own receivables" ON public.receivables FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own recurring templates" ON public.recurring_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own savings goals" ON public.savings_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
