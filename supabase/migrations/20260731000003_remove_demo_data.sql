-- ================================================================
-- Migration: 20260731000003_remove_demo_data.sql
-- Description: Safely removes confirmed demo/mock data by name
-- without touching real user transactions or accounts.
-- ================================================================

BEGIN;

-- 1. Remove recurring templates matching demo names
DELETE FROM public.recurring_templates 
WHERE name IN (
  'House Rent (Gulshan)', 
  'বাড়ি ভাড়া (গুলশান)',
  'Fiber Internet 100Mbps (DotInternet)',
  'ফাইবার ইন্টারনেট ১০০ এমবিপিএস (ডটইন্টারনেট)',
  'Monthly Salary Credit',
  'মাসিক বেতন ক্রেডিট'
);

-- 2. Remove any credit cards explicitly named 'Prime Visa Gold'
DELETE FROM public.credit_cards 
WHERE nickname = 'Prime Visa Gold';

-- 3. Remove any loans explicitly named 'DBBL Home Loan'
DELETE FROM public.loans
WHERE name = 'DBBL Home Loan';

-- 4. Remove any financial accounts with these demo names
DELETE FROM public.financial_accounts
WHERE name IN (
  'Prime Visa Gold', 
  'DBBL Home Loan'
);

COMMIT;
