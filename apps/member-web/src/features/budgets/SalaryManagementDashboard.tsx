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
  Lock,
  HeartHandshake,
  TrendingUp,
  CreditCard,
  RefreshCw,
  Settings2,
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
  const [selectedScenario, setSelectedScenario] = useState<BudgetScenarioType>('balanced');
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'sinking_funds' | 'payday' | 'settings'>('overview');

  const loadBudget = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await calculateAdaptiveBudgetIntelligence(user.id, selectedScenario);
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedScenario]);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <Spinner size={32} />
        <p className="text-sm text-[var(--color-text-secondary)]">Analyzing income, commitments & adaptive budget...</p>
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

  const layers = analysis?.layerAllocations;
  const takehome = analysis?.totalTakeHomeIncome ?? 0;

  return (
    <div className="space-y-6 fade-in">
      {/* Header & Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Salary Management & Adaptive Budget
          </h1>
          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Intelligent planning layer based on your real take-home income and historical spending.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-[var(--color-bg-subtle)] p-1 rounded-xl border border-[var(--color-border)] self-start sm:self-auto overflow-x-auto max-w-full">
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
            Flex & Sinking Funds
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

      {/* TABS CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Hero Cards: Safe-to-Spend & Budget Health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Safe-to-Spend Card */}
            <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xl shadow-emerald-600/10 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-400 opacity-20 blur-2xl rounded-full" />
              <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-emerald-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-200" /> Safe-to-Spend
                  </span>
                  <Badge variant="info" className="bg-emerald-500/30 text-white border-emerald-400/40 text-[10px]">
                    Monthly Allowance
                  </Badge>
                </div>

                <div>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm tabular-nums">
                    {formatCurrency(analysis?.safeToSpend ?? 0)}
                  </div>
                  <p className="text-xs text-emerald-100/80 mt-1">
                    Remaining for uncommitted discretionary spending after reserving essentials, savings, debt & sinking funds.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-emerald-500/30 text-xs">
                  <div>
                    <span className="text-emerald-200/80 block text-[10px]">Take-Home</span>
                    <span className="font-semibold">{formatCurrency(analysis?.totalTakeHomeIncome ?? 0)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-200/80 block text-[10px]">Essentials</span>
                    <span className="font-semibold">{formatCurrency(analysis?.actualEssentialExpenses ?? 0)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-200/80 block text-[10px]">DPS & Goals</span>
                    <span className="font-semibold">{formatCurrency((analysis?.committedSavingsDps ?? 0) + (analysis?.activeGoalsTarget ?? 0))}</span>
                  </div>
                  <div>
                    <span className="text-emerald-200/80 block text-[10px]">Buffer</span>
                    <span className="font-semibold">{formatCurrency(analysis?.minimumBufferAmount ?? 0)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Budget Health & Confidence Card */}
            <Card className="p-6 border-[var(--color-border)] flex flex-col justify-between space-y-4 shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Budget Health
                  </span>
                  {analysis?.budgetHealth && (
                    <Badge variant={healthVariantMap[analysis.budgetHealth] ?? 'info'} className="text-xs px-2.5 py-0.5">
                      {analysis.budgetHealth}
                    </Badge>
                  )}
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)]">Savings Rate:</span>
                    <span className="font-bold text-emerald-600">{analysis?.savingsRate}%</span>
                  </div>
                  <ProgressBar value={analysis?.savingsRate ?? 0} max={100} className="h-1.5" />

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[var(--color-text-secondary)]">Essential Ratio:</span>
                    <span className="font-bold">{analysis?.essentialExpenseRatio}%</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)]">Debt Service Ratio:</span>
                    <span className="font-bold text-amber-600">{analysis?.debtServiceRatio}%</span>
                  </div>
                </div>
              </div>

              {/* Data Confidence Indicator */}
              <div className="p-3 bg-[var(--color-bg-subtle)] rounded-xl border border-[var(--color-border)] text-xs flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Data Confidence</span>
                <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1">
                  {analysis?.dataConfidence === 'HIGH' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                  {analysis?.dataConfidence === 'MEDIUM' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                  {analysis?.dataConfidence === 'STARTER' && <HelpCircle className="w-3.5 h-3.5 text-blue-500" />}
                  {analysis?.dataConfidence}
                </span>
              </div>
            </Card>
          </div>

          {/* Scenario Simulator Controls */}
          <Card className="p-5 border-[var(--color-border)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--color-accent)]" /> Budget Scenario Engine
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Simulate different financial priorities without altering actual records.
                </p>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(['balanced', 'savings_focused', 'debt_focused', 'goal_focused'] as BudgetScenarioType[]).map((scen) => (
                  <button
                    key={scen}
                    onClick={() => setSelectedScenario(scen)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
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

          {/* 6 Major Budget Layers */}
          <Card className="p-6 border-[var(--color-border)] space-y-4">
            <h3 className="font-semibold text-base text-[var(--color-text-primary)] flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-emerald-500" />
              The 6 Budget Layers Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Layer 1: Essentials */}
              <div className="p-4 bg-[var(--color-bg-subtle)] rounded-2xl border border-[var(--color-border)] space-y-1">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)] block">A. Essentials</span>
                <span className="text-lg font-bold text-[var(--color-text-primary)] block tabular-nums">
                  {formatCurrency(layers?.essentials ?? 0)}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)] block">Rent, food, utilities, basic transport & minimum debt</span>
              </div>

              {/* Layer 2: Security */}
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">B. Financial Security</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block tabular-nums">
                  {formatCurrency(layers?.financialSecurity ?? 0)}
                </span>
                <span className="text-[10px] text-emerald-600/80 block">Emergency fund reserve & cash buffer</span>
              </div>

              {/* Layer 3: Goals & Future */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-1">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 block">C. Goals & Future</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400 block tabular-nums">
                  {formatCurrency(layers?.goalsAndFuture ?? 0)}
                </span>
                <span className="text-[10px] text-blue-600/80 block">DPS installments, FDR, and Savings Goals</span>
              </div>

              {/* Layer 4: Lifestyle */}
              <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/40 space-y-1">
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 block">D. Lifestyle</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400 block tabular-nums">
                  {formatCurrency(layers?.lifestyle ?? 0)}
                </span>
                <span className="text-[10px] text-purple-600/80 block">Restaurants, shopping, entertainment & hobbies</span>
              </div>

              {/* Layer 5: Flex / Irregular */}
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/40 space-y-1">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block">E. Flex & Sinking Funds</span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400 block tabular-nums">
                  {formatCurrency(layers?.flexIrregular ?? 0)}
                </span>
                <span className="text-[10px] text-amber-600/80 block">Eid, annual insurance, repairs & gifts</span>
              </div>

              {/* Layer 6: Debt Acceleration */}
              <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/40 space-y-1">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block">F. Debt Acceleration</span>
                <span className="text-lg font-bold text-rose-600 dark:text-rose-400 block tabular-nums">
                  {formatCurrency(layers?.debtAcceleration ?? 0)}
                </span>
                <span className="text-[10px] text-rose-600/80 block">Extra principal payoff for high-interest debt</span>
              </div>
            </div>
          </Card>

          {/* Emergency Fund Intelligence Card */}
          {analysis?.emergencyFund && (
            <Card className="p-6 border-[var(--color-border)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Emergency Fund Status
                </h3>
                <Badge
                  variant={
                    analysis.emergencyFund.currentCoverageMonths >= analysis.emergencyFund.targetMonths
                      ? 'positive'
                      : analysis.emergencyFund.currentCoverageMonths >= 1
                      ? 'warning'
                      : 'negative'
                  }
                  className="text-[10px] px-2"
                >
                  {analysis.emergencyFund.currentCoverageMonths.toFixed(1)} / {analysis.emergencyFund.targetMonths} months
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-muted)]">Coverage Progress</span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {formatCurrency(analysis.emergencyFund.currentLiquidSavings)} of {formatCurrency(analysis.emergencyFund.targetAmount)}
                  </span>
                </div>
                <ProgressBar
                  value={Math.min(analysis.emergencyFund.currentCoverageMonths, analysis.emergencyFund.targetMonths)}
                  max={analysis.emergencyFund.targetMonths}
                  className="h-2"
                />
              </div>

              {analysis.emergencyFund.gapAmount > 0 ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40">
                    <span className="text-amber-700 dark:text-amber-400 block text-[10px] uppercase tracking-wide">Gap to Fill</span>
                    <span className="font-bold text-amber-800 dark:text-amber-300 tabular-nums block mt-0.5">
                      {formatCurrency(analysis.emergencyFund.gapAmount)}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase tracking-wide">Recommended Monthly</span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 tabular-nums block mt-0.5">
                      {formatCurrency(analysis.emergencyFund.recommendedMonthlyContribution)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Emergency fund target achieved! Your financial safety net is secure.
                </div>
              )}
            </Card>
          )}

          {/* Explainability Notes ("Why?") */}
          <Card className="p-6 border-[var(--color-border)] space-y-3 bg-[var(--color-bg-surface)]">
            <h3 className="font-semibold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
              <Info className="w-4 h-4 text-[var(--color-accent)]" /> Why Safivra Recommends This Plan
            </h3>
            <div className="space-y-2">
              {analysis?.explainabilityNotes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 2. INCOME SOURCES TAB */}
      {activeTab === 'income' && (
        <IncomeSourcesManager onIncomeUpdated={loadBudget} />
      )}

      {/* 3. SINKING FUNDS TAB */}
      {activeTab === 'sinking_funds' && (
        <SinkingFundsManager onFundsUpdated={loadBudget} />
      )}

      {/* 4. PAYDAY ALLOCATION TAB */}
      {activeTab === 'payday' && (
        <Card className="p-6 border-[var(--color-border)] space-y-6">
          <div>
            <h3 className="font-semibold text-lg text-[var(--color-text-primary)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Payday Allocation Recommendation
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              When your salary of <span className="font-bold text-emerald-600">{formatCurrency(takehome)}</span> arrives, distribute it immediately to maintain financial peace of mind.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-[var(--color-bg-subtle)] rounded-2xl flex items-center justify-between border border-[var(--color-border)]">
              <div>
                <span className="font-semibold text-sm block">1. Cover Essentials & Mandatory Bills</span>
                <span className="text-xs text-[var(--color-text-muted)]">Rent, groceries, utilities, loan EMIs</span>
              </div>
              <span className="font-bold text-base text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency(layers?.essentials ?? 0)}
              </span>
            </div>

            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-between border border-emerald-100 dark:border-emerald-900/40">
              <div>
                <span className="font-semibold text-sm text-emerald-800 dark:text-emerald-300 block">2. Transfer to Emergency Reserve</span>
                <span className="text-xs text-emerald-700/80 dark:text-emerald-400/80">Building 3-6 month safety buffer</span>
              </div>
              <span className="font-bold text-base text-emerald-700 dark:text-emerald-300 tabular-nums">
                {formatCurrency(layers?.financialSecurity ?? 0)}
              </span>
            </div>

            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl flex items-center justify-between border border-blue-100 dark:border-blue-900/40">
              <div>
                <span className="font-semibold text-sm text-blue-800 dark:text-blue-300 block">3. Fund DPS & Savings Goals</span>
                <span className="text-xs text-blue-700/80 dark:text-blue-400/80">Committed monthly wealth builders</span>
              </div>
              <span className="font-bold text-base text-blue-700 dark:text-blue-300 tabular-nums">
                {formatCurrency(layers?.goalsAndFuture ?? 0)}
              </span>
            </div>

            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl flex items-center justify-between border border-amber-100 dark:border-amber-900/40">
              <div>
                <span className="font-semibold text-sm text-amber-800 dark:text-amber-300 block">4. Reserve Sinking Funds</span>
                <span className="text-xs text-amber-700/80 dark:text-amber-400/80">Eid, insurance, annual maintenance</span>
              </div>
              <span className="font-bold text-base text-amber-700 dark:text-amber-300 tabular-nums">
                {formatCurrency(layers?.flexIrregular ?? 0)}
              </span>
            </div>

            <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl flex items-center justify-between border border-purple-100 dark:border-purple-900/40">
              <div>
                <span className="font-semibold text-sm text-purple-800 dark:text-purple-300 block">5. Lifestyle Spending Allowance</span>
                <span className="text-xs text-purple-700/80 dark:text-purple-400/80">Safe-to-Spend for entertainment & personal</span>
              </div>
              <span className="font-bold text-base text-purple-700 dark:text-purple-300 tabular-nums">
                {formatCurrency(layers?.lifestyle ?? 0)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* 5. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <BudgetConfigPanel onConfigUpdated={loadBudget} />
      )}
    </div>
  );
};
