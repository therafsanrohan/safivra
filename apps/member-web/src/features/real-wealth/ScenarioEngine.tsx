import React, { useState, useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const ScenarioEngine: React.FC = () => {
  const [scenario, setScenario] = useState('expected');
  const baseAmount = 100000; // Mock base amount

  const options = [
    { value: 'conservative', label: 'Conservative (Low Growth, High Inflation)' },
    { value: 'expected', label: 'Expected (Historical Averages)' },
    { value: 'optimistic', label: 'Optimistic (High Growth, Low Inflation)' },
    { value: 'custom', label: 'Custom Assumptions' }
  ];

  const getAssumptions = (scen: string) => {
    switch (scen) {
      case 'conservative': return { inflation: 0.085, growth: 0.040 };
      case 'optimistic': return { inflation: 0.040, growth: 0.120 };
      default: return { inflation: 0.060, growth: 0.080 }; // expected
    }
  };

  const assumptions = getAssumptions(scenario);

  const chartData = useMemo(() => {
    const data = [];
    let currentNominal = baseAmount;
    let currentReal = baseAmount;
    
    for (let year = 0; year <= 10; year++) {
      data.push({
        year: `Year ${year}`,
        Nominal: Math.round(currentNominal),
        Real: Math.round(currentReal),
      });
      currentNominal *= (1 + assumptions.growth);
      currentReal = currentNominal / Math.pow((1 + assumptions.inflation), year + 1); // rough approximation for real wealth
    }
    return data;
  }, [scenario, assumptions]);

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
              {(assumptions.inflation * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Portfolio Base Growth:</span>
            <span className="font-medium">
              {(assumptions.growth * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="h-64 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="year" fontSize={12} tickMargin={10} />
              <YAxis fontSize={12} tickFormatter={(val) => `$${(val / 1000)}k`} />
              <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
              <Legend />
              <Line type="monotone" dataKey="Nominal" stroke="#8884d8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Real" stroke="#82ca9d" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};
