import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';

export const PurchasingPowerTool: React.FC = () => {
  const [amount, setAmount] = useState<number>(1000000);
  const [inflation, setInflation] = useState<number>(6); // Percentage
  const [years, setYears] = useState<number>(10);

  // Client-side approximation for immediate feedback.
  // The deterministic engine runs this on the backend for saved results.
  const inflationFactor = Math.pow(1 + inflation / 100, years);
  const realValue = amount / inflationFactor;
  const powerLossPercent = (1 - (realValue / amount)) * 100;
  const futureRequired = amount * inflationFactor;

  return (
    <Card>
      <CardHeader 
        title="Purchasing Power Calculator" 
        subtitle="See how inflation erodes cash value over time."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[var(--color-text-secondary)]">Amount (৳)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full p-2 border rounded bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="text-sm text-[var(--color-text-secondary)]">Inflation Assumption (%)</label>
            <input 
              type="number" 
              value={inflation} 
              onChange={e => setInflation(Number(e.target.value))}
              className="w-full p-2 border rounded bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="text-sm text-[var(--color-text-secondary)]">Years</label>
            <input 
              type="number" 
              value={years} 
              onChange={e => setYears(Number(e.target.value))}
              className="w-full p-2 border rounded bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]"
            />
          </div>
        </div>

        <div className="bg-[var(--color-bg-subtle)] p-4 rounded-[var(--radius-card)] space-y-4">
          <div>
            <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold">Nominal Amount</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">৳{Math.round(amount).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold">Real Purchasing Power</p>
            <p className="text-xl font-bold text-[var(--color-negative)]">৳{Math.round(realValue).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold">Purchasing Power Loss</p>
            <p className="text-xl font-bold text-[var(--color-negative)]">{powerLossPercent.toFixed(1)}%</p>
          </div>
          <div className="pt-2 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold">Future Amount Required</p>
            <p className="text-sm text-[var(--color-text-secondary)]">To preserve today's purchasing power:</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">৳{Math.round(futureRequired).toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-xs text-[var(--color-text-muted)] p-3 bg-[var(--color-bg-surface)] border rounded">
        <strong>How is this calculated?</strong><br />
        Real Purchasing Power = Amount / (1 + Inflation)^{years}<br/>
        Future Required = Amount * (1 + Inflation)^{years}
      </div>
    </Card>
  );
};
