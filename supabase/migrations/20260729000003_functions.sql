-- =============================================================================
-- Safivra — Database Functions and Triggers
-- Migration: 003_functions
-- =============================================================================

-- ─── Auto-create Profile on Sign-Up ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, preferred_currency, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'BDT',
    'Asia/Dhaka'
  );

  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Account Balance View ─────────────────────────────────────────────────────

-- Current balance is derived from ledger entries — the ledger is the source of truth.
-- For assets: sum of debit entries minus sum of credit entries
-- For liabilities: sum of credit entries (outstanding) minus principal repaid
CREATE OR REPLACE VIEW v_account_balances AS
SELECT
  fa.id AS account_id,
  fa.user_id,
  fa.name,
  fa.account_type,
  fa.account_class,
  fa.institution,
  fa.currency_code,
  fa.credit_limit,
  fa.include_in_total,
  fa.include_in_net_worth,
  fa.is_active,
  fa.is_archived,
  COALESCE(
    SUM(le.amount) FILTER (WHERE lt.status = 'posted'),
    fa.opening_balance
  ) AS balance
FROM financial_accounts fa
LEFT JOIN ledger_entries le ON le.financial_account_id = fa.id
LEFT JOIN ledger_transactions lt ON lt.id = le.ledger_transaction_id
GROUP BY
  fa.id, fa.user_id, fa.name, fa.account_type, fa.account_class,
  fa.institution, fa.currency_code, fa.credit_limit,
  fa.include_in_total, fa.include_in_net_worth,
  fa.is_active, fa.is_archived, fa.opening_balance;

-- Grant access to authenticated users (RLS handles row filtering)
GRANT SELECT ON v_account_balances TO authenticated;

-- ─── Post Transaction Function ───────────────────────────────────────────────
-- Atomic ledger posting that enforces double-entry rules.
-- Browser clients call this via RPC — they CANNOT directly insert ledger entries.

