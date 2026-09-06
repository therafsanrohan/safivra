import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Skeleton, ErrorState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Calculator, History, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/currency/formatter';
import type { Database } from '@/types/database';

type RateSnapshot = Database['public']['Tables']['zakat_rate_snapshots']['Row'];
type RuleSet = Database['public']['Tables']['zakat_rule_sets']['Row'];

export function ZakatDashboardPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRate, setActiveRate] = useState<RateSnapshot | null>(null);
  const [activeRules, setActiveRules] = useState<RuleSet | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchZakatData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch latest rate
      const { data: rateData, error: rateError } = await supabase
        .from('zakat_rate_snapshots')
        .select('*')
        .order('fetch_timestamp', { ascending: false })
        .limit(1)
        .single();
        
      if (rateError && rateError.code !== 'PGRST116') throw rateError;
      setActiveRate(rateData as unknown as RateSnapshot | null);

      // Fetch active rules
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
      // In a real scenario, this might invoke the edge function if the user is an admin,
      // or simply re-fetch from the DB.
      await fetchZakatData();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold mb-6 text-[var(--color-text-primary)]">Zakat Intelligence</h1>
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-6 text-[var(--color-text-primary)]">Zakat Intelligence</h1>
        <ErrorState message={error} onRetry={fetchZakatData} />
      </div>
    );
  }

  const nisabGoldWeight = 85; // 85 grams of gold
  const nisabSilverWeight = 595; // 595 grams of silver
  
  const goldNisabValue = activeRate ? (activeRate.gold_rate_per_gram * nisabGoldWeight) : 0;
  const silverNisabValue = activeRate ? (activeRate.silver_rate_per_gram * nisabSilverWeight) : 0;
  
  const currentNisabValue = activeRules?.nisab_standard === 'gold' ? goldNisabValue : silverNisabValue;

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-2xl font-bold mb-2 text-[var(--color-text-primary)]">Zakat Intelligence</h1>
        
        {/* Welcome & Action Banner */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Calculate Your Zakat</h2>
              <p className="text-emerald-100/90 text-sm md:text-base max-w-lg leading-relaxed">
                Determine your eligibility and estimate your Zakat easily. Our guided flow uses live Nisab rates and your confirmed Safivra balances.
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto flex flex-col gap-3">
              <Button size="lg" className="w-full md:w-auto bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl font-semibold shadow-sm">
                <Calculator className="w-5 h-5 mr-2" />
                Start Calculation
              </Button>
              <Button variant="outline" size="sm" className="w-full md:w-auto border-emerald-700/50 text-emerald-50 hover:bg-emerald-800/50 rounded-xl">
                <History className="w-4 h-4 mr-2" />
                View History
              </Button>
            </div>
          </div>
        </div>

        {/* Live Rates & Nisab Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Current Nisab & Rates</h3>
            <button 
              onClick={handleRefreshRate}
              disabled={refreshing}
              className="flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nisab Threshold Card */}
            <Card className="p-6 border border-emerald-100/50 bg-emerald-50/30 dark:bg-emerald-950/20 dark:border-emerald-900/50 rounded-2xl">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <span className="font-bold text-lg">N</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80">Active Standard</span>
                  <p className="text-sm font-medium text-[var(--color-text-secondary)] capitalize">{activeRules?.nisab_standard || 'Unknown'}</p>
                </div>
              </div>
              
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">Current Nisab Threshold</p>
              <h4 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {activeRate ? formatCurrency(currentNisabValue) : '---'}
              </h4>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-3 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                Based on {activeRules?.nisab_standard === 'gold' ? `${nisabGoldWeight}g Gold` : `${nisabSilverWeight}g Silver`}
              </p>
            </Card>

            {/* Metal Rates Card */}
            <Card className="p-6 rounded-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
                  <span className="text-[var(--color-text-secondary)] font-medium">Gold Rate (per gram)</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {activeRate ? formatCurrency(activeRate.gold_rate_per_gram) : '---'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3">
                  <span className="text-[var(--color-text-secondary)] font-medium">Silver Rate (per gram)</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {activeRate ? formatCurrency(activeRate.silver_rate_per_gram) : '---'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>Source: <span className="font-medium text-[var(--color-text-secondary)]">{activeRate?.provider_name || '---'}</span></span>
                <span>
                  Updated: {activeRate ? new Date(activeRate.fetch_timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '---'}
                </span>
              </div>
            </Card>
          </div>
        </section>

        {/* Info Disclaimer */}
        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">
            <strong>Disclaimer:</strong> The Zakat calculator provides an estimate based on the confirmed details you enter and the selected methodological rules (Version {activeRules?.version || '1.0'}). For personalized religious guidance, please consult a qualified Islamic scholar.
          </p>
        </div>

      </div>
  );
}
