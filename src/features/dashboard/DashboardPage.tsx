import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Eye, EyeOff, ChevronRight, Wallet, Landmark,
  CreditCard, TrendingUp, TrendingDown, ArrowRightLeft,
  ReceiptText,
} from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/lib/mongodb/client';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate, formatDueLabel, getGreeting, formatHeaderDate, lastNMonths, isOverdue } from '@/lib/dates/formatter';
import { Card, CardHeader, Skeleton, EmptyState, ErrorState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid,
} from 'recharts';
import type { Database } from '@/types/database';

type AccountBalance = Database['public']['Views']['v_account_balances']['Row'];

interface MonthlySummary {
  income: number;
  expense: number;
  net: number;
}

interface UpcomingPayment {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  type: 'loan' | 'card' | 'recurring';
  overdue: boolean;
}

interface RecentTransaction {
  id: string;
  title: string;
  amount: number;
  type: string;
  date: string;
  isIncome: boolean;
  isTransfer: boolean;
}

interface DashboardData {
  accounts: AccountBalance[];
  monthlySummary: MonthlySummary;
  cashflowHistory: Array<{ label: string; income: number; expense: number }>;
  loanOutstanding: number;
  creditOutstanding: number;
  upcomingPayments: UpcomingPayment[];
  recentTransactions: RecentTransaction[];
}

