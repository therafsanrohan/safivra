-- ================================================================
-- Migration: 20260730000002_functions_and_views.sql
-- Description: Create security_invoker views, new user trigger, and double-entry transaction engine
-- ================================================================

-- 1. VIEW: v_account_balances (with security_invoker = true)
DROP VIEW IF EXISTS public.v_account_balances CASCADE;

CREATE OR REPLACE VIEW public.v_account_balances
WITH (security_invoker = true) AS
SELECT
  fa.id              AS account_id,
  fa.user_id,
  fa.name,
  fa.account_type,
  fa.account_class,
  fa.institution,
  fa.currency_code,
  fa.credit_limit::TEXT,
  fa.include_in_total,
  fa.include_in_net_worth,
  fa.is_active,
  fa.is_archived,
  CASE fa.account_class
    WHEN 'asset' THEN (
      fa.opening_balance + COALESCE((
        SELECT SUM(CASE
          WHEN le.entry_role IN ('asset_debit', 'transfer_in')  THEN  le.amount
          WHEN le.entry_role IN ('asset_credit','transfer_out','fee_expense') THEN -le.amount
          ELSE 0
        END)
        FROM public.ledger_entries le
        WHERE le.financial_account_id = fa.id
      ), 0)
    )
    WHEN 'liability' THEN (
      fa.opening_balance + COALESCE((
        SELECT SUM(CASE
          WHEN le.entry_role = 'liability_credit'  THEN  le.amount
          WHEN le.entry_role = 'liability_debit'   THEN -le.amount
          ELSE 0
        END)
        FROM public.ledger_entries le
        WHERE le.financial_account_id = fa.id
      ), 0)
    )
    ELSE fa.opening_balance
  END::TEXT AS balance
FROM public.financial_accounts fa;

