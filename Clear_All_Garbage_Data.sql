-- ================================================================
-- SAFIVRA: CLEAR ALL TEST / GARBAGE FINANCIAL DATA
-- This script wipes all test financial accounts, transactions, loans,
-- credit cards, budgets, savings, recurring items, and notifications.
-- 
-- It KEEPS your user login, profile, user preferences, and default system categories.
-- ================================================================

BEGIN;

-- 1. Clear transaction ledger entries and transactions
DELETE FROM public.ledger_entries;
DELETE FROM public.ledger_transactions;

-- 2. Clear payments
DELETE FROM public.loan_payments;
DELETE FROM public.credit_card_payments;

-- 3. Clear liabilities & credit products
DELETE FROM public.loans;
DELETE FROM public.credit_cards;
DELETE FROM public.receivables;

-- 4. Clear planning & analytics data
DELETE FROM public.recurring_templates;
DELETE FROM public.budget_categories;
DELETE FROM public.budgets;
DELETE FROM public.savings_goals;
DELETE FROM public.savings_schemes;

-- 5. Clear notifications
DELETE FROM public.notifications;

-- 6. Clear financial accounts (bank, cash, mobile wallet, etc.)
DELETE FROM public.financial_accounts;

-- 7. Clear user-created custom categories (keeps system categories like Salary, Food, Rent intact)
DELETE FROM public.transaction_categories WHERE is_system = FALSE;

COMMIT;

-- Verification query (all should return 0)
SELECT 
  (SELECT COUNT(*) FROM public.financial_accounts) AS accounts_count,
  (SELECT COUNT(*) FROM public.ledger_transactions) AS transactions_count,
  (SELECT COUNT(*) FROM public.loans) AS loans_count,
  (SELECT COUNT(*) FROM public.credit_cards) AS cards_count,
  (SELECT COUNT(*) FROM public.savings_schemes) AS savings_count,
  (SELECT COUNT(*) FROM public.notifications) AS notifications_count;
