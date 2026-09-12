import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';

export const ScenarioEngine: React.FC = () => {
  const [scenario, setScenario] = useState('expected');

  const options = [
    { value: 'conservative', label: 'Conservative (Low Growth, High Inflation)' },
    { value: 'expected', label: 'Expected (Historical Averages)' },
    { value: 'optimistic', label: 'Optimistic (High Growth, Low Inflation)' },
    { value: 'custom', label: 'Custom Assumptions' }
  ];

  return (
    <Card>
      <CardHeader title="Projection Scenarios" subtitle="Select an economic climate assumption" />
      <div className="space-y-4">
        <Select 
          options={options} 
          value={scenario} 
          onValueChange={setScenario} 
          placeholder="Select scenario"
        />

        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Assumed Inflation:</span>
            <span className="font-medium">
              {scenario === 'conservative' ? '8.5%' : scenario === 'expected' ? '6.0%' : scenario === 'optimistic' ? '4.0%' : 'Custom'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Portfolio Base Growth:</span>
            <span className="font-medium">
              {scenario === 'conservative' ? '4.0%' : scenario === 'expected' ? '8.0%' : scenario === 'optimistic' ? '12.0%' : 'Custom'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