-- 2. TRIGGER FUNCTION: handle_new_user (SECURITY DEFINER with safe search_path)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, preferred_currency, timezone, onboarding_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_currency', 'BDT'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Asia/Dhaka'),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (
    user_id, language, preferred_currency, timezone, theme, balance_privacy, start_of_week, notification_upcoming_days
  )
  VALUES (
    NEW.id,
    'en',
    COALESCE(NEW.raw_user_meta_data->>'preferred_currency', 'BDT'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Asia/Dhaka'),
    'light',
    FALSE,
    0,
    3
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. FUNCTION: post_transaction (SECURITY DEFINER with safe search_path)
CREATE OR REPLACE FUNCTION public.post_transaction(
  p_transaction_type          transaction_type,
  p_transaction_date          DATE,
  p_title                     TEXT,
  p_amount                    NUMERIC,
  p_account_id                UUID,
  p_category_id               UUID    DEFAULT NULL,
  p_destination_account_id    UUID    DEFAULT NULL,
  p_merchant                  TEXT    DEFAULT NULL,
  p_description               TEXT    DEFAULT NULL,
  p_transaction_time          TIME    DEFAULT NULL,
  p_principal_amount          NUMERIC DEFAULT NULL,
  p_interest_amount           NUMERIC DEFAULT NULL,
  p_fee_amount                NUMERIC DEFAULT NULL,
  p_loan_id                   UUID    DEFAULT NULL,
  p_credit_card_id            UUID    DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      UUID := auth.uid();
  v_tx_id        UUID;
  v_principal    NUMERIC := COALESCE(p_principal_amount, p_amount);
  v_interest     NUMERIC := COALESCE(p_interest_amount, 0);
  v_fee          NUMERIC := COALESCE(p_fee_amount, 0);
  v_acct_class   account_class;
  v_dest_class   account_class;
  v_loan_acct_id UUID;
  v_card_acct_id UUID;
BEGIN
  -- 1. Validation checks
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated request';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transaction amount must be strictly positive, received: %', p_amount;
  END IF;

  IF p_principal_amount IS NOT NULL AND p_principal_amount < 0 THEN
    RAISE EXCEPTION 'Principal amount cannot be negative';
  END IF;

  IF p_interest_amount IS NOT NULL AND p_interest_amount < 0 THEN
    RAISE EXCEPTION 'Interest amount cannot be negative';
  END IF;

  IF p_fee_amount IS NOT NULL AND p_fee_amount < 0 THEN
    RAISE EXCEPTION 'Fee amount cannot be negative';
  END IF;

  -- 2. Validate user ownership of resources
  IF p_account_id IS NOT NULL THEN
    SELECT account_class INTO v_acct_class FROM public.financial_accounts
    WHERE id = p_account_id AND user_id = v_user_id;
    
    IF v_acct_class IS NULL THEN
      RAISE EXCEPTION 'Account ID not found or access denied: %', p_account_id;
    END IF;
  END IF;

  IF p_destination_account_id IS NOT NULL AND p_transaction_type = 'transfer' THEN
    SELECT account_class INTO v_dest_class FROM public.financial_accounts
    WHERE id = p_destination_account_id AND user_id = v_user_id;

    IF v_dest_class IS NULL THEN
      RAISE EXCEPTION 'Destination account ID not found or access denied: %', p_destination_account_id;
    END IF;
  END IF;

  IF p_loan_id IS NOT NULL THEN
    SELECT account_id INTO v_loan_acct_id FROM public.loans
    WHERE id = p_loan_id AND user_id = v_user_id;

    IF v_loan_acct_id IS NULL THEN
      RAISE EXCEPTION 'Loan ID not found or access denied: %', p_loan_id;
    END IF;
  END IF;

  IF p_credit_card_id IS NOT NULL THEN
    SELECT account_id INTO v_card_acct_id FROM public.credit_cards
    WHERE id = p_credit_card_id AND user_id = v_user_id;

    IF v_card_acct_id IS NULL THEN
      RAISE EXCEPTION 'Credit Card ID not found or access denied: %', p_credit_card_id;
    END IF;
  END IF;

  IF p_category_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.transaction_categories WHERE id = p_category_id AND (user_id IS NULL OR user_id = v_user_id)) THEN
      RAISE EXCEPTION 'Category ID not found or access denied: %', p_category_id;
    END IF;
  END IF;

  -- 3. Create ledger transaction header
  INSERT INTO public.ledger_transactions (
    user_id, transaction_type, transaction_date, transaction_time,
    title, merchant, description, status
  ) VALUES (
    v_user_id, p_transaction_type, p_transaction_date, p_transaction_time,
    p_title, p_merchant, p_description, 'posted'
  ) RETURNING id INTO v_tx_id;

  -- 4. Create ledger entries using correct double-entry logic
  CASE p_transaction_type

    WHEN 'income' THEN
      IF v_acct_class = 'asset' THEN
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_debit');
      ELSE
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'liability_debit');
      END IF;

      INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, category_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_category_id, p_amount, 'income_credit');

    WHEN 'expense' THEN
      IF v_acct_class = 'asset' THEN
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_credit');
      ELSE
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'liability_credit');
      END IF;

      INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, category_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_category_id, p_amount, 'expense_debit');

    WHEN 'transfer' THEN
      INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'transfer_out'),
               (v_user_id, v_tx_id, p_destination_account_id, p_amount, 'transfer_in');
      
      IF v_fee > 0 THEN
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_account_id, v_fee, 'asset_credit'),
                 (v_user_id, v_tx_id, NULL, v_fee, 'fee_expense');
      END IF;

    WHEN 'loan_received' THEN
      INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_debit'),
               (v_user_id, v_tx_id, v_loan_acct_id, p_amount, 'liability_credit');

    WHEN 'loan_payment' THEN
      -- Validate principal + interest + fee matches total amount
      IF (v_principal + v_interest + v_fee) <> p_amount THEN
        RAISE EXCEPTION 'Loan payment entries do not balance: principal (%) + interest (%) + fee (%) must equal total amount (%)',
          v_principal, v_interest, v_fee, p_amount;
      END IF;

      -- Cash payment credit
      INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_credit');

      -- Liability decrease debit
      IF v_principal > 0 THEN
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, v_loan_acct_id, v_principal, 'liability_debit');
      END IF;

      -- Interest expense debit
      IF v_interest > 0 THEN
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, category_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_category_id, v_interest, 'expense_debit');
      END IF;

      -- Fee expense debit
      IF v_fee > 0 THEN
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, v_fee, 'fee_expense');
      END IF;

    WHEN 'credit_card_purchase' THEN
      INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, category_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_category_id, p_amount, 'expense_debit');
      
      INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'liability_credit');

    WHEN 'credit_card_payment' THEN
      INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_credit'),
               (v_user_id, v_tx_id, v_card_acct_id, p_amount, 'liability_debit');

    WHEN 'refund' THEN
      INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_debit');

      INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, category_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_category_id, p_amount, 'income_credit');

    WHEN 'fee' THEN
      INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_credit'),
               (v_user_id, v_tx_id, NULL, p_amount, 'fee_expense');

    WHEN 'opening_balance' THEN
      IF v_acct_class = 'asset' THEN
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_debit');
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_amount, 'equity_credit');
      ELSE
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'liability_credit');
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_amount, 'expense_debit');
      END IF;

    WHEN 'balance_adjustment' THEN
      IF v_acct_class = 'asset' THEN
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_debit');
      ELSE
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'liability_debit');
      END IF;
      
      INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_amount, 'equity_credit');

    ELSE
      RAISE EXCEPTION 'Unsupported transaction type: %', p_transaction_type;
  END CASE;

  RETURN json_build_object('transaction_id', v_tx_id);
END;
$$;

-- 4. FUNCTION: get_monthly_summary (SECURITY DEFINER with safe search_path)
CREATE OR REPLACE FUNCTION public.get_monthly_summary(p_year INT, p_month INT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_income  NUMERIC;
  v_expense NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated request';
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN le.entry_role = 'income_credit' THEN le.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN le.entry_role IN ('expense_debit','fee_expense') THEN le.amount ELSE 0 END), 0)
  INTO v_income, v_expense
  FROM public.ledger_entries le
  JOIN public.ledger_transactions lt ON lt.id = le.ledger_transaction_id
  WHERE le.user_id = v_user_id
    AND lt.status = 'posted'
    AND EXTRACT(YEAR  FROM lt.transaction_date) = p_year
    AND EXTRACT(MONTH FROM lt.transaction_date) = p_month;

  RETURN json_build_object(
    'income',  v_income,
    'expense', v_expense,
    'net',     v_income - v_expense
  );
END;
$$;
