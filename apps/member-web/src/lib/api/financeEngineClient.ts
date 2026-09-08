import { supabase } from '@/lib/supabase/client';
import {
  AvailableToSpendResult,
  calculateAvailableToSpend,
  calculateForecastTimeline,
  CommitmentInput,
  FinancialAccountInput,
  ForecastTimelineResult,
  generateRecurringOccurrences,
  HorizonConfig,
  ProtectedReserveInput,
  CalendarEventOccurrence,
  ExpectedCashMovement,
} from '../../../../../packages/finance-engine/src';

export interface FinanceDataState {
  accounts: FinancialAccountInput[];
  commitments: CommitmentInput[];
  protectedReserves: ProtectedReserveInput[];
  calendarOccurrences: CalendarEventOccurrence[];
  result: AvailableToSpendResult | null;
  forecast: ForecastTimelineResult | null;
  userTimezone: string;
  userCurrency: string;
  paydayDayOfMonth?: number;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export function getDefaultMonthEnd(todayStr: string): string {
  const parts = todayStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const lastDay = new Date(year, month, 0).getDate();
  const mStr = month.toString().padStart(2, '0');
  const dStr = lastDay.toString().padStart(2, '0');
  return `${year}-${mStr}-${dStr}`;
}

export function getNextPaydayDate(todayStr: string, paydayDay: number): string {
  const parts = todayStr.split('-').map(Number);
  let year = parts[0];
  let month = parts[1];
  const currentDay = parts[2];

  if (currentDay > paydayDay) {
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  const maxDays = new Date(year, month, 0).getDate();
  const actualDay = Math.min(paydayDay, maxDays);
  const mStr = month.toString().padStart(2, '0');
  const dStr = actualDay.toString().padStart(2, '0');
  return `${year}-${mStr}-${dStr}`;
}

export async function fetchFinanceData(params: {
  userId: string;
  todayDate: string; // YYYY-MM-DD
  horizonConfig?: HorizonConfig;
}): Promise<FinanceDataState> {
  const { userId, todayDate } = params;

  try {
    const [
      prefRes,
      accRes,
      loansRes,
      cardsRes,
      recRes,
      eventsRes,
      reservesRes,
      paymentsRes,
      overridesRes,
    ] = await Promise.all([
      supabase.from('user_preferences').select('timezone, preferred_currency, payday_day_of_month').eq('user_id', userId).single(),
      supabase.from('v_account_balances').select('*').eq('user_id', userId).eq('is_archived', false),
      (supabase.from('loans') as any).select('*').eq('user_id', userId).eq('status', 'active'),
      (supabase.from('credit_cards') as any).select('*').eq('user_id', userId).eq('status', 'active'),
      (supabase.from('recurring_templates') as any).select('*').eq('user_id', userId).eq('is_active', true),
      (supabase.from('calendar_events') as any).select('*').eq('user_id', userId),
      (supabase.from('protected_reserves') as any).select('*').eq('user_id', userId),
      (supabase.from('commitment_payments') as any).select('*, ledger_transactions!inner(status)').eq('user_id', userId).eq('ledger_transactions.status', 'posted'),
      (supabase.from('occurrence_overrides') as any).select('*').eq('user_id', userId),
    ]);

    const prefData = prefRes.data as any;
    const userTimezone = prefData?.timezone || 'Asia/Dhaka';
    const userCurrency = prefData?.preferred_currency || 'BDT';
    const paydayDayOfMonth = prefData?.payday_day_of_month || undefined;

    // Horizon calculation
    let endDate = getDefaultMonthEnd(todayDate);
    if (params.horizonConfig) {
      if (params.horizonConfig.type === 'payday' && paydayDayOfMonth) {
        endDate = getNextPaydayDate(todayDate, paydayDayOfMonth);
      } else if (params.horizonConfig.type === 'custom' && params.horizonConfig.endDate) {
        endDate = params.horizonConfig.endDate;
      }
    }

    const horizon: HorizonConfig = params.horizonConfig || {
      type: 'month_end',
      endDate,
      startDate: todayDate,
      paydayDayOfMonth,
    };

    // 1. Process Accounts
    const accounts: FinancialAccountInput[] = (accRes.data || []).map((a: any) => ({
      id: a.account_id,
      name: a.name,
      account_type: a.account_type,
      account_class: a.account_class,
      balance: parseFloat(a.balance || '0'),
      currency_code: a.currency_code || userCurrency,
      is_active: a.is_active,
      is_archived: a.is_archived,
      include_in_total: a.include_in_total,
      credit_limit: a.credit_limit ? parseFloat(a.credit_limit) : null,
    }));

    // 2. Process Linked Payments Map
    const paymentsList = (paymentsRes.data || []).map((p: any) => ({
      commitment_type: p.commitment_type,
      commitment_id: p.commitment_id,
      occurrence_date: p.occurrence_date,
      amount_paid: parseFloat(p.amount_paid || '0'),
    }));

    const paymentSumMap = new Map<string, number>();
    for (const p of paymentsList) {
      const key = `${p.commitment_type}:${p.commitment_id}:${p.occurrence_date}`;
      paymentSumMap.set(key, (paymentSumMap.get(key) || 0) + p.amount_paid);
    }

    // 3. Assemble Commitments & Calendar Occurrences
    const commitments: CommitmentInput[] = [];
    const calendarOccurrences: CalendarEventOccurrence[] = [];

    // A. Loans
    for (const l of (loansRes.data || [])) {
      if (l.monthly_installment && l.next_payment_date) {
        const dueDate = l.next_payment_date;
        const key = `loan_instalment:${l.id}:${dueDate}`;
        const paid = paymentSumMap.get(key) || 0;
        const total = parseFloat(l.monthly_installment);

        commitments.push({
          id: `loan_${l.id}_${dueDate}`,
          title: `Loan: ${l.name}`,
          commitment_type: 'loan_instalment',
          total_amount: total,
          amount_paid: paid,
          due_date: dueDate,
          currency_code: userCurrency,
          source_record_id: l.id,
          linked_account_id: l.account_id,
        });

        calendarOccurrences.push({
          id: `loan_${l.id}_${dueDate}`,
          source_id: l.id,
          title: `Loan: ${l.name}`,
          event_type: 'loan',
          amount: total,
          currency_code: userCurrency,
          due_date: dueDate,
          account_id: l.account_id,
          status: paid >= total ? 'paid' : paid > 0 ? 'partially_paid' : dueDate < todayDate ? 'overdue' : dueDate === todayDate ? 'due_today' : 'upcoming',
          amount_paid: paid,
          remaining_amount: Math.max(0, total - paid),
          is_estimated: false,
        });
      }
    }

    // B. Credit Cards
    for (const c of (cardsRes.data || [])) {
      if (c.payment_due_day) {
        const parts = todayDate.split('-').map(Number);
        const y = parts[0];
        const m = parts[1];
        const maxDays = new Date(y, m, 0).getDate();
        const dueDay = Math.min(c.payment_due_day, maxDays);
        const mStr = m.toString().padStart(2, '0');
        const dStr = dueDay.toString().padStart(2, '0');
        const dueDate = `${y}-${mStr}-${dStr}`;

        const key = `credit_card:${c.id}:${dueDate}`;
        const paid = paymentSumMap.get(key) || 0;
        // Balance or min payment
        const cardAcc = accounts.find((a) => a.id === c.account_id);
        const cardBalance = cardAcc ? Math.abs(Number(cardAcc.balance)) : 0;
        const total = cardBalance > 0 ? cardBalance : 0;

        if (total > 0) {
          commitments.push({
            id: `card_${c.id}_${dueDate}`,
            title: `Credit Card: ${c.nickname}`,
            commitment_type: 'credit_card',
            total_amount: total,
            amount_paid: paid,
            due_date: dueDate,
            currency_code: userCurrency,
            source_record_id: c.id,
            linked_account_id: c.account_id,
          });

          calendarOccurrences.push({
            id: `card_${c.id}_${dueDate}`,
            source_id: c.id,
            title: `Credit Card: ${c.nickname}`,
            event_type: 'card',
            amount: total,
            currency_code: userCurrency,
            due_date: dueDate,
            account_id: c.account_id,
            status: paid >= total ? 'paid' : paid > 0 ? 'partially_paid' : dueDate < todayDate ? 'overdue' : dueDate === todayDate ? 'due_today' : 'upcoming',
            amount_paid: paid,
            remaining_amount: Math.max(0, total - paid),
            is_estimated: false,
          });
        }
      }
    }

    // C. Recurring Templates
    const overrides = (overridesRes.data || []).map((o: any) => ({
      template_id: o.template_id,
      occurrence_date: o.occurrence_date,
      status: o.status,
      override_amount: o.override_amount ? parseFloat(o.override_amount) : null,
      override_date: o.override_date,
    }));

    for (const r of (recRes.data || [])) {
      const rule = {
        id: r.id,
        name: r.name,
        transaction_type: r.transaction_type,
        amount: parseFloat(r.amount || '0'),
        frequency: r.frequency,
        start_date: r.start_date || todayDate,
        next_occurrence: r.next_occurrence || todayDate,
        end_date: r.end_date,
        account_id: r.account_id,
        category_id: r.category_id,
        is_active: r.is_active,
      };

      const occurrences = generateRecurringOccurrences({
        rule,
        rangeStartDate: todayDate,
        rangeEndDate: horizon.endDate,
        todayDate,
        overrides,
        linkedPayments: paymentsList,
      });

      for (const occ of occurrences) {
        calendarOccurrences.push(occ);

        if (r.transaction_type === 'expense') {
          commitments.push({
            id: occ.id,
            title: occ.title,
            commitment_type: 'recurring_template',
            total_amount: occ.amount,
            amount_paid: occ.amount_paid,
            due_date: occ.due_date,
            currency_code: occ.currency_code,
            source_record_id: r.id,
            linked_account_id: r.account_id,
            category_id: r.category_id,
            status: occ.status,
          });
        }
      }
    }

    // D. Custom Calendar Events
    for (const e of (eventsRes.data || [])) {
      const amt = parseFloat(e.amount || '0');
      const key = `custom_event:${e.id}:${e.due_date}`;
      const paid = paymentSumMap.get(key) || 0;

      calendarOccurrences.push({
        id: e.id,
        source_id: e.id,
        title: e.title,
        event_type: e.event_type,
        amount: amt,
        currency_code: e.currency_code || userCurrency,
        due_date: e.due_date,
        account_id: e.account_id,
        category_id: e.category_id,
        status: e.status,
        amount_paid: paid,
        remaining_amount: Math.max(0, amt - paid),
        is_estimated: e.is_estimated || false,
        notes: e.notes,
      });

      if (e.event_type === 'bill' || e.event_type === 'loan' || e.event_type === 'card') {
        commitments.push({
          id: e.id,
          title: e.title,
          commitment_type: 'custom_event',
          total_amount: amt,
          amount_paid: paid,
          due_date: e.due_date,
          currency_code: e.currency_code || userCurrency,
          source_record_id: e.id,
          linked_account_id: e.account_id,
          category_id: e.category_id,
          status: e.status,
        });
      }
    }

    // 4. Protected Reserves
    const protectedReserves: ProtectedReserveInput[] = (reservesRes.data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      amount: parseFloat(r.amount || '0'),
      account_id: r.account_id,
      linked_commitment_id: r.linked_commitment_id,
      notes: r.notes,
    }));

    // 5. Run Available to Spend Calculation
    const result = calculateAvailableToSpend({
      accounts,
      commitments,
      protectedReserves,
      horizon,
      todayDate,
      currencyCode: userCurrency,
    });

    // 6. Build Forecast Cash Movements
    const cashMovements: ExpectedCashMovement[] = [];
    for (const occ of calendarOccurrences) {
      if (occ.status === 'skipped' || occ.status === 'cancelled' || occ.status === 'paid') {
        continue;
      }
      if (occ.event_type === 'income') {
        cashMovements.push({
          id: occ.id,
          title: occ.title,
          type: 'inflow',
          amount: occ.remaining_amount > 0 ? occ.remaining_amount : occ.amount,
          date: occ.due_date,
          account_id: occ.account_id,
        });
      } else if (occ.event_type === 'bill' || occ.event_type === 'loan' || occ.event_type === 'card') {
        cashMovements.push({
          id: occ.id,
          title: occ.title,
          type: 'outflow',
          amount: occ.remaining_amount > 0 ? occ.remaining_amount : occ.amount,
          date: occ.due_date,
          account_id: occ.account_id,
        });
      }
    }

    const forecast = calculateForecastTimeline({
      startingEligibleFunds: result.eligibleCurrentFunds,
      events: cashMovements,
      todayDate,
      endDate: horizon.endDate,
    });

    return {
      accounts,
      commitments,
      protectedReserves,
      calendarOccurrences,
      result,
      forecast,
      userTimezone,
      userCurrency,
      paydayDayOfMonth,
      loading: false,
      error: null,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      accounts: [],
      commitments: [],
      protectedReserves: [],
      calendarOccurrences: [],
      result: null,
      forecast: null,
      userTimezone: 'Asia/Dhaka',
      userCurrency: 'BDT',
      loading: false,
      error: err.message || 'Could not fetch financial calculation data',
      lastUpdated: null,
    };
  }
}
