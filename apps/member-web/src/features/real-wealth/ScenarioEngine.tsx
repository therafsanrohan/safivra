import React, { useState, useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LineChart as ChartIcon, Zap, ShieldAlert, Target, Coins, Percent, CalendarDays } from 'lucide-react';

export const ScenarioEngine: React.FC = () => {
  const [scenario, setScenario] = useState('expected');
  
  // Fully functional dynamic inputs instead of hardcoded mock data
  const [baseAmount, setBaseAmount] = useState<number>(1000000);
  const [inflation, setInflation] = useState<number>(6.0);
  const [growth, setGrowth] = useState<number>(8.0);
  const [timeHorizon, setTimeHorizon] = useState<number>(10);

  const applyPreset = (scen: string) => {
    setScenario(scen);
    if (scen === 'conservative') {
      setInflation(8.5);
      setGrowth(4.0);
    } else if (scen === 'optimistic') {
      setInflation(4.0);
      setGrowth(12.0);
    } else {
      setInflation(6.0);
      setGrowth(8.0);
    }
  };

  const chartColor = useMemo(() => {
    if (growth < inflation) return '#ef4444'; // Red if losing money
    if (growth > inflation + 3) return '#10b981'; // Green if strong growth
    return '#8b5cf6'; // Purple for moderate
  }, [growth, inflation]);

  const chartData = useMemo(() => {
    const data = [];
    let currentNominal = baseAmount;
    let currentReal = baseAmount;
    
    // Use actual input values as decimals
    const infRate = inflation / 100;
    const growRate = growth / 100;
    const years = Math.min(Math.max(1, timeHorizon), 50); // cap to 50 years max for safety

    for (let year = 0; year <= years; year++) {
      data.push({
        year: `Year ${year}`,
        Nominal: Math.round(currentNominal),
        Real: Math.round(currentReal),
        Gap: Math.round(currentNominal - currentReal)
      });
      currentNominal *= (1 + growRate);
      currentReal = currentNominal / Math.pow((1 + infRate), year + 1);
    }
    return data;
  }, [baseAmount, inflation, growth, timeHorizon]);

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
      
      <div className="flex flex-col flex-1 p-4">
        
        {/* Dynamic User Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1">
              <Coins className="w-3 h-3" /> Initial Investment (৳)
            </label>
            <input 
              type="number" 
              min="0"
              value={baseAmount} 
              onChange={e => setBaseAmount(Number(e.target.value))}
              className="w-full p-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] font-bold focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> Time Horizon (Years)
            </label>
            <input 
              type="number" 
              min="1"
              max="50"
              value={timeHorizon} 
              onChange={e => setTimeHorizon(Number(e.target.value))}
              className="w-full p-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] font-bold focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1">
              <Percent className="w-3 h-3" /> Inflation Rate (%)
            </label>
            <input 
              type="number" 
              min="0"
              max="100"
              step="0.1"
              value={inflation} 
              onChange={e => { setInflation(Number(e.target.value)); setScenario('custom'); }}
              className="w-full p-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] font-bold focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1">
              <Percent className="w-3 h-3" /> Return / Growth Rate (%)
            </label>
            <input 
              type="number" 
              min="-100"
              max="100"
              step="0.1"
              value={growth} 
              onChange={e => { setGrowth(Number(e.target.value)); setScenario('custom'); }}
              className="w-full p-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] font-bold focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>
        </div>

        {/* Scenario Presets */}
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide font-bold mb-2">Or Use Preset Environment Assumptions:</p>
        <div className="grid grid-cols-3 gap-2 mb-6 bg-[var(--color-bg-subtle)] p-1.5 rounded-lg border border-[var(--color-border)]/50">
          <button
            onClick={() => applyPreset('conservative')}
            className={`flex flex-col items-center justify-center p-2 rounded-md transition-all text-xs sm:text-sm font-medium ${
              scenario === 'conservative' ? 'bg-[var(--color-bg-surface)] shadow-sm text-red-500' : 'text-[var(--color-text-secondary)] hover:text-red-400'
            }`}
          >
            <ShieldAlert className="w-4 h-4 mb-1" />
            Conservative
          </button>
          <button
            onClick={() => applyPreset('expected')}
            className={`flex flex-col items-center justify-center p-2 rounded-md transition-all text-xs sm:text-sm font-medium ${
              scenario === 'expected' ? 'bg-[var(--color-bg-surface)] shadow-sm text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'
            }`}
          >
            <Target className="w-4 h-4 mb-1" />
            Expected
          </button>
          <button
            onClick={() => applyPreset('optimistic')}
            className={`flex flex-col items-center justify-center p-2 rounded-md transition-all text-xs sm:text-sm font-medium ${
              scenario === 'optimistic' ? 'bg-[var(--color-bg-surface)] shadow-sm text-emerald-500' : 'text-[var(--color-text-secondary)] hover:text-emerald-400'
            }`}
          >
            <Zap className="w-4 h-4 mb-1" />
            Optimistic
          </button>
        </div>

        {/* Chart Area */}
        <div className="flex-1 min-h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
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
              <Area type="monotone" dataKey="Nominal" stroke={chartColor} strokeWidth={3} fillOpacity={1} fill="url(#colorNominal)" />
              <Area type="monotone" dataKey="Real" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};
