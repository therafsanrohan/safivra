import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/currency/formatter';
import { AvailableToSpendResult } from '../../../../../packages/finance-engine/src';
import { ShieldCheck, AlertCircle, Info, ExternalLink } from 'lucide-react';

interface CalculationBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: AvailableToSpendResult | null;
}

export const CalculationBreakdownModal: React.FC<CalculationBreakdownModalProps> = ({
  open,
  onOpenChange,
  result,
}) => {
  if (!result) return null;

  const { breakdown } = result;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Calculation Breakdown & Proof"
      description="Transparent mathematical breakdown of your Available to Spend balance"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
        {/* Formula summary header */}
        <div className="p-4 rounded-[var(--radius-card)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Mathematical Formula
          </p>
          <p className="text-sm font-mono text-[var(--color-text-primary)]">
            Available to Spend = {formatCurrency(result.eligibleCurrentFunds)} −{' '}
            {formatCurrency(result.totalCommitments)} −{' '}
            {formatCurrency(result.totalProtectedFunds)} ={' '}
            <span className={result.isNegative ? 'text-[var(--color-negative)] font-bold' : 'text-[var(--color-positive)] font-bold'}>
              {formatCurrency(result.availableToSpend)}
            </span>
          </p>
        </div>

        {/* 1. Eligible Funds Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <ShieldCheck size={16} className="text-[var(--color-positive)]" />
              1. Eligible Current Funds ({formatCurrency(result.eligibleCurrentFunds)})
            </h3>
          </div>
          <ul className="space-y-2 text-xs">
            {breakdown.eligibleAccounts.map((acc) => (
              <li key={acc.id} className="flex justify-between items-center p-2 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                <div>
                  <span className="font-medium text-[var(--color-text-primary)]">{acc.name}</span>
                  <span className="ml-2 text-[10px] text-[var(--color-text-muted)] uppercase">({acc.account_type.replace('_', ' ')})</span>
                </div>
                <span className={`font-semibold ${acc.balance < 0 ? 'text-[var(--color-negative)]' : 'text-[var(--color-text-primary)]'}`}>
                  {formatCurrency(acc.balance)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Excluded accounts summary */}
        {breakdown.excludedAccounts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">Excluded Accounts & Limits</p>
            <div className="space-y-1.5">
              {breakdown.excludedAccounts.map((exc) => (
                <div key={exc.id} className="p-2 rounded bg-[var(--color-bg-subtle)] text-xs flex justify-between items-center opacity-80">
                  <div>
                    <span className="font-medium text-[var(--color-text-secondary)]">{exc.name}</span>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{exc.reason}</p>
                  </div>
                  <span className="text-[var(--color-text-muted)] font-mono">{formatCurrency(exc.balance)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Outstanding Commitments Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <AlertCircle size={16} className="text-[var(--color-warning)]" />
              2. Outstanding Commitments (−{formatCurrency(result.totalCommitments)})
            </h3>
          </div>
          {breakdown.commitments.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] italic">No outstanding commitments due within planning horizon.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {breakdown.commitments.map((com) => (
                <li key={com.id} className="flex justify-between items-center p-2 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                  <div>
                    <span className="font-medium text-[var(--color-text-primary)]">{com.title}</span>
                    <div className="flex gap-2 items-center text-[10px] text-[var(--color-text-muted)]">
                      <span>Due: {com.due_date}</span>
                      {com.amount_paid > 0 && (
                        <span className="text-[var(--color-positive)]">
                          (Paid: {formatCurrency(com.amount_paid)})
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-[var(--color-negative)]">
                    −{formatCurrency(com.remaining_amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 3. Protected Funds Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Info size={16} className="text-[var(--color-info)]" />
              3. Protected Funds (−{formatCurrency(result.totalProtectedFunds)})
            </h3>
          </div>
          {breakdown.protectedReserves.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] italic">No protected reserves set up in spending accounts.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {breakdown.protectedReserves.map((res) => (
                <li key={res.id} className="p-2 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex justify-between items-center">
                  <div>
                    <span className="font-medium text-[var(--color-text-primary)]">{res.name}</span>
                    {res.reason && <p className="text-[10px] text-[var(--color-text-muted)]">{res.reason}</p>}
                  </div>
                  <span className={`font-semibold ${res.deducted_amount === 0 ? 'text-[var(--color-text-muted)] line-through' : 'text-[var(--color-warning)]'}`}>
                    −{formatCurrency(res.deducted_amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Dialog>
  );
};
