import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/currency/formatter';
import { ScenarioOption } from './types';

interface Props {
  options: ScenarioOption[];
  currency: string;
}

interface OptionCardProps {
  option: ScenarioOption;
  currency: string;
  index: number;
}

function fmt(amount: string): string {
  return formatCurrency(parseFloat(amount));
}

const ACCENT_CLASSES = [
  'border-[var(--color-accent)] bg-[var(--color-accent-soft)]',
  'border-[var(--color-border-strong)]',
  'border-[var(--color-border-strong)]',
];

const OptionCard: React.FC<OptionCardProps> = ({ option, currency, index }) => {
  const [expanded, setExpanded] = useState(false);
  const reduction = parseFloat(option.total_reduction);
  const remaining = parseFloat(option.projected_remaining);

  return (
    <Card
      className={`transition-all ${ACCENT_CLASSES[index] ?? ACCENT_CLASSES[2]}`}
    >
      <div className="px-5 pt-4 pb-5 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--color-accent)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {index + 1}
              </span>
              <h3 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)] truncate">
                {option.label}
              </h3>
            </div>
            <p className="mt-1 text-[var(--text-secondary)] text-[var(--color-text-secondary)] text-sm">
              {option.description}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-[var(--color-text-secondary)]">Potential savings</p>
            <p className="font-bold text-[var(--color-accent)] text-[var(--text-section)]">
              {fmt(option.total_reduction)}
            </p>
          </div>
        </div>

        {/* Projected remaining */}
        <div
          className={`rounded-[var(--radius-button)] px-3 py-2 flex items-center justify-between text-sm ${
            remaining >= 0
              ? 'bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]'
              : 'bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)]'
          }`}
        >
          <span className="text-[var(--color-text-secondary)]">
            Projected remaining gap
          </span>
          <span
            className={`font-semibold ${
              remaining >= 0
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-error)]'
            }`}
          >
            {reduction > 0 ? fmt(option.projected_remaining) : '—'}
          </span>
        </div>

        {/* Why this? toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:opacity-75 transition-opacity"
        >
          <Lightbulb size={13} />
          Why this option?
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {expanded && (
          <div className="text-xs text-[var(--color-text-secondary)] space-y-2 pt-1 border-t border-[var(--color-border-default)]">
            <p>{option.why_this}</p>
            {option.assumptions.length > 0 && (
              <ul className="list-disc list-inside space-y-1">
                {option.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export const ScenarioOptions: React.FC<Props> = ({ options, currency }) => {
  if (options.length === 0) {
    return (
      <Card>
        <div className="px-5 py-8 text-center text-[var(--color-text-secondary)] text-sm">
          No options could be generated with the current constraints. Try
          adjusting your category settings or planning period.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
        Suggested Options
      </h2>
      {options.map((option, i) => (
        <OptionCard key={option.option_id} option={option} currency={currency} index={i} />
      ))}
    </div>
  );
};