CREATE OR REPLACE FUNCTION post_transaction(
  p_transaction_type    transaction_type,
  p_transaction_date    DATE,
  p_title               TEXT,
  p_amount              NUMERIC(18, 2),
  p_account_id          UUID,
  p_category_id         UUID DEFAULT NULL,
  p_destination_account_id UUID DEFAULT NULL,
  p_merchant            TEXT DEFAULT NULL,
  p_description         TEXT DEFAULT NULL,
  p_transaction_time    TIME DEFAULT NULL,
  p_principal_amount    NUMERIC(18, 2) DEFAULT NULL,
  p_interest_amount     NUMERIC(18, 2) DEFAULT NULL,
  p_fee_amount          NUMERIC(18, 2) DEFAULT NULL,
  p_loan_id             UUID DEFAULT NULL,
  p_credit_card_id      UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID;
  v_tx_id      UUID;
  v_balance    NUMERIC(18, 2) := 0;
  v_principal  NUMERIC(18, 2);
  v_interest   NUMERIC(18, 2);
  v_fee        NUMERIC(18, 2);
BEGIN
  -- Step 1: Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Step 2: Verify account ownership
  IF NOT EXISTS (
    SELECT 1 FROM financial_accounts
    WHERE id = p_account_id AND user_id = v_user_id AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'ACCOUNT_OWNERSHIP: Account not found or access denied';
  END IF;

  -- Step 3: Validate destination account ownership (for transfers)
  IF p_destination_account_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM financial_accounts
      WHERE id = p_destination_account_id AND user_id = v_user_id AND is_active = TRUE
    ) THEN
      RAISE EXCEPTION 'ACCOUNT_OWNERSHIP: Destination account not found or access denied';
    END IF;
    IF p_destination_account_id = p_account_id THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Source and destination must be different accounts';
    END IF;
  END IF;

  -- Step 4: Create transaction header
  INSERT INTO ledger_transactions (
    user_id, transaction_type, transaction_date, transaction_time,
    title, merchant, description, status
  ) VALUES (
    v_user_id, p_transaction_type, p_transaction_date, p_transaction_time,
    p_title, p_merchant, p_description, 'posted'
  ) RETURNING id INTO v_tx_id;

  -- Step 5: Create ledger entries per posting rule
  IF p_transaction_type = 'income' THEN
    -- Asset account: +amount (debit)
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_debit');
    -- Income category: -amount (credit)
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, category_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_category_id, -p_amount, 'income_credit');
    v_balance := p_amount + (-p_amount);

  ELSIF p_transaction_type = 'expense' THEN
    -- Expense category: +amount (debit)
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, category_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_category_id, p_amount, 'expense_debit');
    -- Asset account: -amount (credit)
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_account_id, -p_amount, 'asset_credit');
    v_balance := p_amount + (-p_amount);

  ELSIF p_transaction_type = 'transfer' THEN
    v_fee := COALESCE(p_fee_amount, 0);
    -- Destination account: +amount (debit / transfer in)
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_destination_account_id, p_amount, 'transfer_in');
    -- Fee as expense (if any)
    IF v_fee > 0 THEN
      INSERT INTO ledger_entries (user_id, ledger_transaction_id, category_id, amount, entry_role)
      VALUES (v_user_id, v_tx_id, p_category_id, v_fee, 'fee_expense');
    END IF;
    -- Source account: -(amount + fee) (credit / transfer out)
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_account_id, -(p_amount + v_fee), 'transfer_out');
    v_balance := p_amount + v_fee + (-(p_amount + v_fee));

  ELSIF p_transaction_type = 'loan_received' THEN
    -- Asset account: +amount (loan proceeds in)
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_debit');
    -- Loan liability: -amount (liability increases)
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_destination_account_id, -p_amount, 'liability_credit');
    v_balance := p_amount + (-p_amount);

  ELSIF p_transaction_type = 'loan_payment' THEN
    v_principal := COALESCE(p_principal_amount, 0);
    v_interest  := COALESCE(p_interest_amount, 0);
    v_fee       := COALESCE(p_fee_amount, 0);
    -- Loan liability: +principal (reduces outstanding)
    IF v_principal > 0 THEN
      INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
      VALUES (v_user_id, v_tx_id, p_destination_account_id, v_principal, 'liability_debit');
    END IF;
    -- Interest expense: +interest
    IF v_interest > 0 THEN
      INSERT INTO ledger_entries (user_id, ledger_transaction_id, category_id, amount, entry_role)
      VALUES (v_user_id, v_tx_id, p_category_id, v_interest, 'expense_debit');
    END IF;
    -- Fee expense: +fee
    IF v_fee > 0 THEN
      INSERT INTO ledger_entries (user_id, ledger_transaction_id, category_id, amount, entry_role)
      VALUES (v_user_id, v_tx_id, p_category_id, v_fee, 'fee_expense');
    END IF;
    -- Payment account: -(principal + interest + fee)
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_account_id, -(v_principal + v_interest + v_fee), 'asset_credit');
    v_balance := v_principal + v_interest + v_fee + (-(v_principal + v_interest + v_fee));

  ELSIF p_transaction_type = 'credit_card_purchase' THEN
    -- Expense category: +amount
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, category_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_category_id, p_amount, 'expense_debit');
    -- Credit card liability: -amount (balance increases)
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_destination_account_id, -p_amount, 'liability_credit');
    v_balance := p_amount + (-p_amount);

  ELSIF p_transaction_type = 'credit_card_payment' THEN
    -- Credit card liability: +amount (balance decreases)
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_destination_account_id, p_amount, 'liability_debit');
    -- Bank/wallet asset: -amount
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_account_id, -p_amount, 'asset_credit');
    v_balance := p_amount + (-p_amount);

  ELSIF p_transaction_type = 'refund' THEN
    -- Asset account: +amount (refund received)
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_debit');
    -- Expense category: -amount (reverses the expense)
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, category_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_category_id, -p_amount, 'expense_debit');
    v_balance := p_amount + (-p_amount);

  ELSIF p_transaction_type = 'opening_balance' THEN
    -- Asset account: +amount
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_debit');
    -- Opening equity: -amount (not income)
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_account_id, -p_amount, 'equity_credit');
    v_balance := p_amount + (-p_amount);

  ELSIF p_transaction_type = 'balance_adjustment' THEN
    -- Signed adjustment amount can be positive or negative
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_account_id, p_amount, CASE WHEN p_amount >= 0 THEN 'asset_debit' ELSE 'asset_credit' END);
    INSERT INTO ledger_entries (user_id, ledger_transaction_id, category_id, amount, entry_role)
    VALUES (v_user_id, v_tx_id, p_category_id, -p_amount, 'equity_credit');
    v_balance := p_amount + (-p_amount);

  ELSE
    RAISE EXCEPTION 'VALIDATION_ERROR: Unknown transaction type: %', p_transaction_type;
  END IF;

  -- Step 6: Verify entries balance to zero (tolerance for rounding)
  SELECT COALESCE(SUM(amount), 0)
  INTO v_balance
  FROM ledger_entries
  WHERE ledger_transaction_id = v_tx_id;

  IF ABS(v_balance) > 0.001 THEN
    RAISE EXCEPTION 'LEDGER_UNBALANCED: Transaction entries do not balance. Sum = %', v_balance;
  END IF;

  -- Step 7: Record loan payment details if applicable
  IF p_transaction_type = 'loan_payment' AND p_loan_id IS NOT NULL THEN
    INSERT INTO loan_payments (
      user_id, loan_id, ledger_transaction_id, payment_date,
      total_amount, principal_amount, interest_amount, fee_amount,
      payment_account_id
    ) VALUES (
      v_user_id, p_loan_id, v_tx_id, p_transaction_date,
      p_amount, COALESCE(p_principal_amount, 0), COALESCE(p_interest_amount, 0), COALESCE(p_fee_amount, 0),
      p_account_id
    );
  END IF;

  -- Step 8: Record credit card payment details if applicable
  IF p_transaction_type = 'credit_card_payment' AND p_credit_card_id IS NOT NULL THEN
    INSERT INTO credit_card_payments (
      user_id, credit_card_id, ledger_transaction_id, payment_date,
      amount, payment_account_id
    ) VALUES (
      v_user_id, p_credit_card_id, v_tx_id, p_transaction_date,
      p_amount, p_account_id
    );
  END IF;

  RETURN json_build_object('transaction_id', v_tx_id);

