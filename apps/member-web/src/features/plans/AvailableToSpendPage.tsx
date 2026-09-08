import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { isFeatureEnabled } from '@/lib/flags';
import { formatCurrency } from '@/lib/currency/formatter';
import { Card, Skeleton, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { fetchFinanceData, FinanceDataState } from '@/lib/api/financeEngineClient';
import { CalculationBreakdownModal } from './CalculationBreakdownModal';
import { ReserveOverlapModal } from './ReserveOverlapModal';
import { HorizonConfig } from '../../../../../packages/finance-engine/src';
import {
  Wallet, AlertTriangle, ShieldCheck, Info, RefreshCw, Calendar,
  ArrowRight, CheckCircle, HelpCircle, Layers, TrendingDown, TrendingUp
} from 'lucide-react';

export const AvailableToSpendPage: React.FC = () => {
  const { user } = useAuthContext();
  const { t } = useLanguage();

  const isEnabled = isFeatureEnabled('available_to_spend_enabled', user?.id);

  const [todayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [horizonType, setHorizonType] = useState<'month_end' | 'payday' | 'custom'>('month_end');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dataState, setDataState] = useState<FinanceDataState | null>(null);

  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const horizonConfig: HorizonConfig = {
      type: horizonType,
      endDate: horizonType === 'custom' && customEndDate ? customEndDate : '',
    };
    const res = await fetchFinanceData({
      userId: user.id,
      todayDate,
      horizonConfig,
    });
    setDataState(res);
  }, [user, todayDate, horizonType, customEndDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return null;

  const result = dataState?.result;
  const forecast = dataState?.forecast;
  const currencyCode = dataState?.userCurrency || 'BDT';

  return (
    <div className="page-container pt-5 space-y-6 fade-in pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
              {t.availableToSpend.title}
            </h1>
            {!isEnabled && <Badge variant="warning">Rollout Preview</Badge>}
          </div>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-0.5">
            {t.availableToSpend.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Horizon Selector */}
          <Select
            value={horizonType}
            onValueChange={(v) => setHorizonType(v as 'month_end' | 'payday' | 'custom')}
            className="text-xs py-1.5 w-auto"
            options={[
              { value: 'month_end', label: 'Horizon: Month-End' },
              ...(dataState?.paydayDayOfMonth
                ? [{ value: 'payday', label: `Horizon: Next Payday (Day ${dataState.paydayDayOfMonth})` }]
                : []),
              { value: 'custom', label: 'Horizon: Custom Date' },
            ]}
          />

          {horizonType === 'custom' && (
            <Input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="text-xs py-1.5 w-36"
            />
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={dataState?.loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw size={14} className={dataState?.loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Loading state */}
      {!dataState || dataState.loading ? (
        <div className="space-y-4">
          <Skeleton height={180} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton height={100} />
            <Skeleton height={100} />
            <Skeleton height={100} />
          </div>
        </div>
      ) : dataState.error ? (
        <Card className="p-6 border-[var(--color-negative)] bg-[var(--color-negative-soft)] text-center space-y-2">
          <AlertTriangle size={32} className="mx-auto text-[var(--color-negative)]" />
          <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Unable to calculate Available to Spend</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">{dataState.error}</p>
        </Card>
      ) : (
        <>
          {/* Hero Card */}
          <Card className="relative overflow-hidden border-[var(--color-border)] p-6 space-y-4 shadow-sm bg-[var(--color-bg-surface)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Wallet size={14} className="text-[var(--color-accent)]" />
                  Available to Spend ({result?.horizon.endDate})
                </span>

                <div className="mt-2 flex items-baseline gap-3">
                  <span
                    className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                      result?.isNegative ? 'text-[var(--color-negative)]' : 'text-[var(--color-text-primary)]'
                    }`}
                  >
                    {formatCurrency(result?.availableToSpend || 0)}
                  </span>
                  {result?.isNegative && (
                    <Badge variant="negative" className="text-xs font-semibold">
                      Shortfall Deficit
                    </Badge>
                  )}
                </div>
              </div>

              {/* Suggested daily allocation badge */}
              <div className="p-3 rounded-[var(--radius-card)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] space-y-1">
                <span className="text-[11px] font-medium text-[var(--color-text-secondary)] block">
                  Suggested Daily Allocation
                </span>
                <span className="text-lg font-bold text-[var(--color-accent)]">
                  {formatCurrency(result?.suggestedDailyAllocation || 0)}
                  <span className="text-xs font-normal text-[var(--color-text-muted)]"> / day</span>
                </span>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  ({result?.remainingDays} days remaining in planning period)
                </p>
              </div>
            </div>

            {/* Shortfall warning banner if negative */}
            {result?.isNegative && (
              <div className="p-3 rounded-[var(--radius-card)] bg-[var(--color-negative-soft)] border border-[var(--color-negative)] text-xs text-[var(--color-negative)] flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>
                  <strong>Uncommitted Deficit:</strong> Your commitments and reserves exceed current liquid funds by{' '}
                  <strong>{formatCurrency(result.shortfall)}</strong> before {result.horizon.endDate}.
                </span>
              </div>
            )}

            {/* Overlap notice */}
            {result?.breakdown.unresolvedOverlaps && result.breakdown.unresolvedOverlaps.length > 0 && (
              <div className="p-3 rounded-[var(--radius-card)] bg-[var(--color-warning-soft)] border border-[var(--color-warning)] text-xs flex items-center justify-between gap-2">
                <span className="text-[var(--color-warning)] font-medium">
                  {result.breakdown.unresolvedOverlaps.length} potential reserve-bill overlap requiring resolution.
                </span>
                <Button size="sm" variant="outline" onClick={() => setShowReserveModal(true)} className="text-[11px] h-7">
                  Resolve Overlaps
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <span>Last updated: {result?.calculatedAt ? new Date(result.calculatedAt).toLocaleTimeString() : 'Just now'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowReserveModal(true)} className="text-xs gap-1.5">
                  <Layers size={14} /> Manage Reserves
                </Button>
                <Button size="sm" onClick={() => setShowCalculationModal(true)} className="text-xs gap-1.5">
                  <Info size={14} /> View Calculation Proof
                </Button>
              </div>
            </div>
          </Card>

          {/* 3 Component Metric Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 space-y-2 border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  1. Eligible Funds
                </span>
                <ShieldCheck size={16} className="text-[var(--color-positive)]" />
              </div>
              <div className="text-xl font-bold text-[var(--color-text-primary)]">
                {formatCurrency(result?.eligibleCurrentFunds || 0)}
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {result?.breakdown.eligibleAccounts.length} liquid bank, cash & MFS accounts included.
              </p>
            </Card>

            <Card className="p-4 space-y-2 border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  2. Commitments
                </span>
                <TrendingDown size={16} className="text-[var(--color-negative)]" />
              </div>
              <div className="text-xl font-bold text-[var(--color-negative)]">
                −{formatCurrency(result?.totalCommitments || 0)}
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {result?.breakdown.commitments.length} unpaid bills, loan instalments & card dues.
              </p>
            </Card>

            <Card className="p-4 space-y-2 border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  3. Protected Funds
                </span>
                <Layers size={16} className="text-[var(--color-warning)]" />
              </div>
              <div className="text-xl font-bold text-[var(--color-warning)]">
                −{formatCurrency(result?.totalProtectedFunds || 0)}
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {result?.breakdown.protectedReserves.length} reserves allocated inside spending accounts.
              </p>
            </Card>
          </div>

          {/* Chronological Forecast Cash Balance Timeline */}
          {forecast && (
            <Card className="p-5 space-y-4 border-[var(--color-border)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <TrendingUp size={16} className="text-[var(--color-accent)]" />
                    Chronological Forecast Cash Flow Timeline
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Day-by-day cash balance projection up to {forecast.horizonDate}
                  </p>
                </div>

                {forecast.hasMidPeriodShortfall && (
                  <Badge variant="warning" className="text-xs font-medium self-start sm:self-auto">
                    Mid-period cash dip on {forecast.minBalanceDate}
                  </Badge>
                )}
              </div>

              {forecast.hasMidPeriodShortfall && (
                <div className="p-3 rounded bg-[var(--color-warning-soft)] border border-[var(--color-warning)] text-xs text-[var(--color-warning)]">
                  <strong>Chronological Warning:</strong> Your cash balance is projected to drop to{' '}
                  <strong>{formatCurrency(forecast.minBalance)}</strong> on {forecast.minBalanceDate} before later expected income arrives.
                </div>
              )}

              {/* Timeline list */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {forecast.timeline.map((day) => {
                  const hasEvents = day.events.length > 0;
                  return (
                    <div
                      key={day.date}
                      className={`p-2.5 rounded text-xs border flex items-center justify-between transition-colors ${
                        day.isShortfall
                          ? 'bg-[var(--color-negative-soft)] border-[var(--color-negative)]'
                          : hasEvents
                          ? 'bg-[var(--color-bg-surface)] border-[var(--color-border)]'
                          : 'bg-[var(--color-bg-subtle)] border-transparent opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-medium text-[var(--color-text-secondary)] w-24">
                          {day.date}
                        </span>
                        {hasEvents ? (
                          <div className="space-x-2">
                            {day.events.map((e) => (
                              <span
                                key={e.id}
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  e.type === 'inflow'
                                    ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]'
                                    : 'bg-[var(--color-negative-soft)] text-[var(--color-negative)]'
                                }`}
                              >
                                {e.type === 'inflow' ? '+' : '−'}
                                {formatCurrency(e.amount)} ({e.title})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[var(--color-text-muted)] italic">No scheduled movements</span>
                        )}
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-semibold ${
                            day.isShortfall ? 'text-[var(--color-negative)]' : 'text-[var(--color-text-primary)]'
                          }`}
                        >
                          {formatCurrency(day.endingBalance)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Calculation Proof Modal */}
      <CalculationBreakdownModal
        open={showCalculationModal}
        onOpenChange={setShowCalculationModal}
        result={result || null}
      />

      {/* Reserve & Overlap Manager Modal */}
      {dataState && (
        <ReserveOverlapModal
          open={showReserveModal}
          onOpenChange={setShowReserveModal}
          userId={user.id}
          accounts={dataState.accounts}
          commitments={dataState.commitments}
          reserves={dataState.protectedReserves}
          unresolvedOverlaps={result?.breakdown.unresolvedOverlaps || []}
          onRefresh={loadData}
        />
      )}
    </div>
  );
};
