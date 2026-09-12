import React from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { AssetTimeMachine } from './AssetTimeMachine';
import { ScenarioEngine } from './ScenarioEngine';
import { PurchasingPowerTool } from './PurchasingPowerTool';
import { FutureTargetTool } from './FutureTargetTool';
import { isFeatureEnabled } from '@/lib/flags';
import { useAuthContext } from '@/context/AuthContext';
import { Wallet, TrendingDown, LineChart, Info } from 'lucide-react';

export const RealWealthDashboard: React.FC = () => {
  const { user } = useAuthContext();

  if (!isFeatureEnabled('real_wealth_intelligence_enabled', user?.id)) {
    return (
      <div className="p-8 text-center text-[var(--color-text-secondary)]">
        Real Wealth Intelligence is not enabled for your account yet.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[var(--color-accent)] to-purple-500 bg-clip-text text-transparent">
          Real Wealth Intelligence
        </h1>
        <p className="text-[var(--color-text-secondary)] text-lg">
          Understand your true purchasing power, project asset values, and master inflation.
        </p>
      </div>

      {/* Hero Metrics */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0 transition-all hover:scale-[1.02]">
          <Card className="h-full border-[var(--color-border)] shadow-sm bg-gradient-to-br from-[var(--color-bg-surface)] to-[var(--color-bg-subtle)]">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[var(--color-accent)]" />
                  Nominal Net Worth
                </h3>
                <div className="group relative">
                  <Info className="w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer" />
                  <div className="absolute right-0 w-48 p-2 mt-1 text-xs bg-[var(--color-bg-surface)] border shadow-lg rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    Your wealth measured in today's money, without accounting for inflation.
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-[var(--color-text-primary)]">৳0.00</div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Based on latest valuations</p>
            </div>
          </Card>
        </div>

        <div className="min-w-0 transition-all hover:scale-[1.02]">
          <Card className="h-full border-[var(--color-border)] shadow-sm bg-gradient-to-br from-[var(--color-bg-surface)] to-red-500/5">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  Real Net Worth
                </h3>
                <div className="group relative">
                  <Info className="w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer" />
                  <div className="absolute right-0 w-48 p-2 mt-1 text-xs bg-[var(--color-bg-surface)] border shadow-lg rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    Your wealth adjusted for inflation, showing true purchasing power.
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-[var(--color-text-primary)]">৳0.00</div>
              <p className="text-xs text-red-500/80 mt-1">Adjusted to base period CPI</p>
            </div>
          </Card>
        </div>

        <div className="min-w-0 md:col-span-2 lg:col-span-2 transition-all hover:scale-[1.01]">
          <Card className="h-full border-[var(--color-border)] shadow-sm bg-gradient-to-br from-[var(--color-bg-surface)] to-emerald-500/5">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-emerald-500" />
                  Projected Real Net Worth
                </h3>
              </div>
              <div className="text-3xl font-bold text-[var(--color-text-primary)]">৳0.00</div>
              <p className="text-xs text-emerald-600/80 mt-1">10 year horizon based on Expected climate</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="min-w-0 w-full overflow-hidden">
          <ScenarioEngine />
        </div>
        <div className="space-y-6 min-w-0 w-full overflow-hidden flex flex-col">
          <PurchasingPowerTool />
          <FutureTargetTool />
        </div>
      </div>

      <div className="min-w-0 w-full overflow-hidden">
        <AssetTimeMachine />
      </div>
      
      <div className="text-xs text-[var(--color-text-muted)] mt-12 p-4 border border-dashed rounded-lg bg-[var(--color-bg-subtle)] text-center">
        <p className="font-semibold mb-1">Disclaimer</p>
        <p>Future values are projections based on selected assumptions and are not guaranteed returns. Inflation calculations rely on historical CPI data and future estimates.</p>
      </div>
    </div>
  );
};
