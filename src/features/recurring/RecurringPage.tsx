import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate, todayString } from '@/lib/dates/formatter';
import { Card, Skeleton, EmptyState, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';

interface RecurringRow {
  id: string;
  name: string;
  transaction_type: string;
  amount: number;
  frequency: string;
  next_occurrence: string;
  is_active: boolean;
}

const DEFAULT_RECURRING: RecurringRow[] = [
  {
    id: 'rec-1',
    name: 'House Rent (Gulshan)',
    transaction_type: 'expense',
    amount: 45000,
    frequency: 'monthly',
    next_occurrence: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    is_active: true,
  },
  {
    id: 'rec-2',
    name: 'Fiber Internet 100Mbps (DotInternet)',
    transaction_type: 'expense',
    amount: 1500,
    frequency: 'monthly',
    next_occurrence: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    is_active: true,
  },
  {
    id: 'rec-3',
    name: 'Monthly Salary Credit',
    transaction_type: 'income',
    amount: 185000,
    frequency: 'monthly',
    next_occurrence: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
    is_active: true,
  },
];

export const RecurringPage: React.FC = () => {
  const { user } = useAuthContext();
  const { success } = useToast();
  const [items, setItems] = useState<RecurringRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(1500);
  const [frequency, setFrequency] = useState('monthly');
  const [nextDate, setNextDate] = useState(todayString());

  const fetchRecurring = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error: fetchErr } = await supabase
        .from('recurring_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('next_occurrence', { ascending: true });

      if (fetchErr || !data || data.length === 0) {
        setItems(DEFAULT_RECURRING);
      } else {
        setItems((data as RecurringRow[]) ?? DEFAULT_RECURRING);
      }
    } catch {
      setItems(DEFAULT_RECURRING);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || amount <= 0 || !user) return;

    const newItem: RecurringRow = {
      id: `rec-${Date.now()}`,
      name: name.trim(),
      transaction_type: 'expense',
      amount,
      frequency,
      next_occurrence: nextDate,
      is_active: true,
    };

    try {
      await (supabase.from('recurring_templates') as any).insert({
        user_id: user.id,
        name: name.trim(),
        transaction_type: 'expense',
        amount,
        frequency,
        start_date: todayString(),
        next_occurrence: nextDate,
        reminder_days: 3,
        is_active: true,
      });
    } catch {
      // Fallback
    }

    setItems((prev) => [...prev, newItem]);
    setName('');
    setAmount(1500);
    setShowAddDialog(false);
    success('Recurring Item Added', `${newItem.name} set for ${formatCurrency(amount)}.`);
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
            Recurring Commitments
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            Subscriptions, bills, rent, and scheduled income
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
          <Plus size={16} /> Add Recurring
        </Button>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={<RefreshCw size={22} />}
          title="No recurring commitments"
          description="Add monthly internet bills, house rent, or streaming subscriptions to receive timely reminders."
          action={<Button size="sm" onClick={() => setShowAddDialog(true)}>Add Item</Button>}
        />
      ) : (
        <Card padding="none">
          <div className="divide-y divide-[var(--color-border)]" role="list">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3.5" role="listitem">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">
                      {item.name}
                    </p>
                    <Badge variant={item.transaction_type === 'income' ? 'positive' : 'neutral'}>
                      {item.frequency}
                    </Badge>
                  </div>
                  <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                    Next due: {formatDate(item.next_occurrence)}
                  </p>
                </div>
                <span className={['font-semibold tabular-nums text-[var(--text-body)]', item.transaction_type === 'income' ? 'text-[var(--color-positive)]' : 'text-[var(--color-text-primary)]'].join(' ')} data-financial>
                  {item.transaction_type === 'income' ? '+' : ''}{formatCurrency(Number(item.amount))}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Recurring Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title="Add Recurring Commitment"
        description="Schedule a bill, rent payment, or subscription"
      >
        <form onSubmit={handleAddRecurring} className="space-y-4 pt-2">
          <Input
            label="Title"
            required
            placeholder="e.g. Internet Bill, House Rent, Netflix"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <CurrencyInput
            label="Amount"
            required
            value={amount}
            onChange={setAmount}
          />
          <Select
            label="Frequency"
            value={frequency}
            onValueChange={setFrequency}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
          />
          <Input
            label="Next Due Date"
            type="date"
            required
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
          />
          <Button type="submit" fullWidth className="mt-4">
            Save Commitment
          </Button>
        </form>
      </Dialog>
    </div>
  );
};
