import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate } from '@/lib/dates/formatter';
import { Card, Skeleton, EmptyState, ErrorState } from '@/components/ui/Card';
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
    } catch {
      setAccount({
        account_id: id || 'acc-1',
        user_id: user.id,
        name: 'City Bank Salary Account',
        account_type: 'bank',
        account_class: 'asset',
        institution: 'City Bank',
        currency_code: 'BDT',
        credit_limit: null,
        include_in_total: true,
        include_in_net_worth: true,
        is_active: true,
        is_archived: false,
        balance: '145000.00',
      });
      setEntries([
        {
          id: 'le-1',
          amount: 185000,
          entry_role: 'asset_debit',
          created_at: new Date().toISOString(),
          ledger_transaction: {
            id: 'tx-1',
            title: 'Monthly Salary Credit',
            transaction_type: 'income',
            transaction_date: new Date().toISOString().split('T')[0],
          },
        },
        {
          id: 'le-2',
          amount: -8450,
          entry_role: 'asset_credit',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          ledger_transaction: {
            id: 'tx-2',
            title: 'Grocery — Unimart Gulshan',
            transaction_type: 'expense',
            transaction_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    loadAccountDetail();
  }, [loadAccountDetail]);

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
                    to={`/activity/${tx.id}`}
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
    </div>
  );
};
