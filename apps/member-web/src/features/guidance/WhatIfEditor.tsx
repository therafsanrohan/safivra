import React, { useState } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CategoryConstraint, ProposedChange, ScenarioRequest } from './types';

interface Props {
  currency: string;
  availableFunds: string;
  totalCommitments: string;
  totalProtectedFunds: string;
  sevenDayForecast: string | null;
  defaultCategories: CategoryConstraint[];
  planningDays: number;
  onCalculate: (req: ScenarioRequest) => void;
  isLoading: boolean;
}

export const WhatIfEditor: React.FC<Props> = ({
  currency,
  availableFunds,
  totalCommitments,
  totalProtectedFunds,
  sevenDayForecast,
  defaultCategories,
  planningDays,
  onCalculate,
  isLoading,
}) => {
  const [oneTimePurchase, setOneTimePurchase] = useState('');
  const [oneTimeSaving, setOneTimeSaving] = useState('');
  const [categoryOverrides, setCategoryOverrides] = useState<
    Record<string, string>
  >({});

  const handleSubmit = () => {
    const changes: ProposedChange[] = [];

    if (parseFloat(oneTimePurchase) > 0) {
      changes.push({
        change_type: 'one_time_purchase',
        category_id: null,
        new_allocation: null,
        one_time_amount: oneTimePurchase,
        label: 'One-time purchase',
        is_user_entered: true,
      });
    }

    if (parseFloat(oneTimeSaving) > 0) {
      changes.push({
        change_type: 'one_time_saving',
        category_id: null,
        new_allocation: null,
        one_time_amount: oneTimeSaving,
        label: 'One-time saving',
        is_user_entered: true,
      });
    }

    for (const [catId, value] of Object.entries(categoryOverrides)) {
      if (value !== '') {
        changes.push({
          change_type: 'reduce_category',
          category_id: catId,
          new_allocation: value,
          one_time_amount: null,
          label: `Adjusted allocation`,
          is_user_entered: true,
        });
      }
    }

    const constraints: CategoryConstraint[] = defaultCategories.map((c) => ({
      ...c,
      current_allocation: categoryOverrides[c.category_id] ?? c.current_allocation,
    }));

    onCalculate({
      currency,
      planning_days: planningDays,
      available_funds: availableFunds,
      total_commitments: totalCommitments,
      total_protected_funds: totalProtectedFunds,
      eligible_7day_forecast: sevenDayForecast,
      category_constraints: constraints,
      proposed_changes: changes,
    });
  };

  return (
    <Card>
      <div className="px-5 pt-4 pb-5 space-y-4">
        <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
          What-if Editor
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Adjust hypothetical amounts below. None of this changes your real
          transactions or balances.
        </p>

        {/* One-time amounts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              Hypothetical purchase ({currency})
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={oneTimePurchase}
              onChange={(e) => setOneTimePurchase(e.target.value)}
              className="input-field"
              placeholder="0"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              Hypothetical saving ({currency})
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={oneTimeSaving}
              onChange={(e) => setOneTimeSaving(e.target.value)}
              className="input-field"
              placeholder="0"
            />
          </label>
        </div>

        {/* Category overrides */}
        {defaultCategories.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">
              Category allocation overrides
            </p>
            {defaultCategories.map((cat) => (
              <div key={cat.category_id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--color-text-primary)] truncate">
                    {cat.category_name}
                    {cat.is_essential && (
                      <span className="ml-1.5 text-xs text-[var(--color-warning)]">
                        Essential
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Current: {cat.current_allocation} {currency}
                  </p>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  disabled={cat.is_essential}
                  value={categoryOverrides[cat.category_id] ?? ''}
                  onChange={(e) =>
                    setCategoryOverrides((prev) => ({
                      ...prev,
                      [cat.category_id]: e.target.value,
                    }))
                  }
                  placeholder={cat.is_essential ? 'Protected' : 'New amount'}
                  className="input-field w-28 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {categoryOverrides[cat.category_id] !== undefined && !cat.is_essential && (
                  <button
                    onClick={() =>
                      setCategoryOverrides((prev) => {
                        const next = { ...prev };
                        delete next[cat.category_id];
                        return next;
                      })
                    }
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              Calculating…
            </>
          ) : (
            <>
              <Plus size={15} />
              Calculate Scenario
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
