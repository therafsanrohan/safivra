import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';

export const FutureTargetTool: React.FC = () => {
  const [goal, setGoal] = useState<string>('home');
  const [currentCost, setCurrentCost] = useState<number>(5000000);
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear() + 5);
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

  const currentYear = new Date().getFullYear();
  const years = Math.max(0, targetYear - currentYear);
  
  const inflationFactor = Math.pow(1 + inflation / 100, years);
  const estimatedFutureCost = currentCost * inflationFactor;

  return (
    <Card>
      <CardHeader 
        title="Future Target Estimator" 
        subtitle="Estimate how much your future financial goals will cost due to inflation."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[var(--color-text-secondary)]">Select Goal</label>
            <Select 
              options={goals} 
              value={goal} 
              onValueChange={setGoal} 
            />
          </div>
          <div>
            <label className="text-sm text-[var(--color-text-secondary)]">Today's Cost (৳)</label>
            <input 
              type="number" 
              value={currentCost} 
              onChange={e => setCurrentCost(Number(e.target.value))}
              className="w-full p-2 border rounded bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm text-[var(--color-text-secondary)]">Target Year</label>
              <input 
                type="number" 
                value={targetYear} 
                onChange={e => setTargetYear(Number(e.target.value))}
                className="w-full p-2 border rounded bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-[var(--color-text-secondary)]">Inflation (%)</label>
              <input 
                type="number" 
                value={inflation} 
                onChange={e => setInflation(Number(e.target.value))}
                className="w-full p-2 border rounded bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]"
              />
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-bg-subtle)] p-6 rounded-[var(--radius-card)] flex flex-col justify-center items-center text-center space-y-2">
          <p className="text-sm text-[var(--color-text-muted)] uppercase font-semibold">Estimated Future Requirement</p>
          <h3 className="text-3xl font-bold text-[var(--color-text-primary)]">
            ৳{Math.round(estimatedFutureCost).toLocaleString()}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            In {targetYear}, you will need this much nominal currency to buy what costs ৳{Math.round(currentCost).toLocaleString()} today.
          </p>
          <span className="inline-block mt-4 px-2 py-1 bg-[var(--color-warning-soft)] text-[var(--color-warning)] rounded text-xs font-semibold">
            Inflation-based estimate
          </span>
        </div>
      </div>
    </Card>
  );
};
