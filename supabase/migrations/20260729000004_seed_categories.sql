-- =============================================================================
-- Safivra — Seed Default Categories
-- Migration: 004_seed_categories
-- =============================================================================
-- System categories (user_id = NULL) are available to all users.
-- is_system = TRUE prevents users from deleting categories used by transactions.

-- ─── Income Categories ───────────────────────────────────────────────────────
INSERT INTO transaction_categories (name, category_type, icon, is_system, sort_order) VALUES
  ('Salary',            'income', 'Banknote',      TRUE, 10),
  ('Freelance',         'income', 'Laptop',         TRUE, 20),
  ('Business Income',   'income', 'Briefcase',      TRUE, 30),
  ('Bonus',             'income', 'Award',          TRUE, 40),
  ('Commission',        'income', 'Percent',        TRUE, 50),
  ('Investment Return', 'income', 'TrendingUp',     TRUE, 60),
  ('Rental Income',     'income', 'Home',           TRUE, 70),
  ('Gift Received',     'income', 'Gift',           TRUE, 80),
  ('Refund',            'income', 'RotateCcw',      TRUE, 90),
  ('Other Income',      'income', 'CircleDollarSign', TRUE, 100);

-- ─── Expense Categories ──────────────────────────────────────────────────────
INSERT INTO transaction_categories (name, category_type, icon, is_system, sort_order) VALUES
  ('Food & Dining',            'expense', 'Utensils',       TRUE, 10),
  ('Groceries',                'expense', 'ShoppingCart',   TRUE, 20),
  ('Transport',                'expense', 'Car',            TRUE, 30),
  ('Rent',                     'expense', 'Home',           TRUE, 40),
  ('Utilities',                'expense', 'Zap',            TRUE, 50),
  ('Shopping',                 'expense', 'ShoppingBag',    TRUE, 60),
  ('Healthcare',               'expense', 'Heart',          TRUE, 70),
  ('Education',                'expense', 'BookOpen',       TRUE, 80),
  ('Entertainment',            'expense', 'Tv',             TRUE, 90),
  ('Subscription',             'expense', 'RefreshCw',      TRUE, 100),
  ('Family',                   'expense', 'Users',          TRUE, 110),
  ('Personal Care',            'expense', 'Scissors',       TRUE, 120),
  ('Travel',                   'expense', 'Plane',          TRUE, 130),
  ('Charity',                  'expense', 'HandHeart',      TRUE, 140),
  ('Bank Charge',              'expense', 'Landmark',       TRUE, 150),
  ('Mobile Wallet Fee',        'expense', 'Smartphone',     TRUE, 160),
  ('Loan Interest',            'expense', 'Percent',        TRUE, 170),
  ('Credit Card Fee',          'expense', 'CreditCard',     TRUE, 180),
  ('Other Expense',            'expense', 'MoreHorizontal', TRUE, 190);

-- ─── System Categories (internal use) ────────────────────────────────────────
INSERT INTO transaction_categories (name, category_type, icon, is_system, sort_order) VALUES
  ('Opening Balance Equity', 'system', 'Database',    TRUE, 1),
  ('Transfer Fee',           'system', 'ArrowRightLeft', TRUE, 2),
  ('Balance Adjustment',     'system', 'SlidersHorizontal', TRUE, 3);
