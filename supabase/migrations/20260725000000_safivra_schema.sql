-- SAFIVRA: Production-Grade Personal Finance & Wealth Readiness Database Schema
-- Supabase PostgreSQL Migration script

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
CREATE TYPE account_type_enum AS ENUM ('cash', 'checking', 'savings', 'credit_card', 'investment', 'real_estate', 'loan', 'other_asset', 'other_liability');
CREATE TYPE transaction_type_enum AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE budget_category_type AS ENUM ('needs', 'wants', 'savings_investments', 'debt_repayment');
CREATE TYPE debt_payoff_strategy AS ENUM ('avalanche', 'snowball');

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    currency_code VARCHAR(3) DEFAULT 'USD',
    target_fire_age INT DEFAULT 55,
    annual_withdrawal_rate NUMERIC(5,2) DEFAULT 4.00, -- 4.0% SWR
    emergency_fund_target_months INT DEFAULT 6,
    debt_strategy debt_payoff_strategy DEFAULT 'avalanche',
    literacy_score INT DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    account_type account_type_enum NOT NULL,
    institution_name TEXT,
    current_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    is_liability BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BUDGET CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL for global defaults
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'tag',
    color TEXT DEFAULT '#10B981',
    bucket_type budget_category_type NOT NULL DEFAULT 'wants',
    monthly_budget_limit NUMERIC(15,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    destination_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL, -- for transfers
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    type transaction_type_enum NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_recurring BOOLEAN DEFAULT FALSE,
    merchant_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DEBTS TRACKER TABLE (Deep Debt Analysis)
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    debt_name TEXT NOT NULL,
    principal_balance NUMERIC(15,2) NOT NULL,
    annual_interest_rate NUMERIC(5,2) NOT NULL, -- e.g. 18.99%
    minimum_monthly_payment NUMERIC(15,2) NOT NULL,
    due_day_of_month INT CHECK (due_day_of_month BETWEEN 1 AND 31),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LITERACY & WEALTH READINESS MODULES
CREATE TABLE IF NOT EXISTS public.literacy_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_slug TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    quiz_score INT DEFAULT 0,
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, module_slug)
);

-- 9. AUDIT LOGS & LEDGER BALANCE TRIGGER
CREATE OR REPLACE FUNCTION update_account_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.type = 'income' THEN
            UPDATE public.accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE public.accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'transfer' AND NEW.destination_account_id IS NOT NULL THEN
            UPDATE public.accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
            UPDATE public.accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.destination_account_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.type = 'income' THEN
            UPDATE public.accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE public.accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.type = 'transfer' AND OLD.destination_account_id IS NOT NULL THEN
            UPDATE public.accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
            UPDATE public.accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.destination_account_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_account_balance
AFTER INSERT OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION update_account_balance_on_transaction();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.literacy_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their accounts" ON public.accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their categories" ON public.categories FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage their transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their debts" ON public.debts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage literacy progress" ON public.literacy_progress FOR ALL USING (auth.uid() = user_id);
