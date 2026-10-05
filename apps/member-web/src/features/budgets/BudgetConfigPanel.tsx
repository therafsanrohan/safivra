import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { Card, Spinner } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { useToast } from '@/components/ui/Toast';
import { Settings2, Home, UtensilsCrossed, Car, Zap, HeartHandshake, ShieldCheck, Users } from 'lucide-react';

interface BudgetConfigPanelProps {
  onConfigUpdated?: () => void;
}

interface BudgetConfig {
  household_size: number;
  dependents_count: number;
  emergency_target_months: number;
  minimum_buffer_amount: number;
  rent_estimate: number;
  food_estimate: number;
  transport_estimate: number;
  utilities_estimate: number;
  family_support_estimate: number;
}

const defaultConfig: BudgetConfig = {
  household_size: 1,
  dependents_count: 0,
  emergency_target_months: 3,
  minimum_buffer_amount: 5000,
  rent_estimate: 0,
  food_estimate: 0,
  transport_estimate: 0,
  utilities_estimate: 0,
  family_support_estimate: 0,
};

export const BudgetConfigPanel: React.FC<BudgetConfigPanelProps> = ({ onConfigUpdated }) => {
  const { user } = useAuthContext();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BudgetConfig>(defaultConfig);

  const fetchConfig = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await (supabase.from('budget_configurations') as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setConfig({
          household_size: data.household_size ?? 1,
          dependents_count: data.dependents_count ?? 0,
          emergency_target_months: Number(data.emergency_target_months) ?? 3,
          minimum_buffer_amount: Number(data.minimum_buffer_amount) ?? 5000,
          rent_estimate: Number(data.rent_estimate) || 0,
          food_estimate: Number(data.food_estimate) || 0,
          transport_estimate: Number(data.transport_estimate) || 0,
          utilities_estimate: Number(data.utilities_estimate) || 0,
          family_support_estimate: Number(data.family_support_estimate) || 0,
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        household_size: config.household_size,
        dependents_count: config.dependents_count,
        emergency_target_months: config.emergency_target_months.toString(),
        minimum_buffer_amount: config.minimum_buffer_amount.toString(),
        rent_estimate: config.rent_estimate > 0 ? config.rent_estimate.toString() : null,
        food_estimate: config.food_estimate > 0 ? config.food_estimate.toString() : null,
        transport_estimate: config.transport_estimate > 0 ? config.transport_estimate.toString() : null,
        utilities_estimate: config.utilities_estimate > 0 ? config.utilities_estimate.toString() : null,
        family_support_estimate: config.family_support_estimate > 0 ? config.family_support_estimate.toString() : null,
      };

      const { error } = await (supabase.from('budget_configurations') as any)
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;
      success('Budget Config Saved', 'Your essential estimates and settings have been updated.');
      if (onConfigUpdated) onConfigUpdated();
    } catch (err: any) {
      showError('Error', err.message || 'Failed to save budget configuration');
    } finally {
      setSaving(false);
    }
  };

  const totalEstimated =
    config.rent_estimate +
    config.food_estimate +
    config.transport_estimate +
    config.utilities_estimate +
    config.family_support_estimate;

  if (loading) {
    return <div className="py-8 flex justify-center"><Spinner size={24} /></div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-lg text-[var(--color-text-primary)] flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-[var(--color-accent)]" />
          Budget Configuration
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          Set your household context and essential cost estimates. These are used to calculate your Safe-to-Spend when transaction history is limited.
        </p>
      </div>

      {/* Household Context */}
      <Card className="p-5 border-[var(--color-border)] space-y-4">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" /> Household Context
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Household Size
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.household_size}
              onChange={(e) => setConfig(prev => ({ ...prev, household_size: Number(e.target.value) }))}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Dependents
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={config.dependents_count}
              onChange={(e) => setConfig(prev => ({ ...prev, dependents_count: Number(e.target.value) }))}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Emergency Fund Target (months)
            </label>
            <input
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={config.emergency_target_months}
              onChange={(e) => setConfig(prev => ({ ...prev, emergency_target_months: Number(e.target.value) }))}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>

        <div>
          <CurrencyInput
            label="Minimum Monthly Cash Buffer (always keep in account)"
            value={config.minimum_buffer_amount}
            onChange={(val) => setConfig(prev => ({ ...prev, minimum_buffer_amount: val }))}
          />
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
            This amount is always reserved on top of all other expenses. Recommended: 5,000–15,000 BDT.
          </p>
        </div>
      </Card>

      {/* Essential Monthly Expense Estimates */}
      <Card className="p-5 border-[var(--color-border)] space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Essential Monthly Expense Estimates
          </h4>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Used to determine your Essentials layer and Emergency Fund target. Leave at 0 to use the automatic 55% of income heuristic.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0 mt-5">
              <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <CurrencyInput
                label="Rent / Housing"
                value={config.rent_estimate}
                onChange={(val) => setConfig(prev => ({ ...prev, rent_estimate: val }))}
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0 mt-5">
              <UtensilsCrossed className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <CurrencyInput
                label="Food & Groceries"
                value={config.food_estimate}
                onChange={(val) => setConfig(prev => ({ ...prev, food_estimate: val }))}
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center shrink-0 mt-5">
              <Car className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <CurrencyInput
                label="Transport & Commute"
                value={config.transport_estimate}
                onChange={(val) => setConfig(prev => ({ ...prev, transport_estimate: val }))}
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 flex items-center justify-center shrink-0 mt-5">
              <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <CurrencyInput
                label="Utilities (Internet, Electricity, Gas)"
                value={config.utilities_estimate}
                onChange={(val) => setConfig(prev => ({ ...prev, utilities_estimate: val }))}
              />
            </div>
          </div>

          <div className="flex items-start gap-3 sm:col-span-2">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0 mt-5">
              <HeartHandshake className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex-1">
              <CurrencyInput
                label="Family Support / Bari Taka"
                value={config.family_support_estimate}
                onChange={(val) => setConfig(prev => ({ ...prev, family_support_estimate: val }))}
              />
            </div>
          </div>
        </div>

        {/* Total Summary */}
        {totalEstimated > 0 && (
          <div className="flex items-center justify-between p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-sm">
            <span className="text-emerald-800 dark:text-emerald-300 font-medium">Total Essential Estimate</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
              ৳ {totalEstimated.toLocaleString('en-BD')} / month
            </span>
          </div>
        )}
      </Card>

      <Button type="submit" fullWidth disabled={saving} className="mt-2">
        {saving ? 'Saving...' : 'Save Budget Configuration'}
      </Button>
    </form>
  );
};
