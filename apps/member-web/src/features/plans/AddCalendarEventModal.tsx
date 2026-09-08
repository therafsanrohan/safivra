import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { FinancialAccountInput } from '../../../../../packages/finance-engine/src';
import { Calendar, Plus } from 'lucide-react';

interface AddCalendarEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  accounts: FinancialAccountInput[];
  defaultDate?: string;
  onRefresh: () => void;
}

export const AddCalendarEventModal: React.FC<AddCalendarEventModalProps> = ({
  open,
  onOpenChange,
  userId,
  accounts,
  defaultDate,
  onRefresh,
}) => {
  const { success, error: showError } = useToast();
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<'income' | 'bill' | 'loan' | 'card' | 'transfer' | 'savings'>('bill');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [isEstimated, setIsEstimated] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!title || isNaN(numAmt) || numAmt <= 0 || !dueDate) {
      showError('Invalid input', 'Please fill in title, valid positive amount, and date.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase.from('calendar_events') as any).insert({
        user_id: userId,
        title,
        event_type: eventType,
        amount: numAmt,
        due_date: dueDate,
        account_id: accountId || null,
        is_estimated: isEstimated,
        notes: notes || null,
        status: 'upcoming',
      });

      if (error) throw error;
      success('Event created', 'Planning calendar event added.');
      onOpenChange(false);
      setTitle('');
      setAmount('');
      setNotes('');
      onRefresh();
    } catch (err: any) {
      showError('Error adding event', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Calendar Planning Event"
      description="Create a non-ledger planning commitment or expected income item on your Money Calendar."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Title</label>
          <Input
            placeholder="e.g. Broadband Bill or Expected Bonus"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Event Type</label>
            <Select
              value={eventType}
              onValueChange={(v) => setEventType(v as typeof eventType)}
              options={[
                { value: 'bill', label: 'Bill / Expense' },
                { value: 'income', label: 'Expected Income' },
                { value: 'loan', label: 'Loan Instalment' },
                { value: 'card', label: 'Credit Card Due' },
                { value: 'transfer', label: 'Planned Transfer' },
                { value: 'savings', label: 'Savings Contribution' },
              ]}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Amount</label>
            <Input
              type="number"
              placeholder="1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Due / Expected Date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Account (Optional)</label>
            <Select
              value={accountId}
              onValueChange={setAccountId}
              options={[
                { value: '', label: '-- None --' },
                ...accounts.map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isEstimated"
            checked={isEstimated}
            onChange={(e) => setIsEstimated(e.target.checked)}
            className="rounded border-[var(--color-border)] text-[var(--color-accent)]"
          />
          <label htmlFor="isEstimated" className="text-xs text-[var(--color-text-secondary)] font-medium">
            Mark amount or date as estimated
          </label>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Notes</label>
          <Input
            placeholder="Optional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={submitting} className="w-full gap-2 text-xs">
          <Plus size={14} /> Create Calendar Event
        </Button>
      </form>
    </Dialog>
  );
};
