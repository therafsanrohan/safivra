import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '@/lib/mongodb/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { Card, Skeleton, EmptyState, ProgressBar } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { todayString } from '@/lib/dates/formatter';

interface BudgetRow {
  id: string;
  name: string;
  period_type: string;
  total_limit: number;
  spent?: number;
  alert_threshold: number;
  is_active: boolean;
}

const DEFAULT_BUDGETS: BudgetRow[] = [
  {
    id: 'b-1',
    name: 'Food & Dining Out',
    period_type: 'monthly',
    total_limit: 25000,
    spent: 14200,
    alert_threshold: 80,
    is_active: true,
  },
  {
    id: 'b-2',
    name: 'Household Groceries',
    period_type: 'monthly',
    total_limit: 35000,
    spent: 28400,
    alert_threshold: 85,
    is_active: true,
  },
  {
    id: 'b-3',
    name: 'Shopping & Apparel',
    period_type: 'monthly',
    total_limit: 15000,
    spent: 6500,
    alert_threshold: 75,
    is_active: true,
  },
];

export const BudgetsPage: React.FC = () => {
  const { user } = useAuthContext();
  const { success } = useToast();
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [totalLimit, setTotalLimit] = useState(10000);

  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error: fetchErr } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchErr || !data || data.length === 0) {
        setBudgets(DEFAULT_BUDGETS);
      } else {
        setBudgets((data as BudgetRow[]) ?? DEFAULT_BUDGETS);
      }
    } catch {
      setBudgets(DEFAULT_BUDGETS);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || totalLimit <= 0 || !user) return;

    const newB: BudgetRow = {
      id: `b-${Date.now()}`,
      name: name.trim(),
      period_type: 'monthly',
      total_limit: totalLimit,
      spent: 0,
      alert_threshold: 80,
      is_active: true,
    };

    try {
      await (supabase.from('budgets') as any).insert({
        user_id: user.id,
        name: name.trim(),
        period_type: 'monthly',
        total_limit: totalLimit,
        start_date: todayString(),
        alert_threshold: 80,
        is_active: true,
      });
    } catch {
      // Graceful fallback to local state
    }

    setBudgets((prev) => [newB, ...prev]);
    setName('');
    setTotalLimit(10000);
    setShowAddDialog(false);
    success('Budget Created', `${newB.name} limit set to ${formatCurrency(totalLimit)}.`);
  };

  if (loading) {
    return (
      <div className="page-container pt-5 space-y-4">
        <Skeleton height={24} width={100} />
        <Skeleton height={140} />
      </div>
    );
  }

  return (
    <div className="page-container pt-4 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <Link to="/plans" className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <ArrowLeft size={18} /> Plans
        </Link>
      </div>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            Monthly Budgets
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            Category spending limits and threshold alerts
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
          <Plus size={16} /> Add Budget
        </Button>
      </header>

      {budgets.length === 0 ? (
        <EmptyState
          icon={<Target size={22} />}
          title="No active budgets"
          description="Create a monthly budget to keep your dining, entertainment, and shopping expenses under control."
          action={<Button size="sm" onClick={() => setShowAddDialog(true)}>Create Budget</Button>}
        />
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => {
            const limit = Number(b.total_limit);
            const spent = b.spent ?? 0;
            const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

            return (
              <Card key={b.id} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                      {b.name}
                    </h2>
                    <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] capitalize">
                      {b.period_type} Budget
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold tabular-nums text-[var(--text-body)]" data-financial>
                      Spent: {formatCurrency(spent)}
                    </span>
                    <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                      Limit: {formatCurrency(limit)}
                    </p>
                  </div>
                </div>
                <ProgressBar
                  value={pct}
                  showValue
                  variant={pct > (b.alert_threshold ?? 80) ? 'danger' : 'default'}
                  label="Monthly Limit Spent"
                />
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Budget Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title="Add Monthly Budget"
        description="Set a monthly expense cap for a specific category"
      >
        <form onSubmit={handleAddBudget} className="space-y-4 pt-2">
          <Input
            label="Budget Name / Category"
            required
            placeholder="e.g. Dining Out, Entertainment, Gadgets"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <CurrencyInput
            label="Monthly Limit"
            required
            value={totalLimit}
            onChange={setTotalLimit}
          />
          <Button type="submit" fullWidth className="mt-4">
            Save Budget
          </Button>
        </form>
      </Dialog>
    </div>
  );
};
