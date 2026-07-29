import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate } from '@/lib/dates/formatter';
import { parseError } from '@/lib/errors/handler';
import { Card, Skeleton, EmptyState, ErrorState, Badge } from '@/components/ui/Card';

interface RecurringRow {
  id: string;
  name: string;
  transaction_type: string;
  amount: number;
  frequency: string;
  next_occurrence: string;
  is_active: boolean;
}

export const RecurringPage: React.FC = () => {
  const { user } = useAuthContext();
  const [items, setItems] = useState<RecurringRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecurring = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchErr } = await supabase
        .from('recurring_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('next_occurrence', { ascending: true });

      if (fetchErr) throw fetchErr;
      setItems((data as RecurringRow[]) ?? []);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

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
        <ErrorState message={error} onRetry={fetchRecurring} />
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
          Recurring Commitments
        </h1>
        <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
          Subscriptions, bills, rent, and scheduled salary income
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={<RefreshCw size={22} />}
          title="No recurring commitments"
          description="Add monthly internet bills, house rent, or streaming subscriptions to receive timely reminders."
        />
      ) : (
        <Card padding="none">
          <div className="divide-y divide-[var(--color-border)]" role="list">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3.5" role="listitem">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">
                      {item.name}
                    </p>
                    <Badge variant="neutral">{item.frequency}</Badge>
                  </div>
                  <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                    Next due: {formatDate(item.next_occurrence)}
                  </p>
                </div>
                <span className="font-semibold tabular-nums text-[var(--text-body)]" data-financial>
                  {formatCurrency(Number(item.amount))}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