export const DashboardPage: React.FC = () => {
  const { user, profile } = useAuthContext();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const greeting = getGreeting();
  const headerDate = formatHeaderDate();

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const [accountsResult, loansResult, upcomingLoansResult, recentTxResult, notifResult] =
        await Promise.all([
          supabase
            .from('v_account_balances')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_archived', false),
          supabase
            .from('loans')
            .select('id, account_id')
            .eq('user_id', user.id)
            .eq('status', 'active'),
          supabase
            .from('loans')
            .select('id, name, monthly_installment, next_payment_date')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .not('next_payment_date', 'is', null)
            .order('next_payment_date')
            .limit(5),
          supabase
            .from('ledger_transactions')
            .select('id, title, transaction_type, transaction_date')
            .eq('user_id', user.id)
            .eq('status', 'posted')
            .order('transaction_date', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(8),
          supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false),
        ]);

      if (accountsResult.error) throw accountsResult.error;

      const accounts: AccountBalance[] = (accountsResult.data ?? []) as AccountBalance[];

      // Get monthly summary from DB function
      const now = new Date();
      const summaryResult = await supabase.rpc('get_monthly_summary', {
        p_year: now.getFullYear(),
        p_month: now.getMonth() + 1,
      } as unknown as never);
      const summary: MonthlySummary = (summaryResult.data as MonthlySummary | null) ?? { income: 0, expense: 0, net: 0 };

      // Get 6-month cashflow for chart
      const months = lastNMonths(6);
      const cashflowHistory = await Promise.all(
        months.map(async (m) => {
          const s = await supabase.rpc('get_monthly_summary', {
            p_year: m.year,
            p_month: m.month,
          } as unknown as never);
          const ms: MonthlySummary = (s.data as MonthlySummary | null) ?? { income: 0, expense: 0, net: 0 };
          return { label: m.label, income: ms.income, expense: ms.expense };
        })
      );

      // Calculate loan outstanding from liability accounts
      const loanAccountIds = new Set<string>(
        ((loansResult.data as Array<{id: string; account_id: string | null}>) ?? []).map((l) => l.account_id).filter((x): x is string => x != null)
      );
      const loanOutstanding = accounts
        .filter((a) => loanAccountIds.has(a.account_id) || a.account_type === 'loan')
        .reduce((s, a) => s + Math.abs(Number(a.balance)), 0);

      const creditOutstanding = accounts
        .filter((a) => a.account_type === 'credit_card')
        .reduce((s, a) => s + Math.abs(Number(a.balance)), 0);

      // Upcoming payments
      const upcomingPayments: UpcomingPayment[] = ((upcomingLoansResult.data as Array<{id: string; name: string; monthly_installment: string | null; next_payment_date: string | null}>) ?? []).map((l) => ({
        id: l.id,
        title: l.name,
        amount: Number(l.monthly_installment ?? 0),
        dueDate: l.next_payment_date!,
        type: 'loan' as const,
        overdue: isOverdue(l.next_payment_date!),
      }));

      const recentTransactions: RecentTransaction[] = ((recentTxResult.data as Array<{id: string; title: string; transaction_type: string; transaction_date: string}>) ?? []).map((tx) => ({
        id: tx.id,
        title: tx.title,
        amount: 0,
        type: tx.transaction_type,
        date: tx.transaction_date,
        isIncome: tx.transaction_type === 'income',
        isTransfer: tx.transaction_type === 'transfer',
      }));

      setUnreadCount(notifResult.data?.length ?? 0);
      setData({ accounts, monthlySummary: summary, cashflowHistory, loanOutstanding, creditOutstanding, upcomingPayments, recentTransactions });
    } catch (err: any) {
      setError(err.message || 'Could not load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const liquidAccounts = (data?.accounts ?? []).filter(
    (a) => a.include_in_total && a.is_active && ['cash', 'bank', 'savings', 'mobile_financial_service'].includes(a.account_type)
  );

  const totalBalance = liquidAccounts.reduce((s, a) => s + Number(a.balance), 0);
  const totalAssets = (data?.accounts ?? []).filter((a) => a.account_class === 'asset' && a.include_in_net_worth && a.is_active).reduce((s, a) => s + Number(a.balance), 0);
  const totalLiabilities = (data?.accounts ?? []).filter((a) => a.account_class === 'liability' && a.include_in_net_worth && a.is_active).reduce((s, a) => s + Math.abs(Number(a.balance)), 0);
  const netWorth = totalAssets - totalLiabilities;

  if (loading) return <DashboardSkeleton />;
  if (error) return (
    <div className="page-container pt-6">
      <ErrorState message={error} onRetry={loadDashboard} />
    </div>
  );

  return (
    <div className="page-container pt-5 space-y-5 fade-in" role="main">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
            {greeting}, {firstName}
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-0.5">
            {headerDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/notifications"
            className="relative w-10 h-10 flex items-center justify-center rounded-[var(--radius-button)] hover:bg-[var(--color-bg-subtle)] transition-colors"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell size={20} strokeWidth={1.75} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-negative)] flex items-center justify-center text-[10px] font-semibold text-white" aria-hidden="true">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link
            to="/settings"
            className="w-9 h-9 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center"
            aria-label="Profile settings"
          >
            <span className="text-[var(--text-label)] font-semibold text-[var(--color-accent)]">
              {firstName[0]?.toUpperCase()}
            </span>
          </Link>
        </div>
      </header>

      {/* Total Balance */}
      <Card>
        <div className="flex items-start justify-between mb-1">
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">Total Available Balance</p>
          <button
            onClick={() => setBalanceHidden((v) => !v)}
            aria-label={balanceHidden ? 'Show balance' : 'Hide balance'}
            className="p-1 -mr-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          >
            {balanceHidden ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        </div>
        <p
          className="text-[var(--text-balance)] font-semibold tabular-nums text-[var(--color-text-primary)] leading-none"
          data-financial
          aria-label={balanceHidden ? 'Balance hidden' : `Total: ${formatCurrency(totalBalance)}`}
        >
          {balanceHidden ? <span className="tracking-widest">৳ ••••••</span> : formatCurrency(totalBalance)}
        </p>
      </Card>

      {/* Monthly Summary */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Income" value={data?.monthlySummary.income ?? 0} masked={balanceHidden} icon={<TrendingUp size={16} />} />
        <SummaryCard label="Expense" value={data?.monthlySummary.expense ?? 0} masked={balanceHidden} icon={<TrendingDown size={16} />} />
        <SummaryCard label="Loan" value={data?.loanOutstanding ?? 0} masked={balanceHidden} icon={<Landmark size={16} />} href="/loans" />
        <SummaryCard label="Credit" value={data?.creditOutstanding ?? 0} masked={balanceHidden} icon={<CreditCard size={16} />} href="/credit-cards" />
      </div>

      {/* Net Worth */}
      <Card>
        <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mb-2">Current Net Worth</p>
        <p className={['text-2xl font-semibold tabular-nums mb-3', netWorth >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-text-primary)]'].join(' ')} data-financial>
          {balanceHidden ? '৳ ••••••' : formatCurrency(netWorth)}
        </p>
        <div className="flex justify-between text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
          <span><span className="text-[var(--color-text-muted)]">Assets </span><span className="font-medium text-[var(--color-text-primary)]" data-financial>{balanceHidden ? '••••' : formatCurrency(totalAssets)}</span></span>
          <span><span className="text-[var(--color-text-muted)]">Liabilities </span><span className="font-medium text-[var(--color-text-primary)]" data-financial>{balanceHidden ? '••••' : formatCurrency(totalLiabilities)}</span></span>
        </div>
      </Card>

      {/* Cash Flow Chart */}
      {data && data.cashflowHistory.length > 0 && (
        <Card>
          <CardHeader title="Monthly Cash Flow" subtitle="Last 6 months" />
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data.cashflowHistory} barSize={14} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', fontSize: '12px' }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Bar dataKey="income" name="Income" fill="var(--color-positive)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="var(--color-negative-soft)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Accounts */}
      <Card padding="none">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">Accounts</h2>
          <Link to="/accounts" className="text-[var(--text-secondary)] text-[var(--color-accent)] font-semibold">View all</Link>
        </div>
        {liquidAccounts.length === 0 ? (
          <EmptyState
            icon={<Wallet size={22} />}
            title="No accounts yet"
            description="Add your first account to track balances."
            action={<Link to="/accounts/add"><Button size="sm">Add account</Button></Link>}
            className="py-8"
          />
        ) : (
          <div className="divide-y divide-[var(--color-border)]" role="list">
            {liquidAccounts.slice(0, 5).map((acc) => (
              <Link key={acc.account_id} to={`/accounts/${acc.account_id}`} role="listitem"
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                aria-label={`${acc.name}: ${formatCurrency(Number(acc.balance))}`}
              >
                <div className="w-9 h-9 rounded-[var(--radius-button)] bg-[var(--color-accent-soft)] flex items-center justify-center shrink-0">
                  <Wallet size={16} className="text-[var(--color-accent)]" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)] truncate">{acc.name}</p>
                  <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] capitalize">{acc.account_type.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-semibold tabular-nums text-[var(--text-body)]" data-financial>
                    {balanceHidden ? '••••' : formatCurrency(Number(acc.balance))}
                  </span>
                  <ChevronRight size={14} className="text-[var(--color-text-muted)]" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming Payments */}
      {data && data.upcomingPayments.length > 0 && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">Upcoming Payments</h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]" role="list">
            {data.upcomingPayments.map((pmt) => (
              <div key={pmt.id} className="flex items-center gap-3 px-5 py-3.5" role="listitem">
                <div className={['w-2 h-2 rounded-full shrink-0', pmt.overdue ? 'bg-[var(--color-negative)]' : 'bg-[var(--color-warning)]'].join(' ')} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)] truncate">{pmt.title}</p>
                  <p className={['text-[var(--text-secondary)]', pmt.overdue ? 'text-[var(--color-negative)]' : 'text-[var(--color-text-muted)]'].join(' ')}>
                    {formatDueLabel(pmt.dueDate)}
                  </p>
                </div>
                {pmt.amount > 0 && (
                  <span className="font-semibold tabular-nums text-[var(--text-body)]" data-financial>
                    {balanceHidden ? '••••' : formatCurrency(pmt.amount)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card padding="none">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">Recent Activity</h2>
          <Link to="/activity" className="text-[var(--text-secondary)] text-[var(--color-accent)] font-semibold">View all</Link>
        </div>
        {(!data || data.recentTransactions.length === 0) ? (
          <EmptyState
            icon={<ReceiptText size={22} />}
            title="No transactions yet"
            description="Add your first income or expense to begin tracking."
            className="py-8"
          />
        ) : (
          <div className="divide-y divide-[var(--color-border)]" role="list">
            {data.recentTransactions.map((tx) => (
              <Link key={tx.id} to={`/activity/${tx.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                role="listitem"
              >
                <div className={[
                  'w-9 h-9 rounded-[var(--radius-button)] flex items-center justify-center shrink-0',
                  tx.isIncome ? 'bg-[var(--color-positive-soft)]' : tx.isTransfer ? 'bg-[var(--color-info-soft)]' : 'bg-[var(--color-bg-subtle)]',
                ].join(' ')}>
                  {tx.isIncome ? (
                    <TrendingUp size={16} className="text-[var(--color-positive)]" aria-hidden="true" />
                  ) : tx.isTransfer ? (
                    <ArrowRightLeft size={16} className="text-[var(--color-info)]" aria-hidden="true" />
                  ) : (
                    <TrendingDown size={16} className="text-[var(--color-text-muted)]" aria-hidden="true" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)] truncate">{tx.title}</p>
                  <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">{formatDate(tx.date)}</p>
                </div>
                <span className={['font-semibold tabular-nums text-[var(--text-body)] shrink-0', tx.isIncome ? 'text-[var(--color-positive)]' : ''].join(' ')} data-financial>
                  {tx.isIncome ? '+' : tx.isTransfer ? '' : '-'}
                  {balanceHidden ? '••••' : '—'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <div aria-hidden="true" className="h-4" />
    </div>
  );
};

// Summary card
const SummaryCard: React.FC<{
  label: string; value: number; masked: boolean;
  icon: React.ReactNode; href?: string;
}> = ({ label, value, masked, icon, href }) => {
  const content = (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
        {icon}
        <span className="text-[var(--text-secondary)] font-medium">{label}</span>
      </div>
      <p className="text-[1.125rem] font-semibold tabular-nums text-[var(--color-text-primary)]" data-financial>
        {masked ? '••••' : formatCurrency(value)}
      </p>
    </Card>
  );
  if (href) return <Link to={href} className="block">{content}</Link>;
  return content;
};

// Skeleton
const DashboardSkeleton: React.FC = () => (
  <div className="page-container pt-5 space-y-5" aria-label="Loading" aria-busy="true">
    <div className="flex justify-between">
      <div className="space-y-2"><Skeleton height={20} width={140} /><Skeleton height={14} width={100} /></div>
      <Skeleton height={36} width={36} rounded />
    </div>
    <Skeleton height={90} />
    <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} height={70} />)}</div>
    <Skeleton height={90} />
    <Skeleton height={200} />
    <Skeleton height={200} />
  </div>
);
