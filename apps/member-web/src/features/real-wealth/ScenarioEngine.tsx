import React, { useState, useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LineChart as ChartIcon, Zap, ShieldAlert, Target } from 'lucide-react';

export const ScenarioEngine: React.FC = () => {
  const [scenario, setScenario] = useState('expected');
  const baseAmount = 1000000; // Mock base amount

  const getAssumptions = (scen: string) => {
    switch (scen) {
      case 'conservative': return { inflation: 0.085, growth: 0.040, color: '#ef4444' };
      case 'optimistic': return { inflation: 0.040, growth: 0.120, color: '#10b981' };
      default: return { inflation: 0.060, growth: 0.080, color: '#8b5cf6' }; // expected
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
        Gap: Math.round(currentNominal - currentReal)
      });
      currentNominal *= (1 + assumptions.growth);
      currentReal = currentNominal / Math.pow((1 + assumptions.inflation), year + 1);
    }
    return data;
  }, [scenario, assumptions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const nom = payload.find((p: any) => p.dataKey === 'Nominal');
      const real = payload.find((p: any) => p.dataKey === 'Real');
      const gap = nom.value - real.value;
      
      return (
        <div className="bg-[var(--color-bg-surface)] p-4 border border-[var(--color-border)] shadow-xl rounded-lg">
          <p className="font-bold mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm flex justify-between gap-4">
              <span className="text-[var(--color-text-secondary)]">Nominal Value:</span> 
              <span className="font-bold" style={{ color: nom.color }}>৳{nom.value.toLocaleString()}</span>
            </p>
            <p className="text-sm flex justify-between gap-4">
              <span className="text-[var(--color-text-secondary)]">Real Value:</span> 
              <span className="font-bold" style={{ color: real.color }}>৳{real.value.toLocaleString()}</span>
            </p>
            <div className="my-2 border-t border-[var(--color-border)]"></div>
            <p className="text-sm flex justify-between gap-4">
              <span className="text-[var(--color-negative)] font-medium">Inflation Gap:</span> 
              <span className="font-bold text-[var(--color-negative)]">৳{gap.toLocaleString()}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader 
        title={<div className="flex items-center gap-2"><ChartIcon className="w-5 h-5 text-[var(--color-accent)]" /> Projection Scenarios</div>} 
        subtitle="Visualize the gap between nominal growth and true purchasing power." 
      />
      
      <div className="flex flex-col flex-1 p-2">
        {/* Scenario Pills */}
        <div className="grid grid-cols-3 gap-2 mb-6 bg-[var(--color-bg-subtle)] p-1.5 rounded-lg border border-[var(--color-border)]/50">
          <button
            onClick={() => setScenario('conservative')}
            className={`flex flex-col items-center justify-center p-2 rounded-md transition-all text-xs sm:text-sm font-medium ${
              scenario === 'conservative' ? 'bg-[var(--color-bg-surface)] shadow-sm text-red-500' : 'text-[var(--color-text-secondary)] hover:text-red-400'
            }`}
          >
            <ShieldAlert className="w-4 h-4 mb-1" />
            Conservative
          </button>
          <button
            onClick={() => setScenario('expected')}
            className={`flex flex-col items-center justify-center p-2 rounded-md transition-all text-xs sm:text-sm font-medium ${
              scenario === 'expected' ? 'bg-[var(--color-bg-surface)] shadow-sm text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'
            }`}
          >
            <Target className="w-4 h-4 mb-1" />
            Expected
          </button>
          <button
            onClick={() => setScenario('optimistic')}
            className={`flex flex-col items-center justify-center p-2 rounded-md transition-all text-xs sm:text-sm font-medium ${
              scenario === 'optimistic' ? 'bg-[var(--color-bg-surface)] shadow-sm text-emerald-500' : 'text-[var(--color-text-secondary)] hover:text-emerald-400'
            }`}
          >
            <Zap className="w-4 h-4 mb-1" />
            Optimistic
          </button>
        </div>

        <div className="flex justify-center gap-8 mb-6 text-sm bg-[var(--color-bg-subtle)] p-3 rounded-lg">
          <div className="flex flex-col items-center">
            <span className="text-[var(--color-text-muted)] text-xs uppercase tracking-wider font-semibold mb-1">Inflation</span>
            <span className="font-bold text-[var(--color-text-primary)]">{(assumptions.inflation * 100).toFixed(1)}%</span>
          </div>
          <div className="w-px bg-[var(--color-border)]"></div>
          <div className="flex flex-col items-center">
            <span className="text-[var(--color-text-muted)] text-xs uppercase tracking-wider font-semibold mb-1">Growth</span>
            <span className="font-bold text-[var(--color-text-primary)]">{(assumptions.growth * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={assumptions.color} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={assumptions.color} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.4} />
              <XAxis dataKey="year" fontSize={11} tickMargin={10} stroke="var(--color-text-muted)" tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickFormatter={(val) => `৳${(val / 1000)}k`} stroke="var(--color-text-muted)" tickLine={false} axisLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" dataKey="Nominal" stroke={assumptions.color} strokeWidth={3} fillOpacity={1} fill="url(#colorNominal)" />
              <Area type="monotone" dataKey="Real" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};
