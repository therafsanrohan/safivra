import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate } from '@/lib/dates/formatter';
import { parseError } from '@/lib/errors/handler';
import { useToast } from '@/components/ui/Toast';
import { Card, Skeleton, ErrorState, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface FullTransaction {
  id: string;
  title: string;
  transaction_type: string;
  transaction_date: string;
  transaction_time: string | null;
  merchant: string | null;
  description: string | null;
  status: string;
  created_at: string;
  ledger_entries: Array<{
    id: string;
    amount: number;
    entry_role: string;
    financial_account?: { name: string } | null;
    category?: { name: string } | null;
  }>;
}

export const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { success, error: showError } = useToast();

  const [tx, setTx] = useState<FullTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voiding, setVoiding] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTransaction = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchErr } = await supabase
        .from('ledger_transactions')
        .select(`
          id, title, transaction_type, transaction_date, transaction_time, merchant, description, status, created_at,
          ledger_entries(
            id, amount, entry_role,
            financial_account:financial_accounts(name),
            category:transaction_categories(name)
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchErr) throw fetchErr;
      setTx((data as unknown as FullTransaction) ?? null);
    } catch (err: any) {
      setError(err.message || 'Could not fetch transaction details');
      setTx(null);
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    loadTransaction();
  }, [loadTransaction]);

  const handleVoid = async () => {
    if (!id || !tx || tx.status === 'voided') return;
    if (!window.confirm('Are you sure you want to void this transaction? This action will reverse its ledger effects.')) {
      return;
    }

    setVoiding(true);
    try {
      const { error: voidErr } = await supabase.rpc('void_transaction', {
        p_transaction_id: id,
        p_void_reason: 'User voided transaction',
      } as unknown as never);
      if (voidErr) throw voidErr;
      success('Transaction voided', 'The transaction has been voided.');
      loadTransaction();
    } catch (err) {
      showError('Could not void transaction', parseError(err).message);
    } finally {
      setVoiding(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !tx || deleteConfirmation !== 'DELETE') return;
    setIsDeleting(true);
    try {
      const { error: delErr } = await supabase.rpc('delete_financial_record', {
        p_record_type: 'transaction',
        p_record_id: id,
      } as any);
      if (delErr) throw delErr;
      success('Transaction Deleted', 'The transaction has been permanently deleted.');
      navigate('/dashboard/activity');
    } catch (err) {
      showError('Could not delete transaction', parseError(err).message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container pt-5 space-y-4">
        <Skeleton height={24} width={100} />
        <Skeleton height={120} />
        <Skeleton height={180} />
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="page-container pt-6">
        <ErrorState message={error || 'Transaction not found'} onRetry={loadTransaction} />
      </div>
    );
  }

  const entries = tx.ledger_entries ?? [];
  const isVoided = tx.status === 'voided';

  return (
    <div className="page-container pt-4 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          aria-label="Go back"
        >
          <ArrowLeft size={18} /> Activity
        </button>
      </div>

      <Card className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={isVoided ? 'negative' : 'neutral'}>
                {tx.status.toUpperCase()}
              </Badge>
              <span className="text-[var(--text-secondary)] text-[var(--color-text-muted)] capitalize">
                {tx.transaction_type.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)] mt-1">
              {tx.title}
            </h1>
            <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
              {formatDate(tx.transaction_date)} {tx.transaction_time ? `· ${tx.transaction_time}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {tx.status !== 'voided' && (
              <Button
                variant="outline"
                size="sm"
                loading={voiding}
                onClick={handleVoid}
                className="text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)]"
              >
                <Ban size={16} /> Void
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete
            </Button>
          </div>
        </div>

        {tx.merchant && (
          <div>
            <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">Merchant / Source</p>
            <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">{tx.merchant}</p>
          </div>
        )}

        {tx.description && (
          <div>
            <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">Notes</p>
            <p className="text-[var(--text-body)] text-[var(--color-text-primary)]">{tx.description}</p>
          </div>
        )}
      </Card>

      {/* Double-Entry Ledger Breakdown */}
      <section className="space-y-3">
        <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
          Double-Entry Ledger Lines
        </h2>

        <Card padding="none">
          <div className="divide-y divide-[var(--color-border)]" role="list">
            {entries.map((entry) => {
              const amount = Number(entry.amount);
              
              let targetName = entry.financial_account?.name || entry.category?.name;
              if (!targetName) {
                if (entry.entry_role.includes('equity')) {
                  targetName = 'Opening Equity / Capital';
                } else if (entry.entry_role.includes('fee')) {
                  targetName = 'Bank Fees & Charges';
                } else if (entry.entry_role.includes('transfer')) {
                  targetName = 'Linked Transfer Account';
                } else {
                  targetName = 'General Ledger';
                }
              }

              const isDebit = entry.entry_role.includes('debit') || entry.entry_role === 'transfer_in';
              const roleLabel = entry.entry_role.replace(/_/g, ' ');

              return (
                <div key={entry.id} className="flex items-center justify-between px-5 py-3.5" role="listitem">
                  <div className="flex items-center gap-3">
                    <span className={['px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide', isDebit ? 'bg-[var(--color-info-soft)] text-[var(--color-info)]' : 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'].join(' ')}>
                      {isDebit ? 'Debit' : 'Credit'}
                    </span>
                    <div>
                      <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">
                        {targetName}
                      </p>
                      <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] capitalize text-xs">
                        {roleLabel}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums text-[var(--color-text-primary)]" data-financial>
                    {formatCurrency(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-bg-surface)] w-full max-w-sm rounded-[var(--radius-card)] shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5">
              <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)] mb-2">Delete Transaction?</h2>
              <p className="text-[var(--text-body)] text-[var(--color-text-secondary)] mb-4">
                This will permanently delete the transaction and reverse its effects on your account balances. This action cannot be undone.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Type <span className="font-mono text-[var(--color-negative)] font-bold">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-input)] focus:border-[var(--color-negative)] focus:ring-1 focus:ring-[var(--color-negative)] text-[var(--color-text-primary)] bg-[var(--color-bg-surface)] outline-none"
                  placeholder="DELETE"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteConfirmation('');
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  loading={isDeleting}
                  disabled={deleteConfirmation !== 'DELETE'}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
