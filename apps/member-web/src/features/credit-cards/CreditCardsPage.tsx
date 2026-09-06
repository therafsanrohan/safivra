import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { Card, Skeleton, EmptyState, ErrorState, ProgressBar } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';

const getCardGradient = (type: string, name: string | null = '', inst: string | null = '') => {
  const t = type?.toLowerCase() || '';
  const n = name?.toLowerCase() || '';
  const i = inst?.toLowerCase() || '';
  
  if (t === 'credit_card') return 'bank-card-credit';
  if (t === 'cash') return 'bank-card-cash';
  if (t === 'loan' || t === 'mortgage') return 'bank-card-loan';
  if (n.includes('bkash') || i.includes('bkash')) return 'bank-card-wallet-bkash';
  if (n.includes('nagad') || i.includes('nagad')) return 'bank-card-wallet-nagad';
  if (t === 'mobile_money') return 'bank-card-wallet-bkash';
  return 'bank-card-premium';
};

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
  const { t, locale } = useLanguage();
  const isBn = locale === 'bn';
  const [cards, setCards] = useState<CardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const [cardsRes, balancesRes] = await Promise.all([
        (supabase.from('credit_cards') as any)
          .select('id, account_id, nickname, issuer, last_four, credit_limit, statement_day, payment_due_day, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        (supabase.from('v_account_balances') as any)
          .select('account_id, balance')
          .eq('user_id', user.id),
      ]);

      if (cardsRes.error) throw cardsRes.error;

      const balanceMap = new Map(
        ((balancesRes.data as any[]) ?? []).map((b) => [b.account_id, b.balance])
      );

      const mappedCards: CardRow[] = ((cardsRes.data as any[]) ?? []).map((c) => ({
        ...c,
        credit_limit: Number(c.credit_limit),
        account: c.account_id ? { balance: balanceMap.get(c.account_id) ?? '0' } : null,
      }));

      setCards(mappedCards);
    } catch (err: any) {
      console.error('Failed to load credit cards:', err);
      setError(err?.message || 'Failed to load credit cards');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const displayCards = cards.filter((c) => c.status !== 'archived');
  const activeCards = cards.filter((c) => c.status === 'active' || !c.status);
  const totalOutstanding = displayCards.reduce((sum, c) => {
    return sum + (c.account?.balance ? Math.abs(Number(c.account.balance)) : 0);
  }, 0);
  const totalLimit = displayCards.reduce((sum, c) => sum + Number(c.credit_limit), 0);

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
            {t.creditCards.title}
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            {t.creditCards.subtitle}
          </p>
        </div>
        <Link to="/dashboard/credit-cards/add">
          <Button size="sm" className="gap-1">
            <Plus size={16} /> {t.creditCards.addCard}
          </Button>
        </Link>
      </header>

      {/* Summary */}
      <Card variant="glass">
        <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mb-1">{t.creditCards.totalOutstanding}</p>
        <p className="text-2xl font-semibold tabular-nums text-[var(--color-negative)]" data-financial>
          {formatCurrency(totalOutstanding)}
        </p>
        <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] mt-2">
          {t.creditCards.totalLimitLabel}: {formatCurrency(totalLimit)}
        </p>
      </Card>

      {/* Cards List */}
      <section className="space-y-3">
        <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
          {t.creditCards.myCards} ({displayCards.length})
        </h2>

        {displayCards.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={22} />}
            title={t.creditCards.noCards}
            description={t.creditCards.noCardsDesc}
            action={
              <Link to="/dashboard/credit-cards/add">
                <Button size="sm">{t.creditCards.addCard}</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
            {displayCards.map((card) => {
              const outstanding = card.account?.balance ? Math.abs(Number(card.account.balance)) : 0;
              const limit = Number(card.credit_limit);
              const utilizationPct = limit > 0 ? Math.round((outstanding / limit) * 100) : 0;

              return (
                <Link
                  key={card.id}
                  to={`/dashboard/credit-cards/${card.id}`}
                  className="block active-scale"
                  role="listitem"
                >
                  <div className={`rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between aspect-[1.586/1] transition-shadow hover:shadow-lg ${getCardGradient('credit_card', card.nickname, card.issuer)}`}>
                    {/* Glass overlay elements for physical card feel */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-8 -mb-8 blur-lg pointer-events-none"></div>
                    
                    <div className="flex items-start justify-between relative z-10 w-full">
                      <div className="flex items-center gap-3 w-full pr-2">
                        <div className="w-10 h-10 rounded-xl glass-chip flex items-center justify-center shrink-0 shadow-sm text-white">
                          <CreditCard size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold text-white truncate tracking-wide drop-shadow-sm">
                            {card.nickname} {card.last_four ? `(•••• ${card.last_four})` : ''}
                          </p>
                          <p className="text-[13px] text-white/75 truncate">
                            {card.issuer} · {isBn ? 'লিমিট' : 'Limit'}: {formatCurrency(limit)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="relative z-10 mt-auto pt-4 w-full">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-white/60 mb-0.5">
                            {isBn ? 'বকেয়া পরিমাণ' : 'Outstanding Amount'}
                          </p>
                          <p className="text-2xl font-bold tracking-tight text-white tabular-nums drop-shadow-sm" data-financial>
                            {formatCurrency(outstanding)}
                          </p>
                        </div>
                        <p className="text-[11px] text-white/80 font-medium">
                          {utilizationPct}% Used
                        </p>
                      </div>
                      <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${utilizationPct > 80 ? 'bg-red-400' : 'bg-white/80'}`}
                          style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
