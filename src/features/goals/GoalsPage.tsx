import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
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
import { parseError } from '@/lib/errors/handler';

interface GoalRow {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: string;
}

export const GoalsPage: React.FC = () => {
  const { user } = useAuthContext();
  const { success, error: showError } = useToast();
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalRow | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(100000);
  const [currentAmount, setCurrentAmount] = useState(10000);
  const [targetDate, setTargetDate] = useState(todayString());

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error: fetchErr } = await (supabase.from('savings_goals') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      const formatted = (data ?? []).map((g: any) => ({
        ...g,
        target_amount: Number(g.target_amount),
        current_amount: Number(g.current_amount),
      }));
      setGoals((formatted as GoalRow[]) ?? []);
    } catch (err) {
      showError('Failed to load goals', parseError(err).message);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || targetAmount <= 0 || !user) return;

    try {
      const { data, error } = await (supabase.from('savings_goals') as any).insert({
        user_id: user.id,
        name: name.trim(),
        target_amount: targetAmount.toString(),
        current_amount: currentAmount.toString(),
        target_date: targetDate || null,
        status: 'active',
      }).select().single();

      if (error) throw error;

      setGoals((prev) => [
        {
          ...data,
          target_amount: Number(data.target_amount),
          current_amount: Number(data.current_amount),
        } as GoalRow,
        ...prev
      ]);
      setName('');
      setTargetAmount(100000);
      setCurrentAmount(10000);
      setTargetDate(todayString());
      setShowAddDialog(false);
      success('Goal Created', `${data.name} goal set for ${formatCurrency(targetAmount)}.`);
    } catch (err) {
      showError('Failed to create goal', parseError(err).message);
    }
  };

  const handleEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !name.trim() || targetAmount <= 0 || !user) return;

    try {
      const { data, error } = await (supabase.from('savings_goals') as any).update({
        name: name.trim(),
        target_amount: targetAmount.toString(),
        current_amount: currentAmount.toString(),
        target_date: targetDate || null,
      })
      .eq('id', selectedGoal.id)
      .eq('user_id', user.id)
      .select().single();

      if (error) throw error;

      setGoals((prev) => prev.map((g) => g.id === data.id ? {
        ...data,
        target_amount: Number(data.target_amount),
        current_amount: Number(data.current_amount),
      } : g) as GoalRow[]);
      setShowEditDialog(false);
      success('Goal Updated', `${data.name} updated successfully.`);
    } catch (err) {
      showError('Failed to update goal', parseError(err).message);
    }
  };

  const handleDeleteGoal = async () => {
    if (!selectedGoal || !user) return;

    try {
      const { error } = await supabase.from('savings_goals').delete()
        .eq('id', selectedGoal.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals((prev) => prev.filter((g) => g.id !== selectedGoal.id));
      setShowDeleteDialog(false);
      success('Goal Deleted', `${selectedGoal.name} has been removed.`);
    } catch (err) {
      showError('Failed to delete goal', parseError(err).message);
    }
  };

  const openEdit = (g: GoalRow) => {
    setSelectedGoal(g);
    setName(g.name);
    setTargetAmount(Number(g.target_amount));
    setCurrentAmount(Number(g.current_amount));
    setTargetDate(g.target_date || '');
    setShowEditDialog(true);
  };

  const openDelete = (g: GoalRow) => {
    setSelectedGoal(g);
    setShowDeleteDialog(true);
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
        <Link to="/dashboard/plans" className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
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
        <Button size="sm" onClick={() => {
          setName('');
          setTargetAmount(100000);
          setCurrentAmount(10000);
          setTargetDate(todayString());
          setShowAddDialog(true);
        }} className="gap-1">
          <Plus size={16} /> Add Goal
        </Button>
      </header>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Trophy size={22} />}
          title="No savings goals set"
          description="Create savings targets for emergency funds, travel, or big purchases."
          action={<Button size="sm" onClick={() => {
            setName('');
            setTargetAmount(100000);
            setCurrentAmount(10000);
            setTargetDate(todayString());
            setShowAddDialog(true);
          }}>Create Goal</Button>}
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
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold tabular-nums text-[var(--text-body)] text-[var(--color-positive)]" data-financial>
                      {formatCurrency(current)}
                    </span>
                    <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                      of {formatCurrency(target)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => openEdit(g)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors p-1" title="Edit Goal">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => openDelete(g)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-negative)] transition-colors p-1" title="Delete Goal">
                        <Trash2 size={16} />
                      </button>
                    </div>
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
      
      {/* Edit Goal Dialog */}
      <Dialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title="Edit Savings Goal"
        description="Update your goal target and current saved amount"
      >
        <form onSubmit={handleEditGoal} className="space-y-4 pt-2">
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
            Update Goal
          </Button>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Goal"
        description="Are you sure you want to delete this savings goal? This action cannot be undone."
      >
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[var(--color-border)]">
          <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDeleteGoal} className="flex-1">
            Delete Goal
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
