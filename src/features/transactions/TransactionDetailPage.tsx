import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban, Settings, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate } from '@/lib/dates/formatter';
import { parseError } from '@/lib/errors/handler';
import { useToast } from '@/components/ui/Toast';
import { Card, Skeleton, ErrorState, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input, Textarea } from '@/components/ui/Input';

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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editMerchant, setEditMerchant] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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
      const txData = (data as unknown as FullTransaction) ?? null;
      setTx(txData);
      if (txData) {
        setEditTitle(txData.title);
        setEditMerchant(txData.merchant || '');
        setEditDescription(txData.description || '');
      }
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

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !tx || !editTitle.trim()) return;
    setIsEditing(true);
    try {
      const { error: updErr } = await (supabase.from('ledger_transactions') as any)
        .update({
          title: editTitle.trim(),
          merchant: editMerchant.trim() || null,
          description: editDescription.trim() || null,
        })
        .eq('id', id)
        .eq('user_id', user!.id);

      if (updErr) throw updErr;
      success('Transaction updated', 'Details updated successfully.');
      setIsEditModalOpen(false);
      loadTransaction();
    } catch (err) {
      showError('Failed to update transaction', parseError(err).message);
    } finally {
      setIsEditing(false);
    }
  };

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
      // Phase 2: Use archive_financial_record() instead of delete_financial_record()
      // This voids + archives the transaction instead of permanently destroying it,
      // preserving the full audit trail and double-entry ledger history.
      const { error: delErr } = await supabase.rpc('archive_financial_record', {
        p_record_type: 'transaction',
        p_record_id: id,
        p_reason: 'User deleted transaction',
      } as any);
      if (delErr) throw delErr;
      success('Transaction Archived', 'The transaction has been voided and archived.');
      navigate('/dashboard/activity');
    } catch (err) {
      showError('Could not archive transaction', parseError(err).message);
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
            <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-2" data-financial>
              {formatCurrency(entries[0] ? Number(entries[0].amount) : 0)}
            </p>
            <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-1">
              {formatDate(tx.transaction_date)} {tx.transaction_time ? `· ${tx.transaction_time}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="text-[var(--color-primary)] border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)]"
            >
              <Settings size={16} /> Edit
            </Button>
            {tx.status !== 'voided' && (
              <Button
                variant="outline"
                size="sm"
                loading={voiding}
                onClick={handleVoid}
                className="text-[var(--color-warning)] border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)]"
              >
                <Ban size={16} /> Void
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 size={16} /> Delete
            </Button>
          </div>
        </div>

        {entries.find((e) => e.financial_account?.name) && (
          <div className="pt-2 border-t border-[var(--color-border)]">
            <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] text-xs">Account</p>
            <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">
              {entries.find((e) => e.financial_account?.name)?.financial_account?.name}
            </p>
          </div>
        )}

        {tx.merchant && (
          <div>
            <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] text-xs">Merchant / Source</p>
            <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">{tx.merchant}</p>
          </div>
        )}

        {tx.description && (
          <div>
            <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] text-xs">Notes</p>
            <p className="text-[var(--text-body)] text-[var(--color-text-primary)]">{tx.description}</p>
          </div>
        )}
      </Card>

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
      {/* Edit Transaction Modal */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Edit Transaction Details"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Title / Description"
            required
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="e.g. Grocery shopping, Salary"
          />
          <Input
            label="Merchant / Source (Optional)"
            optional
            value={editMerchant}
            onChange={(e) => setEditMerchant(e.target.value)}
            placeholder="e.g. Agora, Shwapno, Employer"
          />
          <Textarea
            label="Notes (Optional)"
            optional
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Add any additional notes"
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isEditing}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
