import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  calculateFIRETarget,
  generateFIREProjection,
  calculateMonthlyCashflow,
} from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Flame } from 'lucide-react';

export const FIRECalculator: React.FC = () => {
  const { profile, updateProfile, accounts, transactions } = useFinance();
  const { netSavings } = calculateMonthlyCashflow(transactions);

  const [targetAge, setTargetAge] = useState<number>(profile.targetFireAge);
  const [returnRate, setReturnRate] = useState<number>(profile.expectedReturnRate);
  const [swr, setSwr] = useState<number>(profile.annualWithdrawalRate);

  const currentInvestments = accounts
    .filter((a) => a.type === 'investment' || a.type === 'savings')
    .reduce((sum, a) => sum + a.balance, 0);

  const monthlyInvested = Math.max(500, netSavings > 0 ? netSavings : 1500);

  // Compute FIRE Targets
  const fireStats = calculateFIRETarget(
    { ...profile, targetFireAge: targetAge, expectedReturnRate: returnRate, annualWithdrawalRate: swr },
    3500 // Base estimated monthly living expense
  );

  const projectionData = generateFIREProjection(
    { ...profile, targetFireAge: targetAge, expectedReturnRate: returnRate, annualWithdrawalRate: swr },
    currentInvestments,
    monthlyInvested,
    3500
  );

  return (
    <div className="glass-panel p-6 space-y-6 glow-violet">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-violet-400" />
            <h2 className="text-xl font-extrabold text-white">FIRE Simulator</h2>
            <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full font-semibold">
              SWR {swr}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Financial Independence, Retire Early readiness & compound wealth projections.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-white/10 p-3 rounded-xl">
          <span className="text-xs text-slate-400 block">Target Portfolio Needed</span>
          <span className="text-2xl font-black text-violet-400">
            {formatCurrency(fireStats.targetPortfolio, profile.currency, true)}
          </span>
        </div>
      </div>

      {/* Input Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/70 p-4 rounded-xl border border-white/5">
        {/* Target Age Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">Target FIRE Age</span>
            <span className="text-violet-400">{targetAge} yrs</span>
          </div>
          <input
            type="range"
            min="35"
            max="65"
            value={targetAge}
            onChange={(e) => {
              const v = Number(e.target.value);
              setTargetAge(v);
              updateProfile({ targetFireAge: v });
            }}
            className="w-full accent-violet-500 bg-slate-800"
          />
        </div>

        {/* Expected Return Rate */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">Expected Stock Return</span>
            <span className="text-emerald-400">{returnRate}% / yr</span>
          </div>
          <input
            type="range"
            min="4"
            max="12"
            step="0.5"
            value={returnRate}
            onChange={(e) => {
              const v = Number(e.target.value);
              setReturnRate(v);
              updateProfile({ expectedReturnRate: v });
            }}
            className="w-full accent-emerald-500 bg-slate-800"
          />
        </div>

        {/* Safe Withdrawal Rate */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">Safe Withdrawal (SWR)</span>
            <span className="text-teal-400">{swr}%</span>
          </div>
          <input
            type="range"
            min="3.0"
            max="5.0"
            step="0.25"
            value={swr}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSwr(v);
              updateProfile({ annualWithdrawalRate: v });
            }}
            className="w-full accent-teal-500 bg-slate-800"
          />
        </div>
      </div>

      {/* Projection Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Portfolio Projection Curve</span>
          <span>Monthly Investment: {formatCurrency(monthlyInvested, profile.currency)}</span>
        </div>
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="age" stroke="#94a3b8" fontSize={12} tickLine={false} label={{ value: 'Age', position: 'insideBottomRight', offset: -5 }} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0d111a',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
                formatter={(val: any) => formatCurrency(Number(val), profile.currency, true)}
              />
              <Area type="monotone" dataKey="portfolioValue" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorPortfolio)" name="Portfolio" />
              <Area type="monotone" dataKey="fireTarget" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" fill="none" name="FIRE Target" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
