# Safivra — System Requirements Specification (SRS)
**Document Version:** 2.0.0  
**Status:** Approved & Production-Ready  
**System Architecture:** Zero-Downtime, Modular Monolith, Double-Entry Financial Engine  
**Scalability Target:** 1.2 Million Requests Per Second (Global Edge + Read Caching)  

---

## 1. Executive Summary & Purpose

Safivra is a high-grade, multi-platform personal financial management and accounting platform designed for real-time tracking of assets, liabilities, income, expenses, loans, credit cards, savings goals, and international multi-currency ledgers.

The primary objective of this specification is to define the functional, architectural, financial, security, and scalability requirements for Safivra as it evolves from a browser-direct architecture into a globally scalable, fault-tolerant enterprise system.

---

## 2. System Architecture Overview

Safivra follows a **Modular Monolith & Strangler Pattern** architecture to guarantee zero-downtime progressive migration.

```
┌─────────────────────────────────────────────────────────────────┐
│              Clients (Web SPA, Capacitor Mobile, Desktop)       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│       Global Edge Layer (Cloudflare WAF / DDoS / CDN Cache)     │
└────────────────────────────────┬────────────────────────────────┘
                                 │ (Rate Limited: 100 req/min/IP)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│         Vercel API Gateway & Modular Monolith Endpoints         │
│ (/api/v1/health, /api/v1/transactions, /api/v1/dashboard, etc)  │
└────────────────┬────────────────────────────────┬───────────────┘
                 │                                │
                 ▼                                ▼
┌──────────────────────────────────┐  ┌──────────────────────────┐
│  Upstash Redis Cache Read Layer │  │ Transactional Outbox     │
│ (Dashboard & Analytics 300s TTL) │  │ Worker Dispatcher Engine │
└──────────────────────────────────┘  └───────────┬──────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│     Authoritative Financial Database (Supabase PostgreSQL)      │
│  - Double-Entry Ledger Engine (ledger_transactions & entries)   │
│  - Row-Level Security (RLS) & SECURITY DEFINER Functions        │
│  - Pre-computed Account Balance Cache & Idempotency Keys        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Financial Engine Specifications (Core Invariants)

### 3.1 Double-Entry Ledger Accounting
- Financial truth is maintained **exclusively** in the `ledger_transactions` and `ledger_entries` tables.
- **Fundamental Invariant**: For every posted transaction, `Debit Amount = Credit Amount`.
- Supported Entry Roles:
  - Asset: `asset_debit` (increase), `asset_credit` (decrease)
  - Liability: `liability_credit` (increase debt), `liability_debit` (decrease debt)
  - Income: `income_credit`
  - Expense: `expense_debit`, `fee_expense`
  - Transfer: `transfer_in`, `transfer_out`

### 3.2 Idempotency & Replay Protection
- Every financial POST request supports a unique `p_idempotency_key` (Format: `tx_{user_prefix}_{timestamp}_{hex}`).
- If the exact same request arrives multiple times (e.g. on network timeout retry), the system returns the cached original result from `idempotency_keys` without re-posting money.

### 3.3 Soft-Delete & Auditability
- **Zero Permanent Deletion Rule**: Financial transactions are never hard-deleted.
- The `archive_financial_record()` RPC sets `archived_at` and voids transactions, preserving full ledger audit history.
- Critical operations emit immutable records into the `audit_log` table (actor, action, entity, timestamp, metadata).

---

## 4. Functional Requirements & Feature Modules

### 4.1 Accounts & Asset Management
- Real-time balances calculated via `v_account_balances` and pre-computed in `account_balance_cache`.
- Supports account classes (`asset`, `liability`) and account types (`checking`, `savings`, `cash`, `credit_card`, `loan`).

### 4.2 Financial Transactions & Transfer Engine
- Transaction Types: `income`, `expense`, `transfer`, `loan_received`, `loan_payment`, `credit_card_purchase`, `credit_card_payment`, `refund`, `fee`, `opening_balance`, `balance_adjustment`.
- Full input validation via Zod schemas and PostgreSQL server-side constraints.

### 4.3 Loans & Debt Tracking
- Active Loan list access with principal, interest, and fee breakdowns.
- Atomic loan installment recording linked directly to cash/bank accounts.

### 4.4 Credit Cards Engine
- Credit limit tracking, statement due date reminders, and credit card payment recording.

### 4.5 Reports & Analytics
- Dynamic Income vs Expense breakdown with server-side date range filtering via `get_analytics_report()`.
- UTF-8 BOM CSV Export using Blob URLs (`URL.createObjectURL(blob)`) for perfect multi-language support (English & Bengali).

### 4.6 Internationalization (i18n)
- Dynamic switching between English (`en`) and Bengali (`bn`) with synced translation keys verified via `npm run i18n:check`.

---

## 5. Non-Functional Requirements

### 5.1 Performance Budget
- **p50 Latency**: < 50ms (Edge/Redis hit)
- **p95 Latency**: < 200ms (PostgreSQL RPC hit)
- **Edge Throughput Target**: Up to 1.2 Million requests per second (Global Edge + WAF).

### 5.2 Security & Privacy
- **Row-Level Security (RLS)**: Enforced on all production tables (`auth.uid() = user_id`).
- **Content Security Policy (CSP)**: Strictly controls connect-src to `*.supabase.co` and `*.ingest.sentry.io`.
- **Sentry Privacy Scrubbing**: Request payloads, authorization headers, and breadcrumbs are stripped before transmission to prevent financial data leaks.

### 5.3 Disaster Recovery & Backup
- **Recovery Point Objective (RPO)**: < 1 Minute (Supabase Point-in-Time Recovery).
- **Recovery Time Objective (RTO)**: < 15 Minutes for DB, < 5 Minutes for App/API.
- On-demand automated financial health audit via `SELECT public.check_financial_integrity();`.

---

## 6. Verification & Quality Assurance

Safivra enforces a zero-error automated verification pipeline before any production deployment:
```bash
npm run verify
# Executes:
# 1. oxlint src (Linting)
# 2. tsc --noEmit (TypeScript Type Checking)
# 3. tsx scripts/validate-translations.ts (i18n Namespace Validation)
# 4. vitest run (19 Automated Integration & Unit Tests)
# 5. vite build (Production PWA Bundle Verification)
```
