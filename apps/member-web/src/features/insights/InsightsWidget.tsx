import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Info, CalendarClock } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { Card, CardHeader, Skeleton } from '@/components/ui/Card';

interface PeriodComparison {
  current_period_amount: number;
  prior_period_amount: number;
  absolute_change: number;
  percentage_change: number | null;
  currency: string;
}

interface BudgetPosition {
  budget_id: string;
  total_budget: number;
  spent_amount: number;
  remaining_amount: number;
  is_overspent: boolean;
  currency: string;
}

interface BaselineForecast {
  forecast_amount: number;
  currency: string;
  lookback_days: number;
  data_quality_warning: string | null;
}

interface InsightsResponse {
  snapshot_id: string;
  as_of: string;
  spending_comparison: PeriodComparison | null;
  budget_positions: BudgetPosition[];
  seven_day_baseline: BaselineForecast | null;
  limitations: string[];
}

export function InsightsWidget() {
  const { session } = useAuthContext();
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchInsights() {
      if (!session) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/v1/analytics/insights`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch insights');
        const data = await res.json();
        setInsights(data);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, [session]);

  if (loading) {
    return (
      <Card>
        <CardHeader title="Loading Insights..." />
        <div className="px-5 pb-5">
          <Skeleton height={100} />
        </div>
      </Card>
    );
  }

  if (error || !insights) {
    return (
      <Card className="bg-destructive/10">
        <div className="flex items-center space-x-2 p-6">
          <AlertCircle className="text-destructive w-5 h-5" />
          <p className="text-sm">Financial insights are currently unavailable.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {insights.limitations.length > 0 && (
        <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 p-3 rounded-md flex items-start space-x-2 text-sm">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            {insights.limitations.map((limit, idx) => (
              <p key={idx}>{limit}</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Spending Comparison */}
        <Card padding="none">
          <CardHeader title="Recent Spending vs Prior" />
          <div className="px-5 pb-5 pt-2">
            {insights.spending_comparison ? (
              <div>
                <div className="text-2xl font-bold">
                  {insights.spending_comparison.currency} {insights.spending_comparison.current_period_amount.toFixed(2)}
                </div>
                {insights.spending_comparison.percentage_change !== null && (
                  <div className="flex items-center space-x-1 mt-1">
                    {insights.spending_comparison.absolute_change > 0 ? (
                      <TrendingUp className="text-[var(--color-negative)] w-4 h-4" />
                    ) : (
                      <TrendingDown className="text-[var(--color-positive)] w-4 h-4" />
                    )}
                    <span className={insights.spending_comparison.absolute_change > 0 ? "text-[var(--color-negative)] text-sm" : "text-[var(--color-positive)] text-sm"}>
                      {Math.abs(insights.spending_comparison.percentage_change).toFixed(1)}% {insights.spending_comparison.absolute_change > 0 ? 'higher' : 'lower'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Not enough data to compare.</p>
            )}
          </div>
        </Card>

        {/* Budget Position */}
        {insights.budget_positions.map((budget) => (
          <Card padding="none" key={budget.budget_id}>
            <CardHeader title="Monthly Budget (Mock)" />
            <div className="px-5 pb-5 pt-2">
              <div className="text-2xl font-bold">
                {budget.currency} {budget.remaining_amount.toFixed(2)}
              </div>
              <div className="mt-1 flex items-center space-x-2">
                <p className="text-sm text-[var(--color-text-muted)]">remaining</p>
                {budget.is_overspent && (
                  <span className="ml-2 bg-[var(--color-negative)] text-white text-xs px-2 py-0.5 rounded-full">Overspent</span>
                )}
              </div>
            </div>
          </Card>
        ))}

        {/* ML Baseline Forecast */}
        <Card padding="none">
          <CardHeader title="7-Day Baseline Forecast" />
          <div className="px-5 pb-5 pt-2">
             {insights.seven_day_baseline && !insights.seven_day_baseline.data_quality_warning ? (
                <div>
                  <div className="text-2xl font-bold">
                    ~{insights.seven_day_baseline.currency} {insights.seven_day_baseline.forecast_amount.toFixed(2)}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" />
                    Based on {insights.seven_day_baseline.lookback_days}-day history
                  </p>
                </div>
             ) : (
                <p className="text-sm text-[var(--color-text-muted)]">Insufficient history to generate baseline forecast.</p>
             )}
          </div>
        </Card>

      </div>
    </div>
  );
}
