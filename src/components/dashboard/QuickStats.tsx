import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { calculateMonthlyCashflow } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { PiggyBank, Landmark, ShieldCheck, Flame } from 'lucide-react';

export const QuickStats: React.FC = () => {
  const { accounts, transactions, profile } = useFinance();
  const { savingsRate } = calculateMonthlyCashflow(transactions);

  const hysaBalance = accounts
    .filter((a) => a.type === 'savings')
    .reduce((sum, a) => sum + a.balance, 0);

  const investmentsBalance = accounts
    .filter((a) => a.type === 'investment' || a.type === 'real_estate')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalDebts = accounts
    .filter((a) => a.isLiability)
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Stat 1: High Yield Savings */}
      <div className="glass-panel p-4 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <PiggyBank className="w-4 h-4 text-emerald-400" /> Liquid Savings
        </div>
        <p className="text-lg font-bold text-slate-100">
          {formatCurrency(hysaBalance, profile.currency, true)}
        </p>
        <p className="text-[10px] text-emerald-400">Yield: ~4.5% APY</p>
      </div>

      {/* Stat 2: Investments */}
      <div className="glass-panel p-4 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Landmark className="w-4 h-4 text-violet-400" /> Investments
        </div>
        <p className="text-lg font-bold text-slate-100">
          {formatCurrency(investmentsBalance, profile.currency, true)}
        </p>
        <p className="text-[10px] text-violet-400">Compounding</p>
      </div>

      {/* Stat 3: Total Debt */}
      <div className="glass-panel p-4 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Flame className="w-4 h-4 text-rose-400" /> Total Liabilities
        </div>
        <p className="text-lg font-bold text-rose-400">
          {formatCurrency(totalDebts, profile.currency, true)}
        </p>
        <p className="text-[10px] text-rose-400 font-medium">Strategy: {profile.debtStrategy.toUpperCase()}</p>
      </div>

      {/* Stat 4: Savings Rate */}
      <div className="glass-panel p-4 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-teal-400" /> Savings Rate
        </div>
        <p className="text-lg font-bold text-teal-400">
          {savingsRate.toFixed(1)}%
        </p>
        <p className="text-[10px] text-slate-400">Target: &gt; 20%</p>
      </div>
    </div>
  );
};
