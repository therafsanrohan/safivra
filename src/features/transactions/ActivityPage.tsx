import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, TrendingUp, TrendingDown, ArrowRightLeft, ReceiptText } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate } from '@/lib/dates/formatter';
import { parseError } from '@/lib/errors/handler';
import { Card, Skeleton, EmptyState, ErrorState } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface TxRow {
  id: string;
  title: string;
  transaction_type: string;
  transaction_date: string;
  merchant: string | null;
  status: string;
  ledger_entries: Array<{
    id: string;
    amount: number;
    entry_role: string;
  }>;
}

export const ActivityPage: React.FC = () => {
  const { user } = useAuthContext();
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      let query = supabase
        .from('ledger_transactions')
        .select(`
          id, title, transaction_type, transaction_date, merchant, status,
          ledger_entries(id, amount, entry_role)
        `)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('transaction_type', typeFilter);
      }

      const { data, error: fetchErr } = await query.limit(50);
      if (fetchErr) throw fetchErr;

      setTransactions((data as unknown as TxRow[]) ?? []);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  }, [user, typeFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.title.toLowerCase().includes(q) ||
      (tx.merchant && tx.merchant.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="page-container pt-5 space-y-4">
        <div className="flex justify-between">
          <Skeleton height={28} width={140} />
          <Skeleton height={36} width={90} />
        </div>
        <Skeleton height={44} />
        <Skeleton height={260} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container pt-6">
        <ErrorState message={error} onRetry={fetchTransactions} />
      </div>
    );
  }

  return (
    <div className="page-container pt-5 space-y-5 fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            Activity
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            All posted ledger transactions
          </p>
        </div>
        <Link to="/activity/add">
          <Button size="sm" className="gap-1">
            <Plus size={16} /> Record
          </Button>
        </Link>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by title or merchant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftElement={<Search size={16} />}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
              { value: 'transfer', label: 'Transfer' },
              { value: 'loan_payment', label: 'Loan Payment' },
              { value: 'credit_card_payment', label: 'Card Payment' },
            ]}
          />
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon={<ReceiptText size={22} />}
          title="No transactions found"
          description={searchQuery ? 'Try adjusting your search query or filter.' : 'Record your first transaction to get started.'}
          action={
            !searchQuery ? (
              <Link to="/activity/add">
                <Button size="sm">Add Transaction</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card padding="none">
          <div className="divide-y divide-[var(--color-border)]" role="list">
            {filteredTransactions.map((tx) => {
              const entries = tx.ledger_entries ?? [];
              const isIncome = tx.transaction_type === 'income';
              const isTransfer = tx.transaction_type === 'transfer';

              // Get primary entry amount
              const primaryEntry = entries.find((e) =>
                isIncome ? e.entry_role === 'asset_debit' : e.entry_role === 'asset_credit' || e.entry_role === 'expense_debit'
              ) || entries[0];

              const amount = primaryEntry ? Math.abs(Number(primaryEntry.amount)) : 0;

              return (
                <Link
                  key={tx.id}
                  to={`/activity/${tx.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                  role="listitem"
                >
                  <div className={[
                    'w-9 h-9 rounded-[var(--radius-button)] flex items-center justify-center shrink-0',
                    isIncome ? 'bg-[var(--color-positive-soft)]' : isTransfer ? 'bg-[var(--color-info-soft)]' : 'bg-[var(--color-bg-subtle)]',
                  ].join(' ')}>
                    {isIncome ? (
                      <TrendingUp size={16} className="text-[var(--color-positive)]" />
                    ) : isTransfer ? (
                      <ArrowRightLeft size={16} className="text-[var(--color-info)]" />
                    ) : (
                      <TrendingDown size={16} className="text-[var(--color-text-muted)]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)] truncate">
                      {tx.title}
                    </p>
                    <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                      {formatDate(tx.transaction_date)} {tx.merchant ? `· ${tx.merchant}` : ''}
                    </p>
                  </div>

                  <span
                    className={[
                      'font-semibold tabular-nums text-[var(--text-body)] shrink-0',
                      isIncome ? 'text-[var(--color-positive)]' : 'text-[var(--color-text-primary)]',
                    ].join(' ')}
                    data-financial
                  >
                    {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(amount)}
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
