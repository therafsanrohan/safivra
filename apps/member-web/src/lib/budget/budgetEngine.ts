import { supabase } from '@/lib/supabase/client';

export type IncomeStability = 'stable' | 'variable' | 'unstable';
export type BudgetHealthState = 'HEALTHY' | 'BALANCED' | 'TIGHT' | 'AT_RISK' | 'DEFICIT';
export type DataConfidenceState = 'HIGH' | 'MEDIUM' | 'LOW' | 'STARTER';
export type BudgetScenarioType = 'current' | 'balanced' | 'savings_focused' | 'debt_focused' | 'goal_focused';

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

export interface BudgetLayerBreakdown {
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
  // Income
  totalGrossIncome: number;
  totalTakeHomeIncome: number;
  incomeSourcesCount: number;

  // Actual Commitments & Historicals
  actualEssentialExpenses: number;
  mandatoryDebtPayments: number;
  committedSavingsDps: number;
  activeGoalsTarget: number;
  sinkingFundMonthlyReserve: number;
  minimumBufferAmount: number;

  // Calculated Metrics
  safeToSpend: number;
  savingsRate: number;              // % of take-home
  essentialExpenseRatio: number;    // % of take-home
  lifestyleExpenseRatio: number;    // % of take-home
  debtServiceRatio: number;         // % of take-home
  surplusDeficit: number;

  // 6 Major Budget Layers
  layerAllocations: BudgetLayerBreakdown;
  recommendedScenario: BudgetScenarioType;

  // Intelligence States
  budgetHealth: BudgetHealthState;
  dataConfidence: DataConfidenceState;
  emergencyFund: EmergencyFundIntelligence;

  // Explainability Insights ("Why?")
  explainabilityNotes: string[];
}

/**
 * Pure, deterministic monetary arithmetic helper to avoid float precision bugs.
 */

