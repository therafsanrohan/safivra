import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Landmark } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDueLabel, isOverdue } from '@/lib/dates/formatter';
import { Card, Skeleton, EmptyState, ErrorState, ProgressBar, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';

interface LoanRow {
  id: string;
  name: string;
  lender_name: string;
  loan_type: string;
  original_principal: number;
  monthly_installment: number | null;
  next_payment_date: string | null;
  status: string;
  account: {
    balance: string;
  } | null;
}

export const LoansPage: React.FC = () => {
  const { user } = useAuthContext();
  const { t, locale } = useLanguage();
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLoans = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchErr } = await supabase
        .from('loans')
        .select(`
          id, name, lender_name, loan_type, original_principal, monthly_installment, next_payment_date, status,
          account:financial_accounts!loans_account_id_fkey(balance)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setLoans((data as unknown as LoanRow[]) ?? []);
    } catch {
      setLoans([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const activeLoans = loans.filter((l) => l.status === 'active');

  const totalOutstanding = activeLoans.reduce((sum, l) => {
    const bal = l.account?.balance ? Math.abs(Number(l.account.balance)) : Number(l.original_principal);
    return sum + bal;
  }, 0);

  if (loading) {
    return (
      <div className="page-container pt-5 space-y-4">
        <div className="flex justify-between">
          <Skeleton height={28} width={100} />
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
        <ErrorState message={error} onRetry={fetchLoans} />
      </div>
    );
  }

  return (
    <div className="page-container pt-5 space-y-5 fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            {t.loans.title}
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            {t.loans.subtitle}
          </p>
        </div>
        <Link to="/dashboard/loans/add">
          <Button size="sm" className="gap-1">
            <Plus size={16} /> {t.loans.addLoan}
          </Button>
        </Link>
      </header>

      {/* Summary */}
      <Card>
        <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mb-1">{t.loans.totalOutstanding}</p>
        <p className="text-2xl font-semibold tabular-nums text-[var(--color-negative)]" data-financial>
          {formatCurrency(totalOutstanding)}
        </p>
        <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] mt-2">
          {locale === 'bn' 
            ? `${activeLoans.length}${t.loans.activeCountText}`
            : `Across ${activeLoans.length} active loan${activeLoans.length === 1 ? '' : 's'}`
          }
        </p>
      </Card>

      {/* Active Loans */}
      <section className="space-y-3">
        <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
          {t.loans.activeLoans} ({activeLoans.length})
        </h2>

        {activeLoans.length === 0 ? (
          <EmptyState
            icon={<Landmark size={22} />}
            title={t.loans.noLoans}
            description={t.loans.noLoansDesc}
            action={
              <Link to="/dashboard/loans/add">
                <Button size="sm">{t.loans.addLoan}</Button>
              </Link>
            }
          />
        ) : (
          <Card padding="none">
            <div className="divide-y divide-[var(--color-border)]" role="list">
              {activeLoans.map((loan) => {
                const outstanding = loan.account?.balance ? Math.abs(Number(loan.account.balance)) : Number(loan.original_principal);
                const original = Number(loan.original_principal);
                const paid = Math.max(0, original - outstanding);
                const pct = Math.round((paid / original) * 100);
                const dueText = loan.next_payment_date ? formatDueLabel(loan.next_payment_date) : null;
                const overdue = loan.next_payment_date ? isOverdue(loan.next_payment_date) : false;

                return (
                  <Link
                    key={loan.id}
                    to={`/dashboard/loans/${loan.id}`}
                    className="flex flex-col gap-2 p-5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                    role="listitem"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">
                          {loan.name}
                        </p>
                        <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                          {loan.lender_name} · {loan.loan_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold tabular-nums text-[var(--text-body)] text-[var(--color-negative)]" data-financial>
                          {formatCurrency(outstanding)}
                        </span>
                        <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                          {t.loans.ofLabel} {formatCurrency(original)}
                        </p>
                      </div>
                    </div>

                    <ProgressBar value={pct} size="sm" showValue />

                    {dueText && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={overdue ? 'negative' : 'warning'}>
                          {dueText}
                        </Badge>
                        {loan.monthly_installment && (
                          <span className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
                            {t.loans.installmentLabel}: {formatCurrency(Number(loan.monthly_installment))}
                          </span>
                        )}
                      </div>
                    )}
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
