import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ExchangeRate {
  currency: string;
  rate: number;
  change: number; // percentage change today
}

const MOCK_RATES: ExchangeRate[] = [
  { currency: 'USD', rate: 119.50, change: 0.15 },
  { currency: 'GBP', rate: 153.20, change: -0.08 },
  { currency: 'EUR', rate: 130.45, change: 0.22 },
  { currency: 'SGD', rate: 89.10, change: -0.05 },
];

export const CurrencyExchangeWidget: React.FC = () => {
  const { locale } = useLanguage();
  const isBn = locale === 'bn';
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchRates = () => {
    setLoading(true);
    // Simulate API fetch delay
    setTimeout(() => {
      // Small random variations for realism
      const variedRates = MOCK_RATES.map((r) => ({
        ...r,
        rate: r.rate + (Math.random() * 0.1 - 0.05),
      }));
      setRates(variedRates);
      setLastUpdated(new Date());
      setLoading(false);
    }, 800);
  };

  useEffect(() => {
    fetchRates();
  }, []);

  return (
    <div className="p-5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <ArrowRightLeft size={16} className="text-indigo-500" /> 
          {isBn ? 'লাইভ কারেন্সি রেট' : 'Live Currency Exchange'}
        </h4>
        <button 
          onClick={fetchRates} 
          disabled={loading}
          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
          title={isBn ? 'রিফ্রেশ করুন' : 'Refresh rates'}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-3">
        {loading && rates.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between items-center animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="w-12 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
                <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          rates.map((rate) => (
            <div key={rate.currency} className="flex justify-between items-center text-sm py-1 border-b border-[var(--color-border)] last:border-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--color-text-primary)]">{rate.currency}</span>
                <span className="text-[var(--color-text-muted)] text-xs">/ BDT</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium tabular-nums" data-financial>৳ {rate.rate.toFixed(2)}</span>
                <span className={`flex items-center text-[10px] font-medium w-10 justify-end ${rate.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {rate.change >= 0 ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
                  {Math.abs(rate.change).toFixed(2)}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-3 text-[10px] text-[var(--color-text-muted)] text-right flex justify-between items-center">
        <span>* Market rates (indicative)</span>
        <span>
          {isBn ? 'আপডেট: ' : 'Updated: '} 
          {lastUpdated.toLocaleTimeString(locale === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
