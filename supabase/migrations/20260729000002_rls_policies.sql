-- =============================================================================
-- Safivra — Row Level Security Policies
-- Migration: 002_rls_policies
-- =============================================================================

-- Enable RLS on all user-owned tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tag_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- ─── Profiles ────────────────────────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─── User Preferences ────────────────────────────────────────────────────────
CREATE POLICY "prefs_select_own" ON user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "prefs_insert_own" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "prefs_update_own" ON user_preferences
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── Financial Accounts ──────────────────────────────────────────────────────
CREATE POLICY "accounts_select_own" ON financial_accounts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "accounts_insert_own" ON financial_accounts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "accounts_update_own" ON financial_accounts
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No hard delete: archive instead
CREATE POLICY "accounts_delete_own" ON financial_accounts
  FOR DELETE USING (user_id = auth.uid() AND is_archived = TRUE);

-- ─── Transaction Categories ───────────────────────────────────────────────────
-- Users can see system categories (user_id IS NULL) and their own custom ones
CREATE POLICY "categories_select" ON transaction_categories
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "categories_insert_own" ON transaction_categories
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_system = FALSE);

CREATE POLICY "categories_update_own" ON transaction_categories
  FOR UPDATE USING (user_id = auth.uid() AND is_system = FALSE)
  WITH CHECK (user_id = auth.uid());

-- ─── Ledger Transactions ─────────────────────────────────────────────────────
CREATE POLICY "ledger_tx_select_own" ON ledger_transactions
  FOR SELECT USING (user_id = auth.uid());

-- Direct INSERT is blocked — use post_transaction() function instead
-- The function runs as SECURITY DEFINER and validates ownership
CREATE POLICY "ledger_tx_insert_own" ON ledger_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "ledger_tx_update_own" ON ledger_transactions
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── Ledger Entries ───────────────────────────────────────────────────────────
CREATE POLICY "ledger_entries_select_own" ON ledger_entries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "ledger_entries_insert_own" ON ledger_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Entries are immutable once posted — no UPDATE or DELETE
-- ─── Transaction Tags ────────────────────────────────────────────────────────
CREATE POLICY "tags_select_own" ON transaction_tags
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "tags_insert_own" ON transaction_tags
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "tags_update_own" ON transaction_tags
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "tag_links_select_own" ON transaction_tag_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ledger_transactions lt
      WHERE lt.id = ledger_transaction_id AND lt.user_id = auth.uid()
    )
  );

CREATE POLICY "tag_links_insert_own" ON transaction_tag_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ledger_transactions lt
      WHERE lt.id = ledger_transaction_id AND lt.user_id = auth.uid()
    )
  );

-- ─── Budgets ─────────────────────────────────────────────────────────────────
CREATE POLICY "budgets_select_own" ON budgets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "budgets_insert_own" ON budgets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "budgets_update_own" ON budgets
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "budgets_delete_own" ON budgets
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "budget_cats_select_own" ON budget_categories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "budget_cats_insert_own" ON budget_categories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "budget_cats_update_own" ON budget_categories
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "budget_cats_delete_own" ON budget_categories
  FOR DELETE USING (user_id = auth.uid());

-- ─── Loans ───────────────────────────────────────────────────────────────────
CREATE POLICY "loans_select_own" ON loans
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "loans_insert_own" ON loans
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "loans_update_own" ON loans
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "loan_payments_select_own" ON loan_payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "loan_payments_insert_own" ON loan_payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ─── Credit Cards ────────────────────────────────────────────────────────────
CREATE POLICY "cards_select_own" ON credit_cards
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "cards_insert_own" ON credit_cards
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "cards_update_own" ON credit_cards
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "card_payments_select_own" ON credit_card_payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "card_payments_insert_own" ON credit_card_payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ─── Receivables ─────────────────────────────────────────────────────────────
CREATE POLICY "receivables_select_own" ON receivables
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "receivables_insert_own" ON receivables
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "receivables_update_own" ON receivables
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── Recurring ───────────────────────────────────────────────────────────────
CREATE POLICY "recurring_select_own" ON recurring_templates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "recurring_insert_own" ON recurring_templates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "recurring_update_own" ON recurring_templates
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── Savings Goals ───────────────────────────────────────────────────────────
CREATE POLICY "goals_select_own" ON savings_goals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "goals_insert_own" ON savings_goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "goals_update_own" ON savings_goals
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── Notifications ───────────────────────────────────────────────────────────
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- ─── Other tables ────────────────────────────────────────────────────────────
CREATE POLICY "reconciliations_select_own" ON account_reconciliations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "reconciliations_insert_own" ON account_reconciliations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "audit_logs_select_own" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "deletion_requests_select_own" ON account_deletion_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "deletion_requests_insert_own" ON account_deletion_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "deletion_requests_update_own" ON account_deletion_requests
  FOR UPDATE USING (user_id = auth.uid());
