import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { parseError } from '@/lib/errors/handler';
import { Card, Skeleton, EmptyState, ErrorState, ProgressBar } from '@/components/ui/Card';

interface BudgetRow {
  id: string;
  name: string;
  period_type: string;
  total_limit: number;
  alert_threshold: number;
  is_active: boolean;
}

export const BudgetsPage: React.FC = () => {
  const { user } = useAuthContext();
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchErr } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setBudgets((data as BudgetRow[]) ?? []);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  if (loading) {
    return (
      <div className="page-container pt-5 space-y-4">
        <Skeleton height={24} width={100} />
        <Skeleton height={140} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container pt-6">
        <ErrorState message={error} onRetry={fetchBudgets} />
      </div>
    );
  }

  return (
    <div className="page-container pt-4 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <Link to="/plans" className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <ArrowLeft size={18} /> Plans
        </Link>
      </div>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            Budgets
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            Monthly spending limits and threshold alerts
          </p>
        </div>
      </header>

      {budgets.length === 0 ? (
        <EmptyState
          icon={<Target size={22} />}
          title="No active budgets"
          description="Create a monthly budget to keep your dining, entertainment, and shopping expenses under control."
        />
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => (
            <Card key={b.id} className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                    {b.name}
                  </h2>
                  <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] capitalize">
                    {b.period_type} Budget
                  </p>
                </div>
                <span className="font-semibold tabular-nums text-[var(--text-body)]" data-financial>
                  Limit: {formatCurrency(Number(b.total_limit))}
                </span>
              </div>
              <ProgressBar value={25} showValue label="Current Month Spent" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
