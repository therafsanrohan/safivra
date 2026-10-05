import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { Card, Spinner } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { Plus, CalendarDays, Trash2, ShieldAlert } from 'lucide-react';
import { SinkingFundItem } from '@/lib/budget/budgetEngine';

interface SinkingFundsManagerProps {
  onFundsUpdated?: () => void;
}

export const SinkingFundsManager: React.FC<SinkingFundsManagerProps> = ({ onFundsUpdated }) => {
  const { user } = useAuthContext();
  const { success, error: showError } = useToast();
  const [funds, setFunds] = useState<SinkingFundItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [annualCost, setAnnualCost] = useState<number>(24000);
  const [targetMonth, setTargetMonth] = useState<number>(6);

  const fetchFunds = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase.from('budget_sinking_funds') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: SinkingFundItem[] = (data ?? []).map((f: any) => ({
        id: f.id,
        name: f.name,
        annualEstimatedCost: Number(f.annual_estimated_cost) || 0,
        monthlyReserveAmount: Number(f.monthly_reserve_amount) || 0,
        targetMonth: f.target_month,
      }));

      setFunds(formatted);
    } catch (err: any) {
      console.error(err);
      showError('Error', err.message || 'Failed to load sinking funds');
    } finally {
      setLoading(false);
    }
  }, [user?.id, showError]);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  const handleAddFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || annualCost <= 0 || !user?.id) return;

    const monthlyReserve = Math.round(annualCost / 12);

    try {
      const { error } = await (supabase.from('budget_sinking_funds') as any).insert({
        user_id: user.id,
        name: name.trim(),
        annual_estimated_cost: annualCost.toString(),
        monthly_reserve_amount: monthlyReserve.toString(),
        target_month: targetMonth || null,
        is_active: true,
      });

      if (error) throw error;

      success('Sinking Fund Added', `${name} reserve set to ${formatCurrency(monthlyReserve)}/month.`);
      setShowAddModal(false);
      setName('');
      setAnnualCost(24000);
      fetchFunds();
      if (onFundsUpdated) onFundsUpdated();
    } catch (err: any) {
      showError('Error', err.message || 'Failed to add sinking fund');
    }
  };

  const handleDeleteFund = async (id: string, fundName: string) => {
    if (!user?.id) return;
    try {
      const { error } = await (supabase.from('budget_sinking_funds') as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      success('Deleted', `${fundName} removed.`);
      fetchFunds();
      if (onFundsUpdated) onFundsUpdated();
    } catch (err: any) {
      showError('Error', err.message || 'Failed to delete sinking fund');
    }
  };

  const totalMonthlyReserve = funds.reduce((sum, f) => sum + f.monthlyReserveAmount, 0);

  if (loading) {
    return <div className="py-6 flex justify-center"><Spinner size={24} /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-[var(--color-text-primary)] flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-amber-500" />
            Flex & Irregular Expenses (Sinking Funds)
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Total Monthly Reserve: <span className="font-bold text-amber-600">{formatCurrency(totalMonthlyReserve)}</span> (prevents sudden budget shocks)
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1 rounded-xl">
          <Plus size={16} /> Add Sinking Fund
        </Button>
      </div>

      {funds.length === 0 ? (
        <Card className="p-6 text-center text-sm text-[var(--color-text-secondary)] border-dashed">
          No irregular sinking funds configured. Add annual expenses like Eid, Insurance, or Repairs to smooth out your monthly budget.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {funds.map((f) => (
            <Card key={f.id} className="p-4 border-[var(--color-border)] shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-[var(--color-text-primary)]">{f.name}</h4>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Annual: {formatCurrency(f.annualEstimatedCost)}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteFund(f.id, f.name)}
                  className="text-[var(--color-text-muted)] hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mt-3 pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  +{formatCurrency(f.monthlyReserveAmount)}/month
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {f.targetMonth ? `Target: Month ${f.targetMonth}` : 'Annual Reserve'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        title="Add Irregular Sinking Fund"
        description="Spread annual or seasonal expenses (Eid, Insurance, Medical, Gifts) across 12 monthly reserves."
      >
        <form onSubmit={handleAddFund} className="space-y-4 pt-2">
          <Input
            label="Sinking Fund Name"
            required
            placeholder="e.g. Eid & Family Gifts, Annual Car Insurance"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <CurrencyInput
            label="Expected Annual Cost"
            required
            value={annualCost}
            onChange={(val) => setAnnualCost(val)}
          />
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            Monthly Reserve needed: <span className="font-bold">{formatCurrency(Math.round(annualCost / 12))}</span> per month.
          </div>
          <Button type="submit" fullWidth className="mt-4">
            Save Sinking Fund
          </Button>
        </form>
      </Dialog>
    </div>
  );
};
