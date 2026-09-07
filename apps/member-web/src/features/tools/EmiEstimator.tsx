import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Input } from '@/components/ui/Input';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--color-bg-surface)] backdrop-blur-sm p-3 rounded-lg border border-[var(--color-border)] shadow-xl">
        <p className="font-bold text-[var(--color-text-primary)] mb-2">{payload[0].name}</p>
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: payload[0].payload.color }}>
          <span>৳ {formatCurrency(payload[0].value)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const EmiEstimator: React.FC = () => {
  const { locale } = useLanguage();
  const isBn = locale === 'bn';
  
  const [loanAmount, setLoanAmount] = useState(500000);
  const [interestRate, setInterestRate] = useState(9.0);
  const [durationYears, setDurationYears] = useState(5);

  // EMI Calculation logic
  const months = durationYears * 12;
  const monthlyRate = interestRate / 100 / 12;
  
  let emi = 0;
  if (monthlyRate === 0) {
    emi = loanAmount / months;
  } else {
    emi = loanAmount * monthlyRate * (Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1));
  }
  
  const totalPayment = emi * months;
  const totalInterest = totalPayment - loanAmount;

  const chartData = [
    { name: isBn ? 'আসল (Principal)' : 'Principal', value: loanAmount, color: '#3b82f6' },
    { name: isBn ? 'সুদ (Interest)' : 'Total Interest', value: totalInterest, color: '#f43f5e' }
  ];

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      {/* Controls */}
      <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-[var(--color-border)] bg-[var(--color-bg-subtle)] dark:bg-[#18181B] space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
            {isBn ? 'লোনের পরিমাণ' : 'Loan Amount'}
          </label>
          <Input 
            type="number" min="10000" step="10000" 
            value={loanAmount || ''} onChange={(e) => setLoanAmount(Number(e.target.value))}
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
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-5 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20 col-span-2 sm:col-span-1">
            <span className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-semibold">{isBn ? 'মাসিক ইএমআই' : 'Monthly EMI'}</span>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-2" data-financial>৳ {formatCurrency(emi)}</div>
          </div>
          <div className="space-y-4 col-span-2 sm:col-span-1">
            <div className="p-3 bg-[var(--color-bg-subtle)] rounded-lg border border-[var(--color-border)] flex justify-between items-center">
              <span className="text-sm text-[var(--color-text-muted)]">{isBn ? 'আসল' : 'Principal'}</span>
              <span className="font-semibold text-[var(--color-text-primary)]" data-financial>৳ {formatCurrency(loanAmount)}</span>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-lg border border-rose-200 dark:border-rose-500/20 flex justify-between items-center">
              <span className="text-sm text-rose-600 dark:text-rose-400">{isBn ? 'মোট সুদ' : 'Total Interest'}</span>
              <span className="font-semibold text-rose-700 dark:text-rose-300" data-financial>৳ {formatCurrency(totalInterest)}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[220px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={6}
                cornerRadius={6}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
