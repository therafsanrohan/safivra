import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet } from 'lucide-react';
import { supabase } from '@/lib/mongodb/client';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { parseError } from '@/lib/errors/handler';
import { todayString } from '@/lib/dates/formatter';
import { accountSchema, type AccountData } from '@/lib/validation/schemas';
import { APP_CONFIG } from '@/config/app';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuthContext();
  const { success, error: showError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<AccountData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: 'Main Cash',
      account_type: 'cash',
      opening_balance: 0,
      opening_balance_date: todayString(),
      include_in_total: true,
      include_in_net_worth: true,
    },
  });

  const onSubmit = async (data: AccountData) => {
    if (!user) return;
    setSubmitting(true);

    try {
      // 1. Create first account
      const { data: newAccount, error: accError } = await (supabase.from('financial_accounts') as any)
        .insert({
          user_id: user.id,
          name: data.name,
          account_type: data.account_type,
          account_class: 'asset',
          currency_code: 'BDT',
          opening_balance: data.opening_balance,
          opening_balance_date: data.opening_balance_date,
          include_in_total: true,
          include_in_net_worth: true,
        })
        .select('id')
        .single();

      if (accError) throw accError;

      // 2. Post opening balance transaction if > 0
      if (data.opening_balance > 0 && newAccount) {
        await supabase.rpc('post_transaction', {
          p_transaction_type: 'opening_balance',
          p_transaction_date: data.opening_balance_date,
          p_title: `Opening Balance — ${data.name}`,
          p_amount: data.opening_balance,
          p_account_id: newAccount.id,
        } as unknown as never);
      }

      // 3. Mark onboarding complete in profile
      const { error: profileError } = await (supabase.from('profiles') as any)
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await refreshProfile();
      success('Welcome to Safivra!', 'Your first account has been set up.');
      navigate('/');
    } catch (err) {
      showError('Onboarding failed', parseError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-[var(--color-bg-page)] px-5 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center mx-auto mb-4">
            <Wallet size={24} className="text-[var(--color-accent)]" />
          </div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            Welcome to {APP_CONFIG.name}
          </h1>
          <p className="text-[var(--text-body)] text-[var(--color-text-secondary)] mt-1">
            Let&apos;s set up your first financial account to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 bg-white p-6 rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-sm">
          <Input
            label="First Account Name"
            required
            placeholder="e.g. Physical Cash, City Bank, bKash"
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
                options={[
                  { value: 'cash', label: 'Physical Cash' },
                  { value: 'bank', label: 'Bank Account' },
                  { value: 'mobile_financial_service', label: 'bKash / Nagad / Rocket' },
                  { value: 'savings', label: 'Savings Deposit' },
                ]}
              />
            )}
          />

          <Controller
            name="opening_balance"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label="Current Starting Balance"
                required
                description="Initial balance as of today"
                value={field.value}
                onChange={field.onChange}
                error={errors.opening_balance?.message}
              />
            )}
          />

          <Button type="submit" fullWidth size="lg" loading={submitting} className="mt-6">
            Complete Setup & Start
          </Button>
        </form>
      </div>
    </div>
  );
};
