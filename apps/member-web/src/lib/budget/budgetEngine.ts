import { supabase } from '@/lib/supabase/client';

export type IncomeStability = 'stable' | 'variable' | 'unstable';
export type BudgetHealthState = 'HEALTHY' | 'BALANCED' | 'TIGHT' | 'AT_RISK' | 'DEFICIT';
export type DataConfidenceState = 'HIGH_CONFIDENCE' | 'PERSONALIZED' | 'STARTER';
export type BudgetScenarioType = 'balanced' | 'savings_focused' | 'debt_focused' | 'goal_focused';

export interface IncomeSourceItem {
  id: string;
  name: string;
  incomeType: string;
  frequency: string;
  stability: IncomeStability;
  grossAmount?: number;
  deductionsAmount?: number;
  netTakehomeAmount: number;
  paymentDay?: number;
  receivingAccountId?: string;
  receivingAccountName?: string;
  isActive: boolean;
}

export interface SinkingFundItem {
  id: string;
  name: string;
  annualEstimatedCost: number;
  monthlyReserveAmount: number;
  targetMonth?: number;
}

export interface BudgetPillarsBreakdown {
  essentials: number;
  financialSecurity: number;
  goalsAndFuture: number;
  lifestyle: number;
  flexIrregular: number;
  debtAcceleration: number;
}

export interface EmergencyFundIntelligence {
  essentialMonthlyCost: number;
  currentLiquidSavings: number;
  currentCoverageMonths: number;
  targetMonths: number;
  targetAmount: number;
  gapAmount: number;
  recommendedMonthlyContribution: number;
}

export interface AdaptiveBudgetAnalysis {
  // Income Breakdown
  totalGrossIncome: number;
  totalTakeHomeIncome: number;
  conservativePlanningIncome: number;
  variableIncomeAmount: number;
  incomeSourcesCount: number;

  // Actual Commitments & Historical Expenses
  actualEssentialExpenses: number;
  historicalAvgMonthlyExpense: number;
  transactionHistoryMonthsCount: number;
  mandatoryDebtPayments: number;
  committedSavingsDps: number;
  activeGoalsTarget: number;
  sinkingFundMonthlyReserve: number;
  minimumBufferAmount: number;

  // Key Outputs
  safeToSpend: number;
  uncommittedMoneyLeft: number;
  savingsRate: number;              // % of take-home
  essentialExpenseRatio: number;    // % of take-home
  lifestyleExpenseRatio: number;    // % of take-home (amount stored in pillarAllocations.lifestyle)
  debtServiceRatio: number;         // % of take-home

  // 5 Core Budget Pillars
  pillarAllocations: BudgetPillarsBreakdown;
  recommendedScenario: BudgetScenarioType;

  // Intelligence & Explanations
  budgetHealth: BudgetHealthState;
  budgetHealthReason: string;
  dataConfidence: DataConfidenceState;
  dataConfidenceReason: string;
  emergencyFund: EmergencyFundIntelligence;
  explainabilityNotes: string[];

  // Income trend (NEW — from backend calculation)
  incomeTrendPct: number | null;    // % change vs prior 3 months
  recent3mIncome: number | null;
  prior3mIncome: number | null;

  // Flags
  hasHighCostDebt: boolean;
  calculatedAt: string;
}

/**
 * Pure deterministic money arithmetic helper to prevent floating point issues.
 */
