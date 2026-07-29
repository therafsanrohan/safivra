import React, { useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { Card, CardHeader, Skeleton, ErrorState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ReportSummary {
  income: number;
  expense: number;
  net: number;
}

export const ReportsPage: React.FC = () => {
  const { user } = useAuthContext();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const { data, error: rpcErr } = await supabase.rpc('get_monthly_summary', {
        p_year: now.getFullYear(),
        p_month: now.getMonth() + 1,
      } as unknown as never);

      if (rpcErr) throw rpcErr;
      setSummary((data as unknown as ReportSummary) ?? { income: 0, expense: 0, net: 0 });
    } catch (err: any) {
      setError(err.message || 'Could not load monthly summary');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const exportCSV = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('ledger_transactions')
      .select('transaction_date, title, transaction_type, status')
      .eq('user_id', user.id);

    const txList = (data as unknown as Array<{ transaction_date: string; title: string; transaction_type: string; status: string }>) ?? [];
    if (txList.length === 0) return;

    const headers = ['Date', 'Title', 'Type', 'Status'];
    const rows = txList.map((t) => [t.transaction_date, `"${t.title}"`, t.transaction_type, t.status]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `safivra_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="page-container pt-5 space-y-4">
        <Skeleton height={28} width={140} />
        <Skeleton height={120} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container pt-6">
        <ErrorState message={error} onRetry={loadReport} />
      </div>
    );
  }

  return (
    <div className="page-container pt-5 space-y-5 fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            Reports & Analytics
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            Income vs expense breakdown and CSV data exports
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={exportCSV} className="gap-1.5">
          <Download size={16} /> Export CSV
        </Button>
      </header>

      <Card className="space-y-4">
        <CardHeader title="Current Month Overview" />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <span className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">Income</span>
            <p className="text-xl font-semibold tabular-nums text-[var(--color-positive)]" data-financial>
              {formatCurrency(summary?.income ?? 0)}
            </p>
          </div>
          <div>
            <span className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">Expense</span>
            <p className="text-xl font-semibold tabular-nums text-[var(--color-text-primary)]" data-financial>
              {formatCurrency(summary?.expense ?? 0)}
            </p>
          </div>
          <div>
            <span className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">Net Cash Flow</span>
            <p className={['text-xl font-semibold tabular-nums', (summary?.net ?? 0) >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'].join(' ')} data-financial>
              {formatCurrency(summary?.net ?? 0)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
