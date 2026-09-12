import React, { useState, useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { History, Sparkles, Percent } from 'lucide-react';

export const AssetTimeMachine: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [amount, setAmount] = useState<number>(1000000);
  const [inflation, setInflation] = useState<number>(6.0);

  // Generate dynamic years around current year instead of hardcoded
  const years = useMemo(() => {
    return [
      currentYear - 10, 
      currentYear - 5, 
      currentYear - 2, 
      currentYear, 
      currentYear + 2, 
      currentYear + 5, 
      currentYear + 10,
      currentYear + 20
    ];
  }, [currentYear]);

  const calculateRealValue = (year: number) => {
    const diff = year - currentYear;
    const rate = inflation / 100;
    
    if (diff === 0) return amount;
    if (diff < 0) {
      // Historical: How much less money was needed to buy the same thing
      return Math.round(amount / Math.pow(1 + rate, Math.abs(diff)));
    }
    // Future: How much more money will be needed to buy the same thing
    return Math.round(amount * Math.pow(1 + rate, diff));
  };

  const isHistorical = selectedYear < currentYear;
  const displayedValue = calculateRealValue(selectedYear);

  return (
    <Card className="border-[var(--color-border)] shadow-md overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-[var(--color-accent)] to-blue-500"></div>
      
      <CardHeader 
        title={<div className="flex items-center gap-2"><History className="w-5 h-5 text-[var(--color-accent)]" /> Asset Time Machine</div>} 
        subtitle="Travel through time to experience the true impact of inflation on your wealth."
      />
      
      <div className="p-6 pt-0 space-y-6">
        
        {/* Dynamic Inputs */}
        <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Target Amount (৳)</label>
            <input 
              type="number" 
              min="0"
              value={amount} 
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full p-2 text-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] font-bold text-lg focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Inflation Rate (%)</label>
            <input 
              type="number" 
              min="0"
              max="100"
              step="0.1"
              value={inflation} 
              onChange={e => setInflation(Number(e.target.value))}
              className="w-full p-2 text-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] font-bold text-lg focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>
        </div>

        {/* Storytelling Canvas */}
        <div className="p-8 bg-gradient-to-b from-[var(--color-bg-surface)] to-[var(--color-bg-subtle)] rounded-xl border border-[var(--color-border)] text-center relative overflow-hidden group transition-all">
          <Sparkles className="absolute top-4 left-4 w-6 h-6 text-[var(--color-accent)] opacity-20 group-hover:opacity-100 transition-opacity" />
          <Sparkles className="absolute bottom-4 right-4 w-6 h-6 text-purple-500 opacity-20 group-hover:opacity-100 transition-opacity" />
          
          <h3 className="text-4xl md:text-6xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-4 transition-all">
            ৳{displayedValue.toLocaleString()}
          </h3>
          
          <p className="text-lg md:text-xl text-[var(--color-text-secondary)] font-medium max-w-2xl mx-auto leading-relaxed">
            {isHistorical ? (
              <span>If you went back to <strong className="text-[var(--color-text-primary)]">{selectedYear}</strong>, you would only need <strong>৳{displayedValue.toLocaleString()}</strong> to buy what costs <strong>৳{amount.toLocaleString()}</strong> today.</span>
            ) : selectedYear === new Date().getFullYear() ? (
              <span>Your baseline wealth today in <strong className="text-[var(--color-text-primary)]">{new Date().getFullYear()}</strong> is exactly <strong>৳{amount.toLocaleString()}</strong>.</span>
            ) : (
              <span>Fast forward to <strong className="text-[var(--color-text-primary)]">{selectedYear}</strong>, you will need <strong>৳{displayedValue.toLocaleString()}</strong> just to afford what <strong>৳{amount.toLocaleString()}</strong> buys you today.</span>
            )}
          </p>
        </div>

        {/* Timeline UX */}
        <div className="relative pt-4 pb-2 px-4">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[var(--color-border)] -translate-y-1/2 z-0 hidden md:block"></div>
          
          <div className="flex gap-3 md:gap-0 overflow-x-auto md:justify-between relative z-10 no-scrollbar">
            {years.map(y => {
              const isSelected = selectedYear === y;
              const isToday = y === new Date().getFullYear();
              
              return (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={[
                    'flex flex-col items-center gap-2 min-w-[80px] transition-all',
                    isSelected ? 'scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'
                  ].join(' ')}
                >
                  <div className={[
                    'w-4 h-4 rounded-full border-2 transition-colors',
                    isSelected 
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)] ring-4 ring-[var(--color-accent)]/20' 
                      : 'bg-[var(--color-bg-surface)] border-[var(--color-border)]'
                  ].join(' ')}></div>
                  <span className={[
                    'text-sm font-semibold',
                    isSelected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]',
                    isToday && !isSelected ? 'text-[var(--color-accent)]' : ''
                  ].join(' ')}>
                    {isToday ? 'Today' : y}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};
