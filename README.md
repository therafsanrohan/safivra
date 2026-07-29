# Safivra — Personal Financial Management Web Application

Safivra is a premium, mobile-first, privacy-respecting Personal Financial Management (PFM) web application tailored specifically for Bangladeshi users. Built with React, TypeScript, Tailwind CSS, and Supabase Postgres.

---

## 🌟 Key Features

1. **Strict Double-Entry Ledger Engine**
   - Implements balanced debit/credit posting (`post_transaction` RPC function).
   - Accounts serve as views over posted ledger entries — preventing manual balance drift.

2. **Regional Localization (Bangladesh / BDT / Asia/Dhaka)**
   - Currencies formatted using `en-BD` locale with `৳` symbol and tabular numbers.
   - All dates and times synchronized to the `Asia/Dhaka` timezone.

3. **Complete Financial Accounts & Commitments**
   - Liquid Asset accounts (Cash, Bank, bKash, Nagad, Savings, Investments).
   - Loans & Debts (Personal, Bank, EMI, interest rate tracking, and repayment progress).
   - Credit Cards (Limit utilization monitoring, statement dates, and bill payments).
   - Budgets, Recurring Commitments, and Savings Goals.

4. **Security & Privacy**
   - Supabase Row Level Security (RLS) on all tables.
   - Password strength validation and email verification guards.
   - Balance Privacy mode for hiding values in public.
   - Client-side CSV transaction exports.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- Supabase project URL & Anon Key

### 2. Setup Environment
Copy `.env.example` to `.env.local` and add your Supabase project credentials:
```bash
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Apply Database Migrations
Run the SQL scripts in `supabase/migrations/` sequentially in your Supabase SQL Editor:
1. `20260729000001_initial_schema.sql`
2. `20260729000002_rls_policies.sql`
3. `20260729000003_functions.sql`
4. `20260729000004_seed_categories.sql`

### 4. Run Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit test suite
npm test

# Build production bundle
npm run build
```

---

## 📱 PWA Support
Safivra includes Service Worker precaching via Vite PWA and can be installed directly to your home screen on iOS and Android.
