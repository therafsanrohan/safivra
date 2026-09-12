import React from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { AssetTimeMachine } from './AssetTimeMachine';
import { ScenarioEngine } from './ScenarioEngine';
import { PurchasingPowerTool } from './PurchasingPowerTool';

// A feature flag toggle at the top level
const IS_REAL_WEALTH_ENABLED = import.meta.env.VITE_ENABLE_REAL_WEALTH === 'true';

export const RealWealthDashboard: React.FC = () => {
  if (!IS_REAL_WEALTH_ENABLED) {
    return null; // Or a coming soon placeholder if needed
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
        <PurchasingPowerTool />
      </div>

      <AssetTimeMachine />
      
      <div className="text-xs text-muted-foreground mt-8 p-4 bg-muted/50 rounded-lg">
        <p className="font-semibold mb-1">Disclaimer</p>
        <p>Future values are projections based on selected assumptions and are not guaranteed returns. Inflation calculations rely on historical CPI data and future estimates.</p>
      </div>
    </div>
  );
};
