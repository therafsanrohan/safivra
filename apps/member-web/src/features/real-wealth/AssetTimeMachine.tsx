import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';

export const AssetTimeMachine: React.FC = () => {
  const [yearOffset, setYearOffset] = useState<number>(0);

  const getYearLabel = (offset: number) => {
    const currentYear = new Date().getFullYear();
    return currentYear + offset;
  };

  return (
    <Card>
      <CardHeader 
        title="Asset Time Machine" 
        subtitle="Slide through time to see how your portfolio changes based on historical data and future projections." 
      />
      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-4xl font-bold text-primary">
            {getYearLabel(yearOffset)}
          </div>
          <div className="text-sm text-muted-foreground">
            {yearOffset < 0 ? 'Historical Record' : yearOffset === 0 ? 'Today' : 'Projected'}
          </div>
        </div>

        {/* Note: if Slider doesn't exist in @/components/ui, this might fail build.
            We will use input type="range" instead for safety. */}
        <input
          type="range"
          min="-10"
          max="20"
          step="1"
          value={yearOffset}
          onChange={(e) => setYearOffset(Number(e.target.value))}
          className="w-full py-4"
        />

        <div className="grid gap-4 md:grid-cols-2 mt-6">
          <div className="p-4 border rounded-lg bg-card">
            <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Nominal Value</h4>
            <p className="text-2xl font-bold">৳---</p>
            <p className="text-xs mt-1 text-muted-foreground">
              {yearOffset < 0 ? 'Recorded valuation' : 'Unadjusted projection'}
            </p>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Real Value (Today's Power)</h4>
            <p className="text-2xl font-bold">৳---</p>
            <p className="text-xs mt-1 text-muted-foreground">
              {yearOffset < 0 ? 'Inflation adjusted from past' : 'Inflation discounted from future'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
