import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { calculateMonthlyCashflow } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { PieChart } from 'lucide-react';

export const BudgetOverview: React.FC = () => {
  const { transactions, categories, profile } = useFinance();
  const { income } = calculateMonthlyCashflow(transactions);

  // Group actual expenses by category bucket
  const bucketTotals: Record<string, number> = {
    needs: 0,
    wants: 0,
    savings_investments: 0,
    debt_repayment: 0,
  };

  transactions.forEach((tx) => {
    if (tx.type === 'expense') {
      const cat = categories.find((c) => c.id === tx.categoryId);
      const bucket = cat ? cat.bucket : 'wants';
      bucketTotals[bucket] = (bucketTotals[bucket] || 0) + tx.amount;
    }
  });

  const totalIncome = income > 0 ? income : profile.monthlyIncome;

  const targets = {
    needs: totalIncome * 0.5,
    wants: totalIncome * 0.3,
    savings_investments: totalIncome * 0.15,
    debt_repayment: totalIncome * 0.05,
  };

  const buckets = [
    { key: 'needs', label: 'Needs (50%)', actual: bucketTotals.needs, target: targets.needs, color: '#10B981' },
    { key: 'wants', label: 'Wants (30%)', actual: bucketTotals.wants, target: targets.wants, color: '#F59E0B' },
    { key: 'savings_investments', label: 'Investments (15%)', actual: bucketTotals.savings_investments, target: targets.savings_investments, color: '#8B5CF6' },
    { key: 'debt_repayment', label: 'Debt Payoff (5%)', actual: bucketTotals.debt_repayment, target: targets.debt_repayment, color: '#EF4444' },
  ];

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-400" />
          50/30/20 Budget Allocation
        </h3>
        <span className="text-xs text-slate-400">
          Monthly Income: <strong className="text-slate-200">{formatCurrency(totalIncome, profile.currency)}</strong>
        </span>
      </div>

      <div className="space-y-3">
        {buckets.map((b) => {
          const pct = b.target > 0 ? Math.min(100, (b.actual / b.target) * 100) : 0;
          const isOver = b.actual > b.target;

          return (
            <div key={b.key} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                  {b.label}
                </span>
                <span className="text-slate-200">
                  {formatCurrency(b.actual, profile.currency)}{' '}
                  <span className="text-slate-500">/ {formatCurrency(b.target, profile.currency, true)}</span>
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: isOver ? '#EF4444' : b.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
