import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { Card, Spinner, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { Plus, Wallet, Trash2, Edit3, ShieldCheck, AlertCircle, Building2 } from 'lucide-react';
import { IncomeSourceItem, IncomeStability } from '@/lib/budget/budgetEngine';

interface IncomeSourcesManagerProps {
  onIncomeUpdated?: () => void;
}

export const IncomeSourcesManager: React.FC<IncomeSourcesManagerProps> = ({ onIncomeUpdated }) => {
  const { user } = useAuthContext();
  const { success, error: showError } = useToast();
  const [sources, setSources] = useState<IncomeSourceItem[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<IncomeSourceItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [incomeType, setIncomeType] = useState('primary_salary');
  const [frequency, setFrequency] = useState('monthly');
  const [stability, setStability] = useState<IncomeStability>('stable');
  const [grossAmount, setGrossAmount] = useState<number>(0);
  const [deductionsAmount, setDeductionsAmount] = useState<number>(0);
  const [netTakehomeAmount, setNetTakehomeAmount] = useState<number>(60000);
  const [paymentDay, setPaymentDay] = useState<number>(5);
  const [receivingAccountId, setReceivingAccountId] = useState<string>('');

  const fetchSources = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [sourcesRes, accountsRes] = await Promise.all([
        (supabase.from('income_sources') as any)
          .select('*, financial_accounts(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('financial_accounts')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('is_active', true),
      ]);

      if (sourcesRes.error) throw sourcesRes.error;

      const formatted: IncomeSourceItem[] = (sourcesRes.data ?? []).map((inc: any) => ({
        id: inc.id,
        name: inc.name,
        incomeType: inc.income_type,
        frequency: inc.frequency,
        stability: inc.stability as IncomeStability,
        grossAmount: inc.gross_amount ? Number(inc.gross_amount) : undefined,
        deductionsAmount: inc.deductions_amount ? Number(inc.deductions_amount) : undefined,
        netTakehomeAmount: Number(inc.net_takehome_amount) || 0,
        paymentDay: inc.payment_day,
        receivingAccountId: inc.receiving_account_id,
        receivingAccountName: inc.financial_accounts?.name,
        isActive: inc.is_active,
      }));

      setSources(formatted);
      setUserAccounts((accountsRes.data as Array<{ id: string; name: string }>) ?? []);
    } catch (err: any) {
      console.error(err);
      showError('Error', err.message || 'Failed to load income sources');
    } finally {
      setLoading(false);
    }
  }, [user?.id, showError]);

  const setAccountsState = (accs: Array<{ id: string; name: string }>) => setAccounts(accs);
  const setUserAccounts = setAccountsState;

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // Auto-update take-home if gross and deductions are provided
  const handleGrossChange = (val: number) => {
    setGrossAmount(val);
    if (val > 0) {
      setNetTakehomeAmount(Math.max(0, val - (deductionsAmount || 0)));
    }
  };

  const handleDeductionsChange = (val: number) => {
    setDeductionsAmount(val);
    if (grossAmount > 0) {
      setNetTakehomeAmount(Math.max(0, grossAmount - val));
    }
  };

  const resetForm = () => {
    setName('');
    setIncomeType('primary_salary');
    setFrequency('monthly');
    setStability('stable');
    setGrossAmount(0);
    setDeductionsAmount(0);
    setNetTakehomeAmount(60000);
    setPaymentDay(5);
    setReceivingAccountId('');
    setSelectedSource(null);
  };

  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || netTakehomeAmount <= 0 || !user?.id) return;

    try {
      const payload = {
        user_id: user.id,
        name: name.trim(),
        income_type: incomeType,
        frequency,
        stability,
        gross_amount: grossAmount > 0 ? grossAmount.toString() : null,
        deductions_amount: deductionsAmount > 0 ? deductionsAmount.toString() : null,
        net_takehome_amount: netTakehomeAmount.toString(),
        payment_day: paymentDay || 1,
        receiving_account_id: receivingAccountId || null,
        is_active: true,
      };

      if (selectedSource) {
        const { error } = await (supabase.from('income_sources') as any)
          .update(payload)
          .eq('id', selectedSource.id)
          .eq('user_id', user.id);
        if (error) throw error;
        success('Updated', `${name} updated successfully.`);
      } else {
        const { error } = await (supabase.from('income_sources') as any)
          .insert(payload);
        if (error) throw error;
        success('Added', `${name} registered as an income source.`);
      }

      setShowAddModal(false);
      resetForm();
      fetchSources();
      if (onIncomeUpdated) onIncomeUpdated();
    } catch (err: any) {
      showError('Error', err.message || 'Failed to save income source');
    }
  };

  const handleDeleteSource = async (id: string, sourceName: string) => {
    if (!user?.id) return;
    try {
      const { error } = await (supabase.from('income_sources') as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      success('Deleted', `${sourceName} removed.`);
      fetchSources();
      if (onIncomeUpdated) onIncomeUpdated();
    } catch (err: any) {
      showError('Error', err.message || 'Failed to delete income source');
    }
  };

  const openEdit = (src: IncomeSourceItem) => {
    setSelectedSource(src);
    setName(src.name);
    setIncomeType(src.incomeType);
    setFrequency(src.frequency);
    setStability(src.stability);
    setGrossAmount(src.grossAmount || 0);
    setDeductionsAmount(src.deductionsAmount || 0);
    setNetTakehomeAmount(src.netTakehomeAmount);
    setPaymentDay(src.paymentDay || 5);
    setReceivingAccountId(src.receivingAccountId || '');
    setShowAddModal(true);
  };

  const totalTakehome = sources.reduce((sum, s) => sum + s.netTakehomeAmount, 0);

  if (loading) {
    return <div className="py-6 flex justify-center"><Spinner size={24} /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-[var(--color-text-primary)] flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[var(--color-accent)]" />
            Income Sources
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Total Monthly Take-Home: <span className="font-bold text-emerald-600">{formatCurrency(totalTakehome)}</span>
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="gap-1 rounded-xl"
        >
          <Plus size={16} /> Add Income
        </Button>
      </div>

      {/* Sources Grid */}
      {sources.length === 0 ? (
        <Card className="p-6 text-center text-sm text-[var(--color-text-secondary)] border-dashed">
          No income sources added yet. Click &quot;Add Income&quot; to set up your salary or freelancing.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sources.map((src) => (
            <Card key={src.id} className="p-4 border-[var(--color-border)] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-[var(--color-text-primary)]">{src.name}</h4>
                    <Badge variant={src.stability === 'stable' ? 'positive' : 'warning'} className="text-[10px] uppercase">
                      {src.stability}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 capitalize">
                    {src.incomeType.replace('_', ' ')} • {src.frequency}
                  </p>
                  {src.receivingAccountName && (
                    <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3 text-[var(--color-accent)] shrink-0" />
                      <span>{src.receivingAccountName}</span>
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(src.netTakehomeAmount)}
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] block">Monthly Net</span>
                </div>
              </div>

              {src.grossAmount && src.grossAmount > src.netTakehomeAmount && (
                <div className="mt-3 pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span>Gross: {formatCurrency(src.grossAmount)}</span>
                  <span>Deductions: -{formatCurrency(src.deductionsAmount || 0)}</span>
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-muted)]">
                  Paid on {src.paymentDay ? `${src.paymentDay}th of month` : 'Monthly'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(src)}
                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteSource(src.id, src.name)}
                    className="p-1 text-[var(--color-text-muted)] hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        title={selectedSource ? 'Edit Income Source' : 'Add Income Source'}
        description="Configure your salary or recurring income for adaptive monthly budgeting."
      >
        <form onSubmit={handleSaveSource} className="space-y-4 pt-2">
          <Input
            label="Income Source Name"
            required
            placeholder="e.g. Primary Salary at Grameenphone"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Income Type"
              value={incomeType}
              onValueChange={setIncomeType}
              options={[
                { value: 'primary_salary', label: 'Primary Salary' },
                { value: 'secondary_salary', label: 'Secondary Salary' },
                { value: 'freelance', label: 'Freelance / Consulting' },
                { value: 'business', label: 'Business Income' },
                { value: 'commission', label: 'Commission' },
                { value: 'bonus', label: 'Bonus' },
                { value: 'rental', label: 'Rental Income' },
                { value: 'recurring_other', label: 'Other Recurring' },
                { value: 'irregular', label: 'Irregular' },
              ]}
            />
            <Select
              label="Stability"
              value={stability}
              onValueChange={(val) => setStability(val as IncomeStability)}
              options={[
                { value: 'stable', label: 'Stable (Fixed Salary)' },
                { value: 'variable', label: 'Variable (Fluctuates)' },
                { value: 'unstable', label: 'Unstable (Irregular)' },
              ]}
            />
          </div>

          <div className="p-3 bg-[var(--color-bg-subtle)] rounded-xl border border-[var(--color-border)] space-y-3">
            <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Take-Home vs Gross Breakdown</p>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput
                label="Gross Salary (Optional)"
                value={grossAmount}
                onChange={handleGrossChange}
              />
              <CurrencyInput
                label="Deductions (Tax/PF)"
                value={deductionsAmount}
                onChange={handleDeductionsChange}
              />
            </div>
            <CurrencyInput
              label="Monthly Take-Home Amount (Required Budget Basis)"
              required
              value={netTakehomeAmount}
              onChange={setNetTakehomeAmount}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Payday (Day of Month)"
              type="number"
              min="1"
              max="31"
              value={paymentDay}
              onChange={(e) => setPaymentDay(Number(e.target.value))}
            />
            {accounts.length > 0 && (
              <Select
                label="Receiving Account"
                value={receivingAccountId}
                onValueChange={setReceivingAccountId}
                options={[
                  { value: '', label: 'Select Account (Optional)' },
                  ...accounts.map((a) => ({ value: a.id, label: a.name })),
                ]}
              />
            )}
          </div>

          <Button type="submit" fullWidth className="mt-4">
            {selectedSource ? 'Update Income Source' : 'Save Income Source'}
          </Button>
        </form>
      </Dialog>
    </div>
  );
};
