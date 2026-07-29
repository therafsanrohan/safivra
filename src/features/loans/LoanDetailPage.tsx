import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Landmark, Calendar, Plus, TrendingDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate, formatDueLabel } from '@/lib/dates/formatter';
import { parseError } from '@/lib/errors/handler';
import { Card, Skeleton, EmptyState, ErrorState, ProgressBar, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface FullLoan {
  id: string;
  name: string;
  lender_name: string;
  loan_type: string;
  original_principal: number;
  annual_rate: number | null;
  monthly_installment: number | null;
  next_payment_date: string | null;
  status: string;
  account_id: string | null;
  account: {
    balance: string;
  } | null;
  payments: Array<{
    id: string;
    payment_date: string;
    total_amount: number;
    principal_amount: number;
    interest_amount: number;
    fee_amount: number;
  }>;
}

export const LoanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [loan, setLoan] = useState<FullLoan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLoanDetail = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchErr } = await supabase
        .from('loans')
        .select(`
          id, name, lender_name, loan_type, original_principal, annual_rate, monthly_installment, next_payment_date, status, account_id,
          account:financial_accounts!loans_account_id_fkey(balance),
          payments:loan_payments(id, payment_date, total_amount, principal_amount, interest_amount, fee_amount)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchErr) throw fetchErr;
      setLoan((data as unknown as FullLoan) ?? null);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    loadLoanDetail();
  }, [loadLoanDetail]);

  if (loading) {
    return (
      <div className="page-container pt-5 space-y-4">
        <Skeleton height={24} width={100} />
        <Skeleton height={140} />
        <Skeleton height={200} />
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="page-container pt-6">
        <ErrorState message={error || 'Loan not found'} onRetry={loadLoanDetail} />
      </div>
    );
  }

  const original = Number(loan.original_principal);
  const outstanding = loan.account?.balance ? Math.abs(Number(loan.account.balance)) : original;
  const paidPrincipal = Math.max(0, original - outstanding);
  const pct = Math.round((paidPrincipal / original) * 100);
  const payments = loan.payments ?? [];

  return (
    <div className="page-container pt-4 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          aria-label="Go back"
        >
          <ArrowLeft size={18} /> Loans
        </button>
        <Link to={`/activity/add?type=loan_payment`}>
          <Button size="sm" className="gap-1">
            <Plus size={16} /> Record Payment
          </Button>
        </Link>
      </div>

      {/* Loan Overview Header */}
      <Card className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[var(--text-label)] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider">
              {loan.loan_type.replace(/_/g, ' ')} · {loan.lender_name}
            </span>
            <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)] mt-0.5">
              {loan.name}
            </h1>
          </div>
          <Badge variant={loan.status === 'active' ? 'warning' : 'positive'}>
            {loan.status.toUpperCase()}
          </Badge>
        </div>

        <div>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">Remaining Outstanding Principal</p>
          <p className="text-3xl font-semibold tabular-nums text-[var(--color-negative)]" data-financial>
            {formatCurrency(outstanding)}
          </p>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] mt-1">
            Original Principal: {formatCurrency(original)}
          </p>
        </div>

        <ProgressBar value={pct} showValue label="Principal Repay Progress" />

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border)]">
          <div>
            <span className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">Monthly EMI</span>
            <p className="text-[var(--text-body)] font-semibold text-[var(--color-text-primary)]" data-financial>
              {loan.monthly_installment ? formatCurrency(Number(loan.monthly_installment)) : '—'}
            </p>
          </div>
          <div>
            <span className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">Interest Rate</span>
            <p className="text-[var(--text-body)] font-semibold text-[var(--color-text-primary)]">
              {loan.annual_rate ? `${loan.annual_rate}% p.a.` : 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      {/* Payment History */}
      <section className="space-y-3">
        <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
          Payment History ({payments.length})
        </h2>

        {payments.length === 0 ? (
          <EmptyState
            icon={<Landmark size={22} />}
            title="No payments recorded"
            description="Installment payments will appear here as they are posted."
            action={
              <Link to="/activity/add?type=loan_payment">
                <Button size="sm">Record Payment</Button>
              </Link>
            }
          />
        ) : (
          <Card padding="none">
            <div className="divide-y divide-[var(--color-border)]" role="list">
              {payments.map((pmt) => (
                <div key={pmt.id} className="flex items-center justify-between px-5 py-3.5" role="listitem">
                  <div>
                    <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">
                      {formatDate(pmt.payment_date)}
                    </p>
                    <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                      Principal: {formatCurrency(Number(pmt.principal_amount))} · Interest: {formatCurrency(Number(pmt.interest_amount))}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums text-[var(--text-body)] text-[var(--color-positive)]" data-financial>
                    {formatCurrency(Number(pmt.total_amount))}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>
    </div>
  );
};
