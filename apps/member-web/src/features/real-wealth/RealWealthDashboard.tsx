import React, { useEffect, useState } from 'react';
import { Card, Spinner } from '@/components/ui/Card';
import { AssetTimeMachine } from './AssetTimeMachine';
import { ScenarioEngine } from './ScenarioEngine';
import { PurchasingPowerTool } from './PurchasingPowerTool';
import { FutureTargetTool } from './FutureTargetTool';
import { isFeatureEnabled } from '@/lib/flags';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Wallet, TrendingDown, LineChart, Info, ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/currency/formatter';

interface WealthData {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidAssets: number;
  investmentAssets: number;
  dataCompleteness: 'complete' | 'partial' | 'insufficient';
}

async function fetchWealthData(userId: string): Promise<WealthData> {
  const ZERO: WealthData = {
    totalAssets: 0, totalLiabilities: 0, netWorth: 0,
    liquidAssets: 0, investmentAssets: 0, dataCompleteness: 'insufficient',
  };

  // 1. Try v_wealth_summary (available after migration runs)
  try {
    const { data, error } = await (supabase.from('v_wealth_summary') as any)
      .select('*').eq('user_id', userId).maybeSingle();
    if (!error && data) {
      const assets      = Number(data.total_assets)      || 0;
      const liabilities = Number(data.total_liabilities) || 0;
      return {
        totalAssets:      assets,
        totalLiabilities: liabilities,
        netWorth:         Number(data.net_worth)         || 0,
        liquidAssets:     Number(data.liquid_assets)     || 0,
        investmentAssets: Number(data.investment_assets) || 0,
        dataCompleteness: assets > 0 ? 'complete' : 'insufficient',
      };
    }
  } catch { /* fallthrough */ }

  // 2. Fallback: compute directly from v_account_balances
  try {
    const { data: rows } = await (supabase.from('v_account_balances') as any)
      .select('account_class, account_type, balance, include_in_net_worth, is_active, is_archived')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('is_archived', false);

    if (!rows || rows.length === 0) return ZERO;

    const LIQUID     = ['cash', 'bank', 'savings', 'mobile_financial_service'];
    const INVESTMENT = ['investment'];
    let totalAssets = 0, totalLiabilities = 0, liquidAssets = 0, investmentAssets = 0;

    for (const row of rows) {
      if (!row.include_in_net_worth) continue;
      const bal = Math.abs(Number(row.balance) || 0);
      if (row.account_class === 'asset') {
        totalAssets += bal;
        if (LIQUID.includes(row.account_type))     liquidAssets     += bal;
        if (INVESTMENT.includes(row.account_type)) investmentAssets += bal;
      } else if (row.account_class === 'liability') {
        totalLiabilities += bal;
      }
    }
    return {
      totalAssets, totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      liquidAssets, investmentAssets,
      dataCompleteness: totalAssets > 0 ? 'partial' : 'insufficient',
    };
  } catch {
    return ZERO;
  }
}

