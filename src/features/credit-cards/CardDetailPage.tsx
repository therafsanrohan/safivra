import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Plus, Settings } from 'lucide-react';
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

interface FullCard {
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

export const CardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { success, error: showError } = useToast();

  const [card, setCard] = useState<FullCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!card || deleteConfirmation !== 'DELETE') return;
    setIsDeleting(true);
    try {
      const { error: delErr } = await supabase.rpc('delete_financial_record', {
        p_record_type: 'credit_card',
        p_record_id: card.id,
      } as any);
      if (delErr) throw delErr;
      
      success('Card Deleted', 'The credit card has been permanently deleted.');
      navigate('/credit-cards');
    } catch (err) {
      showError('Failed to delete card', parseError(err).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const loadCardDetail = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchErr } = await supabase
        .from('credit_cards')
        .select(`
          id, nickname, issuer, last_four, credit_limit, statement_day, payment_due_day, status,
          account:financial_accounts!credit_cards_account_id_fkey(balance)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchErr) throw fetchErr;
      setCard((data as unknown as FullCard) ?? null);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    loadCardDetail();
  }, [loadCardDetail]);

  if (loading) {
    return (
      <div className="page-container pt-5 space-y-4">
        <Skeleton height={24} width={100} />
        <Skeleton height={140} />
        <Skeleton height={200} />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="page-container pt-6">
        <ErrorState message={error || 'Credit card not found'} onRetry={loadCardDetail} />
      </div>
    );
  }

  const outstanding = card.account?.balance ? Math.abs(Number(card.account.balance)) : 0;
  const limit = Number(card.credit_limit);
  const available = Math.max(0, limit - outstanding);
  const pct = limit > 0 ? Math.round((outstanding / limit) * 100) : 0;
  const payments: any[] = [];

  return (
    <div className="page-container pt-4 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          aria-label="Go back"
        >
          <ArrowLeft size={18} /> Cards
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-negative)]"
            aria-label="Delete Card"
          >
            <Settings size={18} /> Settings
          </button>
          <Link to={`/activity/add?type=credit_card_payment`}>
            <Button size="sm" className="gap-1">
              <Plus size={16} /> Record Payment
            </Button>
          </Link>
        </div>
      </div>

      <Card className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[var(--text-label)] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider">
              {card.issuer} {card.last_four ? `· •••• ${card.last_four}` : ''}
            </span>
            <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)] mt-0.5">
              {card.nickname}
            </h1>
          </div>
          <Badge variant={card.status === 'active' ? 'positive' : 'neutral'}>
            {card.status.toUpperCase()}
          </Badge>
        </div>

        <div>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">Current Statement Balance Owed</p>
          <p className="text-3xl font-semibold tabular-nums text-[var(--color-negative)]" data-financial>
            {formatCurrency(outstanding)}
          </p>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] mt-1">
            Available Credit: {formatCurrency(available)} of {formatCurrency(limit)}
          </p>
        </div>

        <ProgressBar value={pct} showValue label="Credit Limit Utilization" />

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border)]">
          <div>
            <span className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">Statement Date</span>
            <p className="text-[var(--text-body)] font-semibold text-[var(--color-text-primary)]">
              {card.statement_day ? `Every ${card.statement_day}th of month` : 'Not set'}
            </p>
          </div>
          <div>
            <span className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">Payment Due Date</span>
            <p className="text-[var(--text-body)] font-semibold text-[var(--color-text-primary)]">
              {card.payment_due_day ? `Every ${card.payment_due_day}th of month` : 'Not set'}
            </p>
          </div>
        </div>
      </Card>

      {/* Payments History */}
      <section className="space-y-3">
        <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
          Card Payment History ({payments.length})
        </h2>

        {payments.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={22} />}
            title="No card payments recorded"
            description="Card repayments will appear here."
            action={
              <Link to="/activity/add?type=credit_card_payment">
                <Button size="sm">Pay Card Bill</Button>
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
                      Bill Payment
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums text-[var(--text-body)] text-[var(--color-positive)]" data-financial>
                    {formatCurrency(Number(pmt.amount))}
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
        title="Delete Credit Card"
      >
        <div className="space-y-4">
          <p className="text-[var(--text-body)] text-[var(--color-text-secondary)]">
            Are you sure you want to delete <strong>{card.nickname}</strong>? This action cannot be undone and will delete all associated payment history.
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
    </div>
  );
};
