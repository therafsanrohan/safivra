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
  actualEssentialExpenses: number; // Historical or estimated essentials
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
  lifestyleExpenseRatio: number;    // % of take-home
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
}

/**
 * Pure deterministic money arithmetic helper to prevent floating point issues.
 */
export function roundMoney(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Centralized calculation engine for Salary Management & Adaptive Budget Intelligence.
 * Safely integrates live income sources, historical ledger transactions, active debt,
 * DPS/FDR commitments, and sinking funds while strictly preventing double-counting.
 */
export async function calculateAdaptiveBudgetIntelligence(
  userId: string,
  selectedScenario: BudgetScenarioType = 'balanced'
): Promise<AdaptiveBudgetAnalysis | null> {
  if (!userId) return null;

  try {
    // ─── PARALLEL FETCH: All 9 independent data sources fire simultaneously ───
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

    const [
      { data: incomeData },
      { data: sinkingData },
      { data: configData },
      { data: loansData },
      { data: cardsData },
      { data: depositData },
      { data: goalsData },
      { data: wealthSummary },
      { data: txHistory },
    ] = await Promise.all([
      (supabase.from('income_sources') as any)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true),

      (supabase.from('budget_sinking_funds') as any)
        .select('id, name, annual_estimated_cost, monthly_reserve_amount, target_month')
        .eq('user_id', userId)
        .eq('is_active', true),

      (supabase.from('budget_configurations') as any)
        .select('emergency_target_months, minimum_buffer_amount, rent_estimate, food_estimate, transport_estimate, utilities_estimate, family_support_estimate')
        .eq('user_id', userId)
        .maybeSingle(),

      (supabase.from('loans') as any)
        .select('monthly_installment, annual_rate')
        .eq('user_id', userId)
        .eq('status', 'active'),

      (supabase.from('credit_cards') as any)
        .select('minimum_payment')
        .eq('user_id', userId)
        .eq('status', 'active'),

      (supabase.from('deposit_products') as any)
        .select('installment_amount, product_type')
        .eq('user_id', userId)
        .eq('status', 'active'),

      (supabase.from('savings_goals') as any)
        .select('target_amount, current_amount, target_date')
        .eq('user_id', userId)
        .eq('status', 'active'),

      (supabase.from('v_wealth_summary') as any)
        .select('liquid_assets, net_worth')
        .eq('user_id', userId)
        .maybeSingle(),

      (supabase.from('ledger_transactions') as any)
        .select('amount, transaction_type, transaction_date')
        .eq('user_id', userId)
        .eq('status', 'posted')
        .gte('transaction_date', sixMonthsAgoStr),
    ]);
    // ─── END PARALLEL FETCH ───────────────────────────────────────────────────

    // 1. Process Income Sources
    const incomeSources: IncomeSourceItem[] = (incomeData ?? []).map((inc: any) => ({
      id: inc.id,
      name: inc.name,
      incomeType: inc.income_type,
      frequency: inc.frequency,
      stability: (inc.stability as IncomeStability) || 'stable',
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

    // Conservative Planning Income (80% weighting on variable/unstable sources)
    let variableIncomeTotal = 0;
    let stableIncomeTotal = 0;

    incomeSources.forEach((inc) => {
      if (inc.stability === 'variable' || inc.stability === 'unstable') {
        variableIncomeTotal += inc.netTakehomeAmount;
      } else {
        stableIncomeTotal += inc.netTakehomeAmount;
      }
    });

    const conservativePlanningIncome = roundMoney(
      stableIncomeTotal + variableIncomeTotal * 0.8
    );

    // 2. Process Sinking Funds
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

    // 3. Process Budget Config
    const emergencyTargetMonths = configData?.emergency_target_months
      ? Number(configData.emergency_target_months)
      : 3.0;

    const minimumBufferAmount = configData?.minimum_buffer_amount
      ? Number(configData.minimum_buffer_amount)
      : 5000.00;

    // 4. Process Debt Obligations
    const loanInstallments = (loansData ?? []).reduce(
      (sum: number, l: any) => sum + (Number(l.monthly_installment) || 0),
      0
    );

    const cardMinimums = (cardsData ?? []).reduce(
      (sum: number, c: any) => sum + (Number(c.minimum_payment) || 0),
      0
    );

    const mandatoryDebtPayments = roundMoney(loanInstallments + cardMinimums);

    // 5. Process DPS/Deposit Commitments
    const committedSavingsDps = roundMoney(
      (depositData ?? []).reduce(
        (sum: number, d: any) => sum + (Number(d.installment_amount) || 0),
        0
      )
    );

    // 6. Process Savings Goals Monthly Target
    const activeGoalsTarget = roundMoney(
      (goalsData ?? []).reduce((sum: number, g: any) => {
        const remaining = Math.max(0, Number(g.target_amount) - Number(g.current_amount || 0));
        if (remaining <= 0) return sum;
        if (!g.target_date) return sum + Math.min(remaining, 2000);
        const monthsLeft = Math.max(
          1,
          Math.ceil(
            (new Date(g.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30.4)
          )
        );
        return sum + Math.round(remaining / monthsLeft);
      }, 0)
    );

    // 7. Process Liquid Assets
    const currentLiquidSavings = Number(wealthSummary?.liquid_assets || 0);

    let transactionHistoryMonthsCount = 0;
    let historicalAvgMonthlyExpense = 0;

    if (txHistory && txHistory.length > 0) {
      const dates = txHistory.map((t: any) => new Date(t.transaction_date).getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const diffMonths = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24 * 30.4)));
      transactionHistoryMonthsCount = diffMonths;

      const totalExpense = txHistory
        .filter((t: any) => t.transaction_type === 'expense')
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

      historicalAvgMonthlyExpense = roundMoney(totalExpense / diffMonths);
    }

    // 9. Estimate or Calculate Essential Monthly Expenses
    const userRent = configData?.rent_estimate ? Number(configData.rent_estimate) : 0;
    const userFood = configData?.food_estimate ? Number(configData.food_estimate) : 0;
    const userTransport = configData?.transport_estimate ? Number(configData.transport_estimate) : 0;
    const userUtilities = configData?.utilities_estimate ? Number(configData.utilities_estimate) : 0;
    const userFamily = configData?.family_support_estimate ? Number(configData.family_support_estimate) : 0;

    const userConfiguredEstimatesTotal = userRent + userFood + userTransport + userUtilities + userFamily;

    // Use user estimates if provided, else historical essential expense avg, else 50% baseline
    let actualEssentialExpenses = 0;
    if (userConfiguredEstimatesTotal > 0) {
      actualEssentialExpenses = userConfiguredEstimatesTotal;
    } else if (historicalAvgMonthlyExpense > 0) {
      actualEssentialExpenses = roundMoney(historicalAvgMonthlyExpense * 0.65);
    } else {
      actualEssentialExpenses = roundMoney(totalTakeHomeIncome * 0.50);
    }

    // 10. Emergency Fund Intelligence
    const emergencyTargetAmount = roundMoney(actualEssentialExpenses * emergencyTargetMonths);
    const emergencyGapAmount = Math.max(0, emergencyTargetAmount - currentLiquidSavings);
    const emergencyCoverageMonths = actualEssentialExpenses > 0
      ? roundMoney(currentLiquidSavings / actualEssentialExpenses)
      : 0;

    const recommendedEmergencyContribution = emergencyGapAmount > 0
      ? roundMoney(Math.min(emergencyGapAmount / 6, conservativePlanningIncome * 0.15))
      : 0;

    // 11. Core Budget Pillar Allocations
    let essentialsAlloc = actualEssentialExpenses + mandatoryDebtPayments;
    let securityAlloc = recommendedEmergencyContribution;
    let goalsAlloc = committedSavingsDps + activeGoalsTarget;
    let flexAlloc = sinkingFundMonthlyReserve;
    let debtAccelerationAlloc = 0;
    let lifestyleAlloc = 0;

    // High interest debt check
    const hasHighCostDebt = (loansData ?? []).some((l: any) => Number(l.annual_rate || 0) > 12);
    if (hasHighCostDebt && selectedScenario !== 'savings_focused') {
      debtAccelerationAlloc = roundMoney(conservativePlanningIncome * 0.10);
    }

    // Scenario Tuning
    if (selectedScenario === 'savings_focused') {
      securityAlloc = roundMoney(securityAlloc * 1.25);
      goalsAlloc = roundMoney(goalsAlloc * 1.20);
    } else if (selectedScenario === 'debt_focused') {
      debtAccelerationAlloc = roundMoney(conservativePlanningIncome * 0.15);
      goalsAlloc = roundMoney(goalsAlloc * 0.75);
    } else if (selectedScenario === 'goal_focused') {
      goalsAlloc = roundMoney(goalsAlloc * 1.30);
    }

    // Money Left & Safe-to-Spend
    const committedTotal = essentialsAlloc + securityAlloc + goalsAlloc + flexAlloc + debtAccelerationAlloc;
    const uncommittedMoneyLeft = roundMoney(totalTakeHomeIncome - committedTotal);
    const safeToSpend = roundMoney(
      Math.max(0, conservativePlanningIncome - (essentialsAlloc + securityAlloc + goalsAlloc + flexAlloc + debtAccelerationAlloc + minimumBufferAmount))
    );

    lifestyleAlloc = Math.max(0, roundMoney(uncommittedMoneyLeft - minimumBufferAmount));

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

    // 12. Budget Health Classification & Reason
    let budgetHealth: BudgetHealthState = 'HEALTHY';
    let budgetHealthReason = '';

    if (uncommittedMoneyLeft < 0 || essentialExpenseRatio > 85) {
      budgetHealth = 'DEFICIT';
      budgetHealthReason = 'Your essential costs and debt commitments exceed your monthly take-home income.';
    } else if (essentialExpenseRatio > 70 || debtServiceRatio > 35) {
      budgetHealth = 'AT_RISK';
      budgetHealthReason = 'A large portion of your income goes to mandatory costs and debt, leaving little room for surprises.';
    } else if (safeToSpend < minimumBufferAmount || essentialExpenseRatio > 60) {
      budgetHealth = 'TIGHT';
      budgetHealthReason = 'Your essential commitments leave a tight margin for uncommitted spending this month.';
    } else if (savingsRate >= 20 && emergencyCoverageMonths >= 3) {
      budgetHealth = 'HEALTHY';
      budgetHealthReason = 'Your income comfortably covers essentials, debt, and healthy savings capacity.';
    } else {
      budgetHealth = 'BALANCED';
      budgetHealthReason = 'Your income and expenses are evenly balanced with room for personal flexibility.';
    }

    // 13. Data Confidence State & Reason
    let dataConfidence: DataConfidenceState = 'STARTER';
    let dataConfidenceReason = '';

    if (transactionHistoryMonthsCount >= 6) {
      dataConfidence = 'HIGH_CONFIDENCE';
      dataConfidenceReason = `Personalized budget based on ${transactionHistoryMonthsCount} months of continuous spending history.`;
    } else if (transactionHistoryMonthsCount >= 3) {
      dataConfidence = 'PERSONALIZED';
      dataConfidenceReason = `Personalized budget based on ${transactionHistoryMonthsCount} months of recent transactions.`;
    } else {
      dataConfidence = 'STARTER';
      dataConfidenceReason = 'Starter Budget based on your income & initial estimates. Safivra will refine this as transaction history builds.';
    }

    // 14. Structured Explainability Notes
    const explainabilityNotes: string[] = [];

    if (totalTakeHomeIncome === 0) {
      explainabilityNotes.push('Please register your monthly salary or income sources to unlock personalized budget recommendations.');
    } else {
      explainabilityNotes.push(`Your net monthly take-home planning baseline is ${totalTakeHomeIncome.toLocaleString()} BDT from ${incomeSources.length} source(s).`);
    }

    if (variableIncomeTotal > 0) {
      explainabilityNotes.push(
        `Variable income (${variableIncomeTotal.toLocaleString()} BDT) is conservatively planned at 80% weight to protect against dry months.`
      );
    }

    if (emergencyCoverageMonths < emergencyTargetMonths) {
      explainabilityNotes.push(
        `Your liquid emergency fund currently covers ${emergencyCoverageMonths.toFixed(1)} months of essentials (Target: ${emergencyTargetMonths} months).`
      );
    } else {
      explainabilityNotes.push(
        `Your emergency reserve is secure with ${emergencyCoverageMonths.toFixed(1)} months of essential coverage.`
      );
    }

    if (committedSavingsDps > 0) {
      explainabilityNotes.push(
        `Existing DPS contributions of ${committedSavingsDps.toLocaleString()} BDT/month are automatically included in your savings commitments.`
      );
    }

    if (hasHighCostDebt) {
      explainabilityNotes.push(
        'High-interest debt detected (>12% annual rate). Additional debt payoff allocation is recommended.'
      );
    }

    explainabilityNotes.push(
      `Your Safe-to-Spend allowance is ${safeToSpend.toLocaleString()} BDT after reserving essentials, committed DPS/goals, sinking funds, and a ${minimumBufferAmount.toLocaleString()} BDT cash buffer.`
    );

    return {
      totalGrossIncome,
      totalTakeHomeIncome,
      conservativePlanningIncome,
      variableIncomeAmount: variableIncomeTotal,
      incomeSourcesCount: incomeSources.length,
      actualEssentialExpenses,
      historicalAvgMonthlyExpense,
      transactionHistoryMonthsCount,
      mandatoryDebtPayments,
      committedSavingsDps,
      activeGoalsTarget,
      sinkingFundMonthlyReserve,
      minimumBufferAmount,
      safeToSpend,
      uncommittedMoneyLeft,
      savingsRate,
      essentialExpenseRatio,
      lifestyleExpenseRatio,
      debtServiceRatio,
      pillarAllocations: {
        essentials: essentialsAlloc,
        financialSecurity: securityAlloc,
        goalsAndFuture: goalsAlloc,
        lifestyle: lifestyleAlloc,
        flexIrregular: flexAlloc,
        debtAcceleration: debtAccelerationAlloc,
      },
      recommendedScenario: selectedScenario,
      budgetHealth,
      budgetHealthReason,
      dataConfidence,
      dataConfidenceReason,
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
