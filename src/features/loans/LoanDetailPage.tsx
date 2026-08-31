import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Landmark, Plus, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate } from '@/lib/dates/formatter';
import { parseError } from '@/lib/errors/handler';
import { Card, Skeleton, EmptyState, ErrorState, ProgressBar, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

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
}

export const LoanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { success, error: showError } = useToast();

  const [loan, setLoan] = useState<FullLoan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState<string | number>('');
  const [editInstallment, setEditInstallment] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    if (!loan || deleteConfirmation !== 'DELETE') return;
    setIsDeleting(true);
    try {
      const { error: delErr } = await supabase.rpc('delete_financial_record', {
        p_record_type: 'loan',
        p_record_id: loan.id,
      } as any);
      if (delErr) throw delErr;
      
      success('Loan Deleted', 'The loan has been permanently deleted.');
      navigate('/dashboard/loans');
    } catch (err) {
      showError('Failed to delete loan', parseError(err).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan || !editName.trim()) return;
    setIsEditing(true);
    
    try {
      const { data, error } = await (supabase.from('loans') as any)
        .update({
          name: editName.trim(),
          annual_rate: editRate ? Number(editRate).toString() : null,
          monthly_installment: editInstallment > 0 ? editInstallment.toString() : null,
        })
        .eq('id', loan.id)
        .eq('user_id', user!.id)
        .select()
        .single();
        
      if (error) throw error;
      setLoan(prev => prev ? { ...prev, ...data } : null);
      success('Loan Updated', 'Loan details updated successfully.');
      setIsEditModalOpen(false);
    } catch (err) {
      showError('Failed to update loan', parseError(err).message);
    } finally {
      setIsEditing(false);
    }
  };

  const loadLoanDetail = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchErr } = await supabase
        .from('loans')
        .select(`
          id, name, lender_name, loan_type, original_principal, annual_rate, monthly_installment, next_payment_date, status, account_id,
          account:financial_accounts!loans_account_id_fkey(balance)
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
  const payments: any[] = [];

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditName(loan?.name || '');
              setEditRate(loan?.annual_rate || '');
              setEditInstallment(loan?.monthly_installment ? Number(loan.monthly_installment) : 0);
              setIsEditModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
            aria-label="Edit Loan"
          >
            <Settings size={18} /> Edit
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-negative)]"
            aria-label="Delete Loan"
          >
            <Settings size={18} /> Delete
          </button>
          <Link to={`/dashboard/activity/add?type=loan_payment`}>
            <Button size="sm" className="gap-1">
              <Plus size={16} /> Record Payment
            </Button>
          </Link>
        </div>
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
              <Link to="/dashboard/activity/add?type=loan_payment">
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

      <Dialog
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          setIsDeleteModalOpen(open);
          if (!open) setDeleteConfirmation('');
        }}
        title="Delete Loan"
      >
        <div className="space-y-4">
          <p className="text-[var(--text-body)] text-[var(--color-text-secondary)]">
            Are you sure you want to delete <strong>{loan.name}</strong>? This action cannot be undone and will delete all associated payment history.
          </p>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
            Type <strong>DELETE</strong> below to confirm.
          </p>
          <Input
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-[var(--color-negative)] hover:bg-[var(--color-negative)]/90 text-white"
              fullWidth
              disabled={deleteConfirmation !== 'DELETE'}
              loading={isDeleting}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Edit Loan Details"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Loan Name"
            required
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Input
            label="Annual Interest Rate (%)"
            type="number"
            step="0.01"
            optional
            value={editRate}
            onChange={(e) => setEditRate(e.target.value)}
          />
          <CurrencyInput
            label="Monthly Installment (EMI)"
            optional
            value={editInstallment}
            onChange={setEditInstallment}
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isEditing}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
