import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { parseError } from '@/lib/errors/handler';
import { todayString } from '@/lib/dates/formatter';
import { loanSchema, type LoanData } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Switch } from '@/components/ui/Card';

export const AddLoanPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { success, error: showError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<LoanData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      loan_type: 'bank',
      interest_type: 'fixed',
      payment_frequency: 'monthly',
      start_date: todayString(),
      include_in_net_worth: true,
    },
  });

  const onSubmit = async (data: LoanData) => {
    if (!user) return;
    setSubmitting(true);

    try {
      // Step 1: Create linked liability account for the loan
      const { data: newAcc, error: accErr } = await (supabase.from('financial_accounts') as any)
        .insert({
          user_id: user.id,
          name: `Loan: ${data.name}`,
          account_type: 'loan',
          account_class: 'liability',
          institution: data.lender_name,
          currency_code: 'BDT',
          opening_balance: data.opening_outstanding ?? data.original_principal,
          opening_balance_date: data.start_date,
          include_in_total: false,
          include_in_net_worth: data.include_in_net_worth,
        })
        .select('id')
        .single();

      if (accErr) throw accErr;

      // Step 2: Create loan record linked to account
      const { error: loanErr } = await (supabase.from('loans') as any)
        .insert({
          user_id: user.id,
          account_id: newAcc.id,
          name: data.name,
          loan_type: data.loan_type,
          lender_name: data.lender_name,
          original_principal: data.original_principal,
          opening_outstanding: data.opening_outstanding ?? data.original_principal,
          interest_type: data.interest_type,
          annual_rate: data.annual_rate || null,
          monthly_installment: data.monthly_installment || null,
          payment_frequency: data.payment_frequency,
          start_date: data.start_date,
          first_payment_date: data.first_payment_date || null,
          next_payment_date: data.first_payment_date || null,
          linked_account_id: data.linked_account_id || null,
          notes: data.notes || null,
          include_in_net_worth: data.include_in_net_worth,
          status: 'active',
        });

      if (loanErr) throw loanErr;

      // Step 3: Post opening balance for loan liability
      const initialOutstanding = data.opening_outstanding ?? data.original_principal;
      if (initialOutstanding > 0 && newAcc) {
        await supabase.rpc('post_transaction', {
          p_transaction_type: 'opening_balance',
          p_transaction_date: data.start_date,
          p_title: `Opening Loan Principal — ${data.name}`,
          p_amount: initialOutstanding,
          p_account_id: newAcc.id,
        } as unknown as never);
      }

      success('Loan added', `${data.name} recorded successfully.`);
      navigate('/dashboard/loans');
    } catch (err) {
      showError('Failed to record loan', parseError(err).message);
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
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            Add Loan
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            Record a bank loan, personal loan, or debt
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 max-w-lg">
        <Input
          label="Loan Title"
          required
          placeholder="e.g. DBBL Home Loan, Personal Loan from Uncle"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Lender / Financial Institution Name"
          required
          placeholder="e.g. BRAC Bank, City Bank, Relative"
          error={errors.lender_name?.message}
          {...register('lender_name')}
        />

        <Controller
          name="loan_type"
          control={control}
          render={({ field }) => (
            <Select
              label="Loan Type"
              required
              value={field.value}
              onValueChange={field.onChange}
              options={[
                { value: 'personal', label: 'Personal Loan' },
                { value: 'bank', label: 'Bank Loan' },
                { value: 'business', label: 'Business Loan' },
                { value: 'education', label: 'Education Loan' },
                { value: 'family_friend', label: 'Family / Friend Loan' },
                { value: 'installment', label: 'Installment Purchase (EMI)' },
                { value: 'other', label: 'Other' },
              ]}
            />
          )}
        />

        <Controller
          name="original_principal"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              label="Original Principal Amount"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.original_principal?.message}
            />
          )}
        />

        <Controller
          name="opening_outstanding"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              label="Current Outstanding Principal"
              optional
              description="Leave empty if full principal is currently owed"
              value={field.value ?? 0}
              onChange={field.onChange}
              error={errors.opening_outstanding?.message}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <Controller
            name="interest_type"
            control={control}
            render={({ field }) => (
              <Select
                label="Interest Type"
                required
                value={field.value}
                onValueChange={field.onChange}
                options={[
                  { value: 'fixed', label: 'Fixed Interest' },
                  { value: 'reducing_balance', label: 'Reducing Balance' },
                  { value: 'interest_free', label: 'Interest Free' },
                  { value: 'unknown', label: 'Unknown / Flat' },
                ]}
              />
            )}
          />

          <Input
            label="Annual Interest Rate (%)"
            type="number"
            step="0.01"
            optional
            placeholder="e.g. 9.0"
            error={errors.annual_rate?.message}
            {...register('annual_rate')}
          />
        </div>

        <Controller
          name="monthly_installment"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              label="Monthly Installment (EMI)"
              optional
              value={field.value ?? 0}
              onChange={field.onChange}
              error={errors.monthly_installment?.message}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Date"
            type="date"
            required
            error={errors.start_date?.message}
            {...register('start_date')}
          />

          <Input
            label="Next Payment Due Date"
            type="date"
            optional
            error={errors.first_payment_date?.message}
            {...register('first_payment_date')}
          />
        </div>

        <Controller
          name="include_in_net_worth"
          control={control}
          render={({ field }) => (
            <Switch
              label="Include in Net Worth"
              description="Deduct outstanding loan balance from net worth"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />

        <Textarea
          label="Notes"
          optional
          placeholder="Sanction letter memo, account number, or notes"
          error={errors.notes?.message}
          {...register('notes')}
        />

        <Button type="submit" fullWidth size="lg" loading={submitting} className="mt-6">
          Record Loan
        </Button>
      </form>
    </div>
  );
};
