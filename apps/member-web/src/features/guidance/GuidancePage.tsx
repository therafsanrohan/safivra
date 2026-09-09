import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Info } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { isFeatureEnabled } from '@/lib/flags';
import { Card, Skeleton } from '@/components/ui/Card';
import { GuidanceSummary } from './GuidanceSummary';
import { ScenarioOptions } from './ScenarioOptions';
import { WhatIfEditor } from './WhatIfEditor';
import { useGuidanceData } from './useGuidanceData';
import { CategoryConstraint, ScenarioRequest } from './types';
import { fetchFinanceData } from '@/lib/api/financeEngineClient';

/**
 * GuidancePage — /dashboard/plans/guidance
 *
 * Gated behind the `guidance_planner_enabled` feature flag.
 * Falls back gracefully when the analytics service is unavailable.
 *
 * SAFETY: This page performs zero writes to any ledger, balance, or budget
 * table. All scenario calculations happen in the read-only Python service.
 */
export const GuidancePage: React.FC = () => {
  const { user, session } = useAuthContext();
  const navigate = useNavigate();

  const isEnabled = isFeatureEnabled('guidance_planner_enabled', user?.id);

  const [currency, setCurrency] = useState('BDT');
  const [availableFunds, setAvailableFunds] = useState('0');
  const [totalCommitments, setTotalCommitments] = useState('0');
  const [totalProtectedFunds, setTotalProtectedFunds] = useState('0');
  const [sevenDayForecast, setSevenDayForecast] = useState<string | null>(null);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryConstraint[]>([]);

  const { state, calculate, reset } = useGuidanceData();

  // Load ATS data to populate starting assumptions
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    fetchFinanceData({
      userId: user.id,
      todayDate: today,
      horizonConfig: { type: 'month_end', endDate: '' },
    }).then((data) => {
      if (!data) { setFinanceLoading(false); return; }
      const result = data.result;
      if (result) {
        setAvailableFunds(String(result.availableToSpend ?? 0));
        setTotalCommitments(String(result.totalCommitments ?? 0));
        setTotalProtectedFunds(String(result.totalProtectedFunds ?? 0));
      }
      setCurrency(data.userCurrency ?? 'BDT');
      setFinanceLoading(false);
    }).catch(() => setFinanceLoading(false));
  }, [user]);

  // Fetch 7-day baseline from insights (best-effort)
  useEffect(() => {
    if (!session) return;
    const API_BASE = import.meta.env.VITE_API_URL as string;
    fetch(`${API_BASE}/v1/analytics/insights`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const forecast = data?.seven_day_baseline?.forecast_amount;
        if (forecast != null) setSevenDayForecast(String(forecast));
      })
      .catch(() => null);
  }, [session]);

  const handleCalculate = useCallback(
    (req: ScenarioRequest) => calculate(req),
    [calculate]
  );

  // If flag is off, redirect rather than show partial UI
  if (!isEnabled) {
    return (
      <div className="page-container pt-5 space-y-5 fade-in">
        <Link
          to="/dashboard/plans"
          className="flex items-center gap-1 text-[var(--color-accent)] text-sm"
        >
          <ChevronLeft size={16} /> Plans
        </Link>
        <Card>
          <div className="px-5 py-10 text-center space-y-3">
            <Info size={32} className="mx-auto text-[var(--color-accent)]" />
            <h1 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
              Financial Guidance
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto">
              This feature is not yet enabled on your account. You can enable it
              for testing by running{' '}
              <code className="bg-[var(--color-bg-subtle)] px-1 rounded text-xs">
                localStorage.setItem('ff_guidance_planner_enabled','true')
              </code>{' '}
              in the browser console, then refresh.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (financeLoading) {
    return (
      <div className="page-container pt-5 space-y-4 fade-in">
        <Skeleton height={24} width={160} />
        <Skeleton height={180} />
        <Skeleton height={120} />
        <Skeleton height={220} />
      </div>
    );
  }

  const planningDays = 7;

  return (
    <div className="page-container pt-5 space-y-5 fade-in pb-12">
      {/* Back navigation */}
      <Link
        to="/dashboard/plans"
        className="flex items-center gap-1 text-[var(--color-accent)] text-sm"
      >
        <ChevronLeft size={16} /> Plans
      </Link>

      {/* Page header */}
      <header>
        <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
          Financial Guidance
        </h1>
        <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
          Explore what-if spending scenarios. Nothing here changes your real
          accounts or transactions.
        </p>
      </header>

      {/* Planning snapshot */}
      {state.status === 'success' ? (
        <GuidanceSummary
          assumptions={state.data.starting_assumptions}
          currency={state.data.currency}
          planningDays={state.data.planning_days}
        />
      ) : (
        <Card>
          <div className="px-5 pt-4 pb-5 space-y-2">
            <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
              {planningDays}-Day Planning Snapshot
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Fill in the what-if editor below and calculate a scenario to see
              your personalised summary.
            </p>
            {sevenDayForecast && (
              <p className="text-xs text-[var(--color-text-secondary)]">
                Historical 7-day spending estimate available — will be used as a
                reference.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Error / unavailable banners */}
      {state.status === 'error' && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-error)] bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] px-4 py-3 flex items-start gap-2 text-sm text-[var(--color-error)]">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          {state.message}
        </div>
      )}
      {state.status === 'unavailable' && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-warning)] bg-[color-mix(in_srgb,var(--color-warning)_8%,transparent)] px-4 py-3 space-y-1 text-sm text-[var(--color-text-primary)]">
          <p className="font-medium flex items-center gap-2">
            <AlertTriangle size={15} className="text-[var(--color-warning)]" />
            Guidance temporarily unavailable
          </p>
          {state.limitations.map((l, i) => (
            <p key={i} className="text-[var(--color-text-secondary)] text-xs">
              {l}
            </p>
          ))}
        </div>
      )}

      {/* Scenario options (shown after a successful calculation) */}
      {state.status === 'success' && (
        <ScenarioOptions
          options={state.data.options}
          currency={state.data.currency}
        />
      )}

      {/* Limitations list */}
      {state.status === 'success' && state.data.limitations.length > 0 && (
        <div className="rounded-[var(--radius-card)] bg-[var(--color-bg-subtle)] px-4 py-3 space-y-1">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">
            Planning notes
          </p>
          {state.data.limitations.map((l, i) => (
            <p key={i} className="text-xs text-[var(--color-text-secondary)]">
              • {l}
            </p>
          ))}
        </div>
      )}

      {/* What-if editor — always visible, recalculate anytime */}
      <WhatIfEditor
        currency={currency}
        availableFunds={availableFunds}
        totalCommitments={totalCommitments}
        totalProtectedFunds={totalProtectedFunds}
        sevenDayForecast={sevenDayForecast}
        defaultCategories={categories}
        planningDays={planningDays}
        onCalculate={handleCalculate}
        isLoading={state.status === 'loading'}
      />

      {/* Reset link */}
      {state.status === 'success' && (
        <button
          onClick={reset}
          className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
        >
          Clear scenario and start over
        </button>
      )}
    </div>
  );
};
