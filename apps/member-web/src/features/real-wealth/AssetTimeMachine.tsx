import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';

export const AssetTimeMachine: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [amount, setAmount] = useState<number>(1000000);
  const [purchaseYear, setPurchaseYear] = useState<number>(2018);

  const years = [2018, 2020, 2023, 2026, 2031, 2036, 2046];

  // Mock deterministic calculation for demo purposes in UI.
  // In a real flow, this would call the backend's deterministic engine.
  const calculateRealValue = (year: number) => {
    const currentYear = new Date().getFullYear();
    const diff = year - currentYear;
    if (diff === 0) return amount;
    if (diff < 0) {
      // Historical: Assuming 6% inflation backward
      return Math.round(amount / Math.pow(1.06, Math.abs(diff)));
    }
    // Future: Assuming 6% inflation forward
    return Math.round(amount * Math.pow(1.06, diff));
  };

  const isHistorical = selectedYear < new Date().getFullYear();
  const displayedValue = calculateRealValue(selectedYear);

  return (
    <Card>
      <CardHeader 
        title="Asset Time Machine" 
        subtitle="Travel through time to see how inflation affects your asset's value."
      />
      <div className="space-y-6">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {years.map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={[
                'px-4 py-2 rounded-full whitespace-nowrap transition-colors font-medium text-sm border',
                selectedYear === y
                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                  : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] border-transparent hover:border-[var(--color-border)]'
              ].join(' ')}
            >
              {y === new Date().getFullYear() ? 'Today (2026)' : y}
            </button>
          ))}
        </div>

        <div className="p-6 bg-[var(--color-bg-subtle)] rounded-[var(--radius-card)] text-center">
          <p className="text-[var(--text-label)] uppercase text-[var(--color-text-muted)] font-semibold mb-2">
            {isHistorical ? 'Inflation-adjusted purchase value' : selectedYear === new Date().getFullYear() ? 'Current Value' : 'Projected Value'}
          </p>
          <h3 className="text-4xl font-bold text-[var(--color-text-primary)]">
            ৳{displayedValue.toLocaleString()}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-3">
            {isHistorical 
              ? `What ৳${amount.toLocaleString()} in ${new Date().getFullYear()} would have been worth in ${selectedYear}.`
              : selectedYear === new Date().getFullYear()
                ? 'Your baseline asset valuation.'
                : `The nominal amount required in ${selectedYear} to equal today's purchasing power.`}
          </p>
        </div>
      </div>
    </Card>
  );
};
