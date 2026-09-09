import React from 'react';
import { Wallet, ShieldCheck, TrendingDown, CalendarClock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/currency/formatter';
import { ScenarioResponse } from './types';

interface Props {
  assumptions: ScenarioResponse['starting_assumptions'];
  currency: string;
  planningDays: number;
}

function fmt(amount: string): string {
  return formatCurrency(parseFloat(amount));
}

export const GuidanceSummary: React.FC<Props> = ({
  assumptions,
  currency,
  planningDays,
}) => {
  const netAvailable = parseFloat(assumptions.net_available);

  const rows = [
    {
      icon: <Wallet size={16} className="text-[var(--color-accent)]" />,
      label: 'Available funds',
      value: fmt(assumptions.available_funds),
    },
    {
      icon: <TrendingDown size={16} className="text-[var(--color-error)]" />,
      label: 'Committed outflows',
      value: `− ${fmt(assumptions.total_commitments)}`,
    },
    {
      icon: <ShieldCheck size={16} className="text-[var(--color-warning)]" />,
      label: 'Protected reserves',
      value: `− ${fmt(assumptions.total_protected_funds)}`,
    },
  ];

  return (
    <Card>
      <div className="px-5 pt-4 pb-5 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarClock size={18} className="text-[var(--color-accent)]" />
          <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
            {planningDays}-Day Planning Snapshot
          </h2>
        </div>

        <div className="divide-y divide-[var(--color-border-default)]">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
                {row.icon}
                <span>{row.label}</span>
              </div>
              <span className="font-medium text-[var(--color-text-primary)] text-[var(--text-secondary)]">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Net available — prominent */}
        <div
          className={`rounded-[var(--radius-card)] px-4 py-3 flex items-center justify-between ${
            netAvailable >= 0
              ? 'bg-[var(--color-accent-soft)]'
              : 'bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]'
          }`}
        >
          <span className="font-semibold text-[var(--color-text-primary)] text-[var(--text-secondary)]">
            Net available to plan
          </span>
          <span
            className={`font-bold text-[var(--text-section)] ${
              netAvailable >= 0
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-error)]'
            }`}
          >
            {fmt(assumptions.net_available)}
          </span>
        </div>

        {/* Forecast basis label */}
        {assumptions.forecast_basis !== 'none' && (
          <p className="text-xs text-[var(--color-text-secondary)]">
            {assumptions.forecast_label}
          </p>
        )}
      </div>
    </Card>
  );
};
