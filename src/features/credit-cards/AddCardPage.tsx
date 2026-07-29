import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/mongodb/client';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { parseError } from '@/lib/errors/handler';
import { creditCardSchema, type CreditCardData } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

export const AddCardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { success, error: showError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<CreditCardData>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      opening_outstanding: 0,
    },
  });

  const onSubmit = async (data: CreditCardData) => {
    if (!user) return;
    setSubmitting(true);

    try {
      // Step 1: Create linked liability account for credit card
      const { data: newAcc, error: accErr } = await (supabase.from('financial_accounts') as any)
        .insert({
          user_id: user.id,
          name: `Card: ${data.nickname}`,
          account_type: 'credit_card',
          account_class: 'liability',
          institution: data.issuer,
          currency_code: 'BDT',
          opening_balance: data.opening_outstanding,
          opening_balance_date: new Date().toISOString().split('T')[0],
          credit_limit: data.credit_limit,
          last_four: data.last_four || null,
          include_in_total: false,
          include_in_net_worth: true,
        })
        .select('id')
        .single();

      if (accErr) throw accErr;

      // Step 2: Create credit card record
      const { error: cardErr } = await (supabase.from('credit_cards') as any)
        .insert({
          user_id: user.id,
          account_id: newAcc.id,
          nickname: data.nickname,
          issuer: data.issuer,
          last_four: data.last_four || null,
          credit_limit: data.credit_limit,
          opening_outstanding: data.opening_outstanding,
          statement_day: data.statement_day || null,
          payment_due_day: data.payment_due_day || null,
          minimum_payment: data.minimum_payment || null,
          notes: data.notes || null,
          status: 'active',
        });

      if (cardErr) throw cardErr;

      // Step 3: Post opening balance if > 0
      if (data.opening_outstanding > 0 && newAcc) {
        await supabase.rpc('post_transaction', {
          p_transaction_type: 'opening_balance',
          p_transaction_date: new Date().toISOString().split('T')[0],
          p_title: `Opening Credit Card Balance — ${data.nickname}`,
          p_amount: data.opening_outstanding,
          p_account_id: newAcc.id,
        } as unknown as never);
      }

      success('Credit card added', `${data.nickname} created successfully.`);
      navigate('/credit-cards');
    } catch (err) {
      showError('Failed to add credit card', parseError(err).message);
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
            Add Credit Card
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            Track card limit, statement date, and current balance
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 max-w-lg">
        <Input
          label="Card Nickname"
          required
          placeholder="e.g. City Bank AMEX Platinum, EBL Visa Signature"
          error={errors.nickname?.message}
          {...register('nickname')}
        />

        <Input
          label="Issuer Bank / Institution"
          required
          placeholder="e.g. City Bank, Eastern Bank, Standard Chartered"
          error={errors.issuer?.message}
          {...register('issuer')}
        />

        <Input
          label="Last 4 Digits"
          optional
          placeholder="4321"
          maxLength={4}
          error={errors.last_four?.message}
          {...register('last_four')}
        />

        <Controller
          name="credit_limit"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              label="Credit Limit"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.credit_limit?.message}
            />
          )}
        />

        <Controller
          name="opening_outstanding"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              label="Current Owed Balance (Outstanding)"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.opening_outstanding?.message}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Statement Day of Month (1-31)"
            type="number"
            min={1}
            max={31}
            optional
            placeholder="e.g. 15"
            error={errors.statement_day?.message}
            {...register('statement_day')}
          />

          <Input
            label="Payment Due Day of Month (1-31)"
            type="number"
            min={1}
            max={31}
            optional
            placeholder="e.g. 5"
            error={errors.payment_due_day?.message}
            {...register('payment_due_day')}
          />
        </div>

        <Textarea
          label="Notes"
          optional
          placeholder="Reward points rules, annual fee date, or perks"
          error={errors.notes?.message}
          {...register('notes')}
        />

        <Button type="submit" fullWidth size="lg" loading={submitting} className="mt-6">
          Save Credit Card
        </Button>
      </form>
    </div>
  );
};
