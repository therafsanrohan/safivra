import { z } from 'zod';

// ─── Centralized Reusable Validation Building Blocks ─────────────────────────

/** Validates email strings with consistent error messaging */
export const vEmail = (msg = 'Please enter a valid email address') =>
  z.string().email(msg);

/** Validates strong passwords (8+ chars, 1+ uppercase, 1+ digit) */
export const vPassword = () =>
  z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[0-9]/, 'Password must include at least one number');

/** Validates positive non-zero financial amounts */
export const vPositiveAmount = (msg = 'Amount must be greater than zero') =>
  z.coerce.number().positive(msg);

/** Validates optional or non-negative zero-allowed amounts */
export const vOptionalAmount = (msg = 'Amount must be zero or positive') =>
  z.coerce.number().min(0, msg).optional();

/** Validates required ISO date strings */
export const vRequiredDate = (msg = 'Date is required') =>
  z.string().min(1, msg);

/** Validates optional note text up to max characters */
export const vNotes = (max = 500) =>
  z.string().max(max).optional();

/** Validates optional 4-digit card/account numbers */
export const vLastFourDigits = () =>
  z
    .string()
    .regex(/^\d{4}$/, 'Must be exactly 4 digits')
    .optional()
    .or(z.literal(''));

/** Reusable password confirmation refinement helper */
export const withPasswordConfirmation = <
  T extends { password?: string; new_password?: string; confirm_password: string }
>(
  schema: z.ZodType<T>,
  passKey: 'password' | 'new_password' = 'password'
) =>
  schema.refine((data) => data[passKey] === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });


// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const signInSchema = z.object({
  email: vEmail(),
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = withPasswordConfirmation(
  z.object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters').max(80),
    email: vEmail(),
    password: vPassword(),
    confirm_password: z.string().min(1, 'Please confirm your password'),
    agreed: z.literal(true, { errorMap: () => ({ message: 'You must agree to continue' }) }),
  })
);

export const forgotPasswordSchema = z.object({
  email: vEmail(),
});

export const resetPasswordSchema = withPasswordConfirmation(
  z.object({
    password: vPassword(),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
);

// ─── Account Schema ───────────────────────────────────────────────────────────

export const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(80),
  account_type: z.enum([
    'cash', 'bank', 'savings', 'mobile_financial_service',
    'credit_card', 'loan', 'investment', 'receivable', 'other_asset', 'other_liability',
  ]),
  institution: z.string().max(100).optional(),
  opening_balance: z.coerce.number().min(0, 'Opening balance must be zero or positive'),
  opening_balance_date: vRequiredDate('Balance date is required'),
  last_four: vLastFourDigits(),
  credit_limit: vOptionalAmount(),
  include_in_total: z.boolean(),
  include_in_net_worth: z.boolean(),
  notes: vNotes(),
});

// ─── Transaction Schemas ──────────────────────────────────────────────────────

export const incomeSchema = z.object({
  amount: vPositiveAmount(),
  category_id: z.string().min(1, 'Category is required'),
  account_id: z.string().min(1, 'Account is required'),
  transaction_date: vRequiredDate(),
  transaction_time: z.string().optional(),
  merchant: z.string().max(100).optional(),
  description: vNotes(),
});

export const expenseSchema = z.object({
  amount: vPositiveAmount(),
  category_id: z.string().min(1, 'Category is required'),
  account_id: z.string().min(1, 'Account is required'),
  transaction_date: vRequiredDate(),
  transaction_time: z.string().optional(),
  merchant: z.string().max(100).optional(),
  description: vNotes(),
});

export const transferSchema = z.object({
  amount: vPositiveAmount(),
  source_account_id: z.string().min(1, 'Source account is required'),
  destination_account_id: z.string().min(1, 'Destination account is required'),
  fee: vOptionalAmount(),
  transaction_date: vRequiredDate(),
  description: vNotes(),
}).refine((d) => d.source_account_id !== d.destination_account_id, {
  message: 'Source and destination must be different accounts',
  path: ['destination_account_id'],
});

