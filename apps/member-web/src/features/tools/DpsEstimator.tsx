import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Input } from '@/components/ui/Input';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--color-bg-surface)] backdrop-blur-sm p-3 rounded-lg border border-[var(--color-border)] shadow-xl">
        <p className="font-bold text-[var(--color-text-primary)] mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm font-medium" style={{ color: entry.stroke }}>
            <span>{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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
      <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-[var(--color-border)] bg-[var(--color-bg-subtle)] dark:bg-[#18181B] space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
            {isBn ? 'মাসিক জমা' : 'Monthly Deposit'}
          </label>
          <Input 
            type="number" min="500" step="500" 
            value={monthlyDeposit || ''} onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
            leftElement={<span className="font-semibold">৳</span>}
            className="font-bold tabular-nums"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
            {isBn ? 'সুদের হার' : 'Interest Rate'}
          </label>
          <Input 
            type="number" min="1" step="0.1" 
            value={interestRate || ''} onChange={(e) => setInterestRate(Number(e.target.value))}
            rightElement={<span className="font-semibold">%</span>}
            className="font-bold tabular-nums"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
            {isBn ? 'মেয়াদ' : 'Duration'}
          </label>
          <Input 
            type="number" min="1" step="1" 
            value={durationYears || ''} onChange={(e) => setDurationYears(Number(e.target.value))}
            rightElement={<span className="font-semibold text-[11px] mt-0.5">YRS</span>}
            className="font-bold tabular-nums"
          />
        </div>
      </div>

      {/* Results & Chart */}
      <div className="p-6 md:w-2/3 flex flex-col">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-[var(--color-bg-subtle)] rounded-xl border border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{isBn ? 'মোট জমা' : 'Total Deposit'}</span>
            <div className="text-xl font-bold text-[var(--color-text-primary)] mt-1" data-financial>{formatCurrency(totalPrincipal)}</div>
          </div>
          <div className="p-4 bg-[var(--color-accent-soft)] rounded-xl border border-[var(--color-accent)]/20">
            <span className="text-xs text-[var(--color-accent)] uppercase tracking-wider">{isBn ? 'মোট লাভ' : 'Total Interest'}</span>
            <div className="text-xl font-bold text-[var(--color-accent)] mt-1" data-financial>{formatCurrency(totalInterest)}</div>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20 col-span-2 md:col-span-1 break-words">
            <span className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider whitespace-nowrap">{isBn ? 'ম্যাচুরিটি ভ্যালু' : 'Maturity Value'}</span>
            <div className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1" data-financial>{formatCurrency(maturityAmount)}</div>
          </div>
        </div>

        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-text-muted)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-text-muted)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.4} />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} dy={10} />
              <YAxis tickFormatter={(val) => `৳${(val/1000)}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} dx={-10} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Area type="monotone" dataKey="total" name={isBn ? "মোট" : "Total"} stroke="var(--color-accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorInterest)" activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-accent)' }} />
              <Area type="monotone" dataKey="principal" name={isBn ? "আসল" : "Principal"} stroke="var(--color-text-muted)" strokeWidth={2} fillOpacity={1} fill="url(#colorPrincipal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
