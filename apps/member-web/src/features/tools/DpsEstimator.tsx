import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const DpsEstimator: React.FC = () => {
  const { locale } = useLanguage();
  const isBn = locale === 'bn';
  
  const [monthlyDeposit, setMonthlyDeposit] = useState(5000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [durationYears, setDurationYears] = useState(5);

  // DPS Calculation logic
  const months = durationYears * 12;
  const monthlyRate = interestRate / 100 / 12;
  
  const totalPrincipal = monthlyDeposit * months;
  let maturityAmount = 0;
  
  // Future Value of an Annuity Due
  if (monthlyRate === 0) {
    maturityAmount = totalPrincipal;
  } else {
    maturityAmount = monthlyDeposit * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  }
  
  const totalInterest = maturityAmount - totalPrincipal;

  // Chart Data
  const chartData = [];
  for (let year = 1; year <= durationYears; year++) {
    const m = year * 12;
    const principal = monthlyDeposit * m;
    const value = monthlyDeposit * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate);
    chartData.push({
      year: `${year}Y`,
      principal,
      interest: value - principal,
      total: value
    });
  }

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      {/* Controls */}
      <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-[var(--color-border)] bg-slate-50 dark:bg-slate-900/50 space-y-6">
        <div>
          <label className="flex justify-between text-sm font-semibold text-[var(--color-text-primary)] mb-2">
            {isBn ? 'মাসিক জমা' : 'Monthly Deposit'}
            <span className="text-emerald-600">৳ {monthlyDeposit.toLocaleString('en-IN')}</span>
          </label>
          <input 
            type="range" min="500" max="50000" step="500" 
            value={monthlyDeposit} onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
        
        <div>
          <label className="flex justify-between text-sm font-semibold text-[var(--color-text-primary)] mb-2">
            {isBn ? 'সুদের হার (%)' : 'Interest Rate (%)'}
            <span className="text-emerald-600">{interestRate}%</span>
          </label>
          <input 
            type="range" min="1" max="15" step="0.1" 
            value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
        
        <div>
          <label className="flex justify-between text-sm font-semibold text-[var(--color-text-primary)] mb-2">
            {isBn ? 'মেয়াদ (বছর)' : 'Duration (Years)'}
            <span className="text-emerald-600">{durationYears} Y</span>
          </label>
          <input 
            type="range" min="1" max="20" step="1" 
            value={durationYears} onChange={(e) => setDurationYears(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>

      {/* Results & Chart */}
      <div className="p-6 md:w-2/3 flex flex-col">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 uppercase tracking-wider">{isBn ? 'মোট জমা' : 'Total Deposit'}</span>
            <div className="text-xl font-bold text-slate-700 mt-1" data-financial>৳ {formatCurrency(totalPrincipal)}</div>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-xs text-emerald-600 uppercase tracking-wider">{isBn ? 'মোট লাভ' : 'Total Interest'}</span>
            <div className="text-xl font-bold text-emerald-700 mt-1" data-financial>৳ {formatCurrency(totalInterest)}</div>
          </div>
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 col-span-2 md:col-span-1">
            <span className="text-xs text-indigo-600 uppercase tracking-wider">{isBn ? 'ম্যাচুরিটি ভ্যালু' : 'Maturity Value'}</span>
            <div className="text-xl font-bold text-indigo-700 mt-1" data-financial>৳ {formatCurrency(maturityAmount)}</div>
          </div>
        </div>

        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tickFormatter={(val) => `৳${(val/1000)}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                formatter={(value: number) => [`৳ ${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, '']}
                labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="total" name={isBn ? "মোট" : "Total"} stroke="#10b981" fillOpacity={1} fill="url(#colorInterest)" />
              <Area type="monotone" dataKey="principal" name={isBn ? "আসল" : "Principal"} stroke="#64748b" fillOpacity={1} fill="url(#colorPrincipal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
