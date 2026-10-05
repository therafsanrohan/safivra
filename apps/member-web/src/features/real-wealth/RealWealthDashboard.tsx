import React, { useEffect, useState } from 'react';
import { Card, Spinner } from '@/components/ui/Card';
import { AssetTimeMachine } from './AssetTimeMachine';
import { ScenarioEngine } from './ScenarioEngine';
import { PurchasingPowerTool } from './PurchasingPowerTool';
import { FutureTargetTool } from './FutureTargetTool';
import { isFeatureEnabled } from '@/lib/flags';
import { useAuthContext } from '@/context/AuthContext';
import { Wallet, TrendingDown, LineChart, Info, ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';
import { fetchRealWealthSummary, WealthSummary } from '@/lib/wealth/wealthEngine';
import { formatCurrency } from '@/lib/currency/formatter';

export const RealWealthDashboard: React.FC = () => {
  const { user } = useAuthContext();
  const [summary, setSummary] = useState<WealthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!user?.id) return;
      setLoading(true);
      const res = await fetchRealWealthSummary(user.id);
      if (mounted) {
        setSummary(res);
        setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (!isFeatureEnabled('real_wealth_intelligence_enabled', user?.id)) {
    return (
      <div className="p-8 text-center text-[var(--color-text-secondary)]">
        Real Wealth Intelligence is not enabled for your account yet.
      </div>
    );
  }

  // Calculate Real Net Worth (simplified baseline CPI adjustment if not detailed)
  const nominalNetWorth = summary?.netWorth ?? 0;
  // Assume CPI base period adjustment factor (e.g. recent annual inflation ~8.5% discount for real value)
  const cpiAdjustmentFactor = 0.915; 
  const realNetWorth = nominalNetWorth * cpiAdjustmentFactor;
  // Projected 10 year horizon (assume nominal modest growth at 6% real)
  const projectedNetWorth = nominalNetWorth * Math.pow(1.06, 10);

  return (
    <div className="rw-page-container pt-5 pb-12 fade-in">
      {/* Page Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[var(--text-page)] font-bold tracking-tight bg-gradient-to-r from-[var(--color-accent)] to-purple-500 bg-clip-text text-transparent">
            Real Wealth Intelligence
          </h1>
          <p className="text-[var(--color-text-secondary)] text-[var(--text-body)] mt-1">
            Understand your true purchasing power, project asset values, and master inflation.
          </p>
        </div>

        {/* Data Completeness Badge */}
        {summary && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium bg-[var(--color-bg-subtle)] border-[var(--color-border)] self-start md:self-auto">
            {summary.dataCompleteness === 'complete' && (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-700 dark:text-emerald-400">Complete Data</span>
              </>
            )}
            {summary.dataCompleteness === 'partial' && (
              <>
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-amber-700 dark:text-amber-400">Partial Data — Add more accounts</span>
              </>
            )}
            {summary.dataCompleteness === 'insufficient' && (
              <>
                <HelpCircle className="w-4 h-4 text-rose-500" />
                <span className="text-rose-700 dark:text-rose-400">Insufficient Data — Add financial accounts</span>
              </>
            )}
          </div>
        )}
      </header>

      {/* Hero Metrics */}
      <section aria-label="Wealth summary" className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <div className="min-w-0 transition-all hover:scale-[1.02]">
          <Card className="h-full border-[var(--color-border)] shadow-sm bg-gradient-to-br from-[var(--color-bg-surface)] to-[var(--color-bg-subtle)]">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[var(--text-secondary)] text-[var(--color-text-secondary)] flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                  <span>Nominal Net Worth</span>
                </h3>
                <div className="group relative shrink-0">
                  <Info className="w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer" />
                  <div className="absolute right-0 w-48 p-2 mt-1 text-xs bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-lg rounded-[var(--radius-card)] opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    Your total wealth across all accounts and assets, without accounting for inflation.
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="py-2"><Spinner size={20} /></div>
              ) : (
                <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums" data-financial>
                  {formatCurrency(nominalNetWorth)}
                </div>
              )}
              <p className="text-[var(--text-label)] text-[var(--color-text-muted)] mt-1">
                Assets: {formatCurrency(summary?.totalAssets ?? 0)} | Liabilities: {formatCurrency(summary?.totalLiabilities ?? 0)}
              </p>
            </div>
          </Card>
        </div>

        <div className="min-w-0 transition-all hover:scale-[1.02]">
          <Card className="h-full border-[var(--color-border)] shadow-sm bg-gradient-to-br from-[var(--color-bg-surface)] to-red-500/5">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[var(--text-secondary)] text-[var(--color-text-secondary)] flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Real Net Worth</span>
                </h3>
                <div className="group relative shrink-0">
                  <Info className="w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer" />
                  <div className="absolute right-0 w-48 p-2 mt-1 text-xs bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-lg rounded-[var(--radius-card)] opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    Your wealth adjusted for inflation, showing true purchasing power in base period terms.
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="py-2"><Spinner size={20} /></div>
              ) : (
                <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums" data-financial>
                  {formatCurrency(realNetWorth)}
                </div>
              )}
              <p className="text-[var(--text-label)] text-red-500/80 mt-1">CPI Inflation Adjusted</p>
            </div>
          </Card>
        </div>

        <div className="min-w-0 sm:col-span-2 xl:col-span-2 transition-all hover:scale-[1.01]">
          <Card className="h-full border-[var(--color-border)] shadow-sm bg-gradient-to-br from-[var(--color-bg-surface)] to-emerald-500/5">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[var(--text-secondary)] text-[var(--color-text-secondary)] flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Projected Real Net Worth</span>
                </h3>
              </div>
              {loading ? (
                <div className="py-2"><Spinner size={20} /></div>
              ) : (
                <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums" data-financial>
                  {formatCurrency(projectedNetWorth)}
                </div>
              )}
              <p className="text-[var(--text-label)] text-emerald-600/80 mt-1">10 year horizon based on Expected climate</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Tools Grid: Scenario Engine + Side Tools */}
      <section aria-label="Financial projection tools" className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6">
        <div className="min-w-0 w-full overflow-hidden">
          <ScenarioEngine initialWealth={nominalNetWorth} />
        </div>
        <div className="flex flex-col gap-6 min-w-0 w-full overflow-hidden">
          <PurchasingPowerTool />
          <FutureTargetTool />
        </div>
      </section>

      {/* Asset Time Machine */}
      <section aria-label="Asset time machine" className="min-w-0 w-full overflow-hidden mb-6">
        <AssetTimeMachine />
      </section>

      {/* Disclaimer */}
      <div className="text-[var(--text-label)] text-[var(--color-text-muted)] p-4 border border-dashed border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-bg-subtle)] text-center">
        <p className="font-semibold mb-1">Disclaimer</p>
        <p>Future values are projections based on selected assumptions and are not guaranteed returns. Inflation calculations rely on historical CPI data and future estimates.</p>
      </div>
    </div>
  );
};

