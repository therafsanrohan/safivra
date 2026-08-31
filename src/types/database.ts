/**
 * TypeScript types for the Safivra database schema.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          preferred_currency: string;
          timezone: string;
          onboarding_completed: boolean;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          preferred_currency?: string;
          timezone?: string;
          onboarding_completed?: boolean;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          preferred_currency?: string;
          timezone?: string;
          onboarding_completed?: boolean;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          language: string;
          preferred_currency: string;
          timezone: string;
          theme: string;
          balance_privacy: boolean;
          start_of_week: number;
          default_account_id: string | null;
          notification_upcoming_days: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          language?: string;
          preferred_currency?: string;
          timezone?: string;
          theme?: string;
          balance_privacy?: boolean;
          start_of_week?: number;
          default_account_id?: string | null;
          notification_upcoming_days?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          language?: string;
          preferred_currency?: string;
          timezone?: string;
          theme?: string;
          balance_privacy?: boolean;
          start_of_week?: number;
          default_account_id?: string | null;
          notification_upcoming_days?: number;
          updated_at?: string;
        };
      };
      financial_accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          account_type: AccountType;
          account_class: AccountClass;
          institution: string | null;
          currency_code: string;
          opening_balance: string;
          opening_balance_date: string;
          last_four: string | null;
          credit_limit: string | null;
          include_in_total: boolean;
          include_in_net_worth: boolean;
          notes: string | null;
          is_active: boolean;
          is_archived: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          account_type: AccountType;
          account_class: AccountClass;
          institution?: string | null;
          currency_code?: string;
          opening_balance?: string;
          opening_balance_date?: string;
          last_four?: string | null;
          credit_limit?: string | null;
          include_in_total?: boolean;
          include_in_net_worth?: boolean;
          notes?: string | null;
          is_active?: boolean;
          is_archived?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          institution?: string | null;
          last_four?: string | null;
          credit_limit?: string | null;
          include_in_total?: boolean;
          include_in_net_worth?: boolean;
          notes?: string | null;
          is_active?: boolean;
          is_archived?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
      };
      transaction_categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          category_type: CategoryType;
          icon: string | null;
          color: string | null;
          is_system: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          category_type: CategoryType;
          icon?: string | null;
          color?: string | null;
          is_system?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          icon?: string | null;
          color?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      ledger_transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: TransactionType;
          transaction_date: string;
          transaction_time: string | null;
          timezone: string;
          title: string;
          description: string | null;
          merchant: string | null;
          status: TransactionStatus;
          reference_number: string | null;
          recurring_template_id: string | null;
          related_transaction_id: string | null;
          voided_at: string | null;
          void_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_type: TransactionType;
          transaction_date: string;
          transaction_time?: string | null;
          timezone?: string;
          title: string;
          description?: string | null;
          merchant?: string | null;
          status?: TransactionStatus;
          reference_number?: string | null;
          recurring_template_id?: string | null;
          related_transaction_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          merchant?: string | null;
          status?: TransactionStatus;
          voided_at?: string | null;
          void_reason?: string | null;
          updated_at?: string;
        };
      };
      ledger_entries: {
        Row: {
          id: string;
          user_id: string;
          ledger_transaction_id: string;
          financial_account_id: string | null;
          category_id: string | null;
          amount: string; // NUMERIC stored as string
          currency_code: string;
          entry_role: EntryRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ledger_transaction_id: string;
          financial_account_id?: string | null;
          category_id?: string | null;
          amount: string;
          currency_code?: string;
          entry_role: EntryRole;
          created_at?: string;
        };
        Update: never;
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          period_type: BudgetPeriod;
          total_limit: string;
          start_date: string;
          end_date: string | null;
          alert_threshold: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          period_type?: BudgetPeriod;
          total_limit: string;
          start_date: string;
          end_date?: string | null;
          alert_threshold?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          total_limit?: string;
          alert_threshold?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      budget_categories: {
        Row: {
          id: string;
          budget_id: string;
          user_id: string;
          category_id: string;
          limit_amount: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          user_id: string;
          category_id: string;
          limit_amount: string;
          created_at?: string;
        };
        Update: {
          limit_amount?: string;
        };
      };
      loans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          loan_type: LoanType;
          lender_name: string;
          original_principal: string;
          opening_outstanding: string | null;
          interest_type: InterestType;
          annual_rate: string | null;
          monthly_installment: string | null;
          payment_frequency: PaymentFrequency;
          start_date: string;
          first_payment_date: string | null;
          next_payment_date: string | null;
          expected_completion: string | null;
          linked_account_id: string | null;
          notes: string | null;
          status: LoanStatus;
          include_in_net_worth: boolean;
          account_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          loan_type: LoanType;
          lender_name: string;
          original_principal: string;
          opening_outstanding?: string | null;
          interest_type?: InterestType;
          annual_rate?: string | null;
          monthly_installment?: string | null;
          payment_frequency?: PaymentFrequency;
          start_date: string;
          first_payment_date?: string | null;
          next_payment_date?: string | null;
          expected_completion?: string | null;
          linked_account_id?: string | null;
          notes?: string | null;
          status?: LoanStatus;
          include_in_net_worth?: boolean;
          account_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          lender_name?: string;
          annual_rate?: string | null;
          monthly_installment?: string | null;
          next_payment_date?: string | null;
          expected_completion?: string | null;
          linked_account_id?: string | null;
          notes?: string | null;
          status?: LoanStatus;
          updated_at?: string;
        };
      };
      loan_payments: {
        Row: {
          id: string;
          user_id: string;
          loan_id: string;
          ledger_transaction_id: string;
          payment_date: string;
          total_amount: string;
          principal_amount: string;
          interest_amount: string;
          fee_amount: string;
          payment_account_id: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          loan_id: string;
          ledger_transaction_id: string;
          payment_date: string;
          total_amount: string;
          principal_amount: string;
          interest_amount: string;
          fee_amount?: string;
          payment_account_id: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      credit_cards: {
        Row: {
          id: string;
          user_id: string;
          nickname: string;
          issuer: string;
          last_four: string | null;
          credit_limit: string;
          opening_outstanding: string;
          statement_day: number | null;
          payment_due_day: number | null;
          minimum_payment: string | null;
          annual_fee_date: string | null;
          linked_account_id: string | null;
          notes: string | null;
          status: CardStatus;
          account_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nickname: string;
          issuer: string;
          last_four?: string | null;
          credit_limit: string;
          opening_outstanding?: string;
          statement_day?: number | null;
          payment_due_day?: number | null;
          minimum_payment?: string | null;
          annual_fee_date?: string | null;
          linked_account_id?: string | null;
          notes?: string | null;
          status?: CardStatus;
          account_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nickname?: string;
          issuer?: string;
          last_four?: string | null;
          credit_limit?: string;
          minimum_payment?: string | null;
          annual_fee_date?: string | null;
          linked_account_id?: string | null;
          notes?: string | null;
          status?: CardStatus;
          updated_at?: string;
        };
      };
      credit_card_payments: {
        Row: {
          id: string;
          user_id: string;
          credit_card_id: string;
          ledger_transaction_id: string;
          payment_date: string;
          amount: string;
          payment_account_id: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          credit_card_id: string;
          ledger_transaction_id: string;
          payment_date: string;
          amount: string;
          payment_account_id: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      receivables: {
        Row: {
          id: string;
          user_id: string;
          person_name: string;
          amount_lent: string;
          amount_remaining: string;
          date_lent: string;
          expected_repayment: string | null;
          linked_account_id: string | null;
          notes: string | null;
          status: ReceivableStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          person_name: string;
          amount_lent: string;
          amount_remaining?: string;
          date_lent: string;
          expected_repayment?: string | null;
          linked_account_id?: string | null;
          notes?: string | null;
          status?: ReceivableStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          amount_remaining?: string;
          expected_repayment?: string | null;
          notes?: string | null;
          status?: ReceivableStatus;
          updated_at?: string;
        };
      };
      recurring_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          transaction_type: TransactionType;
          amount: string;
          account_id: string;
          category_id: string | null;
          frequency: RecurringFrequency;
          start_date: string;
          next_occurrence: string;
          end_date: string | null;
          reminder_days: number;
          auto_post: boolean;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          transaction_type: TransactionType;
          amount: string;
          account_id: string;
          category_id?: string | null;
          frequency: RecurringFrequency;
          start_date: string;
          next_occurrence: string;
          end_date?: string | null;
          reminder_days?: number;
          auto_post?: boolean;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          amount?: string;
          next_occurrence?: string;
          end_date?: string | null;
          reminder_days?: number;
          auto_post?: boolean;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: string;
          current_amount: string;
          target_date: string | null;
          linked_account_id: string | null;
          notes: string | null;
          status: GoalStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount: string;
          current_amount?: string;
          target_date?: string | null;
          linked_account_id?: string | null;
          notes?: string | null;
          status?: GoalStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          target_amount?: string;
          current_amount?: string;
          target_date?: string | null;
          notes?: string | null;
          status?: GoalStatus;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          notification_type: NotificationType;
          title: string;
          body: string;
          related_id: string | null;
          related_type: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_type: NotificationType;
          title: string;
          body: string;
          related_id?: string | null;
          related_type?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
      savings_schemes: {
        Row: {
          id: string;
          user_id: string;
          scheme_name: string;
          scheme_type: 'dps' | 'fdr' | 'savings_account' | 'sanchaypatra';
          institution: string;
          account_number: string | null;
          deposit_amount: string;
          maturity_amount: string;
          interest_rate: string;
          start_date: string;
          maturity_date: string | null;
          status: 'active' | 'matured' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scheme_name: string;
          scheme_type: 'dps' | 'fdr' | 'savings_account' | 'sanchaypatra';
          institution: string;
          account_number?: string | null;
          deposit_amount: string;
          maturity_amount: string;
          interest_rate: string;
          start_date: string;
          maturity_date?: string | null;
          status?: 'active' | 'matured' | 'closed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          scheme_name?: string;
          scheme_type?: 'dps' | 'fdr' | 'savings_account' | 'sanchaypatra';
          institution?: string;
          account_number?: string | null;
          deposit_amount?: string;
          maturity_amount?: string;
          interest_rate?: string;
          start_date?: string;
          maturity_date?: string | null;
          status?: 'active' | 'matured' | 'closed';
          updated_at?: string;
        };
      };
    };
    Views: {
      v_account_balances: {
        Row: {
          account_id: string;
          user_id: string;
          name: string;
          account_type: AccountType;
          account_class: AccountClass;
          institution: string | null;
          currency_code: string;
          credit_limit: string | null;
          include_in_total: boolean;
          include_in_net_worth: boolean;
          is_active: boolean;
          is_archived: boolean;
          balance: string;
        };
      };
    };
    Functions: {
      post_transaction: {
        Args: {
          p_transaction_type: TransactionType;
          p_transaction_date: string;
          p_title: string;
          p_amount: number;
          p_account_id: string;
          p_category_id?: string | null;
          p_destination_account_id?: string | null;
          p_merchant?: string | null;
          p_description?: string | null;
          p_transaction_time?: string | null;
          p_principal_amount?: number | null;
          p_interest_amount?: number | null;
          p_fee_amount?: number | null;
          p_loan_id?: string | null;
          p_credit_card_id?: string | null;
        };
        Returns: { transaction_id: string };
      };
      get_monthly_summary: {
        Args: { p_year: number; p_month: number };
        Returns: { income: number; expense: number; net: number };
      };
      delete_financial_record: {
        Args: {
          p_record_type: string;
          p_record_id: string;
        };
        Returns: { success: boolean };
      };
    };
    Enums: {
      account_type: AccountType;
      account_class: AccountClass;
      transaction_type: TransactionType;
      transaction_status: TransactionStatus;
      category_type: CategoryType;
      entry_role: EntryRole;
      loan_type: LoanType;
      interest_type: InterestType;
      loan_status: LoanStatus;
      payment_frequency: PaymentFrequency;
      card_status: CardStatus;
      budget_period: BudgetPeriod;
      recurring_frequency: RecurringFrequency;
      receivable_status: ReceivableStatus;
      goal_status: GoalStatus;
      notification_type: NotificationType;
    };
  };
};

// Enum types
export type AccountType =
  | 'cash'
  | 'bank'
  | 'savings'
  | 'mobile_financial_service'
  | 'credit_card'
  | 'loan'
  | 'investment'
  | 'receivable'
  | 'other_asset'
  | 'other_liability';

export type AccountClass = 'asset' | 'liability';

export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'loan_received'
  | 'loan_payment'
  | 'credit_card_purchase'
  | 'credit_card_payment'
  | 'refund'
  | 'balance_adjustment'
  | 'opening_balance'
  | 'fee';

export type TransactionStatus = 'posted' | 'pending' | 'voided' | 'failed';

export type CategoryType = 'income' | 'expense' | 'system';

export type EntryRole =
  | 'asset_debit'
  | 'asset_credit'
  | 'liability_debit'
  | 'liability_credit'
  | 'income_credit'
  | 'expense_debit'
  | 'equity_credit'
  | 'transfer_out'
  | 'transfer_in'
  | 'fee_expense';

export type LoanType =
  | 'personal'
  | 'bank'
  | 'business'
  | 'education'
  | 'family_friend'
  | 'installment'
  | 'other';

export type InterestType = 'fixed' | 'reducing_balance' | 'interest_free' | 'manual' | 'unknown';

export type LoanStatus = 'active' | 'paid' | 'overdue' | 'paused' | 'restructured' | 'archived';

export type PaymentFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export type CardStatus = 'active' | 'frozen' | 'closed' | 'archived';

export type BudgetPeriod = 'monthly' | 'weekly' | 'custom';

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type ReceivableStatus = 'active' | 'partially_repaid' | 'repaid' | 'overdue' | 'written_off';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export type NotificationType =
  | 'upcoming_loan_payment'
  | 'upcoming_card_payment'
  | 'upcoming_bill'
  | 'budget_warning'
  | 'budget_exceeded'
  | 'overdue_payment'
  | 'recurring_pending';