export const RealWealthDashboard: React.FC = () => {
  const { user } = useAuthContext();
  const { translate: t } = useLanguage();
  const [wealth, setWealth]   = useState<WealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    fetchWealthData(user.id).then((data) => {
      if (mounted) { setWealth(data); setLoading(false); }
    });
    return () => { mounted = false; };
  }, [user?.id]);

  if (!isFeatureEnabled('real_wealth_intelligence_enabled', user?.id)) {
    return (
      <div className="p-8 text-center text-[var(--color-text-secondary)]">
        Real Wealth Intelligence is not enabled for your account yet.
      </div>
    );
  }

  const nominalNetWorth   = wealth?.netWorth          ?? 0;
  const totalAssets       = wealth?.totalAssets        ?? 0;
  const totalLiabilities  = wealth?.totalLiabilities   ?? 0;
  const realNetWorth      = nominalNetWorth * 0.915;           // ~8.5% CPI discount
  const projectedNetWorth = nominalNetWorth * Math.pow(1.06, 10); // 6% real growth, 10yr

  return (
    <div className="page-container pt-5 pb-12 space-y-6 fade-in">

      {/* ── Page Header — matches other pages (Loans, Zakat, etc.) ── */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            {t('Real Wealth Intelligence')}
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-0.5">
            {t('Understand your true purchasing power, project asset values, and master inflation.')}
          </p>
        </div>

        {/* Data completeness badge */}
        {!loading && wealth && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium shrink-0 self-start bg-[var(--color-bg-subtle)] border-[var(--color-border)]">
            {wealth.dataCompleteness === 'complete'     && <><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400">Complete Data</span></>}
            {wealth.dataCompleteness === 'partial'      && <><AlertCircle  className="w-3.5 h-3.5 text-amber-500"  /><span className="text-amber-600 dark:text-amber-400">Partial Data</span></>}
            {wealth.dataCompleteness === 'insufficient' && <><HelpCircle   className="w-3.5 h-3.5 text-rose-500"   /><span className="text-rose-600 dark:text-rose-400">Add accounts to begin</span></>}
          </div>
        )}
      </header>

      {/* ── Hero Cards ── */}
      <section aria-label="Wealth summary" className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">

        {/* Nominal Net Worth */}
        <Card className="h-full border-[var(--color-border)] shadow-sm transition-all hover:scale-[1.02]">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[var(--text-secondary)] text-[var(--color-text-secondary)] flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                <span>{t('Nominal Net Worth')}</span>
              </h3>
              <div className="group relative shrink-0">
                <Info className="w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer" />
                <div className="absolute right-0 w-52 p-2 mt-1 text-xs bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-lg rounded-[var(--radius-card)] opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  Total wealth across all accounts. No inflation adjustment.
                </div>
              </div>
            </div>
            {loading
              ? <div className="py-2"><Spinner size={20} /></div>
              : <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums" data-financial>{formatCurrency(nominalNetWorth)}</div>
            }
            <p className="text-[var(--text-label)] text-[var(--color-text-muted)] mt-1">
              {loading ? '—' : `${t('Assets')}: ${formatCurrency(totalAssets)} · ${t('Liabilities')}: ${formatCurrency(totalLiabilities)}`}
            </p>
          </div>
        </Card>

        {/* Real Net Worth */}
        <Card className="h-full border-[var(--color-border)] shadow-sm transition-all hover:scale-[1.02]">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[var(--text-secondary)] text-[var(--color-text-secondary)] flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />
                <span>{t('Real Net Worth')}</span>
              </h3>
              <div className="group relative shrink-0">
                <Info className="w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer" />
                <div className="absolute right-0 w-52 p-2 mt-1 text-xs bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-lg rounded-[var(--radius-card)] opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  Wealth adjusted for ~8.5% inflation — your true purchasing power.
                </div>
              </div>
            </div>
            {loading
              ? <div className="py-2"><Spinner size={20} /></div>
              : <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums" data-financial>{formatCurrency(realNetWorth)}</div>
            }
            <p className="text-[var(--text-label)] text-[var(--color-text-muted)] mt-1">{t('Adjusted to base period CPI')}</p>
          </div>
        </Card>

        {/* Projected Real Net Worth */}
        <Card className="h-full border-[var(--color-border)] shadow-sm sm:col-span-2 transition-all hover:scale-[1.01]">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <LineChart className="w-4 h-4 text-emerald-500 shrink-0" />
              <h3 className="font-semibold text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
                {t('Projected Real Net Worth')}
              </h3>
            </div>
            {loading
              ? <div className="py-2"><Spinner size={20} /></div>
              : <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums" data-financial>{formatCurrency(projectedNetWorth)}</div>
            }
            <p className="text-[var(--text-label)] text-[var(--color-text-muted)] mt-1">
              {t('10-year horizon at 6% real growth rate')}
            </p>
          </div>
        </Card>

      </section>

      {/* ── Tools Grid ── */}
      <section aria-label="Financial projection tools" className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="min-w-0 w-full overflow-hidden">
          <ScenarioEngine initialWealth={nominalNetWorth} />
        </div>
        <div className="flex flex-col gap-6 min-w-0 w-full overflow-hidden">
          <PurchasingPowerTool />
          <FutureTargetTool />
        </div>
      </section>

      {/* ── Asset Time Machine ── */}
      <section aria-label="Asset time machine" className="min-w-0 w-full overflow-hidden">
        <AssetTimeMachine />
      </section>

      {/* Disclaimer */}
      <div className="text-[var(--text-label)] text-[var(--color-text-muted)] p-4 border border-dashed border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-bg-subtle)] text-center">
        <p className="font-semibold mb-1">{t('Disclaimer')}</p>
        <p>{t('Future values are projections based on selected assumptions and are not guaranteed returns. Inflation calculations rely on historical CPI data and future estimates.')}</p>
      </div>
    </div>
  );
};
