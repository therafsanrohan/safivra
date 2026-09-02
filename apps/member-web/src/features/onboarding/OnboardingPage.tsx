import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, Landmark, Smartphone, Coins, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { parseError } from '@/lib/errors/handler';
import { todayString } from '@/lib/dates/formatter';
import { accountSchema, type AccountData } from '@/lib/validation/schemas';
import { APP_CONFIG } from '@/config/app';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

const ACCOUNT_TYPES = [
  { id: 'cash', label: 'Physical Cash', icon: Coins, desc: 'Money in your physical wallet' },
  { id: 'bank', label: 'Bank Account', icon: Landmark, desc: 'Checking or salary account' },
  { id: 'mobile_financial_service', label: 'Mobile Wallet', icon: Smartphone, desc: 'bKash, Nagad, Rocket, etc.' },
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading } = useAuthContext();
  const { success, error: showError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<AccountData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      account_type: 'cash',
      opening_balance: 0,
      opening_balance_date: todayString(),
      include_in_total: true,
      include_in_net_worth: true,
    },
  });

  const selectedType = watch('account_type');

  // Prevent users who have completed onboarding from accessing this page
  if (!loading && profile?.onboarding_completed) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: AccountData) => {
    if (!user) return;
    setSubmitting(true);

    try {
      // 1. Create first account
      const { data: newAccount, error: accError } = await (supabase.from('financial_accounts') as any)
        .insert({
          user_id: user.id,
          name: data.name || 'Primary Wallet', // Fallback name
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
          p_title: `Opening Balance — ${data.name || 'Primary Wallet'}`,
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
      navigate('/dashboard', { replace: true });
    } catch (err) {
      showError('Onboarding failed', parseError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-svh flex items-center justify-center bg-[var(--color-bg-page)] relative overflow-hidden px-4">
      {/* Background aesthetics */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-600/20 to-transparent -z-10" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-emerald-400/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-xl bg-[var(--color-bg-surface)] rounded-3xl shadow-xl overflow-hidden border border-[var(--color-border)]">
        <div className="p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Wallet size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Welcome to Safivra</h1>
              <p className="text-[var(--color-text-secondary)] text-sm">Let&apos;s set up your primary account</p>
            </div>
          </div>

          {/* Stepper indicator */}
          <div className="flex items-center mb-8 gap-2">
            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-[var(--color-bg-subtle)]'}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-[var(--color-bg-subtle)]'}`} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">What kind of account is this?</h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">Choose where you keep your most frequently used money.</p>
                  
                  <div className="space-y-3">
                    {ACCOUNT_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedType === type.id;
                      return (
                        <div
                          key={type.id}
                          onClick={() => setValue('account_type', type.id as any)}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-[var(--color-border)] hover:border-emerald-200 dark:hover:border-emerald-500/30'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSelected ? 'bg-emerald-500 text-white' : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]'}`}>
                            <Icon size={24} />
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-[var(--color-text-primary)]'}`}>{type.label}</h3>
                            <p className="text-sm text-[var(--color-text-secondary)]">{type.desc}</p>
                          </div>
                          {isSelected && <CheckCircle2 className="text-emerald-500" size={24} />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="button" size="lg" onClick={() => setStep(2)} className="gap-2 px-8">
                    Next Step <ChevronRight size={18} />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Account Details</h2>
                  
                  <div className="space-y-5">
                    <Input
                      label="Account Name"
                      required
                      placeholder={
                        selectedType === 'bank' ? 'e.g. City Bank Salary' : 
                        selectedType === 'mobile_financial_service' ? 'e.g. Personal bKash' : 
                        'e.g. Main Wallet'
                      }
                      error={errors.name?.message}
                      {...register('name')}
                    />

                    <Controller
                      name="opening_balance"
                      control={control}
                      render={({ field }) => (
                        <CurrencyInput
                          label="Current Balance"
                          required
                          description="How much money is in this account right now?"
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.opening_balance?.message}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20 flex items-start gap-3 mt-4">
                  <ShieldCheck className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" size={20} />
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Your data is secured with AES-256 encryption. We never connect directly to your bank account or store your bank credentials.
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={submitting}>
                    Back
                  </Button>
                  <Button type="submit" size="lg" loading={submitting} className="gap-2 px-8">
                    Complete Setup <CheckCircle2 size={18} />
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
