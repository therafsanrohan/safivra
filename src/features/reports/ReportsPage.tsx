import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, PieChart, Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate } from '@/lib/dates/formatter';
import { Card, CardHeader, Skeleton, ErrorState, ProgressBar, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

interface TransactionWithEntries {
  id: string;
  title: string;
  transaction_type: string;
  transaction_date: string;
  merchant: string | null;
  description: string | null;
  status: string;
  ledger_entries: Array<{
    amount: number;
    entry_role: string;
    financial_account?: { name: string } | null;
    category?: { name: string; color?: string } | null;
  }>;
}

export const ReportsPage: React.FC = () => {
  const { user } = useAuthContext();
  const { t, locale } = useLanguage();
  const isBn = locale === 'bn';

  const [transactions, setTransactions] = useState<TransactionWithEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date Filtering: Selected Year and Month
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // 1-12, 0 = All Year
  const [dateRangeMode, setDateRangeMode] = useState<'month' | 'year' | 'all'>('month');

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchErr } = await (supabase.from('ledger_transactions') as any)
        .select(`
          id, title, transaction_type, transaction_date, merchant, description, status,
          ledger_entries(
            amount, entry_role,
            financial_account:financial_accounts(name),
            category:transaction_categories(name, color)
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'posted')
        .order('transaction_date', { ascending: false });

      if (fetchErr) throw fetchErr;
      setTransactions((data as unknown as TransactionWithEntries[]) ?? []);
    } catch (err: any) {
      console.error('Reports fetch error:', err);
      setError(err.message || 'Could not load report data');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Filter transactions according to selected range
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (dateRangeMode === 'all') return true;
      const txDate = new Date(tx.transaction_date);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth() + 1;

      if (dateRangeMode === 'year') {
        return txYear === selectedYear;
      }
      return txYear === selectedYear && txMonth === selectedMonth;
    });
  }, [transactions, selectedYear, selectedMonth, dateRangeMode]);

  // Calculate Aggregates
  const analytics = useMemo(() => {
    let income = 0;
    let expense = 0;
    const categoryExpenseMap: Record<string, number> = {};
    const categoryIncomeMap: Record<string, number> = {};
    const accountActivityMap: Record<string, number> = {};

    for (const tx of filteredTransactions) {
      const entries = tx.ledger_entries ?? [];
      
      // Find category entry or default to first entry
      const categoryEntry = entries.find((e) => e.category?.name) || entries[0];
      const accountEntry = entries.find((e) => e.financial_account?.name) || entries[0];

      const catName = categoryEntry?.category?.name || (isBn ? 'অন্যান্য' : 'Uncategorized');
      const accName = accountEntry?.financial_account?.name || (isBn ? 'সাধারণ' : 'General');

      // Income entries
      const incomeEntries = entries.filter((e) => e.entry_role === 'income_credit');
      const txIncome = incomeEntries.reduce((sum, e) => sum + Number(e.amount), 0);

      // Expense entries
      const expenseEntries = entries.filter((e) =>
        ['expense_debit', 'fee_expense'].includes(e.entry_role)
      );
      const txExpense = expenseEntries.reduce((sum, e) => sum + Number(e.amount), 0);

      if (tx.transaction_type === 'income' || txIncome > 0) {
        const amt = txIncome > 0 ? txIncome : Number(categoryEntry?.amount || 0);
        income += amt;
        categoryIncomeMap[catName] = (categoryIncomeMap[catName] || 0) + amt;
      }

      if (
        ['expense', 'loan_payment', 'credit_card_payment', 'credit_card_purchase', 'fee'].includes(tx.transaction_type) ||
        txExpense > 0
      ) {
        const amt = txExpense > 0 ? txExpense : Number(categoryEntry?.amount || 0);
        expense += amt;
        categoryExpenseMap[catName] = (categoryExpenseMap[catName] || 0) + amt;
      }

      const totalTxAmount = Number(entries[0]?.amount || 0);
      accountActivityMap[accName] = (accountActivityMap[accName] || 0) + totalTxAmount;
    }

    const netSavings = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.round((netSavings / income) * 100)) : 0;

    // Convert category map to sorted list
    const expenseCategories = Object.entries(categoryExpenseMap)
      .map(([name, total]) => ({
        name,
        total,
        percentage: expense > 0 ? Math.round((total / expense) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const incomeCategories = Object.entries(categoryIncomeMap)
      .map(([name, total]) => ({
        name,
        total,
        percentage: income > 0 ? Math.round((total / income) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const accountActivity = Object.entries(accountActivityMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    return {
      income,
      expense,
      netSavings,
      savingsRate,
      expenseCategories,
      incomeCategories,
      accountActivity,
      txCount: filteredTransactions.length,
    };
  }, [filteredTransactions, isBn]);

  // Export Full CSV
  const exportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      'Date',
      'Title',
      'Type',
      'Category',
      'Account',
      'Merchant',
      'Amount (BDT)',
      'Notes',
      'Status'
    ];

    const rows = filteredTransactions.map((tx) => {
      const entries = tx.ledger_entries ?? [];
      const catEntry = entries.find((e) => e.category?.name);
      const accEntry = entries.find((e) => e.financial_account?.name);

      const amount = Number(entries[0]?.amount || 0);
      const cat = catEntry?.category?.name || '';
      const acc = accEntry?.financial_account?.name || '';
      const merchant = tx.merchant || '';
      const notes = (tx.description || '').replace(/"/g, '""');
      const title = (tx.title || '').replace(/"/g, '""');

      return [
        tx.transaction_date,
        `"${title}"`,
        tx.transaction_type,
        `"${cat}"`,
        `"${acc}"`,
        `"${merchant}"`,
        amount.toFixed(2),
        `"${notes}"`,
        tx.status
      ];
    });

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map((r) => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `safivra_report_${selectedYear}_${dateRangeMode === 'month' ? selectedMonth : dateRangeMode}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthNamesBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const monthNames = isBn ? monthNamesBn : monthNamesEn;

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  if (loading) {
    return (
      <div className="page-container pt-5 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton height={28} width={160} />
          <Skeleton height={36} width={100} />
        </div>
        <Skeleton height={100} />
        <Skeleton height={220} />
        <Skeleton height={220} />
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
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            {isBn ? 'প্রতিবেদন ও বিশ্লেষণ' : 'Reports & Analytics'}
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            {isBn ? 'আয় ও ব্যয়ের বিশ্লেষণ এবং সিএসভি ডাটা এক্সপোর্ট' : 'Income vs expense breakdown and CSV data exports'}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={exportCSV} className="gap-1.5 self-start sm:self-auto" disabled={filteredTransactions.length === 0}>
          <Download size={16} /> {isBn ? 'সিএসভি ডাউনলোড' : 'Export CSV'}
        </Button>
      </header>

      {/* Date Range Selector Card */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-[var(--color-bg-subtle)] p-1 rounded-[var(--radius-button)]">
            <button
              onClick={() => setDateRangeMode('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-input)] transition-all ${
                dateRangeMode === 'month'
                  ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {isBn ? 'মাসিক' : 'Monthly'}
            </button>
            <button
              onClick={() => setDateRangeMode('year')}
              className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-input)] transition-all ${
                dateRangeMode === 'year'
                  ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {isBn ? 'বাৎসরিক' : 'Yearly'}
            </button>
            <button
              onClick={() => setDateRangeMode('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-input)] transition-all ${
                dateRangeMode === 'all'
                  ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {isBn ? 'সর্বমোট' : 'All Time'}
            </button>
          </div>

          {dateRangeMode === 'month' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-button)] hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-semibold text-sm text-[var(--color-text-primary)] min-w-[130px] text-center">
                {monthNames[selectedMonth - 1]} {selectedYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-button)] hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {dateRangeMode === 'year' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedYear((y) => y - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-button)] hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-semibold text-sm text-[var(--color-text-primary)] min-w-[80px] text-center">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-button)] hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] text-[var(--color-text-muted)] text-xs font-medium uppercase tracking-wider">
              {isBn ? 'মোট আয়' : 'Total Income'}
            </span>
            <div className="w-7 h-7 rounded-full bg-[var(--color-positive-soft)] flex items-center justify-center">
              <TrendingUp size={14} className="text-[var(--color-positive)]" />
            </div>
          </div>
          <p className="text-2xl font-bold tabular-nums text-[var(--color-positive)]" data-financial>
            {formatCurrency(analytics.income)}
          </p>
        </Card>

        <Card className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] text-[var(--color-text-muted)] text-xs font-medium uppercase tracking-wider">
              {isBn ? 'মোট খরচ' : 'Total Expense'}
            </span>
            <div className="w-7 h-7 rounded-full bg-[var(--color-negative-soft)] flex items-center justify-center">
              <TrendingDown size={14} className="text-[var(--color-negative)]" />
            </div>
          </div>
          <p className="text-2xl font-bold tabular-nums text-[var(--color-text-primary)]" data-financial>
            {formatCurrency(analytics.expense)}
          </p>
        </Card>

        <Card className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] text-[var(--color-text-muted)] text-xs font-medium uppercase tracking-wider">
              {isBn ? 'নেট সঞ্চয়' : 'Net Savings'}
            </span>
            <Badge variant={analytics.netSavings >= 0 ? 'positive' : 'negative'}>
              {analytics.savingsRate}% {isBn ? 'সঞ্চয় হার' : 'saved'}
            </Badge>
          </div>
          <p className={['text-2xl font-bold tabular-nums', analytics.netSavings >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'].join(' ')} data-financial>
            {formatCurrency(analytics.netSavings)}
          </p>
        </Card>
      </div>

      {/* Category Breakdown Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Expense by Category */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
              {isBn ? 'খাত অনুযায়ী খরচ' : 'Expenses by Category'}
            </h2>
            <span className="text-xs text-[var(--color-text-muted)]">
              {analytics.expenseCategories.length} {isBn ? 'টি খাত' : 'categories'}
            </span>
          </div>

          {analytics.expenseCategories.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] py-6 text-center text-sm">
              {isBn ? 'নির্বাচিত সময়ে কোনো খরচের রেকর্ড পাওয়া যায়নি' : 'No expenses recorded in selected period.'}
            </p>
          ) : (
            <div className="space-y-3.5">
              {analytics.expenseCategories.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--color-text-primary)]">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-text-muted)]">{cat.percentage}%</span>
                      <span className="font-semibold tabular-nums text-[var(--color-text-primary)]" data-financial>
                        {formatCurrency(cat.total)}
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={cat.percentage} size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Income by Source */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
              {isBn ? 'উৎস অনুযায়ী আয়' : 'Income by Source'}
            </h2>
            <span className="text-xs text-[var(--color-text-muted)]">
              {analytics.incomeCategories.length} {isBn ? 'টি উৎস' : 'sources'}
            </span>
          </div>

          {analytics.incomeCategories.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] py-6 text-center text-sm">
              {isBn ? 'নির্বাচিত সময়ে কোনো আয়ের রেকর্ড পাওয়া যায়নি' : 'No income recorded in selected period.'}
            </p>
          ) : (
            <div className="space-y-3.5">
              {analytics.incomeCategories.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--color-text-primary)]">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-text-muted)]">{cat.percentage}%</span>
                      <span className="font-semibold tabular-nums text-[var(--color-positive)]" data-financial>
                        {formatCurrency(cat.total)}
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={cat.percentage} size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Transaction Records Summary */}
      <Card className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            {isBn ? 'মোট ট্রানজ্যাকশন সংখ্যা' : 'Total Transactions in Period'}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {isBn ? 'নির্বাচিত সময়সীমার সকল অনুমোদিত হিসাব' : 'All posted transactions filtered for export'}
          </p>
        </div>
        <span className="text-xl font-bold tabular-nums text-[var(--color-primary)]">
          {analytics.txCount}
        </span>
      </Card>
    </div>
  );
};

