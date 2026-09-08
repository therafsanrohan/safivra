import { describe, it, expect } from 'vitest';
import {
  calculatePaymentStatus,
  clampDayToMonth,
  generateRecurringOccurrences,
} from '../../../../../packages/finance-engine/src/calendarEngine';
import { RecurringRuleInput } from '../../../../../packages/finance-engine/src/types';

describe('Money Calendar Engine (Scenarios 9 & 10 and Recurrence Rules)', () => {

  it('Scenario 9: Retrying recurring occurrence generation or payments is idempotent', () => {
    const rule: RecurringRuleInput = {
      id: 'rec-rent',
      name: 'Monthly Rent',
      transaction_type: 'expense',
      amount: 15000,
      frequency: 'monthly',
      start_date: '2026-01-01',
      next_occurrence: '2026-09-01',
      account_id: 'acc-1',
      is_active: true,
    };

    const linkedPayments = [
      {
        commitment_type: 'recurring_template',
        commitment_id: 'rec-rent',
        occurrence_date: '2026-09-01',
        amount_paid: 15000,
      },
    ];

    // First call
    const res1 = generateRecurringOccurrences({
      rule,
      rangeStartDate: '2026-09-01',
      rangeEndDate: '2026-09-30',
      todayDate: '2026-09-09',
      linkedPayments,
    });

    // Duplicate/retry call with exact same inputs
    const res2 = generateRecurringOccurrences({
      rule,
      rangeStartDate: '2026-09-01',
      rangeEndDate: '2026-09-30',
      todayDate: '2026-09-09',
      linkedPayments,
    });

    expect(res1.length).toBe(1);
    expect(res2.length).toBe(1);
    expect(res1[0].id).toBe('rec-rent:2026-09-01');
    expect(res2[0].id).toBe('rec-rent:2026-09-01');
    expect(res1[0].status).toBe('paid');
    expect(res2[0].status).toBe('paid');
  });

  it('Scenario 10: Date-only calendar events near midnight remain on local date', () => {
    // Midnight events use date-only strings YYYY-MM-DD
    const dueDateStr = '2026-09-15';
    const status = calculatePaymentStatus({
      totalAmount: 5000,
      amountPaid: 0,
      dueDateStr,
      todayDateStr: '2026-09-15', // Same local date
    });

    expect(status).toBe('due_today');
  });

  it('Handles month-end dates (31st) in shorter months (Feb & April)', () => {
    // Feb 2026 (non-leap year, max 28 days)
    const febDate = clampDayToMonth(2026, 2, 31);
    expect(febDate).toBe('2026-02-28');

    // Feb 2028 (leap year, max 29 days)
    const febLeapDate = clampDayToMonth(2028, 2, 31);
    expect(febLeapDate).toBe('2028-02-29');

    // April 2026 (30 days)
    const aprDate = clampDayToMonth(2026, 4, 31);
    expect(aprDate).toBe('2026-04-30');
  });

  it('Correctly calculates payment statuses for overdue, upcoming, and partial payments', () => {
    const overdue = calculatePaymentStatus({
      totalAmount: 5000,
      amountPaid: 0,
      dueDateStr: '2026-09-01',
      todayDateStr: '2026-09-09',
    });
    expect(overdue).toBe('overdue');

    const partial = calculatePaymentStatus({
      totalAmount: 5000,
      amountPaid: 2000,
      dueDateStr: '2026-09-01',
      todayDateStr: '2026-09-09',
    });
    expect(partial).toBe('partially_paid');

    const upcoming = calculatePaymentStatus({
      totalAmount: 5000,
      amountPaid: 0,
      dueDateStr: '2026-09-20',
      todayDateStr: '2026-09-09',
    });
    expect(upcoming).toBe('upcoming');
  });

});
