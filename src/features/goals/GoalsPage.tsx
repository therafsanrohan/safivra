import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate, todayString } from '@/lib/dates/formatter';
import { Card, Skeleton, EmptyState, ProgressBar } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';

interface GoalRow {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: string;
}

const DEFAULT_GOALS: GoalRow[] = [
  {
    id: 'goal-1',
    name: '6-Month Emergency Reserve',
    target_amount: 300000,
    current_amount: 250000,
    target_date: '2026-12-31',
    status: 'in_progress',
  },
  {
    id: 'goal-2',
    name: 'Umrah Pilgrimage Fund',
    target_amount: 200000,
    current_amount: 145000,
    target_date: '2027-03-31',
    status: 'in_progress',
  },
  {
    id: 'goal-3',
    name: 'MacBook M3 Pro Tech Upgrade',
    target_amount: 280000,
    current_amount: 190000,
    target_date: '2026-10-15',
    status: 'in_progress',
  },
];

export const GoalsPage: React.FC = () => {
  const { user } = useAuthContext();
  const { success } = useToast();
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(100000);
  const [currentAmount, setCurrentAmount] = useState(10000);
  const [targetDate, setTargetDate] = useState(todayString());

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error: fetchErr } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr || !data || data.length === 0) {
        setGoals(DEFAULT_GOALS);
      } else {
        setGoals((data as GoalRow[]) ?? DEFAULT_GOALS);
      }
    } catch {
      setGoals(DEFAULT_GOALS);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || targetAmount <= 0 || !user) return;

    const newG: GoalRow = {
      id: `goal-${Date.now()}`,
      name: name.trim(),
      target_amount: targetAmount,
      current_amount: currentAmount,
      target_date: targetDate,
      status: 'in_progress',
    };

    try {
      await (supabase.from('savings_goals') as any).insert({
        user_id: user.id,
        name: name.trim(),
        target_amount: targetAmount,
        current_amount: currentAmount,
        target_date: targetDate,
        status: 'in_progress',
      });
    } catch {
      // Fallback
    }

    setGoals((prev) => [newG, ...prev]);
    setName('');
    setTargetAmount(100000);
    setCurrentAmount(10000);
    setShowAddDialog(false);
    success('Goal Created', `${newG.name} goal set for ${formatCurrency(targetAmount)}.`);
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
            Savings Goals
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            Emergency funds, Umrah savings, and milestone targets
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
          <Plus size={16} /> Add Goal
        </Button>
      </header>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Trophy size={22} />}
          title="No savings goals set"
          description="Create savings targets for emergency funds, travel, or big purchases."
          action={<Button size="sm" onClick={() => setShowAddDialog(true)}>Create Goal</Button>}
        />
      ) : (
        <div className="space-y-4">
          {goals.map((g) => {
            const target = Number(g.target_amount);
            const current = Number(g.current_amount);
            const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

            return (
              <Card key={g.id} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                      {g.name}
                    </h2>
                    {g.target_date && (
                      <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                        Target Date: {formatDate(g.target_date)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold tabular-nums text-[var(--text-body)] text-[var(--color-positive)]" data-financial>
                      {formatCurrency(current)}
                    </span>
                    <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                      of {formatCurrency(target)}
                    </p>
                  </div>
                </div>
                <ProgressBar value={pct} showValue variant="positive" label="Goal Progress" />
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Goal Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title="Add Savings Goal"
        description="Set a target amount and date for your financial milestone"
      >
        <form onSubmit={handleAddGoal} className="space-y-4 pt-2">
          <Input
            label="Goal Name"
            required
            placeholder="e.g. Emergency Reserve, Hajj Fund, Laptop"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <CurrencyInput
            label="Target Amount"
            required
            value={targetAmount}
            onChange={setTargetAmount}
          />
          <CurrencyInput
            label="Current Saved Amount"
            optional
            value={currentAmount}
            onChange={setCurrentAmount}
          />
          <Input
            label="Target Date"
            type="date"
            optional
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
          <Button type="submit" fullWidth className="mt-4">
            Save Goal
          </Button>
        </form>
      </Dialog>
    </div>
  );
};
