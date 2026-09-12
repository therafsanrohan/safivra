import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { calculateFutureRequiredAmount } from '@safivra/finance-engine';

export const PurchasingPowerTool: React.FC = () => {
  const [currentValue, setCurrentValue] = useState(1000000);
  const [inflation, setInflation] = useState(7);
  const [years, setYears] = useState(10);

  const futureRequired = calculateFutureRequiredAmount(currentValue, inflation / 100, years).toNumber();

  return (
    <Card>
      <CardHeader 
        title="Future Target Tool" 
        subtitle="Calculate required future nominal amounts to maintain purchasing power." 
      />
      <div className="space-y-4">
        <div className="space-y-2">
          <Input 
            label="Today's Target Value (৳)"
            type="number" 
            value={currentValue} 
            onChange={(e) => setCurrentValue(Number(e.target.value))} 
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input 
              label="Inflation Rate (%)"
              type="number" 
              value={inflation} 
              onChange={(e) => setInflation(Number(e.target.value))} 
              step="0.1"
            />
          </div>
          <div className="space-y-2">
            <Input 
              label="Horizon (Years)"
              type="number" 
              value={years} 
              onChange={(e) => setYears(Number(e.target.value))} 
            />
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-primary/10 text-primary rounded-lg">
          <p className="text-sm font-medium mb-1">To match today's purchasing power, you will need:</p>
          <p className="text-3xl font-bold">
            ৳{futureRequired.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </Card>
  );
};
