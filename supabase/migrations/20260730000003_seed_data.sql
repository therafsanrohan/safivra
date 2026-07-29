-- ================================================================
-- Migration: 20260730000003_seed_data.sql
-- Description: Seed system categories and enforce role-based function execution privileges
-- ================================================================

-- 1. Create unique index to prevent duplicate system categories
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_system_category
  ON public.transaction_categories (name, category_type)
  WHERE user_id IS NULL;

-- 2. Seed system transaction categories (idempotent ON CONFLICT)
INSERT INTO public.transaction_categories (user_id, name, category_type, icon, color, is_system, is_active, sort_order)
VALUES
  -- Income
  (NULL, 'Salary',             'income',  '💼', '#22c55e', TRUE, TRUE,  1),
  (NULL, 'Freelance',           'income',  '💻', '#10b981', TRUE, TRUE,  2),
  (NULL, 'Business Income',     'income',  '🏪', '#059669', TRUE, TRUE,  3),
  (NULL, 'Investment Returns',  'income',  '📈', '#16a34a', TRUE, TRUE,  4),
  (NULL, 'Rental Income',       'income',  '🏠', '#15803d', TRUE, TRUE,  5),
  (NULL, 'Gift Received',       'income',  '🎁', '#84cc16', TRUE, TRUE,  6),
  (NULL, 'Bonus',               'income',  '🎉', '#65a30d', TRUE, TRUE,  7),
  (NULL, 'Other Income',        'income',  '💰', '#4ade80', TRUE, TRUE,  8),
  
  -- Expense
  (NULL, 'Food & Dining',       'expense', '🍽️', '#ef4444', TRUE, TRUE, 10),
  (NULL, 'Groceries',           'expense', '🛒', '#f97316', TRUE, TRUE, 11),
  (NULL, 'Transport',           'expense', '🚌', '#f59e0b', TRUE, TRUE, 12),
  (NULL, 'Fuel',                'expense', '⛽', '#eab308', TRUE, TRUE, 13),
  (NULL, 'Utilities',           'expense', '💡', '#84cc16', TRUE, TRUE, 14),
  (NULL, 'Internet & Phone',    'expense', '📱', '#06b6d4', TRUE, TRUE, 15),
  (NULL, 'Rent',                'expense', '🏠', '#8b5cf6', TRUE, TRUE, 16),
  (NULL, 'Healthcare',          'expense', '🏥', '#ec4899', TRUE, TRUE, 17),
  (NULL, 'Education',           'expense', '📚', '#6366f1', TRUE, TRUE, 18),
  (NULL, 'Shopping',            'expense', '🛍️', '#f43f5e', TRUE, TRUE, 19),
  (NULL, 'Entertainment',       'expense', '🎬', '#a855f7', TRUE, TRUE, 20),
  (NULL, 'Personal Care',       'expense', '💄', '#ec4899', TRUE, TRUE, 21),
  (NULL, 'Clothing',            'expense', '👕', '#14b8a6', TRUE, TRUE, 22),
  (NULL, 'Travel',              'expense', '✈️', '#0ea5e9', TRUE, TRUE, 23),
  (NULL, 'Insurance',           'expense', '🛡️', '#64748b', TRUE, TRUE, 24),
  (NULL, 'Subscriptions',       'expense', '📺', '#7c3aed', TRUE, TRUE, 25),
  (NULL, 'Charity & Donations', 'expense', '❤️', '#f43f5e', TRUE, TRUE, 26),
  (NULL, 'Bank Charges',        'expense', '🏦', '#475569', TRUE, TRUE, 27),
  (NULL, 'Tax',                 'expense', '📋', '#334155', TRUE, TRUE, 28),
  (NULL, 'EMI',                 'expense', '💳', '#9333ea', TRUE, TRUE, 29),
  (NULL, 'Other Expense',       'expense', '💸', '#94a3b8', TRUE, TRUE, 30),
  
  -- System
  (NULL, 'Opening Balance',     'system',  '🏁', '#64748b', TRUE, TRUE, 100),
  (NULL, 'Transfer',            'system',  '↔️', '#64748b', TRUE, TRUE, 101),
  (NULL, 'Loan Interest',       'system',  '📊', '#64748b', TRUE, TRUE, 102),
  (NULL, 'Loan Fee',            'system',  '📑', '#64748b', TRUE, TRUE, 103)
ON CONFLICT (name, category_type) WHERE user_id IS NULL DO NOTHING;

-- 3. Manage execution privileges (least privilege execution access)
REVOKE EXECUTE ON FUNCTION public.post_transaction(
  transaction_type, DATE, TEXT, NUMERIC, UUID, UUID, UUID, TEXT, TEXT, TIME, NUMERIC, NUMERIC, NUMERIC, UUID, UUID
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.post_transaction(
  transaction_type, DATE, TEXT, NUMERIC, UUID, UUID, UUID, TEXT, TEXT, TIME, NUMERIC, NUMERIC, NUMERIC, UUID, UUID
) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_monthly_summary(INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_monthly_summary(INT, INT) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
-- trigger functions need to be executable by postgres/service_role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
