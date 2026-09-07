import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Wallet, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/ui/Toast';
import { parseError } from '@/lib/errors/handler';
import { todayString } from '@/lib/dates/formatter';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

const onboardingSchema = z.object({
  // Step 1: Personal Profile
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  date_of_birth: z.string().min(1, 'Please enter a valid date of birth'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Please select your gender' }),
  }),
  phone: z.string().optional(),

  // Step 2: Financial Account & Preferences
  preferred_currency: z.string().default('BDT'),
  account_name: z.string().trim().min(1, 'Account name is required'),
  account_type: z.enum(['cash', 'bank', 'mobile_financial_service', 'savings']),
  opening_balance: z.number().min(0, 'Starting balance cannot be negative'),
  opening_balance_date: z.string().default(todayString()),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, updateProfile, refreshProfile } = useAuthContext();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      full_name: profile?.full_name || user?.user_metadata?.full_name || '',
      date_of_birth: profile?.date_of_birth || '',
      gender: (profile?.gender as 'male' | 'female' | 'other') || undefined,
      phone: profile?.phone || '',
      preferred_currency: profile?.preferred_currency || 'BDT',
      account_name: 'Physical Cash',
      account_type: 'cash',
      opening_balance: 0,
      opening_balance_date: todayString(),
    },
  });

  // Save intermediate state to Supabase when moving to step 2
  const handleNextStep = async () => {
    const isStep1Valid = await trigger(['full_name', 'date_of_birth', 'gender', 'phone']);
    if (!isStep1Valid) return;

    const values = getValues();
    // Persist in-progress state to Supabase so user doesn't lose progress
    if (user) {
      updateProfile({
        full_name: values.full_name,
        date_of_birth: values.date_of_birth,
        gender: values.gender,
        phone: values.phone || null,
        onboarding_status: 'in_progress',
      }).catch((err) => {
        console.warn('[Onboarding] Could not save intermediate progress:', err);
      });
    }

    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const onSubmit = async (data: OnboardingFormData) => {
    if (!user) return;
    setSubmitting(true);

    try {
      // 1. Create first financial account
      const { data: newAccount, error: accError } = await (supabase.from('financial_accounts') as any)
        .insert({
          user_id: user.id,
          name: data.account_name,
          account_type: data.account_type,
          account_class: 'asset',
          currency_code: data.preferred_currency || 'BDT',
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
          p_title: `Opening Balance — ${data.account_name}`,
          p_amount: data.opening_balance,
          p_account_id: newAccount.id,
        } as unknown as never);
      }

      // 3. Atomically finalize onboarding status in profile
      const completedAt = new Date().toISOString();
      const profileUpdateResult = await updateProfile({
        full_name: data.full_name,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        phone: data.phone || null,
        preferred_currency: data.preferred_currency || 'BDT',
        onboarding_status: 'completed',
        onboarding_completed: true,
        onboarding_completed_at: completedAt,
        onboarding_version: 'v1',
      });

      if (profileUpdateResult.error) {
        throw new Error(profileUpdateResult.error);
      }

      await refreshProfile();

      success(t.onboarding.successTitle, t.onboarding.successDesc);

      // Safe navigation to requested route or dashboard
      const from = (location.state as { from?: string })?.from;
      const destination = from && from.startsWith('/') && !from.startsWith('/onboarding')
        ? from
        : '/dashboard';

      navigate(destination, { replace: true });
    } catch (err) {
      showError(t.onboarding.errorTitle, parseError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-[var(--color-bg-page)] px-4 py-8 sm:px-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Header & Logo */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-soft)] flex items-center justify-center mx-auto mb-3 shadow-xs">
            {currentStep === 1 ? (
              <User size={24} className="text-[var(--color-accent)]" />
            ) : (
              <Wallet size={24} className="text-[var(--color-accent)]" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {t.onboarding.welcomeTitle}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto">
            {t.onboarding.welcomeSubtitle}
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="bg-[var(--color-bg-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
              {t.onboarding.stepProgress.replace('{{current}}', String(currentStep)).replace('{{total}}', '2')}
            </span>
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              {currentStep === 1 ? t.onboarding.step1Title : t.onboarding.step2Title}
            </span>
          </div>
          <div className="w-full bg-[var(--color-bg-subtle)] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[var(--color-accent)] h-full transition-all duration-300 ease-out"
              style={{ width: currentStep === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {/* Onboarding Form Card */}
        <div className="bg-[var(--color-bg-surface)] p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* STEP 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="border-b border-[var(--color-border)] pb-3 mb-4">
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    {t.onboarding.step1Title}
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {t.onboarding.step1Desc}
                  </p>
                </div>

                {/* 1. Full Name */}
                <Input
                  label={t.onboarding.fullNameLabel}
                  required
                  placeholder={t.onboarding.fullNamePlaceholder}
                  error={errors.full_name?.message}
                  {...register('full_name')}
                />

                {/* 2. Date of Birth */}
                <Input
                  label={t.onboarding.dobLabel}
                  type="date"
                  required
                  error={errors.date_of_birth?.message}
                  {...register('date_of_birth')}
                />

                {/* 3. Gender */}
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={t.onboarding.genderLabel}
                      required
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      error={errors.gender?.message}
                      options={[
                        { value: 'male', label: t.onboarding.genderMale },
                        { value: 'female', label: t.onboarding.genderFemale },
                        { value: 'other', label: t.onboarding.genderOther },
                      ]}
                    />
                  )}
                />

                {/* 4. Phone Number (Optional) */}
                <Input
                  label={t.onboarding.phoneLabel}
                  placeholder={t.onboarding.phonePlaceholder}
                  error={errors.phone?.message}
                  {...register('phone')}
                />

                <Button
                  type="button"
                  fullWidth
                  size="lg"
                  onClick={handleNextStep}
                  className="mt-6 flex items-center justify-center gap-2"
                >
                  <span>{t.onboarding.nextBtn}</span>
                  <ArrowRight size={18} />
                </Button>
              </div>
            )}

            {/* STEP 2: Financial Account & Preferences */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="border-b border-[var(--color-border)] pb-3 mb-4">
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    {t.onboarding.step2Title}
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {t.onboarding.step2Desc}
                  </p>
                </div>

                {/* First Account Name */}
                <Input
                  label={t.onboarding.accountNameLabel}
                  required
                  placeholder={t.onboarding.accountNamePlaceholder}
                  error={errors.account_name?.message}
                  {...register('account_name')}
                />

                {/* Account Type */}
                <Controller
                  name="account_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={t.onboarding.accountTypeLabel}
                      required
                      value={field.value}
                      onValueChange={field.onChange}
                      options={[
                        { value: 'cash', label: t.onboarding.accountTypeCash },
                        { value: 'bank', label: t.onboarding.accountTypeBank },
                        { value: 'mobile_financial_service', label: t.onboarding.accountTypeMfs },
                        { value: 'savings', label: t.onboarding.accountTypeSavings },
                      ]}
                    />
                  )}
                />

                {/* Starting Balance */}
                <Controller
                  name="opening_balance"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      label={t.onboarding.startingBalanceLabel}
                      required
                      description={t.onboarding.startingBalanceDesc}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.opening_balance?.message}
                    />
                  )}
                />

                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handlePrevStep}
                    disabled={submitting}
                    className="flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft size={18} />
                    <span>{t.onboarding.backBtn}</span>
                  </Button>

                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    loading={submitting}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    <span>{t.onboarding.submitBtn}</span>
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
