-- SAFIVRA: Production-Grade Personal Finance & Wealth Readiness Database Schema
-- Supabase PostgreSQL Migration script (Sprints 1 to 6)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
CREATE TYPE account_type_enum AS ENUM ('cash', 'checking', 'savings', 'credit_card', 'investment', 'real_estate', 'loan', 'other_asset', 'other_liability');
CREATE TYPE transaction_type_enum AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE budget_category_type AS ENUM ('needs', 'wants', 'savings_investments', 'debt_repayment');
CREATE TYPE debt_payoff_strategy AS ENUM ('avalanche', 'snowball');
CREATE TYPE workspace_role_enum AS ENUM ('owner', 'admin', 'member');
CREATE TYPE due_type_enum AS ENUM ('receivable', 'payable', 'loan');

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    currency_code VARCHAR(3) DEFAULT 'USD',
    target_fire_age INT DEFAULT 55,
    annual_withdrawal_rate NUMERIC(5,2) DEFAULT 4.00,
    emergency_fund_target_months INT DEFAULT 6,
    debt_strategy debt_payoff_strategy DEFAULT 'avalanche',
    literacy_score INT DEFAULT 100,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WORKSPACES TABLE (Sprint 3: Multi-tenant Workspaces)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'personal', -- 'personal', 'household', 'business'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workspace_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role workspace_role_enum NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 5. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type account_type_enum NOT NULL,
    institution_name TEXT,
    current_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    is_liability BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BUDGET CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'tag',
    color TEXT DEFAULT '#10B981',
    bucket_type budget_category_type NOT NULL DEFAULT 'wants',
    monthly_budget_limit NUMERIC(15,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    destination_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
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

-- 8. DOUBLE-ENTRY JOURNAL LEDGER (Sprint 4: Chart of Accounts & Audit Trail)
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    entry_number SERIAL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    memo TEXT NOT NULL,
    is_reversed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.journal_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    debit_amount NUMERIC(15,2) DEFAULT 0.00,
    credit_amount NUMERIC(15,2) DEFAULT 0.00,
    description TEXT
);

-- 9. RECEIVABLES & PAYABLES (Sprint 6: Loans, Dues & Receivables)
CREATE TABLE IF NOT EXISTS public.receivables_payables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    counterparty_name TEXT NOT NULL,
    type due_type_enum NOT NULL,
    total_amount NUMERIC(15,2) NOT NULL,
    balance_due NUMERIC(15,2) NOT NULL,
    interest_rate NUMERIC(5,2) DEFAULT 0.00,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables_payables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their workspaces" ON public.workspaces FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage accounts" ON public.accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage journal entries" ON public.journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage dues" ON public.receivables_payables FOR ALL USING (auth.uid() = user_id);
