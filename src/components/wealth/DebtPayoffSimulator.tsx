import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { simulateDebtPayoff } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ShieldAlert, Zap } from 'lucide-react';

export const DebtPayoffSimulator: React.FC = () => {
  const { debts, extraDebtPayment, setExtraDebtPayment, profile, updateDebtStrategy } = useFinance();

  const payoff = simulateDebtPayoff(debts, extraDebtPayment);

  const activeStrategy = profile.debtStrategy;

  return (
    <div className="glass-panel p-6 space-y-6 glow-red">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            <h2 className="text-xl font-extrabold text-white">Debt Freedom Simulator</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare Avalanche (highest APR first) vs Snowball (smallest balance first).
          </p>
        </div>

        {/* Strategy Switcher Pills */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => updateDebtStrategy('avalanche')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeStrategy === 'avalanche'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Avalanche (Max Savings)
          </button>
          <button
            onClick={() => updateDebtStrategy('snowball')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeStrategy === 'snowball'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Snowball (Fast Wins)
          </button>
        </div>
      </div>

      {/* Extra Monthly Payment Slider */}
      <div className="bg-slate-900/70 p-4 rounded-xl border border-white/5 space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" /> Extra Monthly Payment Buffer
          </span>
          <span className="text-amber-400 text-sm font-bold">
            +{formatCurrency(extraDebtPayment, profile.currency)}/mo
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="1500"
          step="50"
          value={extraDebtPayment}
          onChange={(e) => setExtraDebtPayment(Number(e.target.value))}
          className="w-full accent-amber-400 bg-slate-800"
        />
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Avalanche Card */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            activeStrategy === 'avalanche'
              ? 'bg-rose-500/10 border-rose-500/40 shadow-lg shadow-rose-950/40'
              : 'bg-slate-900/60 border-white/5 opacity-75'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm text-slate-200">Debt Avalanche</h3>
            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              Highest APR First
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-2xl font-black text-slate-100">
              {payoff.avalancheMonths} <span className="text-xs font-normal text-slate-400">Months</span>
            </p>
            <p className="text-xs text-slate-400">
              Total Interest: <strong className="text-rose-400">{formatCurrency(payoff.avalancheTotalInterest, profile.currency)}</strong>
            </p>
          </div>
        </div>

        {/* Snowball Card */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            activeStrategy === 'snowball'
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-950/40'
              : 'bg-slate-900/60 border-white/5 opacity-75'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm text-slate-200">Debt Snowball</h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Smallest Balance First
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-2xl font-black text-slate-100">
              {payoff.snowballMonths} <span className="text-xs font-normal text-slate-400">Months</span>
            </p>
            <p className="text-xs text-slate-400">
              Total Interest: <strong className="text-emerald-400">{formatCurrency(payoff.snowballTotalInterest, profile.currency)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Payoff Curve Line Chart */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-400">Payoff Timeline Comparison</h4>
        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={payoff.schedule} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0d111a',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
                formatter={(val: any) => formatCurrency(Number(val), profile.currency)}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="avalancheRemaining" stroke="#EF4444" strokeWidth={2.5} name="Avalanche Balance" dot={false} />
              <Line type="monotone" dataKey="snowballRemaining" stroke="#10B981" strokeWidth={2.5} name="Snowball Balance" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
