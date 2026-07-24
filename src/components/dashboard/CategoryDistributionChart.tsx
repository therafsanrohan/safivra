import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

export const CategoryDistributionChart: React.FC = () => {
  const { transactions, categories, profile } = useFinance();

  // Aggregate expenses per category
  const categoryTotals: Record<string, number> = {};

  transactions.forEach((tx) => {
    if (tx.type === 'expense' && tx.categoryId) {
      categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + tx.amount;
    }
  });

  const chartData = Object.keys(categoryTotals).map((catId) => {
    const cat = categories.find((c) => c.id === catId);
    return {
      name: cat ? cat.name : 'Other',
      value: categoryTotals[catId],
      color: cat ? cat.color : '#94A3B8',
    };
  }).filter((item) => item.value > 0);

  const totalExpense = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-teal-400" />
          Category Spending Distribution
        </h3>
        <span className="text-xs text-slate-400">
          Total Spent: <strong className="text-rose-400">{formatCurrency(totalExpense, profile.currency)}</strong>
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          No category expenses recorded yet for visualization.
        </div>
      ) : (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0d111a',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f3f4f6',
                }}
                formatter={(val: any) => formatCurrency(Number(val), profile.currency)}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
