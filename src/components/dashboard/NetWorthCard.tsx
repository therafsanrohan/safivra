import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { calculateNetWorth } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const NetWorthCard: React.FC = () => {
  const { accounts, profile } = useFinance();
  const { assets, liabilities, netWorth } = calculateNetWorth(accounts);

  return (
    <div className="glass-panel p-6 relative overflow-hidden glow-emerald">
      {/* Background Subtle Gradient Overlay */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
            Total Net Worth
          </span>
          <h2 className="text-4xl font-extrabold text-white mt-2 tracking-tight">
            {formatCurrency(netWorth, profile.currency)}
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">+4.2%</span> from last month
          </p>
        </div>

        <div className="flex gap-2">
          <div className="bg-slate-900/80 border border-white/10 p-3 rounded-xl min-w-[120px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> Total Assets
            </div>
            <p className="text-sm font-bold text-slate-100">
              {formatCurrency(assets, profile.currency, true)}
            </p>
          </div>

          <div className="bg-slate-900/80 border border-white/10 p-3 rounded-xl min-w-[120px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" /> Liabilities
            </div>
            <p className="text-sm font-bold text-rose-400">
              {formatCurrency(liabilities, profile.currency, true)}
            </p>
          </div>
        </div>
      </div>

      {/* Account Balances Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-white/5"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: acc.color || '#10B981' }}
              />
              <span className="text-xs text-slate-300 font-medium truncate">{acc.name}</span>
            </div>
            <span
              className={`text-xs font-bold ${
                acc.isLiability ? 'text-rose-400' : 'text-slate-100'
              }`}
            >
              {formatCurrency(acc.balance, profile.currency, true)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
