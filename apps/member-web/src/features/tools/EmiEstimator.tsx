import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
      <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-[var(--color-border)] bg-slate-50 dark:bg-slate-900/50 space-y-6">
        <div>
          <label className="flex justify-between text-sm font-semibold text-[var(--color-text-primary)] mb-2">
            {isBn ? 'লোনের পরিমাণ' : 'Loan Amount'}
            <span className="text-blue-600">৳ {loanAmount.toLocaleString('en-IN')}</span>
          </label>
          <input 
            type="range" min="10000" max="10000000" step="10000" 
            value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
        
        <div>
          <label className="flex justify-between text-sm font-semibold text-[var(--color-text-primary)] mb-2">
            {isBn ? 'সুদের হার (%)' : 'Interest Rate (%)'}
            <span className="text-blue-600">{interestRate}%</span>
          </label>
          <input 
            type="range" min="1" max="25" step="0.1" 
            value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
        
        <div>
          <label className="flex justify-between text-sm font-semibold text-[var(--color-text-primary)] mb-2">
            {isBn ? 'মেয়াদ (বছর)' : 'Duration (Years)'}
            <span className="text-blue-600">{durationYears} Y</span>
          </label>
          <input 
            type="range" min="1" max="30" step="1" 
            value={durationYears} onChange={(e) => setDurationYears(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
      </div>

      {/* Results & Chart */}
      <div className="p-6 md:w-2/3 flex flex-col">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-5 bg-blue-50 rounded-xl border border-blue-100 col-span-2 sm:col-span-1">
            <span className="text-xs text-blue-600 uppercase tracking-wider font-semibold">{isBn ? 'মাসিক ইএমআই' : 'Monthly EMI'}</span>
            <div className="text-3xl font-bold text-blue-700 mt-2" data-financial>৳ {formatCurrency(emi)}</div>
          </div>
          <div className="space-y-4 col-span-2 sm:col-span-1">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
              <span className="text-sm text-slate-600">{isBn ? 'আসল' : 'Principal'}</span>
              <span className="font-semibold text-slate-900" data-financial>৳ {formatCurrency(loanAmount)}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-100 flex justify-between items-center">
              <span className="text-sm text-rose-600">{isBn ? 'মোট সুদ' : 'Total Interest'}</span>
              <span className="font-semibold text-rose-700" data-financial>৳ {formatCurrency(totalInterest)}</span>
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
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`৳ ${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, '']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
