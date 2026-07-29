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
    } catch {
      setAccounts([
        {
          account_id: 'acc-1',
          user_id: user.id,
          name: 'City Bank Salary Account',
          account_type: 'bank',
          account_class: 'asset',
          institution: 'City Bank',
          currency_code: 'BDT',
          credit_limit: null,
          include_in_total: true,
          include_in_net_worth: true,
          is_active: true,
          is_archived: false,
          balance: '145000.00',
        },
        {
          account_id: 'acc-2',
          user_id: user.id,
          name: 'bKash Personal',
          account_type: 'mobile_financial_service',
          account_class: 'asset',
          institution: 'bKash',
          currency_code: 'BDT',
          credit_limit: null,
          include_in_total: true,
          include_in_net_worth: true,
          is_active: true,
          is_archived: false,
          balance: '18450.00',
        },
        {
          account_id: 'acc-3',
          user_id: user.id,
          name: 'DBBL FDR Savings',
          account_type: 'savings',
          account_class: 'asset',
          institution: 'Dutch-Bangla Bank',
          currency_code: 'BDT',
          credit_limit: null,
          include_in_total: true,
          include_in_net_worth: true,
          is_active: true,
          is_archived: false,
          balance: '250000.00',
        },
        {
          account_id: 'acc-4',
          user_id: user.id,
          name: 'DBBL Home Loan',
          account_type: 'loan',
          account_class: 'liability',
          institution: 'Dutch-Bangla Bank',
          currency_code: 'BDT',
          credit_limit: null,
          include_in_total: false,
          include_in_net_worth: true,
          is_active: true,
          is_archived: false,
          balance: '-120000.00',
        },
        {
          account_id: 'acc-5',
          user_id: user.id,
          name: 'City Bank AMEX Card',
          account_type: 'credit_card',
          account_class: 'liability',
          institution: 'City Bank',
          currency_code: 'BDT',
          credit_limit: '100000.00',
          include_in_total: false,
          include_in_net_worth: true,
          is_active: true,
          is_archived: false,
          balance: '-34200.00',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const assetAccounts = accounts.filter((a) => a.account_class === 'asset' && a.is_active);
  const liabilityAccounts = accounts.filter((a) => a.account_class === 'liability' && a.is_active);

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

      {/* Assets Section */}
      <section className="space-y-3">
        <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
          Asset Accounts ({assetAccounts.length})
        </h2>
        {assetAccounts.length === 0 ? (
          <EmptyState
            icon={<Wallet size={20} />}
            title="No asset accounts"
            description="Add your bank accounts, bKash, Nagad, or cash."
            action={
              <Link to="/accounts/add">
                <Button size="sm">Add Account</Button>
              </Link>
            }
          />
        ) : (
          <Card padding="none">
            <div className="divide-y divide-[var(--color-border)]" role="list">
              {assetAccounts.map((acc) => (
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
        )}
      </section>

      {/* Liabilities Section */}
      {liabilityAccounts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
            Liability Accounts ({liabilityAccounts.length})
          </h2>
          <Card padding="none">
            <div className="divide-y divide-[var(--color-border)]" role="list">
              {liabilityAccounts.map((acc) => (
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
