import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { TrendingDown, Coins, CalendarDays, Percent } from 'lucide-react';

export const PurchasingPowerTool: React.FC = () => {
  const [amount, setAmount] = useState<number>(1000000);
  const [inflation, setInflation] = useState<number>(6); // Percentage
  const [years, setYears] = useState<number>(10);

  // Client-side approximation for immediate feedback.
  const inflationFactor = Math.pow(1 + inflation / 100, years);
  const realValue = amount / inflationFactor;
  const powerLossPercent = (1 - (realValue / amount)) * 100;
  const futureRequired = amount * inflationFactor;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader 
        title="Purchasing Power Erosion" 
        subtitle="See how inflation silently reduces the value of cash."
      />
      <div className="flex flex-col gap-6 mt-4 flex-1">
        <div className="space-y-4 flex flex-col justify-center">
          
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-bold mr-1">1</span>
              <Coins className="w-4 h-4" /> Enter Current Amount (৳)
            </label>
            <input 
              type="number" 
              min="0"
              value={amount} 
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full p-2.5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] font-semibold text-base focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>

          {/* Inflation Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-bold mr-1">2</span>
              <Percent className="w-4 h-4" /> Expected Inflation Rate (%)
            </label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              step="0.1"
              value={inflation} 
              onChange={e => setInflation(Number(e.target.value))}
              className="w-full p-2.5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] font-semibold text-base focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>

          {/* Years Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-bold mr-1">3</span>
              <CalendarDays className="w-4 h-4" /> Years into the Future
            </label>
            <input 
              type="number" 
              min="1" 
              max="100" 
              step="1"
              value={years} 
              onChange={e => setYears(Number(e.target.value))}
              className="w-full p-2.5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] font-semibold text-base focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>
        </div>

        {/* Results Glassmorphic Container */}
        <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-bg-surface)] to-[var(--color-bg-subtle)] p-5 shadow-sm mt-auto">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <TrendingDown className="w-32 h-32" />
          </div>
          
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold tracking-wider mb-1">In {years} Years, Your ৳{amount.toLocaleString()} will feel like:</p>
              <p className="text-3xl font-extrabold text-[var(--color-negative)]">
                ৳{Math.round(realValue).toLocaleString()}
              </p>
            </div>
            
            <div className="flex items-center gap-4 border-l-4 border-red-500/50 pl-4 py-1">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold">Value Lost</p>
                <p className="text-lg font-bold text-red-500">
                  -{powerLossPercent.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-border)]/50">
              <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold mb-1">To buy the same things, you will need:</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                ৳{Math.round(futureRequired).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
