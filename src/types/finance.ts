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

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR' | 'CHF' | 'SGD';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  currency: CurrencyCode;
  monthlyIncome: number;
  currentAge: number;
  targetFireAge: number;
  annualWithdrawalRate: number; // e.g., 4.0 for 4%
  expectedReturnRate: number; // e.g., 8.0 for 8%
  inflationRate: number; // e.g., 2.5 for 2.5%
  emergencyFundTargetMonths: number;
  debtStrategy: DebtPayoffStrategy;
  literacyScore: number;
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
  date: string; // ISO format string YYYY-MM-DD
  isRecurring: boolean;
  notes?: string;
}

export interface DebtItem {
  id: string;
  accountId: string;
  name: string;
  balance: number;
  apr: number; // Annual percentage rate, e.g., 19.99
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
