import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { calculateNetWorth, calculateMonthlyCashflow, calculateWealthReadinessScore } from '../../utils/calculations';
import { ShieldCheck, ChevronRight } from 'lucide-react';

export const HealthScoreBadge: React.FC = () => {
  const { accounts, transactions, profile, setActiveTab } = useFinance();
  const { netWorth } = calculateNetWorth(accounts);
  const { expenses, netSavings } = calculateMonthlyCashflow(transactions);
  const savingsRate = netSavings > 0 ? (netSavings / (netSavings + expenses)) * 100 : 0;

  const liquidAssets = accounts
    .filter((a) => a.type === 'savings' || a.type === 'checking')
    .reduce((sum, a) => sum + a.balance, 0);

  const liabilities = accounts
    .filter((a) => a.isLiability)
    .reduce((sum, a) => sum + a.balance, 0);

  const { totalScore, emergencyFundMonths, tier } = calculateWealthReadinessScore(
    netWorth,
    expenses,
    liquidAssets,
    liabilities,
    savingsRate,
    profile.literacyScore
  );

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-sm text-slate-200">Wealth Readiness Index</h3>
        </div>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          {tier}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Circle Score Display */}
        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center bg-slate-900 rounded-full border-4 border-emerald-500/30 shadow-inner">
          <div className="text-center">
            <span className="text-2xl font-black text-white">{totalScore}</span>
            <span className="text-[10px] text-slate-400 block -mt-1">/ 100</span>
          </div>
        </div>

        <div className="flex-1 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span>Emergency Runway:</span>
            <span className="font-bold text-emerald-400">{emergencyFundMonths} Months</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (emergencyFundMonths / 6) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-slate-300 pt-1">
            <span>Savings Rate:</span>
            <span className="font-bold text-teal-400">{savingsRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setActiveTab('wealth')}
        className="w-full py-2 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-1 transition-all"
      >
        Simulate Wealth & Debt Payoff <ChevronRight className="w-4 h-4 text-emerald-400" />
      </button>
    </div>
  );
};
