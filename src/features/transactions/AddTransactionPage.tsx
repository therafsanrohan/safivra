import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { parseError } from '@/lib/errors/handler';
import { todayString } from '@/lib/dates/formatter';
import {
  expenseSchema, incomeSchema, transferSchema,
  loanPaymentSchema, creditCardPaymentSchema,
  type ExpenseData, type IncomeData, type TransferData,
  type LoanPaymentData, type CreditCardPaymentData,
} from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import type { Database } from '@/types/database';

type TransactionType = Database['public']['Enums']['transaction_type'];
type AccountRow = Database['public']['Views']['v_account_balances']['Row'];
type CategoryRow = Database['public']['Tables']['transaction_categories']['Row'];

type TransactionTypeOption = {
  value: TransactionType;
  label: string;
  description: string;
};

const TRANSACTION_TYPES: TransactionTypeOption[] = [
  { value: 'expense',              label: 'Add Expense',        description: 'Record money spent' },
  { value: 'income',               label: 'Add Income',         description: 'Record money received' },
  { value: 'transfer',             label: 'Transfer',           description: 'Move money between accounts' },
  { value: 'loan_payment',         label: 'Loan Payment',       description: 'Record a loan installment' },
  { value: 'credit_card_payment',  label: 'Card Payment',       description: 'Pay a credit card bill' },
  { value: 'balance_adjustment',   label: 'Balance Adjustment', description: 'Correct an account balance' },
];

export const AddTransactionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { success, error: showError } = useToast();

  const [txType, setTxType] = useState<TransactionType>(
    (searchParams.get('type') as TransactionType) ?? 'expense'
  );
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loans, setLoans] = useState<Array<{ id: string; name: string }>>([]);
  const [cards, setCards] = useState<Array<{ id: string; nickname: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  // Load reference data
  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('v_account_balances').select('*').eq('user_id', user.id).eq('is_active', true).eq('is_archived', false),
      supabase.from('transaction_categories').select('*').or(`user_id.eq.${user.id},user_id.is.null`).eq('is_active', true).order('sort_order'),
      supabase.from('loans').select('id, name').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('credit_cards').select('id, nickname').eq('user_id', user.id).eq('status', 'active'),
    ]).then(([acc, cat, lns, cds]) => {
      setAccounts(acc.data ?? []);
      setCategories(cat.data ?? []);
      setLoans(lns.data ?? []);
      setCards(cds.data ?? []);
    });
  }, [user]);

  const txInfo = TRANSACTION_TYPES.find((t) => t.value === txType)!;
  const assetAccounts = accounts.filter((a) => a.account_class === 'asset');
  const expenseCategories = categories.filter((c) => c.category_type === 'expense');
  const incomeCategories = categories.filter((c) => c.category_type === 'income');

  const handlePost = async (
    type: TransactionType,
    params: Record<string, unknown>
  ) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('post_transaction', {
        p_transaction_type: type,
        ...params,
      } as unknown as never);
      if (error) throw error;
      success(`${txInfo.label} recorded`, 'Transaction saved successfully.');
      navigate('/activity');
    } catch (err) {
      showError('Could not save transaction', parseError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container pt-4 fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-button)] hover:bg-[var(--color-bg-subtle)] transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
            {txInfo.label}
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            {txInfo.description}
          </p>
        </div>
      </div>

      {/* Transaction type selector */}
      <div className="mb-5">
        <Select
          label="Transaction type"
          value={txType}
          onValueChange={(v) => setTxType(v as TransactionType)}
          options={TRANSACTION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        />
      </div>

      {/* Form by type */}
      {txType === 'expense' && (
        <ExpenseForm
          accounts={assetAccounts}
          categories={expenseCategories}
          onSubmit={handlePost}
          submitting={submitting}
        />
      )}
      {txType === 'income' && (
        <IncomeForm
          accounts={assetAccounts}
          categories={incomeCategories}
          onSubmit={handlePost}
          submitting={submitting}
        />
      )}
      {txType === 'transfer' && (
        <TransferForm
          accounts={assetAccounts}
          onSubmit={handlePost}
          submitting={submitting}
        />
      )}
      {txType === 'loan_payment' && (
        <LoanPaymentForm
          accounts={assetAccounts}
          loans={loans}
          categories={categories}
          onSubmit={handlePost}
          submitting={submitting}
        />
      )}
      {txType === 'credit_card_payment' && (
        <CardPaymentForm
          accounts={assetAccounts}
          cards={cards}
          onSubmit={handlePost}
          submitting={submitting}
        />
      )}
    </div>
  );
};

