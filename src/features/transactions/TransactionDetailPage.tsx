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
              const targetName = entry.financial_account?.name || entry.category?.name || 'Account/Category';

              return (
                <div key={entry.id} className="flex items-center justify-between px-5 py-3.5" role="listitem">
                  <div>
                    <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">
                      {targetName}
                    </p>
                    <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] capitalize">
                      {entry.entry_role.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className={['font-semibold tabular-nums', amount >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'].join(' ')} data-financial>
                    {amount >= 0 ? '+' : ''}{formatCurrency(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {!isVoided && (
        <div className="pt-2">
          <Button
            variant="destructive"
            fullWidth
            loading={voiding}
            onClick={handleVoid}
            className="gap-2"
          >
            <Ban size={18} /> Void Transaction
          </Button>
        </div>
      )}
    </div>
  );
};