EXCEPTION
  WHEN OTHERS THEN
    RAISE; -- Rollback entire transaction on any error
END;
$$;

GRANT EXECUTE ON FUNCTION post_transaction TO authenticated;

-- ─── Monthly Summary Function ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_monthly_summary(p_year INT, p_month INT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_start   DATE;
  v_end     DATE;
  v_income  NUMERIC(18, 2);
  v_expense NUMERIC(18, 2);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_start := make_date(p_year, p_month, 1);
  v_end   := (v_start + INTERVAL '1 month - 1 day')::DATE;

  -- Income: sum of income_credit entries (negate because credits are stored negative)
  SELECT ABS(COALESCE(SUM(le.amount), 0))
  INTO v_income
  FROM ledger_entries le
  JOIN ledger_transactions lt ON lt.id = le.ledger_transaction_id
  WHERE le.user_id = v_user_id
    AND le.entry_role = 'income_credit'
    AND lt.transaction_date BETWEEN v_start AND v_end
    AND lt.status = 'posted';

  -- Expense: sum of expense_debit and fee_expense entries
  SELECT COALESCE(SUM(le.amount), 0)
  INTO v_expense
  FROM ledger_entries le
  JOIN ledger_transactions lt ON lt.id = le.ledger_transaction_id
  WHERE le.user_id = v_user_id
    AND le.entry_role IN ('expense_debit', 'fee_expense')
    AND lt.transaction_date BETWEEN v_start AND v_end
    AND lt.status = 'posted';

  RETURN json_build_object(
    'income', v_income,
    'expense', v_expense,
    'net', v_income - v_expense
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_monthly_summary TO authenticated;

-- ─── Void Transaction Function ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION void_transaction(
  p_transaction_id UUID,
  p_void_reason    TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE ledger_transactions
  SET
    status      = 'voided',
    voided_at   = NOW(),
    void_reason = p_void_reason,
    updated_at  = NOW()
  WHERE id = p_transaction_id
    AND user_id = v_user_id
    AND status = 'posted';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or already voided';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION void_transaction TO authenticated;