export const loanPaymentSchema = z.object({
  loan_id: z.string().min(1, 'Loan is required'),
  payment_account_id: z.string().min(1, 'Payment account is required'),
  total_amount: vPositiveAmount('Total payment must be greater than zero'),
  principal_amount: z.coerce.number().min(0, 'Principal must be zero or more'),
  interest_amount: z.coerce.number().min(0, 'Interest must be zero or more'),
  fee_amount: vOptionalAmount(),
  transaction_date: vRequiredDate(),
  description: vNotes(),
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
  amount: vPositiveAmount(),
  transaction_date: vRequiredDate(),
  description: vNotes(),
});

// ─── Loan Schema ─────────────────────────────────────────────────────────────

export const loanSchema = z.object({
  name: z.string().min(1, 'Loan name is required').max(100),
  loan_type: z.enum(['personal', 'bank', 'business', 'education', 'family_friend', 'installment', 'other']),
  lender_name: z.string().min(1, 'Lender name is required').max(100),
  original_principal: vPositiveAmount('Principal must be greater than zero'),
  opening_outstanding: vOptionalAmount(),
  interest_type: z.enum(['fixed', 'reducing_balance', 'interest_free', 'manual', 'unknown']),
  annual_rate: z.coerce.number().min(0).max(100).optional(),
  monthly_installment: vOptionalAmount(),
  payment_frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly', 'custom']),
  start_date: vRequiredDate('Start date is required'),
  first_payment_date: z.string().optional(),
  linked_account_id: z.string().optional(),
  notes: vNotes(),
  include_in_net_worth: z.boolean(),
});

// ─── Credit Card Schema ──────────────────────────────────────────────────────

export const creditCardSchema = z.object({
  nickname: z.string().min(1, 'Card name is required').max(80),
  issuer: z.string().min(1, 'Issuer is required').max(100),
  last_four: vLastFourDigits(),
  credit_limit: vPositiveAmount('Credit limit must be greater than zero'),
  opening_outstanding: z.coerce.number().min(0),
  statement_day: z.coerce.number().min(1).max(31).optional(),
  payment_due_day: z.coerce.number().min(1).max(31).optional(),
  minimum_payment: vOptionalAmount(),
  linked_account_id: z.string().optional(),
  notes: vNotes(),
});

// ─── Budget Schema ───────────────────────────────────────────────────────────

export const budgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(100),
  period_type: z.enum(['monthly', 'weekly', 'custom']),
  total_limit: vPositiveAmount('Budget limit must be greater than zero'),
  start_date: vRequiredDate('Start date is required'),
  alert_threshold: z.coerce.number().min(50).max(100),
});

// ─── Recurring Schema ────────────────────────────────────────────────────────

export const recurringSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  transaction_type: z.enum(['income', 'expense']),
  amount: vPositiveAmount(),
  account_id: z.string().min(1, 'Account is required'),
  category_id: z.string().min(1, 'Category is required'),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  start_date: vRequiredDate('Start date is required'),
  end_date: z.string().optional(),
  reminder_days: z.coerce.number().min(0).max(30),
  notes: vNotes(),
});

// ─── Savings Goal Schema ─────────────────────────────────────────────────────

export const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100),
  target_amount: vPositiveAmount('Target must be greater than zero'),
  current_amount: z.coerce.number().min(0),
  target_date: z.string().optional(),
  linked_account_id: z.string().optional(),
  notes: vNotes(),
});

// ─── Profile & Change Password Schemas ───────────────────────────────────────

export const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  preferred_currency: z.string().length(3),
  timezone: z.string().min(1),
});

export const changePasswordSchema = withPasswordConfirmation(
  z.object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: vPassword(),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  }),
  'new_password'
);

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
