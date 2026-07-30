# Safivra — Cross-Platform Financial Management

Safivra is a premium, privacy-respecting Personal Financial Management (PFM) system tailored for Bangladeshi users (BDT). Built with React, TypeScript, Tailwind CSS, Supabase, Capacitor (Mobile), and Tauri (Desktop).

---

## 🌟 Key Features

1. **100% Cross-Platform Ready**
   - **Web & PWA:** Fully responsive layout with Service Worker precaching.
   - **Mobile (Android/iOS):** Native mobile shell using Capacitor.
   - **Desktop (macOS/Windows):** Lightweight native desktop apps using Tauri.
   - Uses an internal `PlatformContext` to automatically adapt UI patterns (like Back Buttons and Notifications) for the active environment.

2. **Strict Double-Entry Ledger Engine**
   - Implements balanced debit/credit posting (`post_transaction` RPC function).
   - Accounts serve as views over posted ledger entries — preventing manual balance drift.

3. **Complete Financial Accounts & Commitments**
   - Liquid Asset accounts (Cash, Bank, bKash, Nagad, Savings, Investments).
   - Loans & Debts (Personal, Bank, EMI, interest rate tracking, and repayment progress).
   - Credit Cards (Limit utilization monitoring, statement dates, and bill payments).
   - Budgets, Recurring Commitments, and Savings Goals.

4. **Security & Privacy**
   - Supabase Row Level Security (RLS) on all tables.
   - Secure HTTP headers (CSP, XSS Protection, Strict-Transport-Security) via Vercel configuration.
   - Balance Privacy mode for hiding values in public.
   - See `SECURITY.md` for our vulnerability reporting policy.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- Supabase project URL & Anon Key
- (Optional) Android Studio / Xcode for Mobile builds
- (Optional) Rust for Tauri Desktop builds

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

### 4. Run Locally (Web)
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit test suite
npm run typecheck && npm test

# Build production bundle
npm run build
```

### 5. Build for Mobile (Capacitor)
```bash
# Sync web assets to native directories
npx cap sync

# Open Android Studio
npx cap open android

# Open Xcode
npx cap open ios
```

### 6. Build for Desktop (Tauri)
```bash
# Start desktop development server
npm run tauri dev

# Build production desktop installer
npm run tauri build
```
