import { z } from 'zod';

// ─── Auth ───────────────────────────────────────────────────────────────────

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(80),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
  agreed: z.literal(true, { errorMap: () => ({ message: 'You must agree to continue' }) }),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

// ─── Account ─────────────────────────────────────────────────────────────────

export const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(80),
  account_type: z.enum([
    'cash', 'bank', 'savings', 'mobile_financial_service',
    'credit_card', 'loan', 'investment', 'receivable', 'other_asset', 'other_liability',
  ]),
  institution: z.string().max(100).optional(),
  opening_balance: z.coerce.number().min(0, 'Opening balance must be zero or positive'),
  opening_balance_date: z.string().min(1, 'Balance date is required'),
  last_four: z
    .string()
    .regex(/^\d{4}$/, 'Must be exactly 4 digits')
    .optional()
    .or(z.literal('')),
  credit_limit: z.coerce.number().min(0).optional(),
  include_in_total: z.boolean(),
  include_in_net_worth: z.boolean(),
  notes: z.string().max(500).optional(),
});

// ─── Transaction ─────────────────────────────────────────────────────────────

export const incomeSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  category_id: z.string().min(1, 'Category is required'),
  account_id: z.string().min(1, 'Account is required'),
  transaction_date: z.string().min(1, 'Date is required'),
  transaction_time: z.string().optional(),
  merchant: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
});

export const expenseSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  category_id: z.string().min(1, 'Category is required'),
  account_id: z.string().min(1, 'Account is required'),
  transaction_date: z.string().min(1, 'Date is required'),
  transaction_time: z.string().optional(),
  merchant: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
});

export const transferSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  source_account_id: z.string().min(1, 'Source account is required'),
  destination_account_id: z.string().min(1, 'Destination account is required'),
  fee: z.coerce.number().min(0).optional(),
  transaction_date: z.string().min(1, 'Date is required'),
  description: z.string().max(500).optional(),
}).refine((d) => d.source_account_id !== d.destination_account_id, {
  message: 'Source and destination must be different accounts',
  path: ['destination_account_id'],
});

export const loanPaymentSchema = z.object({
  loan_id: z.string().min(1, 'Loan is required'),
  payment_account_id: z.string().min(1, 'Payment account is required'),
  total_amount: z.coerce.number().positive('Total payment must be greater than zero'),
  principal_amount: z.coerce.number().min(0, 'Principal must be zero or more'),
  interest_amount: z.coerce.number().min(0, 'Interest must be zero or more'),
  fee_amount: z.coerce.number().min(0).optional(),
  transaction_date: z.string().min(1, 'Date is required'),
  description: z.string().max(500).optional(),
}).refine((d) => {
  const fee = d.fee_amount ?? 0;
  return Math.abs(d.principal_amount + d.interest_amount + fee - d.total_amount) < 0.01;
}, {
  message: 'Principal + Interest + Fee must equal Total payment',
  path: ['total_amount'],
});

export const creditCardPaymentSchema = z.object({
  credit_card_id: z.string().min(1, 'Credit card is required'),
  payment_account_id: z.string().min(1, 'Payment account is required'),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  transaction_date: z.string().min(1, 'Date is required'),
  description: z.string().max(500).optional(),
});

// ─── Loan ────────────────────────────────────────────────────────────────────

export const loanSchema = z.object({
  name: z.string().min(1, 'Loan name is required').max(100),
  loan_type: z.enum(['personal', 'bank', 'business', 'education', 'family_friend', 'installment', 'other']),
  lender_name: z.string().min(1, 'Lender name is required').max(100),
  original_principal: z.coerce.number().positive('Principal must be greater than zero'),
  opening_outstanding: z.coerce.number().min(0).optional(),
  interest_type: z.enum(['fixed', 'reducing_balance', 'interest_free', 'manual', 'unknown']),
  annual_rate: z.coerce.number().min(0).max(100).optional(),
  monthly_installment: z.coerce.number().min(0).optional(),
  payment_frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly', 'custom']),
  start_date: z.string().min(1, 'Start date is required'),
  first_payment_date: z.string().optional(),
  linked_account_id: z.string().optional(),
  notes: z.string().max(500).optional(),
  include_in_net_worth: z.boolean(),
});

// ─── Credit Card ─────────────────────────────────────────────────────────────

export const creditCardSchema = z.object({
  nickname: z.string().min(1, 'Card name is required').max(80),
  issuer: z.string().min(1, 'Issuer is required').max(100),
  last_four: z
    .string()
    .regex(/^\d{4}$/, 'Must be exactly 4 digits')
    .optional()
    .or(z.literal('')),
  credit_limit: z.coerce.number().positive('Credit limit must be greater than zero'),
  opening_outstanding: z.coerce.number().min(0),
  statement_day: z.coerce.number().min(1).max(31).optional(),
  payment_due_day: z.coerce.number().min(1).max(31).optional(),
  minimum_payment: z.coerce.number().min(0).optional(),
  linked_account_id: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// ─── Budget ──────────────────────────────────────────────────────────────────

export const budgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(100),
  period_type: z.enum(['monthly', 'weekly', 'custom']),
  total_limit: z.coerce.number().positive('Budget limit must be greater than zero'),
  start_date: z.string().min(1, 'Start date is required'),
  alert_threshold: z.coerce.number().min(50).max(100),
});

// ─── Recurring ───────────────────────────────────────────────────────────────

export const recurringSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  transaction_type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  account_id: z.string().min(1, 'Account is required'),
  category_id: z.string().min(1, 'Category is required'),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  reminder_days: z.coerce.number().min(0).max(30),
  notes: z.string().max(500).optional(),
});

// ─── Savings Goal ────────────────────────────────────────────────────────────

export const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100),
  target_amount: z.coerce.number().positive('Target must be greater than zero'),
  current_amount: z.coerce.number().min(0),
  target_date: z.string().optional(),
  linked_account_id: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// ─── Profile ─────────────────────────────────────────────────────────────────

export const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  preferred_currency: z.string().length(3),
  timezone: z.string().min(1),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include at least one uppercase letter')
    .regex(/[0-9]/, 'Must include at least one number'),
  confirm_password: z.string().min(1, 'Please confirm your new password'),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

// ─── Type exports ─────────────────────────────────────────────────────────────

export type SignInData = z.infer<typeof signInSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type AccountData = z.infer<typeof accountSchema>;
export type IncomeData = z.infer<typeof incomeSchema>;
export type ExpenseData = z.infer<typeof expenseSchema>;
export type TransferData = z.infer<typeof transferSchema>;
export type LoanPaymentData = z.infer<typeof loanPaymentSchema>;
export type CreditCardPaymentData = z.infer<typeof creditCardPaymentSchema>;
export type LoanData = z.infer<typeof loanSchema>;
export type CreditCardData = z.infer<typeof creditCardSchema>;
export type BudgetData = z.infer<typeof budgetSchema>;
export type RecurringData = z.infer<typeof recurringSchema>;
export type SavingsGoalData = z.infer<typeof savingsGoalSchema>;
export type ProfileData = z.infer<typeof profileSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
