import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, TrendingUp, TrendingDown, ArrowRightLeft, ReceiptText } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate } from '@/lib/dates/formatter';
import { Card, Skeleton, EmptyState, ErrorState } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const PAGE_SIZE = 50;

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
  const { t, locale } = useLanguage();
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchTransactions = useCallback(async (offset = 0, append = false) => {
    if (!user) return;
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      let query = supabase
        .from('ledger_transactions')
        .select(`
          id, title, transaction_type, transaction_date, merchant, status,
          ledger_entries(id, amount, entry_role)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (typeFilter !== 'all') {
        query = query.eq('transaction_type', typeFilter);
      }

      const { data, error: fetchErr, count } = await query;
      if (fetchErr) throw fetchErr;

      const newData = (data as unknown as TxRow[]) ?? [];
      setTransactions((prev) => append ? [...prev, ...newData] : newData);
      setTotalCount(count ?? 0);
      setHasMore(newData.length === PAGE_SIZE);
    } catch (err: any) {
      setError(err?.message || 'Could not fetch transactions');
      if (!append) setTransactions([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, typeFilter]);

  useEffect(() => {
    fetchTransactions(0, false);
  }, [fetchTransactions]);

  const handleLoadMore = () => {
    fetchTransactions(transactions.length, true);
  };

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
          <Skeleton height={28} width={120} />
          <Skeleton height={36} width={80} />
        </div>
        <Skeleton height={40} />
        <Skeleton height={240} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container pt-6">
        <ErrorState message={error} onRetry={() => fetchTransactions(0, false)} />
      </div>
    );
  }

  const isBn = locale === 'bn';

  return (
    <div className="page-container pt-5 space-y-5 fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            {t.activity.title}
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            {totalCount > 0
              ? (isBn ? `মোট ${totalCount}টি লেনদেন` : `${totalCount} transactions total`)
              : (isBn ? 'সকল অনুমোদিত ও সংরক্ষিত লেনদেন' : 'All posted ledger transactions')}
          </p>
        </div>
        <Link to="/dashboard/activity/add">
          <Button size="sm" className="gap-1">
            <Plus size={16} /> {isBn ? 'যুক্ত করুন' : 'Record'}
          </Button>
        </Link>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder={isBn ? 'শিরোনাম বা মার্চেন্ট খুঁজুন...' : 'Search by title or merchant...'}
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
              { value: 'all', label: isBn ? 'সকল ধরন' : 'All Types' },
              { value: 'expense', label: isBn ? 'খরচ (Expense)' : 'Expense' },
              { value: 'income', label: isBn ? 'আয় (Income)' : 'Income' },
              { value: 'transfer', label: isBn ? 'স্থানান্তর (Transfer)' : 'Transfer' },
              { value: 'loan_payment', label: isBn ? 'ঋণ পরিশোধ' : 'Loan Payment' },
              { value: 'credit_card_payment', label: isBn ? 'কার্ড পরিশোধ' : 'Card Payment' },
            ]}
          />
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon={<ReceiptText size={22} />}
          title={isBn ? 'কোনো লেনদেন পাওয়া যায়নি' : 'No transactions found'}
          description={searchQuery ? (isBn ? 'অনুসন্ধান বা ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।' : 'Try adjusting your search query or filter.') : (isBn ? 'শুরু করতে আপনার প্রথম লেনদেন যোগ করুন।' : 'Record your first transaction to get started.')}
          action={
            !searchQuery ? (
              <Link to="/dashboard/activity/add">
                <Button size="sm">{isBn ? 'লেনদেন যোগ করুন' : 'Add Transaction'}</Button>
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
                  to={`/dashboard/activity/${tx.id}`}
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
          {/* Load More */}
          {hasMore && !searchQuery && (
            <div className="px-5 py-4 flex justify-center border-t border-[var(--color-border)]">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleLoadMore}
                loading={loadingMore}
              >
                {isBn ? 'আরও দেখুন' : 'Load More'}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
