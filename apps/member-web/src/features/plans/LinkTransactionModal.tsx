import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/currency/formatter';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { CalendarEventOccurrence } from '../../../../../packages/finance-engine/src';
import { Link2, Search, CheckCircle2 } from 'lucide-react';

interface LinkTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  occurrence: CalendarEventOccurrence | null;
  onRefresh: () => void;
}

export const LinkTransactionModal: React.FC<LinkTransactionModalProps> = ({
  open,
  onOpenChange,
  userId,
  occurrence,
  onRefresh,
}) => {
  const { success, error: showError } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !userId || !occurrence) return;

    const fetchUnlinkedTransactions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('ledger_transactions')
          .select(`
            id,
            title,
            transaction_date,
            status,
            ledger_entries (amount, entry_role, financial_account_id)
          `)
          .eq('user_id', userId)
          .eq('status', 'posted')
          .order('transaction_date', { ascending: false })
          .limit(30);

        if (error) throw error;
        setTransactions(data || []);
        if (occurrence) {
          setAmountPaid(occurrence.remaining_amount.toString());
        }
      } catch (err: any) {
        showError('Error fetching transactions', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUnlinkedTransactions();
  }, [open, userId, occurrence]);

  if (!occurrence) return null;

  const handleLinkTransaction = async () => {
    if (!selectedTxId) {
      showError('Select transaction', 'Please select a transaction to link.');
      return;
    }

    const numPaid = parseFloat(amountPaid);
    if (isNaN(numPaid) || numPaid <= 0) {
      showError('Invalid amount', 'Please specify a positive payment amount.');
      return;
    }

    setSubmitting(true);
    try {
      // Determine commitment type
      let commitmentType = 'recurring_template';
      if (occurrence.event_type === 'loan') commitmentType = 'loan_instalment';
      else if (occurrence.event_type === 'card') commitmentType = 'credit_card';
      else if (occurrence.event_type !== 'bill' && occurrence.event_type !== 'income') commitmentType = 'custom_event';

      const { error } = await (supabase.from('commitment_payments') as any).insert({
        user_id: userId,
        commitment_type: commitmentType,
        commitment_id: occurrence.source_id,
        occurrence_date: occurrence.due_date,
        ledger_transaction_id: selectedTxId,
        amount_paid: numPaid,
      });

      if (error) throw error;

      success('Transaction linked', 'Transaction linked to commitment successfully.');
      onOpenChange(false);
      onRefresh();
    } catch (err: any) {
      showError('Error linking transaction', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Link Transaction to "${occurrence.title}"`}
      description={`Select a posted ledger transaction to mark ${formatCurrency(occurrence.remaining_amount)} as paid.`}
    >
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
        <div>
          <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">
            Payment Amount to Allocate
          </label>
          <input
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-medium text-[var(--color-text-secondary)]">
            Select Recent Posted Transaction
          </label>
          {loading ? (
            <p className="text-xs text-[var(--color-text-muted)] italic">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] italic">No recent transactions found.</p>
          ) : (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {transactions.map((tx) => {
                const isSelected = selectedTxId === tx.id;
                const totalAmt = tx.ledger_entries?.[0]?.amount || 0;

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTxId(tx.id)}
                    className={`p-2.5 rounded border cursor-pointer transition-colors flex justify-between items-center ${
                      isSelected
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                        : 'border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                        {tx.title}
                        {isSelected && <CheckCircle2 size={14} className="text-[var(--color-accent)]" />}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">{tx.transaction_date}</div>
                    </div>
                    <span className="font-semibold text-[var(--color-text-primary)]">{formatCurrency(totalAmt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Button
          onClick={handleLinkTransaction}
          disabled={submitting || !selectedTxId}
          className="w-full gap-2 text-xs"
        >
          <Link2 size={14} /> Confirm Link
        </Button>
      </div>
    </Dialog>
  );
};
