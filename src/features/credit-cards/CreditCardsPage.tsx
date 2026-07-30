import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { Card, Skeleton, EmptyState, ErrorState, ProgressBar } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface CardRow {
  id: string;
  nickname: string;
  issuer: string;
  last_four: string | null;
  credit_limit: number;
  statement_day: number | null;
  payment_due_day: number | null;
  status: string;
  account: {
    balance: string;
  } | null;
}

export const CreditCardsPage: React.FC = () => {
  const { user } = useAuthContext();
  const [cards, setCards] = useState<CardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchErr } = await supabase
        .from('credit_cards')
        .select(`
          id, nickname, issuer, last_four, credit_limit, statement_day, payment_due_day, status,
          account:financial_accounts!credit_cards_account_id_fkey(balance)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setCards((data as unknown as CardRow[]) ?? []);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const activeCards = cards.filter((c) => c.status === 'active');
  const totalOutstanding = activeCards.reduce((sum, c) => {
    return sum + (c.account?.balance ? Math.abs(Number(c.account.balance)) : 0);
  }, 0);
  const totalLimit = activeCards.reduce((sum, c) => sum + Number(c.credit_limit), 0);

  if (loading) {
    return (
      <div className="page-container pt-5 space-y-4">
        <div className="flex justify-between">
          <Skeleton height={28} width={120} />
          <Skeleton height={36} width={100} />
        </div>
        <Skeleton height={80} />
        <Skeleton height={180} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container pt-6">
        <ErrorState message={error} onRetry={fetchCards} />
      </div>
    );
  }

  return (
    <div className="page-container pt-5 space-y-5 fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            Credit Cards
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            Track card statements, utilization, and due dates
          </p>
        </div>
        <Link to="/credit-cards/add">
          <Button size="sm" className="gap-1">
            <Plus size={16} /> Add Card
          </Button>
        </Link>
      </header>

      {/* Summary */}
      <Card>
        <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mb-1">Total Credit Card Outstanding</p>
        <p className="text-2xl font-semibold tabular-nums text-[var(--color-negative)]" data-financial>
          {formatCurrency(totalOutstanding)}
        </p>
        <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] mt-2">
          Total Credit Limit: {formatCurrency(totalLimit)}
        </p>
      </Card>

      {/* Cards List */}
      <section className="space-y-3">
        <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
          My Cards ({activeCards.length})
        </h2>

        {activeCards.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={22} />}
            title="No credit cards added"
            description="Add your Visa, Mastercard, or AMEX credit cards to monitor utilization."
            action={
              <Link to="/credit-cards/add">
                <Button size="sm">Add Card</Button>
              </Link>
            }
          />
        ) : (
          <Card padding="none">
            <div className="divide-y divide-[var(--color-border)]" role="list">
              {activeCards.map((card) => {
                const outstanding = card.account?.balance ? Math.abs(Number(card.account.balance)) : 0;
                const limit = Number(card.credit_limit);
                const utilizationPct = limit > 0 ? Math.round((outstanding / limit) * 100) : 0;

                return (
                  <Link
                    key={card.id}
                    to={`/credit-cards/${card.id}`}
                    className="flex flex-col gap-2.5 p-5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                    role="listitem"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-negative-soft)] flex items-center justify-center shrink-0">
                          <CreditCard size={20} className="text-[var(--color-negative)]" />
                        </div>
                        <div>
                          <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">
                            {card.nickname} {card.last_four ? `(•••• ${card.last_four})` : ''}
                          </p>
                          <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                            {card.issuer}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold tabular-nums text-[var(--text-body)] text-[var(--color-negative)]" data-financial>
                          {formatCurrency(outstanding)}
                        </span>
                        <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                          Limit: {formatCurrency(limit)}
                        </p>
                      </div>
                    </div>

                    <ProgressBar
                      value={utilizationPct}
                      size="sm"
                      showValue
                      label="Limit Utilization"
                    />
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
