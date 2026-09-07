import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Landmark } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDueLabel, isOverdue } from '@/lib/dates/formatter';
import { Card, Skeleton, EmptyState, ErrorState, Badge } from '@/components/ui/Card';
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
  const isBn = locale === 'bn';
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLoans = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const [loansRes, balancesRes] = await Promise.all([
        (supabase.from('loans') as any)
          .select('id, name, account_id, lender_name, loan_type, original_principal, monthly_installment, next_payment_date, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        (supabase.from('v_account_balances') as any)
          .select('account_id, balance')
          .eq('user_id', user.id),
      ]);

      if (loansRes.error) throw loansRes.error;

      const balanceMap = new Map(
        ((balancesRes.data as any[]) ?? []).map((b) => [b.account_id, b.balance])
      );

      const mappedLoans: LoanRow[] = ((loansRes.data as any[]) ?? []).map((l) => ({
        ...l,
        original_principal: Number(l.original_principal),
        monthly_installment: l.monthly_installment ? Number(l.monthly_installment) : null,
        account: l.account_id ? { balance: balanceMap.get(l.account_id) ?? String(l.original_principal) } : null,
      }));

      setLoans(mappedLoans);
    } catch (err: any) {
      console.error('Failed to load loans:', err);
      setError(err?.message || 'Failed to load loans');
      setLoans([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const displayLoans = loans.filter((l) => l.status !== 'archived');
  const totalOutstanding = displayLoans.reduce((sum, l) => {
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
      <Card variant="glass">
        <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mb-1">{t.loans.totalOutstanding}</p>
        <p className="text-2xl font-semibold tabular-nums text-[var(--color-negative)]" data-financial>
          {formatCurrency(totalOutstanding)}
        </p>
        <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] mt-2">
          {locale === 'bn' 
            ? `${displayLoans.length}${t.loans.activeCountText}`
            : `Across ${displayLoans.length} loan${displayLoans.length === 1 ? '' : 's'}`
          }
        </p>
      </Card>

      {/* Active Loans */}
      <section className="space-y-3">
        <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
          {t.loans.activeLoans} ({displayLoans.length})
        </h2>

        {displayLoans.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
            {displayLoans.map((loan) => {
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
                  className="block active-scale"
                  role="listitem"
                >
                  <div className={`rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[220px] transition-shadow hover:shadow-lg ${getCardGradient('loan', loan.name, loan.lender_name)}`}>
                    {/* Glass overlay elements for physical card feel */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-8 -mb-8 blur-lg pointer-events-none"></div>
                    
                    <div className="flex items-start justify-between relative z-10 w-full">
                      <div className="flex items-center gap-3 w-full pr-2">
                        <div className="w-10 h-10 rounded-xl glass-chip flex items-center justify-center shrink-0 shadow-sm text-white">
                          <Landmark size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold text-white truncate tracking-wide drop-shadow-sm">
                            {loan.name}
                          </p>
                          <p className="text-[13px] text-white/75 capitalize truncate">
                            {loan.lender_name} · {loan.loan_type?.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 mt-auto pt-4 w-full space-y-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-white/60 mb-0.5">
                          {isBn ? 'বকেয়া পরিমাণ' : 'Outstanding Amount'}
                        </p>
                        <p className="text-2xl font-bold tracking-tight text-white tabular-nums drop-shadow-sm" data-financial>
                          {formatCurrency(outstanding)}
                        </p>
                        <p className="text-[11px] text-white/70 mt-1">
                          {t.loans.ofLabel} {formatCurrency(original)}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                         <div className="flex justify-between items-center text-[10px] text-white/80 font-medium">
                           <span>{pct}% {isBn ? 'পরিশোধিত' : 'Paid'}</span>
                         </div>
                         <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-white/80 rounded-full transition-all duration-500"
                             style={{ width: `${Math.min(pct, 100)}%` }}
                           />
                         </div>
                      </div>

                      {dueText && (
                        <div className="flex items-center justify-between pt-1">
                          <Badge variant={overdue ? 'negative' : 'warning'} className="bg-white/10 text-white border-white/20 backdrop-blur-md px-2 py-0.5">
                            {dueText}
                          </Badge>
                          {loan.monthly_installment && (
                            <span className="text-[11px] text-white/80 font-medium">
                              {formatCurrency(Number(loan.monthly_installment))} / mo
                            </span>
                          )}
                        </div>
                      )}
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
