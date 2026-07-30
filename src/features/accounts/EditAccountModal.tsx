import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Switch } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { parseError } from '@/lib/errors/handler';

const editAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(80),
  institution: z.string().max(100).optional(),
  credit_limit: z.coerce.number().min(0, 'Credit limit must be zero or positive').optional(),
  include_in_total: z.boolean(),
  include_in_net_worth: z.boolean(),
  notes: z.string().max(500).optional(),
});

type EditAccountData = z.infer<typeof editAccountSchema>;

interface EditAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: any;
  onSuccess: () => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  open,
  onOpenChange,
  account,
  onSuccess,
}) => {
  const { success, error: showError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<EditAccountData>({
    resolver: zodResolver(editAccountSchema),
  });

  // Populate form when account data is available or modal opens
  useEffect(() => {
    if (account && open) {
      reset({
        name: account.name || '',
        institution: account.institution || '',
        credit_limit: account.credit_limit ? Number(account.credit_limit) : undefined,
        include_in_total: account.include_in_total ?? true,
        include_in_net_worth: account.include_in_net_worth ?? true,
      });
    }
  }, [account, open, reset]);

  const onSubmit = async (data: EditAccountData) => {
    if (!account) return;
    setSubmitting(true);

    try {
      const { error } = await (supabase as any)
        .from('financial_accounts')
        .update({
          name: data.name,
          institution: data.institution || null,
          credit_limit: data.credit_limit ? String(data.credit_limit) : null,
          include_in_total: data.include_in_total,
          include_in_net_worth: data.include_in_net_worth,
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.account_id);

      if (error) throw error;
      
      success('Account updated successfully');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      showError('Failed to update account', parseError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const isCreditCard = account?.account_class === 'liability' && account?.account_type === 'credit_card';

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Edit Account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Account Name"
          required
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Institution / Bank (Optional)"
          error={errors.institution?.message}
          {...register('institution')}
        />

        {isCreditCard && (
          <Controller
            control={control}
            name="credit_limit"
            render={({ field }) => (
              <CurrencyInput
                label="Credit Limit (Optional)"
                value={field.value ?? 0}
                onChange={field.onChange}
                error={errors.credit_limit?.message}
              />
            )}
          />
        )}

        <div className="space-y-3 pt-2">
          <Controller
            control={control}
            name="include_in_total"
            render={({ field }) => (
              <Switch
                label="Include in Total Balances"
                description="Show this account in overall dashboard totals"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="include_in_net_worth"
            render={({ field }) => (
              <Switch
                label="Include in Net Worth"
                description="Count this account when calculating your net worth"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} fullWidth>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} fullWidth>
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
