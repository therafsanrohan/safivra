import {
  AvailableToSpendResult,
  CalculationBreakdown,
  CommitmentInput,
  ExcludedAccountDetail,
  FinancialAccountInput,
  ForecastTimelineResult,
  HorizonConfig,
  ProtectedReserveInput,
  TimelineDay,
  ExpectedCashMovement,
} from './types';

/**
 * Returns number of remaining calendar days in local timezone including today.
 * e.g., if today is Sep 9 and horizon is Sep 30, remaining days = 22.
 */
export function getRemainingDays(todayStr: string, endDateStr: string): number {
  const t = new Date(todayStr + 'T00:00:00');
  const e = new Date(endDateStr + 'T00:00:00');
  const diffMs = e.getTime() - t.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

/**
 * Core Financial Calculation Layer: Available to Spend
 */
export function calculateAvailableToSpend(params: {
  accounts: FinancialAccountInput[];
  commitments: CommitmentInput[];
  protectedReserves: ProtectedReserveInput[];
  horizon: HorizonConfig;
  todayDate: string; // YYYY-MM-DD
  currencyCode?: string;
}): AvailableToSpendResult {
  const {
    accounts,
    commitments,
    protectedReserves,
    horizon,
    todayDate,
    currencyCode = 'BDT',
  } = params;

  const warnings: string[] = [];
  const eligibleAccountsList: Array<{
    id: string;
    name: string;
    account_type: any;
    balance: number;
  }> = [];

  const excludedAccountsList: ExcludedAccountDetail[] = [];

  let eligibleCurrentFunds = 0;

  // 1. ELIGIBLE CURRENT FUNDS CALCULATION
  for (const acc of accounts) {
    const bal = typeof acc.balance === 'number' ? acc.balance : parseFloat(acc.balance || '0');
    
    // Check currency mismatch warning
    if (acc.currency_code && acc.currency_code !== currencyCode) {
      warnings.push(`Account "${acc.name}" uses ${acc.currency_code} (reporting in ${currencyCode}).`);
    }

    if (!acc.is_active || acc.is_archived) {
      excludedAccountsList.push({
        id: acc.id,
        name: acc.name,
        account_type: acc.account_type,
        balance: bal,
        reason: 'Inactive or archived account',
      });
      continue;
    }

    // Exclude liabilities (e.g. credit cards, loans)
    if (acc.account_class === 'liability' || acc.account_type === 'credit_card' || acc.account_type === 'loan') {
      excludedAccountsList.push({
        id: acc.id,
        name: acc.name,
        account_type: acc.account_type,
        balance: bal,
        reason: acc.account_type === 'credit_card' 
          ? 'Credit limits are borrowed capacity, not cash funds'
          : 'Liability loan account',
      });
      continue;
    }

    // Exclude non-liquid asset types
    if (
      acc.account_type === 'savings' ||
      acc.account_type === 'investment' ||
      acc.account_type === 'receivable'
    ) {
      excludedAccountsList.push({
        id: acc.id,
        name: acc.name,
        account_type: acc.account_type,
        balance: bal,
        reason: acc.account_type === 'savings'
          ? 'Savings account excluded from spending balance'
          : `${acc.account_type} account excluded from liquid spending`,
      });
      continue;
    }

    // Exclude explicitly unflagged accounts
    if (acc.include_in_total === false) {
      excludedAccountsList.push({
        id: acc.id,
        name: acc.name,
        account_type: acc.account_type,
        balance: bal,
        reason: 'Explicitly excluded from total balance by user setting',
      });
      continue;
    }

    // Include liquid spending accounts (bank, cash, mobile_financial_service, other_asset)
    eligibleCurrentFunds += bal;
    eligibleAccountsList.push({
      id: acc.id,
      name: acc.name,
      account_type: acc.account_type,
      balance: bal,
    });
  }

  // 2. OUTSTANDING COMMITMENTS CALCULATION (within horizon)
  let totalCommitments = 0;
  const deductedCommitmentsList: Array<{
    id: string;
    title: string;
    commitment_type: any;
    due_date: string;
    total_amount: number;
    amount_paid: number;
    remaining_amount: number;
  }> = [];

  const deductedCommitmentIds = new Set<string>();

  for (const c of commitments) {
    if (c.status === 'cancelled' || c.status === 'skipped' || c.status === 'paid') {
      continue;
    }

    // Include if due_date <= horizon.endDate or if overdue (due_date < todayDate)
    const isOverdue = c.due_date < todayDate;
    const isWithinHorizon = c.due_date <= horizon.endDate;

    if (isOverdue || isWithinHorizon) {
      const remaining = Math.max(0, c.total_amount - (c.amount_paid || 0));
      if (remaining > 0) {
        totalCommitments += remaining;
        deductedCommitmentsList.push({
          id: c.id,
          title: c.title,
          commitment_type: c.commitment_type,
          due_date: c.due_date,
          total_amount: c.total_amount,
          amount_paid: c.amount_paid || 0,
          remaining_amount: remaining,
        });
        deductedCommitmentIds.add(c.id);
      }
    }
  }

  // 3. PROTECTED FUNDS CALCULATION & OVERLAP DEDUPLICATION
  let totalProtectedFunds = 0;
  const processedReservesList: Array<{
    id: string;
    name: string;
    amount: number;
    account_id: string;
    linked_commitment_id?: string | null;
    deducted_amount: number;
    reason?: string;
  }> = [];

  const unresolvedOverlaps: Array<{
    reserve_id: string;
    reserve_name: string;
    reserve_amount: number;
    matching_commitment_id: string;
    matching_commitment_title: string;
  }> = [];

  for (const r of protectedReserves) {
    const isLinkedDeducted = r.linked_commitment_id && deductedCommitmentIds.has(r.linked_commitment_id);

    if (isLinkedDeducted) {
      // Overlap: Reserve is allocated to a commitment already deducted in this horizon!
      processedReservesList.push({
        id: r.id,
        name: r.name,
        amount: r.amount,
        account_id: r.account_id,
        linked_commitment_id: r.linked_commitment_id,
        deducted_amount: 0,
        reason: 'Already allocated to a deducted commitment within planning horizon (no double deduction)',
      });
    } else {
      // Check for unlinked potential name/amount overlap with commitments
      if (!r.linked_commitment_id) {
        const potentialMatch = commitments.find(
          (c) =>
            deductedCommitmentIds.has(c.id) &&
            c.title.toLowerCase().trim() === r.name.toLowerCase().trim() &&
            c.total_amount === r.amount
        );
        if (potentialMatch) {
          unresolvedOverlaps.push({
            reserve_id: r.id,
            reserve_name: r.name,
            reserve_amount: r.amount,
            matching_commitment_id: potentialMatch.id,
            matching_commitment_title: potentialMatch.title,
          });
        }
      }

      totalProtectedFunds += r.amount;
      processedReservesList.push({
        id: r.id,
        name: r.name,
        amount: r.amount,
        account_id: r.account_id,
        linked_commitment_id: r.linked_commitment_id,
        deducted_amount: r.amount,
        reason: 'Protected reserve held in spending account',
      });
    }
  }

  // 4. FINAL AVAILABLE TO SPEND RESULT
  const availableToSpend = eligibleCurrentFunds - totalCommitments - totalProtectedFunds;
  const isNegative = availableToSpend < 0;
  const shortfall = isNegative ? Math.abs(availableToSpend) : 0;
  const remainingDays = getRemainingDays(todayDate, horizon.endDate);
  const suggestedDailyAllocation = isNegative
    ? 0
    : Math.floor((availableToSpend / remainingDays) * 100) / 100;

  const breakdown: CalculationBreakdown = {
    eligibleAccounts: eligibleAccountsList,
    excludedAccounts: excludedAccountsList,
    commitments: deductedCommitmentsList,
    protectedReserves: processedReservesList,
    unresolvedOverlaps,
  };

  return {
    eligibleCurrentFunds,
    totalCommitments,
    totalProtectedFunds,
    availableToSpend,
    shortfall,
    isNegative,
    remainingDays,
    suggestedDailyAllocation,
    horizon,
    calculatedAt: new Date().toISOString(),
    currency_code: currencyCode,
    breakdown,
    warnings,
  };
}

/**
 * Calculates Chronological Forecast Balance Timeline
 */
export function calculateForecastTimeline(params: {
  startingEligibleFunds: number;
  events: ExpectedCashMovement[];
  todayDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}): ForecastTimelineResult {
  const { startingEligibleFunds, events, todayDate, endDate } = params;

  const timeline: TimelineDay[] = [];
  const eventsByDate = new Map<string, ExpectedCashMovement[]>();

  for (const ev of events) {
    if (!eventsByDate.has(ev.date)) {
      eventsByDate.set(ev.date, []);
    }
    eventsByDate.get(ev.date)!.push(ev);
  }

  let currentBal = startingEligibleFunds;
  let minBal = startingEligibleFunds;
  let minBalDate = todayDate;

  const curr = new Date(todayDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  while (curr.getTime() <= end.getTime()) {
    const dateStr = curr.toISOString().split('T')[0];
    const dayEvents = eventsByDate.get(dateStr) || [];

    let dayInflows = 0;
    let dayOutflows = 0;

    for (const e of dayEvents) {
      if (e.type === 'inflow') {
        dayInflows += e.amount;
      } else {
        dayOutflows += e.amount;
      }
    }

    const startBal = currentBal;
    currentBal = startBal + dayInflows - dayOutflows;

    if (currentBal < minBal) {
      minBal = currentBal;
      minBalDate = dateStr;
    }

    timeline.push({
      date: dateStr,
      startingBalance: startBal,
      inflows: dayInflows,
      outflows: dayOutflows,
      endingBalance: currentBal,
      isShortfall: currentBal < 0,
      events: dayEvents,
    });

    curr.setDate(curr.getDate() + 1);
  }

  return {
    horizonDate: endDate,
    startingBalance: startingEligibleFunds,
    endingBalance: currentBal,
    minBalance: minBal,
    minBalanceDate: minBalDate,
    hasMidPeriodShortfall: minBal < 0,
    timeline,
  };
}
