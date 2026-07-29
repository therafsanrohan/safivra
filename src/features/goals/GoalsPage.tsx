import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate } from '@/lib/dates/formatter';
import { parseError } from '@/lib/errors/handler';
import { Card, Skeleton, EmptyState, ErrorState, ProgressBar } from '@/components/ui/Card';

interface GoalRow {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: string;
}

export const GoalsPage: React.FC = () => {
  const { user } = useAuthContext();
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchErr } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setGoals((data as GoalRow[]) ?? []);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

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
        <ErrorState message={error} onRetry={fetchGoals} />
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

      <header>
        <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
          Savings Goals
        </h1>
        <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
          Emergency funds, Hajj/Umrah savings, and major milestone targets
        </p>
      </header>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Trophy size={22} />}
          title="No savings goals set"
          description="Create savings targets for emergency funds, travel, or big purchases."
        />
      ) : (
        <div className="space-y-4">
          {goals.map((g) => {
            const target = Number(g.target_amount);
            const current = Number(g.current_amount);
            const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

            return (
              <Card key={g.id} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                      {g.name}
                    </h2>
                    {g.target_date && (
                      <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                        Target Date: {formatDate(g.target_date)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold tabular-nums text-[var(--text-body)] text-[var(--color-positive)]" data-financial>
                      {formatCurrency(current)}
                    </span>
                    <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                      of {formatCurrency(target)}
                    </p>
                  </div>
                </div>
                <ProgressBar value={pct} showValue variant="positive" label="Goal Progress" />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
