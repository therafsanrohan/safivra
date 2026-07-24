export type AccountType = 
  | 'cash' 
  | 'checking' 
  | 'savings' 
  | 'credit_card' 
  | 'investment' 
  | 'real_estate' 
  | 'loan' 
  | 'other_asset' 
  | 'other_liability';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type BudgetBucket = 'needs' | 'wants' | 'savings_investments' | 'debt_repayment';

export type DebtPayoffStrategy = 'avalanche' | 'snowball';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR' | 'CHF' | 'SGD' | 'BDT';

export type WorkspaceRole = 'owner' | 'admin' | 'member';

export type DueType = 'receivable' | 'payable' | 'loan';

export interface Workspace {
  id: string;
  name: string;
  type: 'personal' | 'household' | 'business';
  role: WorkspaceRole;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  currency: CurrencyCode;
  monthlyIncome: number;
  currentAge: number;
  targetFireAge: number;
  annualWithdrawalRate: number;
  expectedReturnRate: number;
  inflationRate: number;
  emergencyFundTargetMonths: number;
  debtStrategy: DebtPayoffStrategy;
  literacyScore: number;
  mfaEnabled?: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution: string;
  balance: number;
  isLiability: boolean;
  color?: string;
  accountNumberLast4?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  bucket: BudgetBucket;
  monthlyLimit: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  destinationAccountId?: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description: string;
  merchant?: string;
  date: string;
  isRecurring: boolean;
  notes?: string;
  workspaceId?: string;
}

export interface JournalLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: number;
  date: string;
  memo: string;
  lines: JournalLine[];
  isReversed: boolean;
}

export interface ReceivablePayableItem {
  id: string;
  counterparty: string;
  type: DueType;
  totalAmount: number;
  balanceDue: number;
  apr: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  notes?: string;
}

export interface OfflineQueueAction {
  id: string;
  action: 'ADD_TRANSACTION' | 'UPDATE_DEBT' | 'CREATE_ACCOUNT';
  payload: any;
  createdAt: string;
}

export interface DebtItem {
  id: string;
  accountId: string;
  name: string;
  balance: number;
  apr: number;
  minimumPayment: number;
  dueDay: number;
}

export interface LiteracyModule {
  id: string;
  slug: string;
  title: string;
  category: 'Foundation' | 'Investing' | 'Debt Strategy' | 'Tax & Wealth';
  durationMinutes: number;
  xpPoints: number;
  summary: string;
  content: string[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  completed: boolean;
  userScore?: number;
}

export interface FIREProjectionPoint {
  age: number;
  year: number;
  portfolioValue: number;
  fireTarget: number;
  totalContributions: number;
  totalInterestEarned: number;
}

export interface DebtPayoffSchedulePoint {
  month: number;
  dateStr: string;
  avalancheRemaining: number;
  snowballRemaining: number;
  avalancheInterestPaid: number;
  snowballInterestPaid: number;
}
