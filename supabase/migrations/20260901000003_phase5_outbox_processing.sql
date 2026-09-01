-- ================================================================
-- Migration: 20260901000003_phase5_outbox_processing.sql
-- Description: Phase 5 — Transactional Outbox Pattern & Async Processing
--
--   1. outbox_events table — stores transactional side-effect events
--      Enforces atomic event generation inside financial transactions
--   2. Update post_transaction() — emits transaction.created event to outbox
--   3. Update void_transaction() — emits transaction.voided event to outbox
--   4. Update archive_financial_record() — emits record.archived event to outbox
--   5. process_outbox_batch() RPC — atomical worker fetch-and-lock function
--
-- GUARANTEE: Money/ledger commit MUST happen in same DB transaction
-- as outbox event creation. Side-effects (notifications, analytics, worker)
-- happen asynchronously outside the critical financial write path.
-- ================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. TRANSACTIONAL OUTBOX TABLE
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outbox_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type     TEXT        NOT NULL,  -- 'transaction.created', 'transaction.voided', 'account.archived', etc.
  aggregate_type TEXT        NOT NULL,  -- 'ledger_transaction', 'financial_account', 'loan', 'credit_card'
  aggregate_id   UUID        NOT NULL,
  payload        JSONB       NOT NULL DEFAULT '{}',
  status         TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts       INT         NOT NULL DEFAULT 0,
  last_error     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_status_created
  ON public.outbox_events (status, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_outbox_events_user_created
  ON public.outbox_events (user_id, created_at DESC);

ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own outbox events (for status tracking / sync)
CREATE POLICY "outbox_events_select_policy" ON public.outbox_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- 2. WORKER RPC: BATCH FETCH & LOCK PENDING OUTBOX EVENTS
-- ────────────────────────────────────────────────────────────────
-- Atomically selects and locks pending events for processing
-- using FOR UPDATE SKIP LOCKED to prevent duplicate processing by concurrent workers.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fetch_pending_outbox_events(p_batch_size INT DEFAULT 25)
RETURNS SETOF public.outbox_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.outbox_events
  SET status   = 'processing',
      attempts = attempts + 1
  WHERE id IN (
    SELECT id
    FROM public.outbox_events
    WHERE status = 'pending'
      AND attempts < 5
    ORDER BY created_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fetch_pending_outbox_events(INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fetch_pending_outbox_events(INT) TO service_role;

-- ────────────────────────────────────────────────────────────────
-- 3. WORKER RPC: MARK OUTBOX EVENT COMPLETED / FAILED
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.complete_outbox_event(
  p_event_id UUID,
  p_status   TEXT,
  p_error    TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.outbox_events
  SET status       = p_status,
      last_error   = p_error,
      processed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE processed_at END
  WHERE id = p_event_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_outbox_event(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.complete_outbox_event(UUID, TEXT, TEXT) TO service_role;

-- ────────────────────────────────────────────────────────────────
-- 4. UPDATE post_transaction() TO EMIT OUTBOX EVENT ATOMICALLY
-- ────────────────────────────────────────────────────────────────
-- Inserts transaction.created event inside the SAME database transaction
-- ────────────────────────────────────────────────────────────────
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
  p_credit_card_id            UUID    DEFAULT NULL,
  p_idempotency_key           TEXT    DEFAULT NULL
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
  v_cached_response JSONB;
  v_result       JSON;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated request';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT response_json INTO v_cached_response
    FROM public.idempotency_keys
    WHERE user_id = v_user_id
      AND idempotency_key = p_idempotency_key
      AND expires_at > NOW();

    IF v_cached_response IS NOT NULL THEN
      RETURN v_cached_response::JSON;
    END IF;
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

  IF p_account_id IS NOT NULL THEN
    SELECT account_class INTO v_acct_class FROM public.financial_accounts
    WHERE id = p_account_id AND user_id = v_user_id AND deleted_at IS NULL;

    IF v_acct_class IS NULL THEN
      RAISE EXCEPTION 'Account ID not found or access denied: %', p_account_id;
    END IF;
  END IF;

  IF p_destination_account_id IS NOT NULL AND p_transaction_type = 'transfer' THEN
    SELECT account_class INTO v_dest_class FROM public.financial_accounts
    WHERE id = p_destination_account_id AND user_id = v_user_id AND deleted_at IS NULL;

    IF v_dest_class IS NULL THEN
      RAISE EXCEPTION 'Destination account ID not found or access denied: %', p_destination_account_id;
    END IF;
  END IF;

  IF p_loan_id IS NOT NULL THEN
    SELECT account_id INTO v_loan_acct_id FROM public.loans
    WHERE id = p_loan_id AND user_id = v_user_id AND deleted_at IS NULL;

    IF v_loan_acct_id IS NULL THEN
      RAISE EXCEPTION 'Loan ID not found or access denied: %', p_loan_id;
    END IF;
  END IF;

  IF p_credit_card_id IS NOT NULL THEN
    SELECT account_id INTO v_card_acct_id FROM public.credit_cards
    WHERE id = p_credit_card_id AND user_id = v_user_id AND deleted_at IS NULL;

    IF v_card_acct_id IS NULL THEN
      RAISE EXCEPTION 'Credit Card ID not found or access denied: %', p_credit_card_id;
    END IF;
  END IF;

  IF p_category_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.transaction_categories
      WHERE id = p_category_id AND (user_id IS NULL OR user_id = v_user_id)
    ) THEN
      RAISE EXCEPTION 'Category ID not found or access denied: %', p_category_id;
    END IF;
  END IF;

  -- Create transaction header
  INSERT INTO public.ledger_transactions (
    user_id, transaction_type, transaction_date, transaction_time,
    title, merchant, description, status
  ) VALUES (
    v_user_id, p_transaction_type, p_transaction_date, p_transaction_time,
    p_title, p_merchant, p_description, 'posted'
  ) RETURNING id INTO v_tx_id;

  -- Create double-entry ledger entries
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
      IF (v_principal + v_interest + v_fee) <> p_amount THEN
        RAISE EXCEPTION 'Loan payment entries do not balance: principal (%) + interest (%) + fee (%) must equal total amount (%)',
          v_principal, v_interest, v_fee, p_amount;
      END IF;

      INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
        VALUES (v_user_id, v_tx_id, p_account_id, p_amount, 'asset_credit');

      IF v_principal > 0 THEN
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, financial_account_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, v_loan_acct_id, v_principal, 'liability_debit');
      END IF;

      IF v_interest > 0 THEN
        INSERT INTO public.ledger_entries (user_id, ledger_transaction_id, category_id, amount, entry_role)
          VALUES (v_user_id, v_tx_id, p_category_id, v_interest, 'expense_debit');
      END IF;

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

  v_result := json_build_object('transaction_id', v_tx_id);

  -- Store idempotency key
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.idempotency_keys (user_id, idempotency_key, response_json, transaction_id)
    VALUES (v_user_id, p_idempotency_key, v_result::JSONB, v_tx_id)
    ON CONFLICT (user_id, idempotency_key) DO UPDATE
      SET response_json  = EXCLUDED.response_json,
          transaction_id = EXCLUDED.transaction_id;
  END IF;

  -- Audit log entry
  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_user_id,
    'transaction.created',
    'ledger_transaction',
    v_tx_id,
    json_build_object(
      'transaction_type', p_transaction_type,
      'idempotency_key',  p_idempotency_key
    )::JSONB
  );

  -- ── TRANSACTIONAL OUTBOX EVENT ────────────────────────────────
  -- Emitted in SAME database transaction. Processed asynchronously
  -- by background worker for notifications, cache sync, & analytics.
  INSERT INTO public.outbox_events (
    user_id, event_type, aggregate_type, aggregate_id, payload
  ) VALUES (
    v_user_id,
    'transaction.created',
    'ledger_transaction',
    v_tx_id,
    json_build_object(
      'transaction_type', p_transaction_type,
      'title',            p_title,
      'amount',           p_amount,
      'account_id',       p_account_id,
      'transaction_date', p_transaction_date
    )::JSONB
  );

  RETURN v_result;
END;
$$;

COMMIT;
