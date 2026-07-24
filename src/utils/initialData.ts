import type { Account, Category, Transaction, DebtItem, UserProfile, Workspace, JournalEntry, ReceivablePayableItem } from '../types/finance';

export const INITIAL_PROFILE: UserProfile = {
  id: 'user-default-1',
  fullName: 'Alex Morgan',
  email: 'alex.morgan@safivra.io',
  currency: 'USD',
  monthlyIncome: 6500,
  currentAge: 30,
  targetFireAge: 52,
  annualWithdrawalRate: 4.0,
  expectedReturnRate: 8.5,
  inflationRate: 2.5,
  emergencyFundTargetMonths: 6,
  debtStrategy: 'avalanche',
  literacyScore: 110,
};

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    name: 'Chase High Yield Checking',
    type: 'checking',
    institution: 'Chase Bank',
    balance: 4250.00,
    isLiability: false,
    color: '#3B82F6',
    accountNumberLast4: '4821',
  },
  {
    id: 'acc-2',
    name: 'Marcus High-Yield Savings (4.5% APY)',
    type: 'savings',
    institution: 'Goldman Sachs',
    balance: 18500.00,
    isLiability: false,
    color: '#10B981',
    accountNumberLast4: '9012',
  },
  {
    id: 'acc-3',
    name: 'Vanguard Index Portfolio (S&P 500)',
    type: 'investment',
    institution: 'Vanguard',
    balance: 45200.00,
    isLiability: false,
    color: '#8B5CF6',
    accountNumberLast4: '3341',
  },
  {
    id: 'acc-4',
    name: 'Sapphire Preferred Credit Card',
    type: 'credit_card',
    institution: 'Chase',
    balance: 2450.00,
    isLiability: true,
    color: '#EF4444',
    accountNumberLast4: '7721',
  },
  {
    id: 'acc-5',
    name: 'Auto Loan - Tesla Model 3',
    type: 'loan',
    institution: 'Tesla Finance',
    balance: 12400.00,
    isLiability: true,
    color: '#F59E0B',
    accountNumberLast4: '5109',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Housing & Rent', icon: 'home', color: '#6366F1', bucket: 'needs', monthlyLimit: 1800 },
  { id: 'cat-2', name: 'Groceries & Staples', icon: 'shopping-bag', color: '#10B981', bucket: 'needs', monthlyLimit: 500 },
  { id: 'cat-3', name: 'Utilities & Internet', icon: 'zap', color: '#0EA5E9', bucket: 'needs', monthlyLimit: 250 },
  { id: 'cat-4', name: 'Dining Out & Coffee', icon: 'coffee', color: '#F59E0B', bucket: 'wants', monthlyLimit: 350 },
  { id: 'cat-5', name: 'Entertainment & Subscriptions', icon: 'film', color: '#EC4899', bucket: 'wants', monthlyLimit: 150 },
  { id: 'cat-6', name: 'Index ETF Contribution', icon: 'trending-up', color: '#8B5CF6', bucket: 'savings_investments', monthlyLimit: 1200 },
  { id: 'cat-7', name: 'Debt Payoff Extra', icon: 'shield-alert', color: '#EF4444', bucket: 'debt_repayment', monthlyLimit: 400 },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    accountId: 'acc-1',
    categoryId: 'cat-1',
    type: 'expense',
    amount: 1750.00,
    description: 'Monthly Apartment Rent',
    merchant: 'Skyline Properties',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    isRecurring: true,
  },
  {
    id: 'tx-2',
    accountId: 'acc-1',
    categoryId: '',
    type: 'income',
    amount: 3250.00,
    description: 'Bi-weekly Direct Deposit Payroll',
    merchant: 'Acme Corp Inc.',
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    isRecurring: true,
  },
  {
    id: 'tx-3',
    accountId: 'acc-4',
    categoryId: 'cat-4',
    type: 'expense',
    amount: 64.50,
    description: 'Dinner with friends',
    merchant: 'The Capital Grille',
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    isRecurring: false,
  },
  {
    id: 'tx-4',
    accountId: 'acc-1',
    categoryId: 'cat-6',
    type: 'expense',
    amount: 600.00,
    description: 'Automated VOO Vanguard ETF buy',
    merchant: 'Vanguard Investments',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    isRecurring: true,
  },
  {
    id: 'tx-5',
    accountId: 'acc-1',
    categoryId: 'cat-2',
    type: 'expense',
    amount: 142.80,
    description: 'Weekly Organic Grocery Run',
    merchant: 'Whole Foods Market',
    date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    isRecurring: false,
  },
];

export const INITIAL_DEBTS: DebtItem[] = [
  {
    id: 'debt-1',
    accountId: 'acc-4',
    name: 'Sapphire Credit Card',
    balance: 2450.00,
    apr: 21.99,
    minimumPayment: 85.00,
    dueDay: 15,
  },
  {
    id: 'debt-2',
    accountId: 'acc-5',
    name: 'Tesla Auto Loan',
    balance: 12400.00,
    apr: 4.49,
    minimumPayment: 320.00,
    dueDay: 28,
  },
];

export const INITIAL_WORKSPACES: Workspace[] = [
  { id: 'ws-1', name: 'Personal Vault', type: 'personal', role: 'owner' },
  { id: 'ws-2', name: 'Morgan Family Household', type: 'household', role: 'admin' },
  { id: 'ws-3', name: 'Nexus Ventures LLC', type: 'business', role: 'owner' },
];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'je-1',
    entryNumber: 1001,
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    memo: 'Monthly Apartment Rent Payment',
    isReversed: false,
    lines: [
      { id: 'jl-1', journalEntryId: 'je-1', accountId: 'cat-1', accountName: 'Housing & Rent Expense', debit: 1750.00, credit: 0.00, description: 'Debit Rent Expense' },
      { id: 'jl-2', journalEntryId: 'je-1', accountId: 'acc-1', accountName: 'Chase Checking Asset', debit: 0.00, credit: 1750.00, description: 'Credit Bank Account' },
    ],
  },
  {
    id: 'je-2',
    entryNumber: 1002,
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    memo: 'Bi-weekly Direct Deposit Payroll',
    isReversed: false,
    lines: [
      { id: 'jl-3', journalEntryId: 'je-2', accountId: 'acc-1', accountName: 'Chase Checking Asset', debit: 3250.00, credit: 0.00, description: 'Debit Cash Asset' },
      { id: 'jl-4', journalEntryId: 'je-2', accountId: 'rev-1', accountName: 'Salary Revenue', debit: 0.00, credit: 3250.00, description: 'Credit Payroll Income' },
    ],
  },
];

export const INITIAL_RECEIVABLES: ReceivablePayableItem[] = [
  {
    id: 'rec-1',
    counterparty: 'David Miller (Freelance Project)',
    type: 'receivable',
    totalAmount: 1800.00,
    balanceDue: 1200.00,
    apr: 0.00,
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    status: 'pending',
    notes: 'UI/UX Design milestone payment',
  },
  {
    id: 'rec-2',
    counterparty: 'City Dental Clinic',
    type: 'payable',
    totalAmount: 450.00,
    balanceDue: 450.00,
    apr: 0.00,
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    status: 'pending',
    notes: 'Annual checkup invoice',
  },
];
