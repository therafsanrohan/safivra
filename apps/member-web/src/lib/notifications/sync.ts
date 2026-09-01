import { supabase } from '@/lib/supabase/client';
import { differenceInDays, parseISO, isBefore } from 'date-fns';
import { nowInDhaka } from '@/lib/dates/formatter';

export async function syncNotifications(userId: string) {
  if (!userId) return;

  try {
    // 1. Fetch active loans
    const { data: loans } = await (supabase.from('loans') as any)
      .select('id, name, monthly_installment, next_payment_date')
      .eq('user_id', userId)
      .eq('status', 'active')
      .not('next_payment_date', 'is', null);

    // 2. Fetch active recurring templates
    const { data: recurring } = await (supabase.from('recurring_templates') as any)
      .select('id, name, amount, next_occurrence')
      .eq('user_id', userId)
      .eq('is_active', true)
      .not('next_occurrence', 'is', null);

    // 3. Fetch active credit cards
    const { data: cards } = await (supabase.from('credit_cards') as any)
      .select('id, nickname, credit_limit, payment_due_day, account_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    // 4. Fetch existing unread notifications to avoid duplicates
    const { data: existingNotifs } = await (supabase.from('notifications') as any)
      .select('notification_type, related_id, is_read, created_at')
      .eq('user_id', userId)
      .eq('is_read', false);

    const existingKeys = new Set(
      (existingNotifs ?? []).map((n: any) => `${n.notification_type}_${n.related_id}`)
    );

    const now = nowInDhaka();
    const newNotifications: any[] = [];

    // Process Loans
    if (loans) {
      for (const loan of loans) {
        if (!loan.next_payment_date) continue;
        const dueDate = parseISO(loan.next_payment_date);
        const daysDiff = differenceInDays(dueDate, now);

        if (daysDiff <= 0 && isBefore(dueDate, now)) {
          // Overdue
          if (!existingKeys.has(`overdue_payment_${loan.id}`)) {
            newNotifications.push({
              user_id: userId,
              notification_type: 'overdue_payment',
              title: `Loan Overdue: ${loan.name}`,
              body: `Your payment of ${loan.monthly_installment ? `৳${Number(loan.monthly_installment).toLocaleString('en-IN')}` : 'installment'} was due on ${loan.next_payment_date}.`,
              related_id: loan.id,
              related_type: 'loan',
              is_read: false
            });
          }
        } else if (daysDiff <= 7) {
          // Upcoming within 7 days
          if (!existingKeys.has(`upcoming_loan_payment_${loan.id}`)) {
            newNotifications.push({
              user_id: userId,
              notification_type: 'upcoming_loan_payment',
              title: `Upcoming Loan Payment: ${loan.name}`,
              body: `Your payment of ${loan.monthly_installment ? `৳${Number(loan.monthly_installment).toLocaleString('en-IN')}` : 'installment'} is due in ${daysDiff} days (${loan.next_payment_date}).`,
              related_id: loan.id,
              related_type: 'loan',
              is_read: false
            });
          }
        }
      }
    }

    // Process Recurring Templates
    if (recurring) {
      for (const rec of recurring) {
        if (!rec.next_occurrence) continue;
        const dueDate = parseISO(rec.next_occurrence);
        const daysDiff = differenceInDays(dueDate, now);

        if (daysDiff <= 0 && isBefore(dueDate, now)) {
          if (!existingKeys.has(`overdue_payment_${rec.id}`)) {
            newNotifications.push({
              user_id: userId,
              notification_type: 'overdue_payment',
              title: `Bill Overdue: ${rec.name}`,
              body: `Your recurring bill of ৳${Number(rec.amount).toLocaleString('en-IN')} was due on ${rec.next_occurrence}.`,
              related_id: rec.id,
              related_type: 'recurring_template',
              is_read: false
            });
          }
        } else if (daysDiff <= 7) {
          if (!existingKeys.has(`upcoming_bill_${rec.id}`)) {
            newNotifications.push({
              user_id: userId,
              notification_type: 'upcoming_bill',
              title: `Upcoming Bill: ${rec.name}`,
              body: `Your bill of ৳${Number(rec.amount).toLocaleString('en-IN')} is due in ${daysDiff} days (${rec.next_occurrence}).`,
              related_id: rec.id,
              related_type: 'recurring_template',
              is_read: false
            });
          }
        }
      }
    }

    // Process Credit Cards
    if (cards) {
      for (const card of cards) {
        if (!card.payment_due_day) continue;
        
        // Check outstanding balance
        const balance = card.account?.balance ? Math.abs(Number(card.account.balance)) : 0;
        if (balance <= 0) continue; // No outstanding balance, no notification needed

        // Calculate next due date based on payment_due_day
        const dueDay = card.payment_due_day;
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed
        
        let dueDate = new Date(currentYear, currentMonth, dueDay);
        // If due date has passed this month, the next one is next month
        if (isBefore(dueDate, now)) {
          dueDate = new Date(currentYear, currentMonth + 1, dueDay);
        }

        const daysDiff = differenceInDays(dueDate, now);
        const dateStr = dueDate.toISOString().split('T')[0];

        if (daysDiff <= 7) {
          if (!existingKeys.has(`upcoming_card_payment_${card.id}`)) {
            newNotifications.push({
              user_id: userId,
              notification_type: 'upcoming_card_payment',
              title: `Upcoming Credit Card Bill: ${card.nickname}`,
              body: `Your credit card outstanding of ৳${balance.toLocaleString('en-IN')} is due in ${daysDiff} days (${dateStr}).`,
              related_id: card.id,
              related_type: 'credit_card',
              is_read: false
            });
          }
        }
      }
    }

    // Insert new notifications
    if (newNotifications.length > 0) {
      const { error: insertErr } = await (supabase.from('notifications') as any)
        .insert(newNotifications);
      if (insertErr) throw insertErr;
      console.log(`[NotificationSync] Inserted ${newNotifications.length} new notifications.`);
    }
  } catch (err) {
    console.error('[NotificationSync] Error running notification sync:', err);
  }
}
