import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Wallet, Landmark, CreditCard, TrendingUp, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { Card, Skeleton, EmptyState, ErrorState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Database } from '@/types/database';

type AccountBalance = Database['public']['Views']['v_account_balances']['Row'];

export const AccountsPage: React.FC = () => {
  const { user } = useAuthContext();
  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balanceHidden, setBalanceHidden] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('v_account_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('name');
      if (error) throw error;
      setAccounts((data as AccountBalance[]) ?? []);
    } catch (err: any) {
      setError(err.message || 'Could not fetch accounts');
      setAccounts([]);
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
            Accounts
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            Manage your liquid assets and liabilities
          </p>
        </div>
        <Link to="/accounts/add">
          <Button size="sm" className="gap-1">
            <Plus size={16} /> Add Account
          </Button>
        </Link>
      </header>

      {/* Summary */}
      <Card>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">Total Net Assets</span>
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
            <span className="text-[var(--color-text-muted)]">Assets: </span>
            <span className="font-medium text-[var(--color-positive)]" data-financial>
              {balanceHidden ? '••••' : formatCurrency(totalAssetBalance)}
            </span>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)]">Liabilities: </span>
            <span className="font-medium text-[var(--color-negative)]" data-financial>
              {balanceHidden ? '••••' : formatCurrency(totalLiabilityBalance)}
            </span>
          </div>
        </div>
      </Card>

      {displayAssetAccounts.length === 0 && displayLiabilityAccounts.length === 0 && (
        <EmptyState
          icon={<CreditCard size={24} />}
          title="No accounts found"
          description="You haven't added any financial accounts yet."
          action={
            <Link to="/accounts/add">
              <Button size="sm" className="mt-2">Add your first account</Button>
            </Link>
          }
        />
      )}

      {/* Assets Section */}
      {displayAssetAccounts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
            Asset Accounts ({displayAssetAccounts.length})
          </h2>
          <Card padding="none">
            <div className="divide-y divide-[var(--color-border)]" role="list">
              {displayAssetAccounts.map((acc) => (
                <Link
                  key={acc.account_id}
                  to={`/accounts/${acc.account_id}`}
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
                    <span className="font-semibold tabular-nums text-[var(--text-body)]" data-financial>
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

      {/* Liabilities Section */}
      {displayLiabilityAccounts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
            Liability Accounts ({displayLiabilityAccounts.length})
          </h2>
          <Card padding="none">
            <div className="divide-y divide-[var(--color-border)]" role="list">
              {displayLiabilityAccounts.map((acc) => (
                <Link
                  key={acc.account_id}
                  to={`/accounts/${acc.account_id}`}
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
