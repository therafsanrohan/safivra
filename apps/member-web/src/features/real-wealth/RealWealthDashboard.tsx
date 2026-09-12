import React from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { AssetTimeMachine } from './AssetTimeMachine';
import { ScenarioEngine } from './ScenarioEngine';
import { PurchasingPowerTool } from './PurchasingPowerTool';
import { FutureTargetTool } from './FutureTargetTool';
import { isFeatureEnabled } from '@/lib/flags';
import { useAuthContext } from '@/context/AuthContext';

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
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Real Wealth Intelligence</h1>
        <p className="text-muted-foreground">
          Understand your historical purchasing power, project your future asset values, and analyze inflation drag.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader title="Current Nominal Net Worth" />
          <div className="text-2xl font-bold">৳0.00</div>
          <p className="text-xs text-muted-foreground">Based on latest valuations</p>
        </Card>

        <Card>
          <CardHeader title="Inflation-Adjusted Net Worth" />
          <div className="text-2xl font-bold">৳0.00</div>
          <p className="text-xs text-muted-foreground">Adjusted to base period CPI</p>
        </Card>

        <Card>
          <CardHeader title="Projected Real Net Worth" />
          <div className="text-2xl font-bold">৳0.00</div>
          <p className="text-xs text-muted-foreground">10 year horizon</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ScenarioEngine />
        <div className="space-y-6">
          <PurchasingPowerTool />
          <FutureTargetTool />
        </div>
      </div>

      <AssetTimeMachine />
      
      <div className="text-xs text-muted-foreground mt-8 p-4 bg-muted/50 rounded-lg">
        <p className="font-semibold mb-1">Disclaimer</p>
        <p>Future values are projections based on selected assumptions and are not guaranteed returns. Inflation calculations rely on historical CPI data and future estimates.</p>
      </div>
    </div>
  );
};
