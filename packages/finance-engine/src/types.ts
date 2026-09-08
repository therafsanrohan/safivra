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

export interface FinancialAccountInput {
  id: string;
  name: string;
  account_type: AccountType;
  account_class: AccountClass;
  balance: number | string;
  currency_code: string;
  is_active: boolean;
  is_archived: boolean;
  include_in_total: boolean;
  credit_limit?: number | string | null;
}

export type CommitmentType =
  | 'recurring_template'
  | 'loan_instalment'
  | 'credit_card'
  | 'custom_event';

export type PaymentStatus =
  | 'upcoming'
  | 'due_today'
  | 'overdue'
  | 'partially_paid'
  | 'paid'
  | 'skipped'
  | 'cancelled';

export interface CommitmentInput {
  id: string;
  title: string;
  commitment_type: CommitmentType;
  total_amount: number;
  amount_paid: number;
  due_date: string; // YYYY-MM-DD
  currency_code: string;
  linked_account_id?: string | null;
  category_id?: string | null;
  status?: PaymentStatus;
  is_estimated?: boolean;
  notes?: string;
  source_record_id?: string;
}

export interface ProtectedReserveInput {
  id: string;
  name: string;
  amount: number;
  account_id: string; // must point to an included spending account
  linked_commitment_id?: string | null;
  notes?: string;
}

export type HorizonType = 'month_end' | 'custom' | 'payday';

export interface HorizonConfig {
  type: HorizonType;
  endDate: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD (defaults to today)
  paydayDayOfMonth?: number;
}

export interface ExcludedAccountDetail {
  id: string;
  name: string;
  account_type: AccountType;
  balance: number;
  reason: string;
}

export interface CalculationBreakdown {
  eligibleAccounts: Array<{
    id: string;
    name: string;
    account_type: AccountType;
    balance: number;
  }>;
  excludedAccounts: ExcludedAccountDetail[];
  commitments: Array<{
    id: string;
    title: string;
    commitment_type: CommitmentType;
    due_date: string;
    total_amount: number;
    amount_paid: number;
    remaining_amount: number;
  }>;
  protectedReserves: Array<{
    id: string;
    name: string;
    amount: number;
    account_id: string;
    linked_commitment_id?: string | null;
    deducted_amount: number;
    reason?: string;
  }>;
  unresolvedOverlaps: Array<{
    reserve_id: string;
    reserve_name: string;
    reserve_amount: number;
    matching_commitment_id: string;
    matching_commitment_title: string;
  }>;
}

export interface AvailableToSpendResult {
  eligibleCurrentFunds: number;
  totalCommitments: number;
  totalProtectedFunds: number;
  availableToSpend: number;
  shortfall: number;
  isNegative: boolean;
  remainingDays: number;
  suggestedDailyAllocation: number;
  horizon: HorizonConfig;
  calculatedAt: string; // ISO string
  currency_code: string;
  breakdown: CalculationBreakdown;
  warnings: string[];
}

export interface ExpectedCashMovement {
  id: string;
  title: string;
  type: 'inflow' | 'outflow';
  amount: number;
  date: string; // YYYY-MM-DD
  account_id?: string | null;
  is_estimated?: boolean;
}

export interface TimelineDay {
  date: string; // YYYY-MM-DD
  startingBalance: number;
  inflows: number;
  outflows: number;
  endingBalance: number;
  isShortfall: boolean;
  events: ExpectedCashMovement[];
}

export interface ForecastTimelineResult {
  horizonDate: string;
  startingBalance: number;
  endingBalance: number;
  minBalance: number;
  minBalanceDate: string;
  hasMidPeriodShortfall: boolean;
  timeline: TimelineDay[];
}

export interface RecurringRuleInput {
  id: string;
  name: string;
  transaction_type: 'income' | 'expense' | 'transfer';
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  next_occurrence: string;
  end_date?: string | null;
  account_id: string;
  category_id?: string | null;
  auto_post?: boolean;
  is_active?: boolean;
}

export interface CalendarEventOccurrence {
  id: string; // templateId:YYYY-MM-DD or custom_event_id
  source_id: string;
  title: string;
  event_type: 'income' | 'bill' | 'loan' | 'card' | 'transfer' | 'savings';
  amount: number;
  currency_code: string;
  due_date: string; // YYYY-MM-DD
  account_id?: string | null;
  category_id?: string | null;
  status: PaymentStatus;
  amount_paid: number;
  remaining_amount: number;
  is_estimated: boolean;
  recurrence?: string;
  notes?: string;
}
