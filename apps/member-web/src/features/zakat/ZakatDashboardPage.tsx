import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Skeleton, ErrorState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Calculator, History, AlertCircle, TrendingUp, HandHeart } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/currency/formatter';
import { useLanguage } from '@/context/LanguageContext';
import type { Database } from '@/types/database';

type RateSnapshot = Database['public']['Tables']['zakat_rate_snapshots']['Row'];
type RuleSet = Database['public']['Tables']['zakat_rule_sets']['Row'];

export function ZakatDashboardPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRate, setActiveRate] = useState<RateSnapshot | null>(null);
  const [activeRules, setActiveRules] = useState<RuleSet | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchZakatData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: rateData, error: rateError } = await supabase
        .from('zakat_rate_snapshots')
        .select('*')
        .order('fetch_timestamp', { ascending: false })
        .limit(1)
        .single();

      if (rateError && rateError.code !== 'PGRST116') throw rateError;
      setActiveRate(rateData as unknown as RateSnapshot | null);

      const { data: rulesData, error: rulesError } = await supabase
        .from('zakat_rule_sets')
        .select('*')
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (rulesError && rulesError.code !== 'PGRST116') throw rulesError;
      setActiveRules(rulesData as unknown as RuleSet | null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZakatData();
  }, []);

  const handleRefreshRate = async () => {
    try {
      setRefreshing(true);
      await fetchZakatData();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-8 bg-[var(--color-bg-page)] min-h-svh">
        <h1 className="text-2xl font-bold mb-6 text-[var(--color-text-primary)]">{t.zakat.pageTitle}</h1>
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-8 bg-[var(--color-bg-page)] min-h-svh">
        <h1 className="text-2xl font-bold mb-6 text-[var(--color-text-primary)]">{t.zakat.pageTitle}</h1>
        <ErrorState message={error} onRetry={fetchZakatData} />
      </div>
    );
  }

  const nisabGoldWeight = 85;
  const nisabSilverWeight = 595;

  const goldNisabValue = activeRate ? activeRate.gold_rate_per_gram * nisabGoldWeight : 0;
  const silverNisabValue = activeRate ? activeRate.silver_rate_per_gram * nisabSilverWeight : 0;
  const currentNisabValue =
    activeRules?.nisab_standard === 'silver' ? silverNisabValue : goldNisabValue;

  return (
    <div className="space-y-6 pb-12 p-4 md:p-8 bg-[var(--color-bg-page)] min-h-svh max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400">
          <HandHeart className="w-6 h-6" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          {t.zakat.pageTitle}
        </h1>
      </div>

      {/* Welcome & Action Banner */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-800 dark:to-emerald-950 rounded-[2rem] p-6 md:p-10 text-white shadow-xl shadow-emerald-600/20 dark:shadow-none relative overflow-hidden border border-emerald-400/30 dark:border-emerald-500/20">
        {/* Background effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-300 dark:bg-emerald-400 opacity-20 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-400 dark:bg-emerald-500 opacity-20 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="space-y-3 text-center md:text-left w-full md:w-auto flex-1">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-sm">
              {t.zakat.calculatorTitle}
            </h2>
            <p className="text-emerald-50/90 text-sm md:text-base max-w-xl leading-relaxed">
              {t.zakat.dashboardSubtitle}
            </p>
          </div>
          <div className="shrink-0 w-full md:w-auto flex flex-col gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard/zakat/calculator')}
              className="w-full md:w-auto bg-white text-emerald-900 hover:text-emerald-950 hover:bg-emerald-50 rounded-2xl h-14 px-8 font-bold shadow-lg shadow-black/10 transition-all active:scale-[0.98] border-0"
            >
              <Calculator className="w-5 h-5 mr-2" />
              {t.zakat.startCalculation}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/zakat/history')}
              className="w-full md:w-auto border-white/30 bg-white/10 text-white hover:bg-white/20 rounded-2xl h-12 transition-all"
            >
              <History className="w-4 h-4 mr-2" />
              {t.zakat.viewHistory}
            </Button>
          </div>
        </div>
      </div>

      {/* Live Rates & Nisab Section */}
      <section className="space-y-5 pt-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {t.zakat.currentNisab}
          </h3>
          <button
            onClick={handleRefreshRate}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-black/40 border border-[var(--color-border)] rounded-full text-sm font-medium text-emerald-600 dark:text-emerald-400 transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t.zakat.refresh}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {/* Nisab Threshold Card */}
          <div className="p-6 md:p-8 border border-emerald-100/80 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-black/20 dark:border-emerald-900/50 rounded-[2rem] shadow-sm relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70">
                  {t.zakat.activeStandard}
                </span>
                <div className="inline-flex items-center mt-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 rounded-full">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 capitalize">
                    {activeRules?.nisab_standard || '—'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              {t.zakat.nisabThreshold}
            </p>
            <h4 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
              {activeRate ? formatCurrency(currentNisabValue) : '---'}
            </h4>
            <p className="text-sm font-medium text-[var(--color-text-tertiary)] mt-4 flex items-center bg-white/50 dark:bg-black/20 w-fit px-3 py-1.5 rounded-lg border border-[var(--color-border)]">
              <AlertCircle className="w-4 h-4 mr-1.5 text-amber-500" />
              {activeRules?.nisab_standard === 'gold'
                ? `Based on ${nisabGoldWeight}g Gold`
                : `Based on ${nisabSilverWeight}g Silver`}
            </p>
          </div>

          {/* Metal Rates Card */}
          <div className="p-6 md:p-8 rounded-[2rem] bg-white dark:bg-[var(--color-bg-subtle)] border border-[var(--color-border)] shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
                {t.zakat.marketRates}
              </h3>

              <div className="flex justify-between items-center p-4 bg-yellow-50/50 dark:bg-yellow-950/10 border border-yellow-100 dark:border-yellow-900/30 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-[var(--color-text-secondary)] font-medium">{t.zakat.goldPerGram}</span>
                </div>
                <span className="font-bold text-[var(--color-text-primary)] text-lg">
                  {activeRate ? formatCurrency(activeRate.gold_rate_per_gram) : '---'}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-[var(--color-text-secondary)] font-medium">{t.zakat.silverPerGram}</span>
                </div>
                <span className="font-bold text-[var(--color-text-primary)] text-lg">
                  {activeRate ? formatCurrency(activeRate.silver_rate_per_gram) : '---'}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[var(--color-text-tertiary)]">
              <span className="flex items-center bg-[var(--color-bg-subtle)] px-2.5 py-1 rounded-md">
                {t.zakat.source}:{' '}
                <span className="ml-1 text-[var(--color-text-secondary)]">
                  {activeRate?.provider_name || '—'}
                </span>
              </span>
              <span className="flex items-center bg-[var(--color-bg-subtle)] px-2.5 py-1 rounded-md">
                {t.zakat.updated}:{' '}
                {activeRate
                  ? new Date(activeRate.fetch_timestamp).toLocaleString([], {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Info Disclaimer */}
      <div className="bg-amber-50/80 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/50 flex gap-3 text-sm text-amber-800 dark:text-amber-200/80 mt-4">
        <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-500" />
        <p>
          <span className="font-semibold block mb-1 text-amber-900 dark:text-amber-100">
            {t.zakat.disclaimer}
          </span>
          {t.zakat.disclaimerText}
        </p>
      </div>
    </div>
  );
}