export function roundMoney(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Calls the PostgreSQL RPC `calculate_adaptive_budget` which executes all
 * financial calculations server-side using 17 CTEs in a single round-trip.
 *
 * Performance: 1 network request vs the previous 9 sequential Supabase queries.
 * All math (income weighting, emergency fund, debt ratios, pillar allocations,
 * health classification, confidence scoring, income trend) happens inside
 * the database engine.
 */
export async function calculateAdaptiveBudgetIntelligence(
  userId: string,
  selectedScenario: BudgetScenarioType = 'balanced'
): Promise<AdaptiveBudgetAnalysis | null> {
  if (!userId) return null;

  try {
    const { data, error } = await (supabase.rpc as any)(
      'calculate_adaptive_budget',
      {
        p_user_id:  userId,
        p_scenario: selectedScenario,
      }
    );

    if (error) {
      console.error('[BudgetEngine] RPC error:', error);
      throw error;
    }

    if (!data || typeof data !== 'object') {
      throw new Error('RPC returned invalid data format: ' + JSON.stringify(data));
    }

    // Map the JSONB response from the RPC to our TypeScript interface
    const d = data as Record<string, any>;

    const analysis: AdaptiveBudgetAnalysis = {
      // Income
      incomeSourcesCount:          Number(d.incomeSourcesCount          ?? 0),
      totalGrossIncome:            Number(d.totalGrossIncome            ?? 0),
      totalTakeHomeIncome:         Number(d.totalTakeHomeIncome         ?? 0),
      conservativePlanningIncome:  Number(d.conservativePlanningIncome  ?? 0),
      variableIncomeAmount:        Number(d.variableIncomeAmount        ?? 0),

      // Commitments
      actualEssentialExpenses:     Number(d.actualEssentialExpenses     ?? 0),
      mandatoryDebtPayments:       Number(d.mandatoryDebtPayments       ?? 0),
      committedSavingsDps:         Number(d.committedSavingsDps         ?? 0),
      activeGoalsTarget:           Number(d.activeGoalsTarget           ?? 0),
      sinkingFundMonthlyReserve:   Number(d.sinkingFundMonthlyReserve   ?? 0),
      minimumBufferAmount:         Number(d.minimumBufferAmount         ?? 5000),

      // History
      historicalAvgMonthlyExpense:   Number(d.historicalAvgMonthlyExpense  ?? 0),
      transactionHistoryMonthsCount: Number(d.transactionHistoryMonthsCount ?? 0),

      // Key Outputs
      safeToSpend:           Number(d.safeToSpend          ?? 0),
      uncommittedMoneyLeft:  Number(d.uncommittedMoneyLeft ?? 0),
      savingsRate:           Number(d.savingsRate          ?? 0),
      essentialExpenseRatio: Number(d.essentialExpenseRatio ?? 0),
      lifestyleExpenseRatio: Number(d.pillarAllocations?.lifestyle ?? 0),
      debtServiceRatio:      Number(d.debtServiceRatio     ?? 0),

      // Pillars
      pillarAllocations: {
        essentials:        Number(d.pillarAllocations?.essentials        ?? 0),
        financialSecurity: Number(d.pillarAllocations?.financialSecurity ?? 0),
        goalsAndFuture:    Number(d.pillarAllocations?.goalsAndFuture    ?? 0),
        lifestyle:         Number(d.pillarAllocations?.lifestyle         ?? 0),
        flexIrregular:     Number(d.pillarAllocations?.flexIrregular     ?? 0),
        debtAcceleration:  Number(d.pillarAllocations?.debtAcceleration  ?? 0),
      },

      recommendedScenario: (d.scenario as BudgetScenarioType) ?? selectedScenario,

      // Health
      budgetHealth:       (d.budgetHealth      as BudgetHealthState)       ?? 'BALANCED',
      budgetHealthReason:  d.budgetHealthReason ?? '',

      // Confidence
      dataConfidence:      (d.dataConfidence    as DataConfidenceState)    ?? 'STARTER',
      dataConfidenceReason: d.dataConfidenceReason ?? '',

      // Emergency Fund
      emergencyFund: {
        essentialMonthlyCost:           Number(d.emergencyFund?.essentialMonthlyCost           ?? 0),
        currentLiquidSavings:           Number(d.emergencyFund?.currentLiquidSavings           ?? 0),
        currentCoverageMonths:          Number(d.emergencyFund?.currentCoverageMonths          ?? 0),
        targetMonths:                   Number(d.emergencyFund?.targetMonths                   ?? 3),
        targetAmount:                   Number(d.emergencyFund?.targetAmount                   ?? 0),
        gapAmount:                      Number(d.emergencyFund?.gapAmount                      ?? 0),
        recommendedMonthlyContribution: Number(d.emergencyFund?.recommendedMonthlyContribution ?? 0),
      },

      // Income Trend (new from backend)
      incomeTrendPct: d.incomeTrendPct != null ? Number(d.incomeTrendPct) : null,
      recent3mIncome: d.recent3mIncome != null ? Number(d.recent3mIncome) : null,
      prior3mIncome:  d.prior3mIncome  != null ? Number(d.prior3mIncome)  : null,

      // Flags
      hasHighCostDebt: Boolean(d.hasHighCostDebt ?? false),
      calculatedAt:    String(d.calculatedAt ?? new Date().toISOString()),

      // Explainability notes are now built client-side from structured data
      // (avoids storing string arrays in JSONB which is harder to i18n)
      explainabilityNotes: buildExplainabilityNotes(d),
    };

    return analysis;
  } catch (err) {
    console.error('[BudgetEngine] Unexpected error:', err);
    return null;
  }
}

/**
 * Builds human-readable explainability notes from the structured RPC response.
 * Runs client-side so notes can eventually be i18n'd without a backend change.
 */
function buildExplainabilityNotes(d: Record<string, any>): string[] {
  const notes: string[] = [];
  const takehome = Number(d.totalTakeHomeIncome ?? 0);
  const sources  = Number(d.incomeSourcesCount  ?? 0);
  const variable = Number(d.variableIncomeAmount ?? 0);
  const buffer   = Number(d.minimumBufferAmount  ?? 5000);
  const safe     = Number(d.safeToSpend          ?? 0);
  const dps      = Number(d.committedSavingsDps  ?? 0);
  const ef       = d.emergencyFund as Record<string, any> ?? {};
  const trend    = d.incomeTrendPct != null ? Number(d.incomeTrendPct) : null;

  if (takehome === 0) {
    notes.push('Add your monthly salary or income sources to unlock personalized budget recommendations.');
    return notes;
  }

  notes.push(
    `Net monthly take-home is ${takehome.toLocaleString()} BDT across ${sources} income source${sources !== 1 ? 's' : ''}.`
  );

  if (variable > 0) {
    notes.push(
      `Variable income (${variable.toLocaleString()} BDT) is planned at 80% weight to protect against lean months.`
    );
  }

  const coverage = Number(ef.currentCoverageMonths ?? 0);
  const target   = Number(ef.targetMonths          ?? 3);
  if (coverage < target) {
    notes.push(
      `Emergency fund covers ${coverage.toFixed(1)} of ${target} target months. Building this protects against unexpected shocks.`
    );
  } else {
    notes.push(
      `Emergency reserve is secure: ${coverage.toFixed(1)} months of essentials covered.`
    );
  }

  if (dps > 0) {
    notes.push(
      `DPS contributions of ${dps.toLocaleString()} BDT/month are included in your savings commitments.`
    );
  }

  if (d.hasHighCostDebt) {
    notes.push('High-interest debt (>12% p.a.) detected. Extra debt payoff allocation is recommended.');
  }

  if (trend !== null) {
    const dir = trend >= 0 ? 'up' : 'down';
    notes.push(
      `Income trend: ${dir} ${Math.abs(trend).toFixed(1)}% vs prior 3 months.`
    );
  }

  notes.push(
    `Safe-to-Spend is ${safe.toLocaleString()} BDT after reserving essentials, savings, sinking funds, and a ${buffer.toLocaleString()} BDT buffer.`
  );

  return notes;
}
