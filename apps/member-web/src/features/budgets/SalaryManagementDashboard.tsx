import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { Card, Spinner, ProgressBar, Badge } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import {
  Wallet,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  PieChart as PieIcon,
  Layers,
  ArrowUpRight,
  Info,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  RefreshCw,
  Settings2,
  CalendarDays,
  ArrowRight,
  HelpCircle as QuestionIcon,
  PiggyBank,
  Briefcase,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  calculateAdaptiveBudgetIntelligence,
  AdaptiveBudgetAnalysis,
  BudgetScenarioType,
} from '@/lib/budget/budgetEngine';
import { IncomeSourcesManager } from './IncomeSourcesManager';
import { SinkingFundsManager } from './SinkingFundsManager';
import { BudgetConfigPanel } from './BudgetConfigPanel';

export const SalaryManagementDashboard: React.FC = () => {
  const { user } = useAuthContext();
  const { error: showError } = useToast();

  const [analysis, setAnalysis] = useState<AdaptiveBudgetAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<BudgetScenarioType>('balanced');
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'sinking_funds' | 'payday' | 'settings'>('overview');
  const [showWhyExplain, setShowWhyExplain] = useState(false);

  const loadBudget = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setRpcError(null);
    try {
      const result = await calculateAdaptiveBudgetIntelligence(user.id, selectedScenario);
      if (result === null) {
        setRpcError('Could not load budget data. The database function may not be set up yet. Please run the migrations in your Supabase dashboard.');
      } else {
        setAnalysis(result);
      }
    } catch (err: any) {
      console.error(err);
      setRpcError(err?.message ?? 'Failed to calculate adaptive budget.');
      showError('Error', 'Failed to calculate adaptive budget.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedScenario, showError]);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3">
        <Spinner size={32} />
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          Calculating actual income, commitments &amp; safe-to-spend...
        </p>
      </div>
    );
  }

  if (rpcError) {
    return (
      <div className="space-y-6 fade-in max-w-3xl mx-auto px-1">
        {/* Header */}
        <div className="border-b border-[var(--color-border)] pb-4">
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">Salary &amp; Adaptive Budget</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Setup required to unlock your personalized plan.</p>
        </div>

        {/* Error card */}
        <Card className="p-6 space-y-4 border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Database Setup Required</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                The Salary &amp; Adaptive Budget feature needs two database migrations to be run in your Supabase SQL Editor.
              </p>
              <div className="mt-3 p-3 bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] font-mono text-[10px] text-[var(--color-text-muted)] break-all">
                {rpcError}
              </div>
            </div>
          </div>
        </Card>

        {/* Setup Instructions */}
        <Card className="p-6 space-y-4 border-[var(--color-border)]">
          <h3 className="font-semibold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[var(--color-accent)]" />
            How to Fix: Run These 2 SQL Migrations
          </h3>
          <div className="space-y-3 text-xs text-[var(--color-text-secondary)]">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">Go to Supabase Dashboard → SQL Editor</p>
                <p>Open your project at supabase.com</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">Run Migration 1 — Tables</p>
                <p className="font-mono">supabase/migrations/20261005000002_salary_and_adaptive_budget.sql</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">Run Migration 2 — RPC Engine</p>
                <p className="font-mono">supabase/migrations/20261006000000_adaptive_budget_rpc.sql</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">Then come back and click Retry</p>
              </div>
            </div>
          </div>
          <button
            onClick={loadBudget}
            className="w-full mt-2 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry Now
          </button>
        </Card>
      </div>
    );
  }

  const healthVariantMap: Record<string, 'positive' | 'info' | 'warning' | 'negative'> = {
    HEALTHY: 'positive',
    BALANCED: 'info',
    TIGHT: 'warning',
    AT_RISK: 'warning',
    DEFICIT: 'negative',
  };

  const pillars = analysis?.pillarAllocations;
  const takehome = analysis?.totalTakeHomeIncome ?? 0;

  return (
    <div className="space-y-6 fade-in max-w-6xl mx-auto px-1 sm:px-0">
      {/* Header & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Salary & Adaptive Budget
            </h1>
            {analysis?.dataConfidence && (
              <Badge
                variant={analysis.dataConfidence === 'HIGH_CONFIDENCE' ? 'positive' : 'info'}
                className="text-[10px] uppercase font-semibold"
              >
                {analysis.dataConfidence === 'STARTER' ? 'Starter Budget' : 'Personalized'}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Clear monthly spending limits based on your actual income and real obligations.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1 bg-[var(--color-bg-subtle)] p-1 rounded-xl border border-[var(--color-border)] overflow-x-auto self-start md:self-auto max-w-full">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'income'
                ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Income Sources
          </button>
          <button
            onClick={() => setActiveTab('sinking_funds')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'sinking_funds'
                ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Sinking Funds
          </button>
          <button
            onClick={() => setActiveTab('payday')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'payday'
                ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Payday Plan
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              activeTab === 'settings'
                ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Settings
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* SECTION 1: Your Monthly Money (Core Summary Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 border-[var(--color-border)] space-y-1 bg-[var(--color-bg-surface)]">
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                Take-Home Income
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] block tabular-nums">
                {formatCurrency(analysis?.totalTakeHomeIncome ?? 0)}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] block">
                {analysis?.incomeSourcesCount ?? 0} source(s)
              </span>
            </Card>

            <Card className="p-4 border-[var(--color-border)] space-y-1 bg-[var(--color-bg-surface)]">
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                Essentials & Rent
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] block tabular-nums">
                {formatCurrency(analysis?.actualEssentialExpenses ?? 0)}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] block">
                Priority costs
              </span>
            </Card>

            <Card className="p-4 border-[var(--color-border)] space-y-1 bg-[var(--color-bg-surface)]">
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                Committed Debt & DPS
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] block tabular-nums">
                {formatCurrency((analysis?.mandatoryDebtPayments ?? 0) + (analysis?.committedSavingsDps ?? 0))}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] block">
                Loans, Cards & DPS
              </span>
            </Card>

            <Card className="p-4 border-[var(--color-border)] space-y-1 bg-[var(--color-bg-surface)]">
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                Money Left
              </span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 block tabular-nums">
                {formatCurrency(analysis?.uncommittedMoneyLeft ?? 0)}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] block">
                Uncommitted balance
              </span>
            </Card>
          </div>

          {/* SECTION 2: Hero Safe-to-Spend Banner */}
          <Card className="p-6 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-lg rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-400 opacity-20 blur-2xl rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-emerald-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-200" /> Recommended Safe-to-Spend
                  </span>
                  {analysis?.budgetHealth && (
                    <Badge variant="info" className="bg-emerald-500/30 text-white border-emerald-400/40 text-[10px]">
                      Status: {analysis.budgetHealth}
                    </Badge>
                  )}
                </div>

                <div>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm tabular-nums">
                    {formatCurrency(analysis?.safeToSpend ?? 0)}
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
                    This is the estimated amount you can comfortably spend this month after reserving your essentials, debt obligations, DPS commitments, sinking funds, and a ৳{(analysis?.minimumBufferAmount ?? 5000).toLocaleString()} cash buffer.
                  </p>
                </div>

                <button
                  onClick={() => setShowWhyExplain(!showWhyExplain)}
                  className="text-xs text-emerald-200 hover:text-white font-medium underline inline-flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  {showWhyExplain ? 'Hide calculation breakdown' : 'Why this number?'}
                </button>
              </div>

              {/* Quick Health Meter Card */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-3 w-full md:w-64 shrink-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-100">Savings Capacity</span>
                  <span className="font-bold text-white">{analysis?.savingsRate}%</span>
                </div>
                <ProgressBar value={analysis?.savingsRate ?? 0} max={100} className="h-1.5 bg-emerald-950/40" />

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-emerald-100">Essential Ratio</span>
                  <span className="font-bold text-white">{analysis?.essentialExpenseRatio}%</span>
                </div>

                <div className="text-[10px] text-emerald-200/80 pt-1 border-t border-white/10">
                  {analysis?.budgetHealthReason}
                </div>
              </div>
            </div>

            {/* Expandable Calculation Breakdown */}
            {showWhyExplain && (
              <div className="mt-5 pt-4 border-t border-emerald-500/30 space-y-2 text-xs text-emerald-100 bg-emerald-950/30 p-4 rounded-2xl">
                <h4 className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> How Safivra Calculates Your Safe-to-Spend:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div>+ Monthly Planning Income: <strong>{formatCurrency(analysis?.totalTakeHomeIncome ?? 0)}</strong></div>
                  <div>- Essentials & Housing: <strong>{formatCurrency(analysis?.actualEssentialExpenses ?? 0)}</strong></div>
                  <div>- Mandatory Debt Payments: <strong>{formatCurrency(analysis?.mandatoryDebtPayments ?? 0)}</strong></div>
                  <div>- Committed DPS & Goals: <strong>{formatCurrency((analysis?.committedSavingsDps ?? 0) + (analysis?.activeGoalsTarget ?? 0))}</strong></div>
                  <div>- Sinking Fund Reserves: <strong>{formatCurrency(analysis?.sinkingFundMonthlyReserve ?? 0)}</strong></div>
                  <div>- Reserved Cash Buffer: <strong>{formatCurrency(analysis?.minimumBufferAmount ?? 0)}</strong></div>
                </div>
              </div>
            )}
          </Card>

          {/* SECTION 3: Scenario Selection */}
          <Card className="p-4 border-[var(--color-border)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--color-accent)]" /> Budget Scenario Model
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Adjust priorities to see recommended allocations for your cash flow.
                </p>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(['balanced', 'savings_focused', 'debt_focused', 'goal_focused'] as BudgetScenarioType[]).map((scen) => (
                  <button
                    key={scen}
                    onClick={() => setSelectedScenario(scen)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      selectedScenario === scen
                        ? 'bg-[var(--color-accent)] text-white shadow-sm'
                        : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {scen.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* SECTION 4: 5 Core Budget Pillars */}
          <Card className="p-6 border-[var(--color-border)] space-y-4">
            <div>
              <h3 className="font-semibold text-base text-[var(--color-text-primary)] flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-emerald-500" />
                The 5 Core Budget Pillars Breakdown
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                How your monthly take-home income is distributed across your real obligations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Pillar 1: Essentials */}
              <div className="p-4 bg-[var(--color-bg-subtle)] rounded-2xl border border-[var(--color-border)] space-y-1">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)] block">1. Essentials & Housing</span>
                <span className="text-lg font-bold text-[var(--color-text-primary)] block tabular-nums">
                  {formatCurrency(pillars?.essentials ?? 0)}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)] block">
                  Rent, food, utilities, transport & minimum debt payments
                </span>
              </div>

              {/* Pillar 2: Financial Security */}
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">2. Financial Security</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block tabular-nums">
                  {formatCurrency(pillars?.financialSecurity ?? 0)}
                </span>
                <span className="text-[10px] text-emerald-600/80 block">
                  Emergency fund contributions & liquid reserves
                </span>
              </div>

              {/* Pillar 3: Goals & Future */}
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-1">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 block">3. Goals & Future</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400 block tabular-nums">
                  {formatCurrency(pillars?.goalsAndFuture ?? 0)}
                </span>
                <span className="text-[10px] text-blue-600/80 block">
                  Committed DPS installments & active Savings Goals
                </span>
              </div>

              {/* Pillar 4: Flexible / Sinking Funds */}
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/40 space-y-1">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block">4. Irregular Sinking Funds</span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400 block tabular-nums">
                  {formatCurrency(pillars?.flexIrregular ?? 0)}
                </span>
                <span className="text-[10px] text-amber-600/80 block">
                  Eid, annual fees, insurance, gifts & repairs reserve
                </span>
              </div>

              {/* Pillar 5: Lifestyle */}
              <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/40 space-y-1 sm:col-span-2 lg:col-span-2">
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 block">5. Lifestyle Spending</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400 block tabular-nums">
                  {formatCurrency(pillars?.lifestyle ?? 0)}
                </span>
                <span className="text-[10px] text-purple-600/80 block">
                  Personal expenses, dining out, shopping & entertainment allowance
                </span>
              </div>
            </div>
          </Card>

          {/* SECTION 5: Explainability Insights ("Why Safivra Recommends This") */}
          <Card className="p-6 border-[var(--color-border)] space-y-3 bg-[var(--color-bg-surface)]">
            <h3 className="font-semibold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
              <Info className="w-4 h-4 text-[var(--color-accent)]" /> Why Safivra Recommends This Plan
            </h3>
            <div className="space-y-2">
              {analysis?.explainabilityNotes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* INCOME SOURCES TAB */}
      {activeTab === 'income' && (
        <IncomeSourcesManager onIncomeUpdated={loadBudget} />
      )}

      {/* SINKING FUNDS TAB */}
      {activeTab === 'sinking_funds' && (
        <SinkingFundsManager onFundsUpdated={loadBudget} />
      )}

      {/* PAYDAY PLAN TAB */}
      {activeTab === 'payday' && (
        <Card className="p-6 border-[var(--color-border)] space-y-6">
          <div>
            <h3 className="font-semibold text-lg text-[var(--color-text-primary)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Payday Allocation Recommendation
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              When your salary of <span className="font-bold text-emerald-600">{formatCurrency(takehome)}</span> arrives, distribute it immediately:
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-[var(--color-bg-subtle)] rounded-2xl flex items-center justify-between border border-[var(--color-border)]">
              <div>
                <span className="font-semibold text-sm block">1. Transfer for Essentials & Rent</span>
                <span className="text-xs text-[var(--color-text-muted)]">Rent, groceries, utilities & loan EMIs</span>
              </div>
              <span className="font-bold text-base text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency(pillars?.essentials ?? 0)}
              </span>
            </div>

            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-between border border-emerald-100 dark:border-emerald-900/40">
              <div>
                <span className="font-semibold text-sm text-emerald-800 dark:text-emerald-300 block">2. Deposit to Emergency Reserve</span>
                <span className="text-xs text-emerald-700/80 dark:text-emerald-400/80">Liquid cash emergency buffer</span>
              </div>
              <span className="font-bold text-base text-emerald-700 dark:text-emerald-300 tabular-nums">
                {formatCurrency(pillars?.financialSecurity ?? 0)}
              </span>
            </div>

            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl flex items-center justify-between border border-blue-100 dark:border-blue-900/40">
              <div>
                <span className="font-semibold text-sm text-blue-800 dark:text-blue-300 block">3. Fund DPS & Savings Goals</span>
                <span className="text-xs text-blue-700/80 dark:text-blue-400/80">Committed wealth building products</span>
              </div>
              <span className="font-bold text-base text-blue-700 dark:text-blue-300 tabular-nums">
                {formatCurrency(pillars?.goalsAndFuture ?? 0)}
              </span>
            </div>

            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl flex items-center justify-between border border-amber-100 dark:border-amber-900/40">
              <div>
                <span className="font-semibold text-sm text-amber-800 dark:text-amber-300 block">4. Reserve Sinking Funds</span>
                <span className="text-xs text-amber-700/80 dark:text-amber-400/80">Eid, annual fees & maintenance</span>
              </div>
              <span className="font-bold text-base text-amber-700 dark:text-amber-300 tabular-nums">
                {formatCurrency(pillars?.flexIrregular ?? 0)}
              </span>
            </div>

            <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl flex items-center justify-between border border-purple-100 dark:border-purple-900/40">
              <div>
                <span className="font-semibold text-sm text-purple-800 dark:text-purple-300 block">5. Personal Lifestyle Spending</span>
                <span className="text-xs text-purple-700/80 dark:text-purple-400/80">Safe-to-Spend for entertainment & lifestyle</span>
              </div>
              <span className="font-bold text-base text-purple-700 dark:text-purple-300 tabular-nums">
                {formatCurrency(pillars?.lifestyle ?? 0)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <BudgetConfigPanel onConfigUpdated={loadBudget} />
      )}
    </div>
  );
};
