import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { Card, Skeleton, EmptyState, ProgressBar } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';

interface BudgetRow {
  id: string;
  name: string;
  period: string;
  amount: number;
  spent?: number; // Usually calculated from transactions
}

export const BudgetsPage: React.FC = () => {
  const { user } = useAuthContext();
  const { success, error: showError } = useToast();
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Selected Budget for Edit/Delete
  const [selectedBudget, setSelectedBudget] = useState<BudgetRow | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(10000);

  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error: fetchErr } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setBudgets((data as BudgetRow[]) ?? []);
    } catch (err: any) {
      console.error(err);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || amount <= 0 || !user) return;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          name: name.trim(),
          amount: amount,
          period: 'monthly'
        })
        .select()
        .single();

      if (error) throw error;
      
      setBudgets((prev) => [data, ...prev]);
      setName('');
      setAmount(10000);
      setShowAddDialog(false);
      success('Budget Created', `${data.name} limit set to ${formatCurrency(amount)}.`);
    } catch (err: any) {
      showError('Failed to create budget', err.message);
    }
  };

  const handleEditBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudget || !name.trim() || amount <= 0 || !user) return;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .update({
          name: name.trim(),
          amount: amount
        })
        .eq('id', selectedBudget.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setBudgets((prev) => prev.map((b) => b.id === data.id ? data : b));
      setShowEditDialog(false);
      success('Budget Updated', `${data.name} updated successfully.`);
    } catch (err: any) {
      showError('Failed to update budget', err.message);
    }
  };

  const handleDeleteBudget = async () => {
    if (!selectedBudget || !user) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', selectedBudget.id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setBudgets((prev) => prev.filter((b) => b.id !== selectedBudget.id));
      setShowDeleteDialog(false);
      success('Budget Deleted', `${selectedBudget.name} has been removed.`);
    } catch (err: any) {
      showError('Failed to delete budget', err.message);
    }
  };

  const openEdit = (b: BudgetRow) => {
    setSelectedBudget(b);
    setName(b.name);
    setAmount(Number(b.amount));
    setShowEditDialog(true);
  };

  const openDelete = (b: BudgetRow) => {
    setSelectedBudget(b);
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
            Monthly Budgets
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            Category spending limits and threshold alerts
          </p>
        </div>
        <Button size="sm" onClick={() => {
          setName('');
          setAmount(10000);
          setShowAddDialog(true);
        }} className="gap-1">
          <Plus size={16} /> Add Budget
        </Button>
      </header>

      {budgets.length === 0 ? (
        <EmptyState
          icon={<Target size={22} />}
          title="No active budgets"
          description="Create a monthly budget to keep your dining, entertainment, and shopping expenses under control."
          action={<Button size="sm" onClick={() => {
            setName('');
            setAmount(10000);
            setShowAddDialog(true);
          }}>Create Budget</Button>}
        />
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => {
            const limit = Number(b.amount);
            const spent = b.spent ?? 0;
            const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
            // Default alert threshold 80% visually
            const isAlert = pct > 80;

            return (
              <Card key={b.id} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                        {b.name}
                      </h2>
                    </div>
                    <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] capitalize">
                      {b.period} Budget
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold tabular-nums text-[var(--text-body)]" data-financial>
                      Spent: {formatCurrency(spent)}
                    </span>
                    <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                      Limit: {formatCurrency(limit)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => openEdit(b)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors p-1" title="Edit Budget">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => openDelete(b)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-negative)] transition-colors p-1" title="Delete Budget">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <ProgressBar
                  value={pct}
                  showValue
                  variant={isAlert ? 'danger' : 'default'}
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
            value={amount}
            onChange={setAmount}
          />
          <Button type="submit" fullWidth className="mt-4">
            Save Budget
          </Button>
        </form>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title="Edit Budget"
        description="Update your budget details."
      >
        <form onSubmit={handleEditBudget} className="space-y-4 pt-2">
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
            value={amount}
            onChange={setAmount}
          />
          <Button type="submit" fullWidth className="mt-4">
            Update Budget
          </Button>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Budget"
        description="Are you sure you want to delete this budget? This action cannot be undone."
      >
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[var(--color-border)]">
          <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={handleDeleteBudget} className="flex-1">
            Delete Budget
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
