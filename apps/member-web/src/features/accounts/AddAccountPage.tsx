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
import { accountSchema, type AccountData } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Switch } from '@/components/ui/Card';
import type { Database } from '@/types/database';

type AccountType = Database['public']['Enums']['account_type'];
type AccountClass = Database['public']['Enums']['account_class'];

const ACCOUNT_TYPES: Array<{ value: AccountType; label: string; class: AccountClass }> = [
  { value: 'cash', label: 'Physical Cash', class: 'asset' },
  { value: 'bank', label: 'Bank Account (Checking/Savings)', class: 'asset' },
  { value: 'mobile_financial_service', label: 'Mobile Financial Service (bKash/Nagad/Rocket)', class: 'asset' },
  { value: 'savings', label: 'DPS / Fixed Deposit (FDR)', class: 'asset' },
  { value: 'investment', label: 'Stocks / Mutual Funds / Gold', class: 'asset' },
  { value: 'receivable', label: 'Receivable / Money Lent', class: 'asset' },
  { value: 'other_asset', label: 'Other Asset', class: 'asset' },
  { value: 'other_liability', label: 'Other Liability', class: 'liability' },
];

export const AddAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { success, error: showError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<AccountData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      account_type: 'bank',
      opening_balance: 0,
      opening_balance_date: todayString(),
      include_in_total: true,
      include_in_net_worth: true,
    },
  });

  const selectedType = watch('account_type');
  const typeObj = ACCOUNT_TYPES.find((t) => t.value === selectedType);
  const isCreditCard = selectedType === 'credit_card';

  const onSubmit = async (data: AccountData) => {
    if (!user) return;
    setSubmitting(true);

    try {
      const accountClass: AccountClass = typeObj?.class ?? 'asset';

      // Insert account record with opening_balance 0 (the actual opening balance is posted cleanly via ledger entry below)
      const { data: newAccount, error: accError } = await (supabase.from('financial_accounts') as any)
        .insert({
          user_id: user.id,
          name: data.name,
          account_type: data.account_type,
          account_class: accountClass,
          institution: data.institution || null,
          currency_code: 'BDT',
          opening_balance: 0,
          opening_balance_date: data.opening_balance_date,
          last_four: data.last_four || null,
          credit_limit: data.credit_limit ? String(data.credit_limit) : null,
          include_in_total: data.include_in_total,
          include_in_net_worth: data.include_in_net_worth,
          notes: data.notes || null,
        })
        .select('id')
        .single();

      if (accError) throw accError;

      // Post opening balance transaction if > 0
      if (data.opening_balance > 0 && newAccount) {
        const { error: rpcError } = await supabase.rpc('post_transaction', {
          p_transaction_type: 'opening_balance',
          p_transaction_date: data.opening_balance_date,
          p_title: `Opening Balance — ${data.name}`,
          p_amount: data.opening_balance,
          p_account_id: newAccount.id,
        } as unknown as never);
        if (rpcError) throw rpcError;
      }

      success('Account created', `${data.name} has been added successfully.`);
      navigate('/dashboard/accounts');
    } catch (err: any) {
      console.error(err);
      let errMsg = parseError(err).message;
      if (errMsg === 'An unexpected error occurred. Please try again.' && err && typeof err === 'object') {
        errMsg = err.message || JSON.stringify(err);
      }
      showError('Failed to create account', errMsg);
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
            Add Account
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            Add a new financial account or wallet
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 max-w-lg">
        <Input
          label="Account Name"
          required
          placeholder="e.g. City Bank Salary, bKash Personal, Main Cash"
          error={errors.name?.message}
          {...register('name')}
        />

        <Controller
          name="account_type"
          control={control}
          render={({ field }) => (
            <Select
              label="Account Type"
              required
              value={field.value}
              onValueChange={field.onChange}
              options={ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              error={errors.account_type?.message}
            />
          )}
        />

        <Input
          label="Financial Institution"
          optional
          placeholder="e.g. Dutch-Bangla Bank, bKash, BRAC Bank"
          error={errors.institution?.message}
          {...register('institution')}
        />

        <Controller
          name="opening_balance"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              label="Opening Balance"
              required
              description="Initial balance on start date"
              value={field.value}
              onChange={field.onChange}
              error={errors.opening_balance?.message}
            />
          )}
        />

        <Input
          label="Opening Balance Date"
          type="date"
          required
          error={errors.opening_balance_date?.message}
          {...register('opening_balance_date')}
        />

        {isCreditCard && (
          <>
            <Controller
              name="credit_limit"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  label="Credit Limit"
                  optional
                  value={field.value ?? 0}
                  onChange={field.onChange}
                  error={errors.credit_limit?.message}
                />
              )}
            />

            <Input
              label="Last 4 Digits"
              optional
              placeholder="1234"
              maxLength={4}
              error={errors.last_four?.message}
              {...register('last_four')}
            />
          </>
        )}

        <div className="pt-2 space-y-4 border-t border-[var(--color-border)]">
          <Controller
            name="include_in_total"
            control={control}
            render={({ field }) => (
              <Switch
                label="Include in Total Available Balance"
                description="Show balance in primary liquidity total on Dashboard"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <Controller
            name="include_in_net_worth"
            control={control}
            render={({ field }) => (
              <Switch
                label="Include in Net Worth"
                description="Include this account in your overall net worth calculations"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        <Textarea
          label="Notes"
          optional
          placeholder="Account number, branch details, or memo"
          error={errors.notes?.message}
          {...register('notes')}
        />

        <Button type="submit" fullWidth size="lg" loading={submitting} className="mt-6">
          Save Account
        </Button>
      </form>
    </div>
  );
};
