import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate } from '@/lib/dates/formatter';
import { Card, Skeleton, EmptyState, ErrorState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Settings, Trash2 } from 'lucide-react';
import { EditAccountModal } from './EditAccountModal';
import type { Database } from '@/types/database';

type AccountBalance = Database['public']['Views']['v_account_balances']['Row'];

interface LedgerEntryRow {
  id: string;
  amount: number;
  entry_role: string;
  created_at: string;
  ledger_transaction: {
    id: string;
    title: string;
    transaction_type: string;
    transaction_date: string;
  } | null;
}

export const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [account, setAccount] = useState<AccountBalance | null>(null);
  const [entries, setEntries] = useState<LedgerEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error: showError } = useToast();

  const loadAccountDetail = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    setError('');

    try {
      const [accRes, entriesRes] = await Promise.all([
        supabase
          .from('v_account_balances')
          .select('*')
          .eq('account_id', id)
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('ledger_entries')
          .select(`
            id, amount, entry_role, created_at,
            ledger_transaction:ledger_transactions (id, title, transaction_type, transaction_date)
          `)
          .eq('financial_account_id', id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      if (accRes.error) throw accRes.error;
      setAccount((accRes.data as AccountBalance) ?? null);
      setEntries((entriesRes.data as unknown as LedgerEntryRow[]) ?? []);
    } catch (err: any) {
      setError(err.message || 'Could not fetch account details');
      setAccount(null);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    loadAccountDetail();
  }, [loadAccountDetail]);

  const handleDelete = async () => {
    if (deleteConfirmation !== 'DELETE' || !id) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_financial_record', {
        p_record_type: 'account',
        p_record_id: id,
      } as any);
      if (error) throw error;
      success('Account deleted successfully');
      navigate('/dashboard/accounts');
    } catch (err: any) {
      showError('Failed to delete account', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container pt-5 space-y-4">
        <Skeleton height={24} width={100} />
        <Skeleton height={100} />
        <Skeleton height={200} />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="page-container pt-6">
        <ErrorState message={error || 'Account not found'} onRetry={loadAccountDetail} />
      </div>
    );
  }

  const isAsset = account.account_class === 'asset';
  const balance = Number(account.balance);

  return (
    <div className="page-container pt-4 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          aria-label="Go back"
        >
          <ArrowLeft size={18} /> Accounts
        </button>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-1.5 text-[var(--color-primary)] hover:opacity-80 font-medium text-sm"
          aria-label="Edit Account"
        >
          <Settings size={16} /> Edit Account
        </button>
      </div>

      {/* Account Overview Header */}
      <Card className="space-y-3">
        <div>
          <span className="text-[var(--text-label)] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider">
            {account.account_type.replace(/_/g, ' ')} {account.institution ? `· ${account.institution}` : ''}
          </span>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            {account.name}
          </h1>
        </div>

        <div>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">Current Balance</p>
          <p className={['text-3xl font-semibold tabular-nums', isAsset ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-negative)]'].join(' ')} data-financial>
            {formatCurrency(isAsset ? balance : Math.abs(balance))}
          </p>
        </div>

        {account.credit_limit && (
          <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
            Credit Limit: <span className="font-semibold text-[var(--color-text-primary)]" data-financial>{formatCurrency(Number(account.credit_limit))}</span>
          </p>
        )}
      </Card>

      {/* Transactions Statement */}
      <section className="space-y-3">
        <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
          Account Activity ({entries.length})
        </h2>

        {entries.length === 0 ? (
          <EmptyState
            icon={<ArrowRightLeft size={22} />}
            title="No activity recorded"
            description="Transactions affecting this account will appear here."
          />
        ) : (
          <Card padding="none">
            <div className="divide-y divide-[var(--color-border)]" role="list">
              {entries.map((entry) => {
                const tx = entry.ledger_transaction;
                if (!tx) return null;
                const isPositive = Number(entry.amount) > 0;

                return (
                  <Link
                    key={entry.id}
                    to={`/dashboard/activity/${tx.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                    role="listitem"
                  >
                    <div className={['w-9 h-9 rounded-[var(--radius-button)] flex items-center justify-center shrink-0', isPositive ? 'bg-[var(--color-positive-soft)]' : 'bg-[var(--color-bg-subtle)]'].join(' ')}>
                      {isPositive ? (
                        <TrendingUp size={16} className="text-[var(--color-positive)]" />
                      ) : (
                        <TrendingDown size={16} className="text-[var(--color-text-muted)]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)] truncate">
                        {tx.title}
                      </p>
                      <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                        {formatDate(tx.transaction_date)}
                      </p>
                    </div>

                    <span className={['font-semibold tabular-nums text-[var(--text-body)]', isPositive ? 'text-[var(--color-positive)]' : 'text-[var(--color-text-primary)]'].join(' ')} data-financial>
                      {isPositive ? '+' : ''}{formatCurrency(Number(entry.amount))}
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>
        )}
      </section>

      {/* Danger Zone */}
      <section className="space-y-3 pt-6 border-t border-[var(--color-border)] mt-8">
        <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-negative)]">
          Danger Zone
        </h2>
        <Card className="border-[var(--color-negative-soft)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">Delete Account</p>
              <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
                Permanently delete this account and remove it from your balances. Warning: This cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              className="text-[var(--color-negative)] border-[var(--color-negative-soft)] hover:bg-[var(--color-negative-soft)] shrink-0"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 size={16} />
              Delete Account
            </Button>
          </div>
        </Card>
      </section>

      <EditAccountModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        account={account}
        onSuccess={loadAccountDetail}
      />

      <Dialog
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          setIsDeleteModalOpen(open);
          if (!open) setDeleteConfirmation('');
        }}
        title="Delete Account"
      >
        <div className="space-y-4">
          <p className="text-[var(--text-body)] text-[var(--color-text-secondary)]">
            Are you sure you want to delete <strong>{account.name}</strong>? This action cannot be undone and may affect your ledger history.
          </p>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
            Type <strong>DELETE</strong> below to confirm.
          </p>
          <Input
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-[var(--color-negative)] hover:bg-[var(--color-negative)]/90 text-white"
              fullWidth
              disabled={deleteConfirmation !== 'DELETE'}
              loading={isDeleting}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