// ─── Expense Form ─────────────────────────────────────────────────────────────
const ExpenseForm: React.FC<{
  accounts: AccountRow[];
  categories: CategoryRow[];
  onSubmit: (type: TransactionType, params: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}> = ({ accounts, categories, onSubmit, submitting }) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm<ExpenseData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { transaction_date: todayString() },
  });

  const submit = handleSubmit(async (data) => {
    await onSubmit('expense', {
      p_transaction_date: data.transaction_date,
      p_title: data.merchant || categories.find((c) => c.id === data.category_id)?.name || 'Expense',
      p_amount: data.amount,
      p_account_id: data.account_id,
      p_category_id: data.category_id,
      p_merchant: data.merchant || null,
      p_description: data.description || null,
      p_transaction_time: data.transaction_time || null,
    });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Controller
        name="amount"
        control={control}
        render={({ field }) => (
          <CurrencyInput
            label="Amount"
            required
            size="lg"
            error={errors.amount?.message}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        name="category_id"
        control={control}
        render={({ field }) => (
          <Select
            label="Category"
            required
            value={field.value}
            onValueChange={field.onChange}
            error={errors.category_id?.message}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select category"
          />
        )}
      />
      <Controller
        name="account_id"
        control={control}
        render={({ field }) => (
          <Select
            label="Paid from"
            required
            value={field.value}
            onValueChange={field.onChange}
            error={errors.account_id?.message}
            options={accounts.map((a) => ({ value: a.account_id, label: a.name }))}
            placeholder="Select account"
          />
        )}
      />
      <Input
        label="Date"
        type="date"
        required
        error={errors.transaction_date?.message}
        {...register('transaction_date')}
      />
      <Input
        label="Merchant"
        optional
        placeholder="e.g. Pathao, Shajgoj, Daraz"
        {...register('merchant')}
      />
      <Input
        label="Time"
        type="time"
        optional
        {...register('transaction_time')}
      />
      <Input
        label="Note"
        optional
        {...register('description')}
      />
      <Button type="submit" fullWidth size="lg" loading={submitting}>
        Add Expense
      </Button>
    </form>
  );
};

// ─── Income Form ──────────────────────────────────────────────────────────────
const IncomeForm: React.FC<{
  accounts: AccountRow[];
  categories: CategoryRow[];
  onSubmit: (type: TransactionType, params: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}> = ({ accounts, categories, onSubmit, submitting }) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm<IncomeData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { transaction_date: todayString() },
  });

  const submit = handleSubmit(async (data) => {
    await onSubmit('income', {
      p_transaction_date: data.transaction_date,
      p_title: data.merchant || categories.find((c) => c.id === data.category_id)?.name || 'Income',
      p_amount: data.amount,
      p_account_id: data.account_id,
      p_category_id: data.category_id,
      p_merchant: data.merchant || null,
      p_description: data.description || null,
    });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Controller
        name="amount"
        control={control}
        render={({ field }) => (
          <CurrencyInput label="Amount" required size="lg" error={errors.amount?.message} value={field.value} onChange={field.onChange} />
        )}
      />
      <Controller
        name="category_id"
        control={control}
        render={({ field }) => (
          <Select label="Category" required value={field.value} onValueChange={field.onChange} error={errors.category_id?.message} options={categories.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select category" />
        )}
      />
      <Controller
        name="account_id"
        control={control}
        render={({ field }) => (
          <Select label="Received in" required value={field.value} onValueChange={field.onChange} error={errors.account_id?.message} options={accounts.map((a) => ({ value: a.account_id, label: a.name }))} placeholder="Select account" />
        )}
      />
      <Input label="Date" type="date" required error={errors.transaction_date?.message} {...register('transaction_date')} />
      <Input label="Source" optional placeholder="e.g. Company name, client" {...register('merchant')} />
      <Input label="Note" optional {...register('description')} />
      <Button type="submit" fullWidth size="lg" loading={submitting}>Add Income</Button>
    </form>
  );
};

// ─── Transfer Form ────────────────────────────────────────────────────────────
const TransferForm: React.FC<{
  accounts: AccountRow[];
  onSubmit: (type: TransactionType, params: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}> = ({ accounts, onSubmit, submitting }) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm<TransferData>({
    resolver: zodResolver(transferSchema),
    defaultValues: { transaction_date: todayString(), fee: 0 },
  });

  const submit = handleSubmit(async (data) => {
    await onSubmit('transfer', {
      p_transaction_date: data.transaction_date,
      p_title: 'Transfer',
      p_amount: data.amount,
      p_account_id: data.source_account_id,
      p_destination_account_id: data.destination_account_id,
      p_fee_amount: data.fee ?? 0,
      p_description: data.description || null,
    });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Controller name="amount" control={control} render={({ field }) => (
        <CurrencyInput label="Amount" required size="lg" error={errors.amount?.message} value={field.value} onChange={field.onChange} />
      )} />
      <Controller name="source_account_id" control={control} render={({ field }) => (
        <Select label="From account" required value={field.value} onValueChange={field.onChange} error={errors.source_account_id?.message} options={accounts.map((a) => ({ value: a.account_id, label: a.name }))} placeholder="Select account" />
      )} />
      <Controller name="destination_account_id" control={control} render={({ field }) => (
        <Select label="To account" required value={field.value} onValueChange={field.onChange} error={errors.destination_account_id?.message} options={accounts.map((a) => ({ value: a.account_id, label: a.name }))} placeholder="Select account" />
      )} />
      <Controller name="fee" control={control} render={({ field }) => (
        <CurrencyInput label="Transfer fee" optional error={errors.fee?.message} value={field.value ?? 0} onChange={field.onChange} />
      )} />
      <Input label="Date" type="date" required error={errors.transaction_date?.message} {...register('transaction_date')} />
      <Input label="Note" optional {...register('description')} />
      <Button type="submit" fullWidth size="lg" loading={submitting}>Complete Transfer</Button>
    </form>
  );
};

// ─── Loan Payment Form ────────────────────────────────────────────────────────
const LoanPaymentForm: React.FC<{
  accounts: AccountRow[];
  loans: Array<{ id: string; name: string }>;
  categories: CategoryRow[];
  onSubmit: (type: TransactionType, params: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}> = ({ accounts, loans, categories, onSubmit, submitting }) => {
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<LoanPaymentData>({
    resolver: zodResolver(loanPaymentSchema),
    defaultValues: { transaction_date: todayString(), fee_amount: 0, interest_amount: 0, principal_amount: 0 },
  });

  const interestCategory = categories.find((c) => c.name === 'Loan Interest');

  const submit = handleSubmit(async (data) => {
    // Find the loan's linked account (liability account)
    const selectedLoan = loans.find((l) => l.id === data.loan_id);
    await onSubmit('loan_payment', {
      p_transaction_date: data.transaction_date,
      p_title: `Loan Payment — ${selectedLoan?.name ?? 'Loan'}`,
      p_amount: data.total_amount,
      p_account_id: data.payment_account_id,
      p_destination_account_id: data.loan_id, // will be used to identify loan liability account
      p_category_id: interestCategory?.id,
      p_principal_amount: data.principal_amount,
      p_interest_amount: data.interest_amount,
      p_fee_amount: data.fee_amount ?? 0,
      p_loan_id: data.loan_id,
      p_description: data.description || null,
    });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Controller name="loan_id" control={control} render={({ field }) => (
        <Select label="Loan" required value={field.value} onValueChange={field.onChange} error={errors.loan_id?.message} options={loans.map((l) => ({ value: l.id, label: l.name }))} placeholder="Select loan" />
      )} />
      <Controller name="total_amount" control={control} render={({ field }) => (
        <CurrencyInput label="Total payment" required size="lg" error={errors.total_amount?.message} value={field.value} onChange={field.onChange} />
      )} />
      <div className="grid grid-cols-2 gap-3">
        <Controller name="principal_amount" control={control} render={({ field }) => (
          <CurrencyInput label="Principal" required error={errors.principal_amount?.message} value={field.value} onChange={field.onChange} />
        )} />
        <Controller name="interest_amount" control={control} render={({ field }) => (
          <CurrencyInput label="Interest" required error={errors.interest_amount?.message} value={field.value} onChange={field.onChange} />
        )} />
      </div>
      <Controller name="fee_amount" control={control} render={({ field }) => (
        <CurrencyInput label="Fee" optional error={errors.fee_amount?.message} value={field.value ?? 0} onChange={field.onChange} />
      )} />
      <Controller name="payment_account_id" control={control} render={({ field }) => (
        <Select label="Payment account" required value={field.value} onValueChange={field.onChange} error={errors.payment_account_id?.message} options={accounts.map((a) => ({ value: a.account_id, label: a.name }))} placeholder="Select account" />
      )} />
      <Input label="Date" type="date" required error={errors.transaction_date?.message} {...register('transaction_date')} />
      <Input label="Note" optional {...register('description')} />
      <Button type="submit" fullWidth size="lg" loading={submitting}>Record Loan Payment</Button>
    </form>
  );
};

// ─── Card Payment Form ────────────────────────────────────────────────────────
const CardPaymentForm: React.FC<{
  accounts: AccountRow[];
  cards: Array<{ id: string; nickname: string }>;
  onSubmit: (type: TransactionType, params: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}> = ({ accounts, cards, onSubmit, submitting }) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm<CreditCardPaymentData>({
    resolver: zodResolver(creditCardPaymentSchema),
    defaultValues: { transaction_date: todayString() },
  });

  const submit = handleSubmit(async (data) => {
    const selectedCard = cards.find((c) => c.id === data.credit_card_id);
    await onSubmit('credit_card_payment', {
      p_transaction_date: data.transaction_date,
      p_title: `Card Payment — ${selectedCard?.nickname ?? 'Card'}`,
      p_amount: data.amount,
      p_account_id: data.payment_account_id,
      p_destination_account_id: data.credit_card_id,
      p_credit_card_id: data.credit_card_id,
      p_description: data.description || null,
    });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Controller name="credit_card_id" control={control} render={({ field }) => (
        <Select label="Credit card" required value={field.value} onValueChange={field.onChange} error={errors.credit_card_id?.message} options={cards.map((c) => ({ value: c.id, label: c.nickname }))} placeholder="Select card" />
      )} />
      <Controller name="amount" control={control} render={({ field }) => (
        <CurrencyInput label="Payment amount" required size="lg" error={errors.amount?.message} value={field.value} onChange={field.onChange} />
      )} />
      <Controller name="payment_account_id" control={control} render={({ field }) => (
        <Select label="Payment account" required value={field.value} onValueChange={field.onChange} error={errors.payment_account_id?.message} options={accounts.map((a) => ({ value: a.account_id, label: a.name }))} placeholder="Select account" />
      )} />
      <Input label="Date" type="date" required error={errors.transaction_date?.message} {...register('transaction_date')} />
      <Input label="Note" optional {...register('description')} />
      <Button type="submit" fullWidth size="lg" loading={submitting}>Record Card Payment</Button>
    </form>
  );
};
