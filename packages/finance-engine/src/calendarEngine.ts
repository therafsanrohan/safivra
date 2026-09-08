import {
  CalendarEventOccurrence,
  PaymentStatus,
  RecurringRuleInput,
} from './types';

/**
 * Calculates payment status for a commitment occurrence
 */
export function calculatePaymentStatus(params: {
  totalAmount: number;
  amountPaid: number;
  dueDateStr: string;
  todayDateStr: string;
  isSkipped?: boolean;
  isCancelled?: boolean;
}): PaymentStatus {
  const { totalAmount, amountPaid, dueDateStr, todayDateStr, isSkipped, isCancelled } = params;

  if (isCancelled) return 'cancelled';
  if (isSkipped) return 'skipped';
  if (amountPaid >= totalAmount && totalAmount > 0) return 'paid';
  if (amountPaid > 0) return 'partially_paid';
  if (dueDateStr < todayDateStr) return 'overdue';
  if (dueDateStr === todayDateStr) return 'due_today';
  return 'upcoming';
}

/**
 * Returns the maximum days in a given year and month (1-indexed month 1..12).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Clamps a day of month to the valid range for a year and month.
 * e.g., Day 31 in Feb 2026 -> 28; Day 31 in April 2026 -> 30.
 */
export function clampDayToMonth(year: number, month: number, targetDay: number): string {
  const maxDays = getDaysInMonth(year, month);
  const actualDay = Math.min(targetDay, maxDays);
  const yStr = year.toString().padStart(4, '0');
  const mStr = month.toString().padStart(2, '0');
  const dStr = actualDay.toString().padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
}

/**
 * Generates stable occurrences for a recurring template within a bounded date range.
 */
export function generateRecurringOccurrences(params: {
  rule: RecurringRuleInput;
  rangeStartDate: string; // YYYY-MM-DD
  rangeEndDate: string; // YYYY-MM-DD
  todayDate: string; // YYYY-MM-DD
  overrides?: Array<{
    template_id: string;
    occurrence_date: string;
    status: 'skipped' | 'cancelled' | 'modified';
    override_amount?: number | null;
    override_date?: string | null;
  }>;
  linkedPayments?: Array<{
    commitment_type: string;
    commitment_id: string;
    occurrence_date: string;
    amount_paid: number;
  }>;
}): CalendarEventOccurrence[] {
  const { rule, rangeStartDate, rangeEndDate, todayDate, overrides = [], linkedPayments = [] } = params;

  if (!rule.is_active) return [];

  const occurrences: CalendarEventOccurrence[] = [];
  const startParts = rule.start_date.split('-').map(Number);
  const initialYear = startParts[0];
  const initialMonth = startParts[1]; // 1-indexed
  const targetDay = startParts[2];

  const overrideMap = new Map(
    overrides
      .filter((o) => o.template_id === rule.id)
      .map((o) => [o.occurrence_date, o])
  );

  const paymentMap = new Map<string, number>();
  for (const lp of linkedPayments) {
    if (lp.commitment_type === 'recurring_template' && lp.commitment_id === rule.id) {
      const key = `${lp.occurrence_date}`;
      paymentMap.set(key, (paymentMap.get(key) || 0) + lp.amount_paid);
    }
  }

  const rangeStart = new Date(rangeStartDate + 'T00:00:00');
  const rangeEnd = new Date(rangeEndDate + 'T00:00:00');
  const ruleEnd = rule.end_date ? new Date(rule.end_date + 'T00:00:00') : null;

  let currentYear = initialYear;
  let currentMonth = initialMonth;

  // Generate bounded occurrences
  let safetyCounter = 0;
  while (safetyCounter < 500) {
    safetyCounter++;

    let dateStr = '';

    if (rule.frequency === 'weekly') {
      const wDate = new Date(initialYear, initialMonth - 1, targetDay + (safetyCounter - 1) * 7);
      dateStr = wDate.toISOString().split('T')[0];
    } else if (rule.frequency === 'monthly') {
      dateStr = clampDayToMonth(currentYear, currentMonth, targetDay);
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    } else if (rule.frequency === 'quarterly') {
      dateStr = clampDayToMonth(currentYear, currentMonth, targetDay);
      currentMonth += 3;
      if (currentMonth > 12) {
        currentMonth -= 12;
        currentYear++;
      }
    } else if (rule.frequency === 'yearly') {
      dateStr = clampDayToMonth(currentYear, currentMonth, targetDay);
      currentYear++;
    } else {
      break;
    }

    const oDate = new Date(dateStr + 'T00:00:00');

    if (oDate.getTime() > rangeEnd.getTime()) break;

    if (ruleEnd && oDate.getTime() > ruleEnd.getTime()) break;

    if (oDate.getTime() >= rangeStart.getTime()) {
      const ov = overrideMap.get(dateStr);
      const isSkipped = ov?.status === 'skipped';
      const isCancelled = ov?.status === 'cancelled';
      const amt = ov?.override_amount ?? rule.amount;
      const actualDueDate = ov?.override_date ?? dateStr;

      const amtPaid = paymentMap.get(dateStr) || 0;
      const remAmt = Math.max(0, amt - amtPaid);

      const status = calculatePaymentStatus({
        totalAmount: amt,
        amountPaid: amtPaid,
        dueDateStr: actualDueDate,
        todayDateStr: todayDate,
        isSkipped,
        isCancelled,
      });

      const eventType = rule.transaction_type === 'income' ? 'income' : 'bill';

      occurrences.push({
        id: `${rule.id}:${dateStr}`,
        source_id: rule.id,
        title: rule.name,
        event_type: eventType,
        amount: amt,
        currency_code: 'BDT',
        due_date: actualDueDate,
        account_id: rule.account_id,
        category_id: rule.category_id,
        status,
        amount_paid: amtPaid,
        remaining_amount: remAmt,
        is_estimated: false,
        recurrence: rule.frequency,
      });
    }
  }

  return occurrences;
}
