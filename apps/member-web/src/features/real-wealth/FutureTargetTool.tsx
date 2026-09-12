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
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4 flex-1">
        <div className="space-y-6 flex flex-col justify-center">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Goal Category</label>
            <Select 
              options={goals} 
              value={goal} 
              onValueChange={setGoal} 
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1">
                <Coins className="w-4 h-4" /> Today's Cost (৳)
              </label>
              <span className="font-bold text-[var(--color-text-primary)]">
                ৳{currentCost.toLocaleString()}
              </span>
            </div>
            <input 
              type="range" 
              min="50000" 
              max="50000000" 
              step="50000"
              value={currentCost} 
              onChange={e => setCurrentCost(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1">
                <CalendarDays className="w-4 h-4" /> Target Year
              </label>
              <span className="font-bold text-[var(--color-text-primary)]">
                {targetYear} <span className="text-xs text-[var(--color-text-muted)] font-normal">({years} yrs)</span>
              </span>
            </div>
            <input 
              type="range" 
              min={currentYear} 
              max={currentYear + 40} 
              step="1"
              value={targetYear} 
              onChange={e => setTargetYear(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1">
                <Percent className="w-4 h-4" /> Inflation
              </label>
              <span className="font-bold text-[var(--color-text-primary)]">
                {inflation}%
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="20" 
              step="0.5"
              value={inflation} 
              onChange={e => setInflation(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          </div>
        </div>

        {/* Results Glassmorphic Container */}
        <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-bg-surface)] to-[var(--color-bg-subtle)] p-6 shadow-sm flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Target className="w-32 h-32" />
          </div>
          
          <div className="space-y-6 relative z-10">
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

            <p className="text-sm text-[var(--color-text-secondary)] pt-4 border-t border-[var(--color-border)]/50 leading-relaxed">
              If you wait until <strong>{targetYear}</strong> to fund this goal, it will cost you an extra <strong>৳{Math.round(difference).toLocaleString()}</strong> compared to today's prices, assuming a {inflation}% inflation rate.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
