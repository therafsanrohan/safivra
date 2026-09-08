import { describe, it, expect } from 'vitest';
import {
  calculateAvailableToSpend,
  calculateForecastTimeline,
} from '../../../../../packages/finance-engine/src/availableToSpend';
import {
  FinancialAccountInput,
  CommitmentInput,
  ProtectedReserveInput,
  HorizonConfig,
} from '../../../../../packages/finance-engine/src/types';

describe('Available to Spend Calculation Engine (Requirement 9 Acceptance Cases)', () => {

  const defaultHorizon: HorizonConfig = {
    type: 'month_end',
    endDate: '2026-09-30',
  };
  const todayDate = '2026-09-09';

  it('Scenario 1: 50k eligible, 15k commitments, 10k separate protected => 25k Available to Spend', () => {
    const accounts: FinancialAccountInput[] = [
      {
        id: 'acc-1',
        name: 'Main Bank Account',
        account_type: 'bank',
        account_class: 'asset',
        balance: 50000,
        currency_code: 'BDT',
        is_active: true,
        is_archived: false,
        include_in_total: true,
      },
    ];

    const commitments: CommitmentInput[] = [
      {
        id: 'com-1',
        title: 'Electricity & Rent',
        commitment_type: 'recurring_template',
        total_amount: 15000,
        amount_paid: 0,
        due_date: '2026-09-15',
        currency_code: 'BDT',
      },
    ];

    const protectedReserves: ProtectedReserveInput[] = [
      {
        id: 'res-1',
        name: 'Emergency Fund Reserve',
        amount: 10000,
        account_id: 'acc-1',
      },
    ];

    const result = calculateAvailableToSpend({
      accounts,
      commitments,
      protectedReserves,
      horizon: defaultHorizon,
      todayDate,
    });

    expect(result.eligibleCurrentFunds).toBe(50000);
    expect(result.totalCommitments).toBe(15000);
    expect(result.totalProtectedFunds).toBe(10000);
    expect(result.availableToSpend).toBe(25000);
    expect(result.isNegative).toBe(false);
    expect(result.shortfall).toBe(0);
  });

  it('Scenario 2: Expected salary of 30k changes forecast, but Available to Spend remains 25k', () => {
    const accounts: FinancialAccountInput[] = [
      {
        id: 'acc-1',
        name: 'Bank',
        account_type: 'bank',
        account_class: 'asset',
        balance: 50000,
        currency_code: 'BDT',
        is_active: true,
        is_archived: false,
        include_in_total: true,
      },
    ];

    const commitments: CommitmentInput[] = [
      {
        id: 'com-1',
        title: 'Bills',
        commitment_type: 'recurring_template',
        total_amount: 15000,
        amount_paid: 0,
        due_date: '2026-09-15',
        currency_code: 'BDT',
      },
    ];

    const protectedReserves: ProtectedReserveInput[] = [
      {
        id: 'res-1',
        name: 'Emergency Reserve',
        amount: 10000,
        account_id: 'acc-1',
      },
    ];

    // Available to spend does NOT include unreceived salary of 30,000
    const result = calculateAvailableToSpend({
      accounts,
      commitments,
      protectedReserves,
      horizon: defaultHorizon,
      todayDate,
    });

    expect(result.availableToSpend).toBe(25000);

    // But forecast timeline DOES include expected salary inflow on Sep 25
    const forecast = calculateForecastTimeline({
      startingEligibleFunds: result.eligibleCurrentFunds,
      events: [
        { id: 'sal-1', title: 'Salary Inflow', type: 'inflow', amount: 30000, date: '2026-09-25' },
        { id: 'com-1', title: 'Bills', type: 'outflow', amount: 15000, date: '2026-09-15' },
      ],
      todayDate,
      endDate: defaultHorizon.endDate,
    });

    expect(forecast.startingBalance).toBe(50000);
    expect(forecast.endingBalance).toBe(65000); // 50k + 30k - 15k = 65k
  });

  it('Scenario 3: Excluded savings account containing 10k is NOT deducted again as protected money', () => {
    const accounts: FinancialAccountInput[] = [
      {
        id: 'acc-bank',
        name: 'Checking Account',
        account_type: 'bank',
        account_class: 'asset',
        balance: 50000,
        currency_code: 'BDT',
        is_active: true,
        is_archived: false,
        include_in_total: true,
      },
      {
        id: 'acc-savings',
        name: 'High-Yield Savings DPS',
        account_type: 'savings', // Excluded savings account!
        account_class: 'asset',
        balance: 10000,
        currency_code: 'BDT',
        is_active: true,
        is_archived: false,
        include_in_total: true,
      },
    ];

    const commitments: CommitmentInput[] = [
      {
        id: 'com-1',
        title: 'Bills',
        commitment_type: 'recurring_template',
        total_amount: 15000,
        amount_paid: 0,
        due_date: '2026-09-15',
        currency_code: 'BDT',
      },
    ];

    const result = calculateAvailableToSpend({
      accounts,
      commitments,
      protectedReserves: [], // No separate reserve within checking
      horizon: defaultHorizon,
      todayDate,
    });

    // Savings account (10k) was already excluded from eligible funds (50k checking)
    expect(result.eligibleCurrentFunds).toBe(50000);
    expect(result.totalCommitments).toBe(15000);
    expect(result.totalProtectedFunds).toBe(0);
    expect(result.availableToSpend).toBe(35000);
  });

  it('Scenario 4: 5k reserve assigned to same 5k bill reduces availability by 5k, not 10k', () => {
    const accounts: FinancialAccountInput[] = [
      {
        id: 'acc-1',
        name: 'Bank',
        account_type: 'bank',
        account_class: 'asset',
        balance: 50000,
        currency_code: 'BDT',
        is_active: true,
        is_archived: false,
        include_in_total: true,
      },
    ];

    const commitments: CommitmentInput[] = [
      {
        id: 'bill-rent',
        title: 'Apartment Rent',
        commitment_type: 'recurring_template',
        total_amount: 5000,
        amount_paid: 0,
        due_date: '2026-09-15',
        currency_code: 'BDT',
      },
    ];

    const protectedReserves: ProtectedReserveInput[] = [
      {
        id: 'res-rent',
        name: 'Rent Reserve',
        amount: 5000,
        account_id: 'acc-1',
        linked_commitment_id: 'bill-rent', // Overlap linked!
      },
    ];

    const result = calculateAvailableToSpend({
      accounts,
      commitments,
      protectedReserves,
      horizon: defaultHorizon,
      todayDate,
    });

    expect(result.eligibleCurrentFunds).toBe(50000);
    expect(result.totalCommitments).toBe(5000);
    expect(result.totalProtectedFunds).toBe(0); // Deducted amount is 0 because linked commitment is deducted!
    expect(result.availableToSpend).toBe(45000); // 50,000 - 5,000 = 45,000 (reduced by 5,000, not 10,000)
  });

  it('Scenario 5: Paying a 5k bill reduces cash by 5k and commitments by 5k => Available to Spend stays 25k', () => {
    // Before payment: cash = 50,000, commitments = 15,000, protected = 10,000 => ATS = 25,000
    // After paying 5,000 bill from bank:
    const accountsAfter: FinancialAccountInput[] = [
      {
        id: 'acc-1',
        name: 'Bank',
        account_type: 'bank',
        account_class: 'asset',
        balance: 45000, // Reduced by 5,000
        currency_code: 'BDT',
        is_active: true,
        is_archived: false,
        include_in_total: true,
      },
    ];

    const commitmentsAfter: CommitmentInput[] = [
      {
        id: 'com-paid',
        title: 'Paid Bill',
        commitment_type: 'recurring_template',
        total_amount: 5000,
        amount_paid: 5000, // Fully paid! Remaining = 0
        due_date: '2026-09-15',
        currency_code: 'BDT',
        status: 'paid',
      },
      {
        id: 'com-unpaid',
        title: 'Remaining Bills',
        commitment_type: 'recurring_template',
        total_amount: 10000,
        amount_paid: 0,
        due_date: '2026-09-20',
        currency_code: 'BDT',
      },
    ];

    const protectedReserves: ProtectedReserveInput[] = [
      {
        id: 'res-1',
        name: 'Emergency Reserve',
        amount: 10000,
        account_id: 'acc-1',
      },
    ];

    const result = calculateAvailableToSpend({
      accounts: accountsAfter,
      commitments: commitmentsAfter,
      protectedReserves,
      horizon: defaultHorizon,
      todayDate,
    });

    expect(result.eligibleCurrentFunds).toBe(45000);
    expect(result.totalCommitments).toBe(10000);
    expect(result.totalProtectedFunds).toBe(10000);
    expect(result.availableToSpend).toBe(25000); // ATS remains unchanged at 25,000!
  });

  it('Scenario 6: 2k partial payment against 5k bill leaves 3k outstanding commitment', () => {
    const commitments: CommitmentInput[] = [
      {
        id: 'bill-partial',
        title: 'Utility Bill',
        commitment_type: 'recurring_template',
        total_amount: 5000,
        amount_paid: 2000, // 2,000 partial payment
        due_date: '2026-09-15',
        currency_code: 'BDT',
      },
    ];

    const result = calculateAvailableToSpend({
      accounts: [
        {
          id: 'acc-1',
          name: 'Cash',
          account_type: 'cash',
          account_class: 'asset',
          balance: 10000,
          currency_code: 'BDT',
          is_active: true,
          is_archived: false,
          include_in_total: true,
        },
      ],
      commitments,
      protectedReserves: [],
      horizon: defaultHorizon,
      todayDate,
    });

    expect(result.totalCommitments).toBe(3000);
    expect(result.availableToSpend).toBe(7000); // 10,000 - 3,000 = 7,000
  });

  it('Scenario 7: Transferring 3k between included accounts does not change aggregate availability', () => {
    // Before: Bank 30k, Cash 20k => 50k
    // After transferring 3k from Bank to Cash: Bank 27k, Cash 23k => 50k
    const accountsTransferred: FinancialAccountInput[] = [
      {
        id: 'acc-bank',
        name: 'Bank',
        account_type: 'bank',
        account_class: 'asset',
        balance: 27000,
        currency_code: 'BDT',
        is_active: true,
        is_archived: false,
        include_in_total: true,
      },
      {
        id: 'acc-cash',
        name: 'Cash Wallet',
        account_type: 'cash',
        account_class: 'asset',
        balance: 23000,
        currency_code: 'BDT',
        is_active: true,
        is_archived: false,
        include_in_total: true,
      },
    ];

    const result = calculateAvailableToSpend({
      accounts: accountsTransferred,
      commitments: [
        {
          id: 'c-1',
          title: 'Bill',
          commitment_type: 'recurring_template',
          total_amount: 15000,
          amount_paid: 0,
          due_date: '2026-09-15',
          currency_code: 'BDT',
        },
      ],
      protectedReserves: [
        { id: 'r-1', name: 'Reserve', amount: 10000, account_id: 'acc-bank' },
      ],
      horizon: defaultHorizon,
      todayDate,
    });

    expect(result.eligibleCurrentFunds).toBe(50000);
    expect(result.availableToSpend).toBe(25000);
  });

  it('Scenario 8: Negative result remains visible as a shortfall (-5,000)', () => {
    const result = calculateAvailableToSpend({
      accounts: [
        {
          id: 'acc-1',
          name: 'Bank',
          account_type: 'bank',
          account_class: 'asset',
          balance: 10000,
          currency_code: 'BDT',
          is_active: true,
          is_archived: false,
          include_in_total: true,
        },
      ],
      commitments: [
        {
          id: 'c-1',
          title: 'Big Bill',
          commitment_type: 'recurring_template',
          total_amount: 15000,
          amount_paid: 0,
          due_date: '2026-09-15',
          currency_code: 'BDT',
        },
      ],
      protectedReserves: [],
      horizon: defaultHorizon,
      todayDate,
    });

    expect(result.availableToSpend).toBe(-5000);
    expect(result.isNegative).toBe(true);
    expect(result.shortfall).toBe(5000);
    expect(result.suggestedDailyAllocation).toBe(0); // Suggested daily allocation capped at 0
  });

  it('Chronological Forecast Timeline detects mid-month cash dip', () => {
    const forecast = calculateForecastTimeline({
      startingEligibleFunds: 10000,
      events: [
        { id: 'e-1', title: 'Early Rent Outflow', type: 'outflow', amount: 12000, date: '2026-09-12' },
        { id: 'e-2', title: 'Late Salary Inflow', type: 'inflow', amount: 30000, date: '2026-09-25' },
      ],
      todayDate: '2026-09-09',
      endDate: '2026-09-30',
    });

    expect(forecast.hasMidPeriodShortfall).toBe(true);
    expect(forecast.minBalance).toBe(-2000);
    expect(forecast.minBalanceDate).toBe('2026-09-12');
    expect(forecast.endingBalance).toBe(28000); // Positive month end (28k), but caught mid-month dip (-2k)!
  });

});
