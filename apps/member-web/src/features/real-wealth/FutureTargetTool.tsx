import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Target, Coins, CalendarDays, Percent } from 'lucide-react';

export const FutureTargetTool: React.FC = () => {
  const [goal, setGoal] = useState<string>('home');
  const [currentCost, setCurrentCost] = useState<number>(5000000);
  const currentYear = new Date().getFullYear();
  const [targetYear, setTargetYear] = useState<number>(currentYear + 5);
  const [inflation, setInflation] = useState<number>(6);

  const goals = [
    { value: 'home', label: 'Home Purchase' },
    { value: 'education', label: 'Education' },
    { value: 'retirement', label: 'Retirement' },
    { value: 'hajj', label: 'Hajj' },
    { value: 'emergency', label: 'Emergency Fund' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'business', label: 'Business Capital' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'custom', label: 'Custom Goal' },
  ];

  const years = Math.max(0, targetYear - currentYear);
  const inflationFactor = Math.pow(1 + inflation / 100, years);
  const estimatedFutureCost = currentCost * inflationFactor;
  const difference = estimatedFutureCost - currentCost;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader 
        title={<div className="flex items-center gap-2"><Target className="w-5 h-5 text-[var(--color-accent)]" /> Future Target Estimator</div>} 
        subtitle="Estimate the true nominal cost of your future goals due to inflation."
      />
      
      <div className="flex flex-col gap-6 mt-4 flex-1">
        <div className="space-y-4 flex flex-col justify-center">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-bold mr-1">1</span>
              Goal Category
            </label>
            <Select 
              options={goals} 
              value={goal} 
              onValueChange={setGoal} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-bold mr-1">2</span>
              <Coins className="w-4 h-4" /> Today's Cost (৳)
            </label>
            <input 
              type="number" 
              min="0"
              value={currentCost} 
              onChange={e => setCurrentCost(Number(e.target.value))}
              className="w-full p-2.5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] font-semibold text-base focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-bold mr-1">3</span>
              <CalendarDays className="w-4 h-4" /> Target Year
            </label>
            <input 
              type="number" 
              min={currentYear} 
              max={currentYear + 100}
              step="1"
              value={targetYear} 
              onChange={e => setTargetYear(Number(e.target.value))}
              className="w-full p-2.5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] font-semibold text-base focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-bold mr-1">4</span>
              <Percent className="w-4 h-4" /> Expected Inflation (%)
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
        </div>

        {/* Results Glassmorphic Container */}
        <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-bg-surface)] to-[var(--color-bg-subtle)] p-5 shadow-sm mt-auto">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Target className="w-32 h-32" />
          </div>
          
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold tracking-wider mb-1">To achieve this in {targetYear}, you need:</p>
              <h3 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text-primary)]">
                ৳{Math.round(estimatedFutureCost).toLocaleString()}
              </h3>
            </div>
            
            <div className="flex items-center gap-4 border-l-4 border-[var(--color-accent)] pl-4 py-1">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold">Inflation Premium</p>
                <p className="text-lg font-bold text-[var(--color-accent)]">
                  + ৳{Math.round(difference).toLocaleString()}
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--color-text-secondary)] pt-3 border-t border-[var(--color-border)]/50 leading-relaxed">
              If you wait until <strong>{targetYear}</strong> to fund this goal, it will cost you an extra <strong>৳{Math.round(difference).toLocaleString()}</strong> compared to today's prices, assuming a {inflation}% inflation rate.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
