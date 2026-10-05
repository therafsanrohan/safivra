import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, RefreshCw, TrendingUp, TrendingDown, WifiOff } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ExchangeRate {
  currency: string;
  rate: number;
  change: number;
}

// Fallback rates shown when API is unreachable (mobile offline / network error)
const FALLBACK_RATES: ExchangeRate[] = [
  { currency: 'USD', rate: 119.50, change: 0 },
  { currency: 'GBP', rate: 153.20, change: 0 },
  { currency: 'EUR', rate: 130.45, change: 0 },
  { currency: 'SGD', rate:  89.10, change: 0 },
];

const FLAG_CODE: Record<string, string> = {
  USD: 'us', GBP: 'gb', EUR: 'eu', SGD: 'sg',
};

export const CurrencyExchangeWidget: React.FC = () => {
  const { locale } = useLanguage();
  const isBn = locale === 'bn';
  const [rates, setRates]           = useState<ExchangeRate[]>(FALLBACK_RATES);
  const [loading, setLoading]       = useState(true);
  const [offline, setOffline]       = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchRates = async () => {
    setLoading(true);
    setOffline(false);
    try {
      // open.er-api.com — free, CORS-safe, no API key needed
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 8000);

      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: controller.signal,
      });
      clearTimeout(tid);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data?.rates?.BDT) {
        const bdt = data.rates.BDT;
        setRates([
          { currency: 'USD', rate: bdt,                          change: 0 },
          { currency: 'GBP', rate: bdt / (data.rates.GBP || 1), change: 0 },
          { currency: 'EUR', rate: bdt / (data.rates.EUR || 1), change: 0 },
          { currency: 'SGD', rate: bdt / (data.rates.SGD || 1), change: 0 },
        ]);
        setLastUpdated(new Date());
      } else {
        setRates(FALLBACK_RATES);
      }
    } catch {
      setOffline(true);
      setRates(FALLBACK_RATES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)] flex justify-between items-center">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <ArrowRightLeft size={14} />
          </div>
          {isBn ? 'লাইভ কারেন্সি রেট' : 'Live Exchange Rates'}
        </h4>
        <button
          onClick={fetchRates}
          disabled={loading}
          aria-label={isBn ? 'রিফ্রেশ' : 'Refresh rates'}
          className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-indigo-500 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-1">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center py-2.5 px-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[var(--color-bg-subtle)] rounded-full" />
                  <div className="w-12 h-4 bg-[var(--color-bg-subtle)] rounded" />
                </div>
                <div className="w-20 h-5 bg-[var(--color-bg-subtle)] rounded" />
              </div>
            ))}
          </div>
        ) : (
          rates.map((rate) => (
            <div
              key={rate.currency}
              className="group flex justify-between items-center py-2.5 px-3 rounded-lg hover:bg-[var(--color-bg-subtle)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-bg-subtle)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden shadow-sm">
                  <img
                    src={`https://flagcdn.com/w40/${FLAG_CODE[rate.currency]}.png`}
                    alt={rate.currency}
                    width={20}
                    height={14}
                    className="object-cover rounded-sm"
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      el.style.display = 'none';
                      el.parentElement!.textContent = rate.currency.slice(0, 2);
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[var(--color-text-primary)]">{rate.currency}</span>
                  <span className="text-[var(--color-text-muted)] text-[10px] font-medium uppercase tracking-wider">
                    1 {rate.currency} = BDT
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-bold tabular-nums text-[var(--color-text-primary)]">
                  ৳ {rate.rate.toFixed(2)}
                </span>
                <span
                  className={`flex items-center gap-0.5 text-[10px] font-medium ${
                    rate.change > 0
                      ? 'text-emerald-500'
                      : rate.change < 0
                      ? 'text-rose-500'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  {rate.change > 0 && <TrendingUp size={10} />}
                  {rate.change < 0 && <TrendingDown size={10} />}
                  {rate.change !== 0 ? `${Math.abs(rate.change).toFixed(2)}%` : 'Stable'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-[var(--color-bg-page)] text-[10px] text-[var(--color-text-muted)] font-medium flex justify-between items-center border-t border-[var(--color-border)]">
        <span className="flex items-center gap-1.5">
          {offline ? (
            <>
              <WifiOff size={10} className="text-amber-500" />
              <span className="text-amber-500">{isBn ? 'অফলাইন রেট' : 'Offline rate'}</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Live API
            </>
          )}
        </span>
        <span>
          {isBn ? 'আপডেট: ' : 'Updated: '}
          {lastUpdated.toLocaleTimeString(
            locale === 'bn' ? 'bn-BD' : 'en-US',
            { hour: '2-digit', minute: '2-digit' }
          )}
        </span>
      </div>
    </div>
  );
};