export function roundMoney(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates adaptive budget intelligence for a user by aggregating
 * live income sources, historical ledger entries, active debts, DPS/FDR, and savings goals.
 */
export async function calculateAdaptiveBudgetIntelligence(
  userId: string,
  selectedScenario: BudgetScenarioType = 'balanced'
): Promise<AdaptiveBudgetAnalysis | null> {
  if (!userId) return null;

  try {
    // 1. Fetch Income Sources
    const { data: incomeData } = await (supabase.from('income_sources') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    const incomeSources: IncomeSourceItem[] = (incomeData ?? []).map((inc: any) => ({
      id: inc.id,
      name: inc.name,
      incomeType: inc.income_type,
      frequency: inc.frequency,
      stability: inc.stability as IncomeStability,
      grossAmount: inc.gross_amount ? Number(inc.gross_amount) : undefined,
      deductionsAmount: inc.deductions_amount ? Number(inc.deductions_amount) : undefined,
      netTakehomeAmount: Number(inc.net_takehome_amount) || 0,
      paymentDay: inc.payment_day,
      receivingAccountId: inc.receiving_account_id,
      isActive: inc.is_active,
    }));

    const totalTakeHomeIncome = roundMoney(
      incomeSources.reduce((sum, item) => sum + item.netTakehomeAmount, 0)
    );

    const totalGrossIncome = roundMoney(
      incomeSources.reduce(
        (sum, item) => sum + (item.grossAmount ?? item.netTakehomeAmount),
        0
      )
    );

    // 2. Fetch Sinking Funds
    const { data: sinkingData } = await (supabase.from('budget_sinking_funds') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    const sinkingFunds: SinkingFundItem[] = (sinkingData ?? []).map((sf: any) => ({
      id: sf.id,
      name: sf.name,
      annualEstimatedCost: Number(sf.annual_estimated_cost) || 0,
      monthlyReserveAmount: Number(sf.monthly_reserve_amount) || 0,
      targetMonth: sf.target_month,
    }));

    const sinkingFundMonthlyReserve = roundMoney(
      sinkingFunds.reduce((sum, item) => sum + item.monthlyReserveAmount, 0)
    );

    // 3. Fetch Budget Configurations
    const { data: configData } = await (supabase.from('budget_configurations') as any)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const emergencyTargetMonths = configData?.emergency_target_months
      ? Number(configData.emergency_target_months)
      : 3.0;

    const minimumBufferAmount = configData?.minimum_buffer_amount
      ? Number(configData.minimum_buffer_amount)
      : 5000.00;

    // 4. Fetch Debt Obligations (Loans & Credit Cards)
    const { data: loansData } = await (supabase.from('loans') as any)
      .select('monthly_installment, annual_rate')
      .eq('user_id', userId)
      .eq('status', 'active');

    const { data: cardsData } = await (supabase.from('credit_cards') as any)
      .select('minimum_payment')
      .eq('user_id', userId)
      .eq('status', 'active');

    const loanInstallments = (loansData ?? []).reduce(
      (sum: number, l: any) => sum + (Number(l.monthly_installment) || 0),
      0
    );

    const cardMinimums = (cardsData ?? []).reduce(
      (sum: number, c: any) => sum + (Number(c.minimum_payment) || 0),
      0
    );

    const mandatoryDebtPayments = roundMoney(loanInstallments + cardMinimums);

    // 5. Fetch Deposit Products / DPS Installments
    const { data: depositData } = await (supabase.from('deposit_products') as any)
      .select('installment_amount, product_type')
      .eq('user_id', userId)
      .eq('status', 'active');

    const committedSavingsDps = roundMoney(
      (depositData ?? []).reduce(
        (sum: number, d: any) => sum + (Number(d.installment_amount) || 0),
        0
      )
    );

    // 6. Fetch Savings Goals
    const { data: goalsData } = await (supabase.from('savings_goals') as any)
      .select('target_amount, current_amount, target_date')
      .eq('user_id', userId)
      .eq('status', 'active');

    const activeGoalsTarget = roundMoney(
      (goalsData ?? []).reduce((sum: number, g: any) => {
        const remaining = Math.max(0, Number(g.target_amount) - Number(g.current_amount || 0));
        if (!g.target_date || remaining <= 0) return sum + 2000; // default modest target
        const monthsLeft = Math.max(
          1,
          Math.ceil(
            (new Date(g.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30.4)
          )
        );
        return sum + Math.round(remaining / monthsLeft);
      }, 0)
    );

    // 7. Fetch Liquid Assets from v_wealth_summary
    const { data: wealthSummary } = await (supabase.from('v_wealth_summary') as any)
      .select('liquid_assets, net_worth, data_completeness')
      .eq('user_id', userId)
      .maybeSingle();

    const currentLiquidSavings = Number(wealthSummary?.liquid_assets || 0);

    // 8. Estimate Essential Expenses (Rent, Food, Transport, Utilities, Debt)
    const userRentEstimate = configData?.rent_estimate ? Number(configData.rent_estimate) : 0;
    const userFoodEstimate = configData?.food_estimate ? Number(configData.food_estimate) : 0;
    const userTransportEstimate = configData?.transport_estimate ? Number(configData.transport_estimate) : 0;
    const userUtilitiesEstimate = configData?.utilities_estimate ? Number(configData.utilities_estimate) : 0;
    const userFamilySupport = configData?.family_support_estimate ? Number(configData.family_support_estimate) : 0;

    const totalUserEstimates = userRentEstimate + userFoodEstimate + userTransportEstimate + userUtilitiesEstimate + userFamilySupport;

    // Baseline essentials estimate if 0: 55% of take-home
    const actualEssentialExpenses = roundMoney(
      totalUserEstimates > 0
        ? totalUserEstimates + mandatoryDebtPayments
        : Math.max(mandatoryDebtPayments, totalTakeHomeIncome * 0.55)
    );

    // 9. Emergency Fund Intelligence
    const emergencyTargetAmount = roundMoney(actualEssentialExpenses * emergencyTargetMonths);
    const emergencyGapAmount = Math.max(0, emergencyTargetAmount - currentLiquidSavings);
    const emergencyCoverageMonths = actualEssentialExpenses > 0
      ? roundMoney(currentLiquidSavings / actualEssentialExpenses)
      : 0;

    const recommendedEmergencyContribution = emergencyGapAmount > 0
      ? roundMoney(Math.min(emergencyGapAmount / 6, totalTakeHomeIncome * 0.15))
      : 0;

    // 10. Scenario-Based Layer Allocation
    let essentialsAlloc = actualEssentialExpenses;
    let securityAlloc = recommendedEmergencyContribution;
    let goalsAlloc = committedSavingsDps + activeGoalsTarget;
    let flexAlloc = sinkingFundMonthlyReserve;
    let debtAccelerationAlloc = 0;
    let lifestyleAlloc = 0;

    // High interest debt check
    const hasHighCostDebt = (loansData ?? []).some((l: any) => Number(l.annual_rate || 0) > 12);
    if (hasHighCostDebt && selectedScenario !== 'savings_focused') {
      debtAccelerationAlloc = roundMoney(totalTakeHomeIncome * 0.08);
    }

    // Apply scenario multipliers
    if (selectedScenario === 'savings_focused') {
      securityAlloc = roundMoney(securityAlloc * 1.3);
      goalsAlloc = roundMoney(goalsAlloc * 1.25);
    } else if (selectedScenario === 'debt_focused') {
      debtAccelerationAlloc = roundMoney(totalTakeHomeIncome * 0.15);
      goalsAlloc = roundMoney(goalsAlloc * 0.7);
    } else if (selectedScenario === 'goal_focused') {
      goalsAlloc = roundMoney(goalsAlloc * 1.35);
    }

    // Remaining for Lifestyle & Buffer
    const committedTotal = essentialsAlloc + securityAlloc + goalsAlloc + flexAlloc + debtAccelerationAlloc;
    const remainingForLifestyle = Math.max(0, totalTakeHomeIncome - committedTotal - minimumBufferAmount);
    lifestyleAlloc = roundMoney(remainingForLifestyle);

    // Safe-to-Spend Calculation
    const safeToSpend = roundMoney(
      Math.max(0, totalTakeHomeIncome - (essentialsAlloc + securityAlloc + goalsAlloc + flexAlloc + debtAccelerationAlloc + minimumBufferAmount))
    );

    // Financial Ratios
    const savingsRate = totalTakeHomeIncome > 0
      ? roundMoney(((securityAlloc + goalsAlloc) / totalTakeHomeIncome) * 100)
      : 0;

    const essentialExpenseRatio = totalTakeHomeIncome > 0
      ? roundMoney((essentialsAlloc / totalTakeHomeIncome) * 100)
      : 0;

    const lifestyleExpenseRatio = totalTakeHomeIncome > 0
      ? roundMoney((lifestyleAlloc / totalTakeHomeIncome) * 100)
      : 0;

    const debtServiceRatio = totalTakeHomeIncome > 0
      ? roundMoney((mandatoryDebtPayments / totalTakeHomeIncome) * 100)
      : 0;

    const surplusDeficit = roundMoney(totalTakeHomeIncome - (essentialsAlloc + securityAlloc + goalsAlloc + flexAlloc + lifestyleAlloc));

    // 11. Budget Health Classification
    let budgetHealth: BudgetHealthState = 'HEALTHY';
    if (surplusDeficit < 0 || essentialExpenseRatio > 85) {
      budgetHealth = 'DEFICIT';
    } else if (essentialExpenseRatio > 75 || debtServiceRatio > 40) {
      budgetHealth = 'AT_RISK';
    } else if (safeToSpend < minimumBufferAmount || essentialExpenseRatio > 65) {
      budgetHealth = 'TIGHT';
    } else if (savingsRate >= 15 && emergencyCoverageMonths >= 3) {
      budgetHealth = 'HEALTHY';
    } else {
      budgetHealth = 'BALANCED';
    }

    // 12. Data Confidence State
    let dataConfidence: DataConfidenceState = 'STARTER';
    if (incomeSources.length > 0 && wealthSummary?.data_completeness === 'complete') {
      dataConfidence = 'HIGH';
    } else if (incomeSources.length > 0) {
      dataConfidence = 'MEDIUM';
    } else if (totalUserEstimates > 0) {
      dataConfidence = 'LOW';
    }

    // 13. Generate Explainability Notes ("Why?")
    const explainabilityNotes: string[] = [];

    if (totalTakeHomeIncome === 0) {
      explainabilityNotes.push('Please add your income sources to unlock personalized budget recommendations.');
    } else {
      explainabilityNotes.push(`Your net take-home planning income is ${totalTakeHomeIncome.toLocaleString()} BDT/month across ${incomeSources.length} source(s).`);
    }

    if (emergencyCoverageMonths < emergencyTargetMonths) {
      explainabilityNotes.push(
        `Your liquid emergency reserve covers ${emergencyCoverageMonths.toFixed(1)} months of essential expenses (target: ${emergencyTargetMonths} months). Safivra recommends prioritizing safety savings.`
      );
    } else {
      explainabilityNotes.push(
        `Your emergency reserve is healthy at ${emergencyCoverageMonths.toFixed(1)} months of coverage.`
      );
    }

    if (committedSavingsDps > 0) {
      explainabilityNotes.push(
        `Your committed DPS installments (${committedSavingsDps.toLocaleString()} BDT/month) are automatically factored into your monthly plan.`
      );
    }

    if (hasHighCostDebt) {
      explainabilityNotes.push(
        'High-interest debt detected. Safivra recommends accelerating debt payoff to save on interest.'
      );
    }

    explainabilityNotes.push(
      `Your Safe-to-Spend limit is ${safeToSpend.toLocaleString()} BDT after reserving mandatory essentials, goals, sinking funds, and a ${minimumBufferAmount.toLocaleString()} BDT buffer.`
    );

    return {
      totalGrossIncome,
      totalTakeHomeIncome,
      incomeSourcesCount: incomeSources.length,
      actualEssentialExpenses,
      mandatoryDebtPayments,
      committedSavingsDps,
      activeGoalsTarget,
      sinkingFundMonthlyReserve,
      minimumBufferAmount,
      safeToSpend,
      savingsRate,
      essentialExpenseRatio,
      lifestyleExpenseRatio,
      debtServiceRatio,
      surplusDeficit,
      layerAllocations: {
        essentials: essentialsAlloc,
        financialSecurity: securityAlloc,
        goalsAndFuture: goalsAlloc,
        lifestyle: lifestyleAlloc,
        flexIrregular: flexAlloc,
        debtAcceleration: debtAccelerationAlloc,
      },
      recommendedScenario: selectedScenario,
      budgetHealth,
      dataConfidence,
      emergencyFund: {
        essentialMonthlyCost: actualEssentialExpenses,
        currentLiquidSavings,
        currentCoverageMonths: emergencyCoverageMonths,
        targetMonths: emergencyTargetMonths,
        targetAmount: emergencyTargetAmount,
        gapAmount: emergencyGapAmount,
        recommendedMonthlyContribution: recommendedEmergencyContribution,
      },
      explainabilityNotes,
    };
  } catch (err) {
    console.error('[BudgetEngine] Error calculating adaptive budget:', err);
    return null;
  }
}
