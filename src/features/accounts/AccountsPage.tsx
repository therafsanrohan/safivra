import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Wallet, Landmark, CreditCard, TrendingUp, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { Card, Skeleton, EmptyState, ErrorState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';
import type { Database } from '@/types/database';

type AccountBalance = Database['public']['Views']['v_account_balances']['Row'];

export const AccountsPage: React.FC = () => {
  const { user } = useAuthContext();
  const { t, locale } = useLanguage();
  const isBn = locale === 'bn';

  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balanceHidden, setBalanceHidden] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [accRes, loansRes, cardsRes] = await Promise.all([
        supabase
          .from('v_account_balances')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .order('name'),
        (supabase.from('loans') as any)
          .select('id, name, lender_name, loan_type, original_principal, monthly_installment, account_id, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        (supabase.from('credit_cards') as any)
          .select('id, nickname, issuer, credit_limit, account_id, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
      ]);

      if (accRes.error) throw accRes.error;
      const accData = (accRes.data as AccountBalance[]) ?? [];
      setAccounts(accData);

      const balMap = new Map(accData.map((a) => [a.account_id, a.balance]));

      const mappedLoans = ((loansRes.data as any[]) ?? []).map((l) => ({
        ...l,
        balance: balMap.get(l.account_id) ?? l.original_principal,
      }));
      setLoans(mappedLoans);

      const mappedCards = ((cardsRes.data as any[]) ?? []).map((c) => ({
        ...c,
        balance: balMap.get(c.account_id) ?? '0',
      }));
      setCards(mappedCards);
    } catch (err: any) {
      setError(err.message || 'Could not fetch accounts');
      setAccounts([]);
      setLoans([]);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const assetAccounts = accounts.filter((a) => a.account_class === 'asset' && a.is_active);
  const liabilityAccounts = accounts.filter((a) => a.account_class === 'liability' && a.is_active);

  const displayAssetAccounts = assetAccounts;
  const displayLiabilityAccounts = liabilityAccounts.filter(
    (a) => !['loan', 'credit_card'].includes(a.account_type)
  );

  const totalAssetBalance = assetAccounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const totalLiabilityBalance = liabilityAccounts.reduce((sum, a) => sum + Math.abs(Number(a.balance)), 0);

  const hasAnyItems = displayAssetAccounts.length > 0 || loans.length > 0 || cards.length > 0 || displayLiabilityAccounts.length > 0;

  if (loading) {
    return (
      <div className="page-container pt-5 space-y-4">
        <div className="flex justify-between items-center">
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
        <ErrorState message={error} onRetry={fetchAccounts} />
      </div>
    );
  }

  return (
    <div className="page-container pt-5 space-y-5 fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            {t.accounts.title}
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            {t.accounts.subtitle}
          </p>
        </div>
        <Link to="/dashboard/accounts/add">
          <Button size="sm" className="gap-1">
            <Plus size={16} /> {t.accounts.addAccount}
          </Button>
        </Link>
      </header>

      {/* Summary */}
      <Card>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">{t.accounts.totalNetAssets}</span>
          <button
            onClick={() => setBalanceHidden((v) => !v)}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            aria-label={balanceHidden ? 'Show balances' : 'Hide balances'}
          >
            {balanceHidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]" data-financial>
          {balanceHidden ? '৳ ••••••' : formatCurrency(totalAssetBalance - totalLiabilityBalance)}
        </p>
        <div className="flex justify-between text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-3 pt-3 border-t border-[var(--color-border)]">
          <div>
            <span className="text-[var(--color-text-muted)]">{t.dashboard.assets}: </span>
            <span className="font-medium text-[var(--color-positive)]" data-financial>
              {balanceHidden ? '••••' : formatCurrency(totalAssetBalance)}
            </span>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)]">{t.dashboard.liabilities}: </span>
            <span className="font-medium text-[var(--color-negative)]" data-financial>
              {balanceHidden ? '••••' : formatCurrency(totalLiabilityBalance)}
            </span>
          </div>
        </div>
      </Card>

      {!hasAnyItems && (
        <EmptyState
          icon={<CreditCard size={24} />}
          title={t.accounts.noAccounts}
          description={t.accounts.noAccountsDesc}
          action={
            <Link to="/dashboard/accounts/add">
              <Button size="sm" className="mt-2">{t.accounts.addFirstBtn}</Button>
            </Link>
          }
        />
      )}

      {/* Assets Section */}
      {displayAssetAccounts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
            {t.accounts.assetAccounts} ({displayAssetAccounts.length})
          </h2>
          <Card padding="none">
            <div className="divide-y divide-[var(--color-border)]" role="list">
              {displayAssetAccounts.map((acc) => (
                <Link
                  key={acc.account_id}
                  to={`/dashboard/accounts/${acc.account_id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                  role="listitem"
                >
                  <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-accent-soft)] flex items-center justify-center shrink-0">
                    <AccountTypeIcon type={acc.account_type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)] truncate">
                      {acc.name}
                    </p>
                    <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] capitalize">
                      {acc.institution ? `${acc.institution} · ` : ''}
                      {acc.account_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold tabular-nums text-[var(--text-body)] text-[var(--color-positive)]" data-financial>
                      {balanceHidden ? '••••' : formatCurrency(Number(acc.balance))}
                    </span>
                    <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Active Loans Section */}
      {loans.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
              {isBn ? 'চলমান ঋণ ও লোন' : 'Active Loans'} ({loans.length})
            </h2>
            <Link to="/dashboard/loans" className="text-xs font-semibold text-[var(--color-accent)]">
              {isBn ? 'সব দেখুন' : 'View all'} →
            </Link>
          </div>
          <Card padding="none">
            <div className="divide-y divide-[var(--color-border)]" role="list">
              {loans.map((loan) => {
                const outstanding = Math.abs(Number(loan.balance || loan.original_principal));
                return (
                  <Link
                    key={loan.id}
                    to={`/dashboard/loans/${loan.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                    role="listitem"
                  >
                    <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-negative-soft)] flex items-center justify-center shrink-0">
                      <Landmark size={18} className="text-[var(--color-negative)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)] truncate">
                        {loan.name}
                      </p>
                      <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                        {loan.lender_name} · {loan.loan_type?.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold tabular-nums text-[var(--text-body)] text-[var(--color-negative)]" data-financial>
                        {balanceHidden ? '••••' : formatCurrency(outstanding)}
                      </span>
                      <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </section>
      )}

      {/* Credit Cards Section */}
      {cards.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
              {isBn ? 'ক্রেডিট কার্ডসমূহ' : 'Credit Cards'} ({cards.length})
            </h2>
            <Link to="/dashboard/credit-cards" className="text-xs font-semibold text-[var(--color-accent)]">
              {isBn ? 'সব দেখুন' : 'View all'} →
            </Link>
          </div>
          <Card padding="none">
            <div className="divide-y divide-[var(--color-border)]" role="list">
              {cards.map((card) => {
                const outstanding = Math.abs(Number(card.balance));
                return (
                  <Link
                    key={card.id}
                    to={`/dashboard/credit-cards/${card.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                    role="listitem"
                  >
                    <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-negative-soft)] flex items-center justify-center shrink-0">
                      <CreditCard size={18} className="text-[var(--color-negative)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)] truncate">
                        {card.nickname}
                      </p>
                      <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                        {card.issuer} · {isBn ? 'লিমিট' : 'Limit'}: {formatCurrency(Number(card.credit_limit))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold tabular-nums text-[var(--text-body)] text-[var(--color-negative)]" data-financial>
                        {balanceHidden ? '••••' : formatCurrency(outstanding)}
                      </span>
                      <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </section>
      )}

      {/* Other Liabilities Section */}
      {displayLiabilityAccounts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
            {t.accounts.liabilityAccounts} ({displayLiabilityAccounts.length})
          </h2>
          <Card padding="none">
            <div className="divide-y divide-[var(--color-border)]" role="list">
              {displayLiabilityAccounts.map((acc) => (
                <Link
                  key={acc.account_id}
                  to={`/dashboard/accounts/${acc.account_id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                  role="listitem"
                >
                  <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-negative-soft)] flex items-center justify-center shrink-0">
                    <AccountTypeIcon type={acc.account_type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)] truncate">
                      {acc.name}
                    </p>
                    <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] capitalize">
                      {acc.account_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold tabular-nums text-[var(--text-body)] text-[var(--color-negative)]" data-financial>
                      {balanceHidden ? '••••' : formatCurrency(Math.abs(Number(acc.balance)))}
                    </span>
                    <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
};

const AccountTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'bank':
      return <Landmark size={18} className="text-[var(--color-accent)]" />;
    case 'credit_card':
      return <CreditCard size={18} className="text-[var(--color-negative)]" />;
    case 'savings':
    case 'investment':
      return <TrendingUp size={18} className="text-[var(--color-accent)]" />;
    default:
      return <Wallet size={18} className="text-[var(--color-accent)]" />;
  }
};
