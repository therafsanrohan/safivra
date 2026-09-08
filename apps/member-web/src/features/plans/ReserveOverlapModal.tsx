import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency } from '@/lib/currency/formatter';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { FinancialAccountInput, CommitmentInput, ProtectedReserveInput } from '../../../../../packages/finance-engine/src';
import { Plus, Trash2, ShieldAlert, Check } from 'lucide-react';

interface ReserveOverlapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  accounts: FinancialAccountInput[];
  commitments: CommitmentInput[];
  reserves: ProtectedReserveInput[];
  unresolvedOverlaps: Array<{
    reserve_id: string;
    reserve_name: string;
    reserve_amount: number;
    matching_commitment_id: string;
    matching_commitment_title: string;
  }>;
  onRefresh: () => void;
}

export const ReserveOverlapModal: React.FC<ReserveOverlapModalProps> = ({
  open,
  onOpenChange,
  userId,
  accounts,
  commitments,
  reserves,
  unresolvedOverlaps,
  onRefresh,
}) => {
  const { success, error: showError } = useToast();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [linkedCommitmentId, setLinkedCommitmentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const eligibleSpendingAccounts = accounts.filter(
    (a) => a.account_class === 'asset' && a.account_type !== 'savings' && a.account_type !== 'investment'
  );

  const handleAddReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!name || isNaN(numAmt) || numAmt <= 0 || !accountId) {
      showError('Invalid input', 'Please provide a valid reserve name, positive amount, and spending account.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase.from('protected_reserves') as any).insert({
        user_id: userId,
        name,
        amount: numAmt,
        account_id: accountId,
        linked_commitment_id: linkedCommitmentId || null,
      });

      if (error) throw error;
      success('Reserve added', 'Protected reserve created successfully.');
      setName('');
      setAmount('');
      setLinkedCommitmentId('');
      onRefresh();
    } catch (err: any) {
      showError('Error adding reserve', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReserve = async (id: string) => {
    try {
      const { error } = await (supabase.from('protected_reserves') as any).delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
      success('Reserve removed', 'Protected reserve deleted.');
      onRefresh();
    } catch (err: any) {
      showError('Error removing reserve', err.message);
    }
  };

  const handleResolveOverlap = async (reserveId: string, commitmentId: string) => {
    try {
      const { error } = await (supabase.from('protected_reserves') as any)
        .update({ linked_commitment_id: commitmentId })
        .eq('id', reserveId)
        .eq('user_id', userId);

      if (error) throw error;
      success('Overlap resolved', 'Reserve linked to commitment to prevent double deduction.');
      onRefresh();
    } catch (err: any) {
      showError('Error resolving overlap', err.message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Protected Reserves & Overlaps"
      description="Reserve money inside your spending accounts for buffers or specific bills"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
        {/* Unresolved Overlaps Alert */}
        {unresolvedOverlaps.length > 0 && (
          <div className="p-3 rounded-[var(--radius-card)] bg-[var(--color-warning-soft)] border border-[var(--color-warning)] space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[var(--color-warning)]">
              <ShieldAlert size={16} />
              <span>Potential Reserve-Bill Overlap Detected</span>
            </div>
            <p className="text-[var(--color-text-secondary)]">
              The following reserve matches an upcoming commitment name and amount. Link them so it isn't deducted twice:
            </p>
            {unresolvedOverlaps.map((ov) => (
              <div key={ov.reserve_id} className="flex justify-between items-center bg-[var(--color-bg-surface)] p-2 rounded border border-[var(--color-border)]">
                <div>
                  <span className="font-semibold">{ov.reserve_name}</span> reserve ({formatCurrency(ov.reserve_amount)}) covers bill <span className="font-semibold">{ov.matching_commitment_title}</span>?
                </div>
                <Button
                  size="sm"
                  onClick={() => handleResolveOverlap(ov.reserve_id, ov.matching_commitment_id)}
                  className="gap-1 text-[11px]"
                >
                  <Check size={12} /> Link Bill
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Existing Reserves List */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Active Protected Reserves</h3>
          {reserves.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] italic">No reserves created. Add a reserve below to earmark money.</p>
          ) : (
            <div className="space-y-2">
              {reserves.map((r) => {
                const acc = accounts.find((a) => a.id === r.account_id);
                const linkedCom = commitments.find((c) => c.id === r.linked_commitment_id);

                return (
                  <div key={r.id} className="flex justify-between items-center p-2.5 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-xs">
                    <div>
                      <span className="font-semibold text-[var(--color-text-primary)]">{r.name}</span>
                      <div className="text-[10px] text-[var(--color-text-muted)]">
                        <span>In: {acc?.name || 'Spending Account'}</span>
                        {linkedCom && <span className="ml-2 text-[var(--color-accent)]">• Linked to {linkedCom.title}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-[var(--color-warning)]">{formatCurrency(r.amount)}</span>
                      <button
                        onClick={() => handleDeleteReserve(r.id)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-negative)] transition-colors p-1"
                        aria-label="Delete reserve"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Reserve Form */}
        <form onSubmit={handleAddReserve} className="p-3.5 rounded-[var(--radius-card)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] space-y-3">
          <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">Add New Protected Reserve</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Reserve Name</label>
              <Input
                placeholder="e.g. Rent Reserve or Emergency Buffer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Amount</label>
              <Input
                type="number"
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Spending Account</label>
              <Select
                value={accountId}
                onValueChange={setAccountId}
                options={eligibleSpendingAccounts.map((a) => ({
                  value: a.id,
                  label: `${a.name} (${formatCurrency(a.balance as number)})`,
                }))}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Link to Commitment (Optional)</label>
              <Select
                value={linkedCommitmentId}
                onValueChange={setLinkedCommitmentId}
                options={[
                  { value: '', label: '-- Unlinked Buffer --' },
                  ...commitments.map((c) => ({
                    value: c.id,
                    label: `${c.title} (${formatCurrency(c.total_amount)})`,
                  })),
                ]}
              />
            </div>
          </div>
          <Button type="submit" disabled={submitting} className="w-full gap-2 text-xs">
            <Plus size={14} /> Add Protected Reserve
          </Button>
        </form>
      </div>
    </Dialog>
  );
};
