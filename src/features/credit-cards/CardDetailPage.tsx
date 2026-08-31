import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Plus, Settings, Trash2 } from 'lucide-react';
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

interface FullCard {
  id: string;
  account_id?: string;
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

interface CardPaymentItem {
  id: string;
  txId?: string;
  title: string;
  type?: string;
  amount: number;
  payment_date: string;
  isPayment: boolean;
}

export const CardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { success, error: showError } = useToast();

  const [card, setCard] = useState<FullCard | null>(null);
  const [payments, setPayments] = useState<CardPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editLimit, setEditLimit] = useState(0);
  const [editStatementDay, setEditStatementDay] = useState<string | number>('');
  const [editPaymentDay, setEditPaymentDay] = useState<string | number>('');
  const [isEditing, setIsEditing] = useState(false);

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
      navigate('/dashboard/credit-cards');
    } catch (err) {
      showError('Failed to delete card', parseError(err).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || !editNickname.trim()) return;
    setIsEditing(true);
    
    try {
      const { data, error } = await (supabase.from('credit_cards') as any)
        .update({
          nickname: editNickname.trim(),
          credit_limit: (editLimit > 0 ? editLimit : Number(card.credit_limit)).toString(),
          statement_day: editStatementDay ? Number(editStatementDay) : null,
          payment_due_day: editPaymentDay ? Number(editPaymentDay) : null,
        })
        .eq('id', card.id)
        .eq('user_id', user!.id)
        .select()
        .single();
        
      if (error) throw error;
      setCard(prev => prev ? { ...prev, ...data } : null);
      success('Card Updated', 'Credit card details updated successfully.');
      setIsEditModalOpen(false);
    } catch (err) {
      showError('Failed to update card', parseError(err).message);
    } finally {
      setIsEditing(false);
    }
  };

  const loadCardDetail = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchErr } = await (supabase.from('credit_cards') as any)
        .select('id, account_id, nickname, issuer, last_four, credit_limit, statement_day, payment_due_day, status')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchErr) throw fetchErr;
      const cardData = (data as unknown as FullCard) ?? null;

      if (cardData?.account_id) {
        const [balRes, payRes] = await Promise.all([
          (supabase.from('v_account_balances') as any)
            .select('balance')
            .eq('account_id', cardData.account_id)
            .single(),
          (supabase.from('ledger_entries') as any)
            .select(`
              id, amount, entry_role, created_at,
              ledger_transaction:ledger_transactions!inner(
                id, title, transaction_date, status, transaction_type
              )
            `)
            .eq('financial_account_id', cardData.account_id)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
        ]);

        if (balRes.data) {
          cardData.account = { balance: balRes.data.balance };
        }

        if (payRes.data) {
          const list = (payRes.data as any[])
            .filter((p) => p.ledger_transaction?.status === 'posted')
            .map((p) => ({
              id: p.id,
              txId: p.ledger_transaction?.id,
              title: p.ledger_transaction?.title || 'Card Transaction',
              type: p.ledger_transaction?.transaction_type,
              amount: Number(p.amount),
              payment_date: p.ledger_transaction?.transaction_date || p.created_at,
              isPayment: p.entry_role === 'liability_debit' || p.ledger_transaction?.transaction_type === 'credit_card_payment',
            }));
          setPayments(list);
        }
      }

      setCard(cardData);
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
            onClick={() => {
              setEditNickname(card?.nickname || '');
              setEditLimit(card?.credit_limit ? Number(card.credit_limit) : 0);
              setEditStatementDay(card?.statement_day || '');
              setEditPaymentDay(card?.payment_due_day || '');
              setIsEditModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm font-medium"
            aria-label="Edit Card"
          >
            <Settings size={16} /> Edit
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 text-[var(--color-negative)] hover:text-red-700 text-sm font-medium"
            aria-label="Delete Card"
          >
            <Trash2 size={16} /> Delete
          </button>
          <Link to={`/dashboard/activity/add?type=credit_card_payment`}>
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
          Card Activity & Payment History ({payments.length})
        </h2>

        {payments.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={22} />}
            title="No card payments recorded"
            description="Card repayments and charges will appear here."
            action={
              <Link to="/dashboard/activity/add?type=credit_card_payment">
                <Button size="sm">Pay Card Bill</Button>
              </Link>
            }
          />
        ) : (
          <Card padding="none">
            <div className="divide-y divide-[var(--color-border)]" role="list">
              {payments.map((pmt) => (
                <Link 
                  key={pmt.id} 
                  to={pmt.txId ? `/dashboard/activity/${pmt.txId}` : '#'}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--color-bg-subtle)] transition-colors" 
                  role="listitem"
                >
                  <div>
                    <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">
                      {pmt.title}
                    </p>
                    <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] text-xs">
                      {formatDate(pmt.payment_date)}
                    </p>
                  </div>
                  <span className={['font-semibold tabular-nums text-[var(--text-body)]', pmt.isPayment ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'].join(' ')} data-financial>
                    {pmt.isPayment ? '+' : '-'}{formatCurrency(Number(pmt.amount))}
                  </span>
                </Link>
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
      <Dialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Edit Card Details"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Card Nickname"
            required
            value={editNickname}
            onChange={(e) => setEditNickname(e.target.value)}
          />
          <CurrencyInput
            label="Credit Limit"
            required
            value={editLimit}
            onChange={setEditLimit}
          />
          <Input
            label="Statement Day (1-31)"
            type="number"
            min="1" max="31"
            optional
            value={editStatementDay}
            onChange={(e) => setEditStatementDay(e.target.value)}
          />
          <Input
            label="Payment Due Day (1-31)"
            type="number"
            min="1" max="31"
            optional
            value={editPaymentDay}
            onChange={(e) => setEditPaymentDay(e.target.value)}
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
