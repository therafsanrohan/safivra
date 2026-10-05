import { supabase } from '@/lib/supabase/client';
import { differenceInDays, parseISO, isBefore } from 'date-fns';
import { nowInDhaka } from '@/lib/dates/formatter';
import { isQuietHoursActive, showLocalSystemNotification } from './pushManager';
import { autoTranslationEngine, generateSourceHashSync } from '@/lib/i18n/autoTranslationEngine';

export type NotificationCategory =
  | 'financial_reminder'
  | 'account_activity'
  | 'dps'
  | 'fdr'
  | 'savings_goals'
  | 'loans'
  | 'credit_cards'
  | 'salary'
  | 'budget'
  | 'real_wealth'
  | 'zakat'
  | 'admin_announcement'
  | 'security'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface NotificationPayload {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  relatedType?: string;
  relatedId?: string;
  deduplicationKey?: string;
  scheduledAt?: string;
  expiresAt?: string;
}

export interface UserNotificationSettings {
  inAppEnabled: boolean;
  webPushEnabled: boolean;
  categoryDps: boolean;
  categoryFdr: boolean;
  categoryGoals: boolean;
  categoryLoans: boolean;
  categoryCards: boolean;
  categorySalary: boolean;
  categoryBudget: boolean;
  categoryWealth: boolean;
  categoryZakat: boolean;
  categoryAdmin: boolean;
  categorySecurity: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  dailyPushLimit: number;
}

/**
 * Fetches or initializes user notification preferences.
 */
export async function getUserNotificationSettings(
  userId: string
): Promise<UserNotificationSettings> {
  const defaultSettings: UserNotificationSettings = {
    inAppEnabled: true,
    webPushEnabled: true,
    categoryDps: true,
    categoryFdr: true,
    categoryGoals: true,
    categoryLoans: true,
    categoryCards: true,
    categorySalary: true,
    categoryBudget: true,
    categoryWealth: true,
    categoryZakat: true,
    categoryAdmin: true,
    categorySecurity: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:30',
    quietHoursEnd: '08:00',
    dailyPushLimit: 3,
  };

  if (!userId) return defaultSettings;

  try {
    const { data } = await (supabase.from('user_notification_settings') as any)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) return defaultSettings;

    return {
      inAppEnabled: data.in_app_enabled ?? true,
      webPushEnabled: data.web_push_enabled ?? true,
      categoryDps: data.category_dps ?? true,
      categoryFdr: data.category_fdr ?? true,
      categoryGoals: data.category_goals ?? true,
      categoryLoans: data.category_loans ?? true,
      categoryCards: data.category_cards ?? true,
      categorySalary: data.category_salary ?? true,
      categoryBudget: data.category_budget ?? true,
      categoryWealth: data.category_wealth ?? true,
      categoryZakat: data.category_zakat ?? true,
      categoryAdmin: data.category_admin ?? true,
      categorySecurity: data.category_security ?? true,
      quietHoursEnabled: data.quiet_hours_enabled ?? false,
      quietHoursStart: data.quiet_hours_start ?? '22:30',
      quietHoursEnd: data.quiet_hours_end ?? '08:00',
      dailyPushLimit: data.daily_push_limit ?? 3,
    };
  } catch (err) {
    console.warn('[NotificationEngine] Error loading user settings:', err);
    return defaultSettings;
  }
}

/**
 * Evaluates whether a category is enabled in user preferences.
 */
function isCategoryEnabled(settings: UserNotificationSettings, category: NotificationCategory): boolean {
  switch (category) {
    case 'dps': return settings.categoryDps;
    case 'fdr': return settings.categoryFdr;
    case 'savings_goals': return settings.categoryGoals;
    case 'loans': return settings.categoryLoans;
    case 'credit_cards': return settings.categoryCards;
    case 'salary': return settings.categorySalary;
    case 'budget': return settings.categoryBudget;
    case 'real_wealth': return settings.categoryWealth;
    case 'zakat': return settings.categoryZakat;
    case 'admin_announcement': return settings.categoryAdmin;
    case 'security': return settings.categorySecurity;
    default: return true;
  }
}

/**
 * Centralized, idempotent notification dispatcher.
 * Validates preferences, quiet hours, deduplication, and inserts into DB + triggers Push.
 */
export async function dispatchNotification(payload: NotificationPayload): Promise<boolean> {
  const {
    userId,
    category,
    title,
    body,
    priority = 'normal',
    actionUrl,
    relatedType,
    relatedId,
    deduplicationKey,
    scheduledAt,
    expiresAt,
  } = payload;

  if (!userId || !title || !body) return false;

  try {
    const settings = await getUserNotificationSettings(userId);

    // 1. In-App Check
    if (!settings.inAppEnabled) return false;

    // 2. Category Enablement Check
    if (!isCategoryEnabled(settings, category)) return false;

    // 3. Deduplication Check (idempotency)
    if (deduplicationKey) {
      const { data: existing } = await (supabase.from('notifications') as any)
        .select('id')
        .eq('user_id', userId)
        .eq('deduplication_key', deduplicationKey)
        .maybeSingle();

      if (existing) {
        // Notification already generated & dispatched
        return false;
      }
    }

    // 4. Quiet Hours Evaluation
    const inQuietHours = settings.quietHoursEnabled && isQuietHoursActive(settings.quietHoursStart, settings.quietHoursEnd);
    if (inQuietHours && priority !== 'critical') {
      // Delay non-critical notifications during quiet hours
      console.log(`[NotificationEngine] Suppressing non-critical notification during quiet hours: ${title}`);
      return false;
    }

    // 5. Insert into notifications table
    const { error: insertErr } = await (supabase.from('notifications') as any).insert({
      user_id: userId,
      notification_type: category, // Backward compatible
      category,
      title,
      body,
      priority,
      action_url: actionUrl,
      related_type: relatedType,
      related_id: relatedId,
      deduplication_key: deduplicationKey,
      scheduled_at: scheduledAt,
      expires_at: expiresAt,
      is_read: false,
      delivery_channel: settings.webPushEnabled ? 'both' : 'in_app',
      delivery_status: 'delivered',
    });

    if (insertErr) {
      console.error('[NotificationEngine] Failed to insert notification:', insertErr);
      return false;
    }

    // 6. Local / Web Push Dispatch if enabled
    if (settings.webPushEnabled) {
      showLocalSystemNotification(title, {
        body,
        data: { url: actionUrl || '/notifications' },
      });
    }

    return true;
  } catch (err) {
    console.error('[NotificationEngine] Unexpected error dispatching notification:', err);
    return false;
  }
}

/**
 * Event-Driven Financial Rules Evaluator.
 * Scans user's live financial entities (DPS, FDR, Goals, Loans, Cards, Zakat, Salary)
 * and dispatches event notifications idempotently.
 */
export async function evaluateFinancialNotificationRules(userId: string): Promise<void> {
  if (!userId) return;

  const now = nowInDhaka();
  const dateTodayStr = now.toISOString().split('T')[0];

  try {
    // ─── 1. DPS RULES ────────────────────────────────────────────────────────
    const { data: dpsList } = await (supabase.from('deposit_products') as any)
      .select('id, product_name, installment_amount, next_installment_date, maturity_date')
      .eq('user_id', userId)
      .eq('product_type', 'dps')
      .eq('status', 'active');

    if (dpsList) {
      for (const dps of dpsList) {
        if (dps.next_installment_date) {
          const dueDate = parseISO(dps.next_installment_date);
          const daysDiff = differenceInDays(dueDate, now);
          const amountStr = dps.installment_amount ? `৳${Number(dps.installment_amount).toLocaleString()}` : '';

          if (daysDiff === 3) {
            const titleStr = 'DPS Contribution Approaching: {{name}}';
            const bodyStr = 'Your {{amount}} DPS contribution is due in 3 days ({{date}}).';
            
            await dispatchNotification({
              userId,
              category: 'dps',
              priority: 'normal',
              title: autoTranslationEngine.translate(titleStr, generateSourceHashSync(titleStr), { variables: { name: dps.product_name } }),
              body: autoTranslationEngine.translate(bodyStr, generateSourceHashSync(bodyStr), { variables: { amount: amountStr, date: dps.next_installment_date } }),
              actionUrl: '/plans/savings',
              relatedType: 'deposit_product',
              relatedId: dps.id,
              deduplicationKey: `dps:${dps.id}:due:${dps.next_installment_date}:3day`,
            });
          } else if (daysDiff === 0) {
            await dispatchNotification({
              userId,
              category: 'dps',
              priority: 'high',
              title: `DPS Contribution Due Today: ${dps.product_name}`,
              body: `Your ${amountStr} DPS contribution is due today. Review your DPS details.`,
              actionUrl: '/plans/savings',
              relatedType: 'deposit_product',
              relatedId: dps.id,
              deduplicationKey: `dps:${dps.id}:due:${dps.next_installment_date}:today`,
            });
          } else if (daysDiff < 0 && isBefore(dueDate, now)) {
            await dispatchNotification({
              userId,
              category: 'dps',
              priority: 'high',
              title: `DPS Contribution Appears Overdue: ${dps.product_name}`,
              body: `Your DPS contribution appears to be overdue. Review your DPS details in Safivra.`,
              actionUrl: '/plans/savings',
              relatedType: 'deposit_product',
              relatedId: dps.id,
              deduplicationKey: `dps:${dps.id}:overdue:${dps.next_installment_date}`,
            });
          }
        }

        // DPS Maturity Warning (30 days)
        if (dps.maturity_date) {
          const matDate = parseISO(dps.maturity_date);
          const daysToMat = differenceInDays(matDate, now);
          if (daysToMat === 30) {
            await dispatchNotification({
              userId,
              category: 'dps',
              priority: 'high',
              title: `DPS Maturity Approaching: ${dps.product_name}`,
              body: `Your DPS is expected to mature in 30 days (${dps.maturity_date}).`,
              actionUrl: '/plans/savings',
              relatedType: 'deposit_product',
              relatedId: dps.id,
              deduplicationKey: `dps:${dps.id}:maturity:${dps.maturity_date}:30day`,
            });
          }
        }
      }
    }

    // ─── 2. FDR RULES ────────────────────────────────────────────────────────
    const { data: fdrList } = await (supabase.from('deposit_products') as any)
      .select('id, product_name, principal_amount, maturity_date')
      .eq('user_id', userId)
      .eq('product_type', 'fdr')
      .eq('status', 'active');

    if (fdrList) {
      for (const fdr of fdrList) {
        if (!fdr.maturity_date) continue;
        const matDate = parseISO(fdr.maturity_date);
        const daysToMat = differenceInDays(matDate, now);

        const intervals = [30, 14, 7, 1];
        if (intervals.includes(daysToMat)) {
          await dispatchNotification({
            userId,
            category: 'fdr',
            priority: daysToMat <= 7 ? 'high' : 'normal',
            title: `FDR Maturity Approaching: ${fdr.product_name}`,
            body: `Your FDR is expected to mature in ${daysToMat} day(s). Review your next step.`,
            actionUrl: '/plans/savings',
            relatedType: 'deposit_product',
            relatedId: fdr.id,
            deduplicationKey: `fdr:${fdr.id}:maturity:${fdr.maturity_date}:${daysToMat}day`,
          });
        }
      }
    }

    // ─── 3. SAVINGS GOAL MILESTONE RULES ─────────────────────────────────────
    const { data: goals } = await (supabase.from('savings_goals') as any)
      .select('id, name, target_amount, current_amount')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (goals) {
      for (const goal of goals) {
        const target = Number(goal.target_amount || 0);
        const current = Number(goal.current_amount || 0);
        if (target <= 0) continue;

        const pct = Math.floor((current / target) * 100);
        const milestones = [25, 50, 75, 90, 100];

        for (const m of milestones) {
          if (pct >= m) {
            await dispatchNotification({
              userId,
              category: 'savings_goals',
              priority: m === 100 ? 'high' : 'normal',
              title: m === 100 ? `Goal Achieved! ${goal.name}` : `Goal Milestone: ${goal.name}`,
              body: m === 100
                ? `Congratulations! You've reached 100% of your ${goal.name} goal.`
                : `You've crossed ${m}% of your ${goal.name} goal (৳${current.toLocaleString()} / ৳${target.toLocaleString()}).`,
              actionUrl: '/plans/goals',
              relatedType: 'savings_goal',
              relatedId: goal.id,
              deduplicationKey: `goal:${goal.id}:milestone:${m}`,
            });
          }
        }
      }
    }

    // ─── 4. LOAN REMINDERS ──────────────────────────────────────────────────
    const { data: loans } = await (supabase.from('loans') as any)
      .select('id, name, monthly_installment, next_payment_date')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (loans) {
      for (const loan of loans) {
        if (!loan.next_payment_date) continue;
        const dueDate = parseISO(loan.next_payment_date);
        const daysDiff = differenceInDays(dueDate, now);

        if (daysDiff === 5 || daysDiff === 3) {
          await dispatchNotification({
            userId,
            category: 'loans',
            priority: 'high',
            title: `Loan Payment Approaching: ${loan.name}`,
            body: `Your loan payment is due in ${daysDiff} days (${loan.next_payment_date}).`,
            actionUrl: '/loans',
            relatedType: 'loan',
            relatedId: loan.id,
            deduplicationKey: `loan:${loan.id}:due:${loan.next_payment_date}:${daysDiff}day`,
          });
        } else if (daysDiff === 0) {
          await dispatchNotification({
            userId,
            category: 'loans',
            priority: 'high',
            title: `Loan Payment Due Today: ${loan.name}`,
            body: `Your loan payment is due today. Review payment details in Safivra.`,
            actionUrl: '/loans',
            relatedType: 'loan',
            relatedId: loan.id,
            deduplicationKey: `loan:${loan.id}:due:${loan.next_payment_date}:today`,
          });
        }
      }
    }

    // ─── 5. CREDIT CARD REMINDERS ───────────────────────────────────────────
    const { data: cards } = await (supabase.from('credit_cards') as any)
      .select('id, nickname, payment_due_day')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (cards) {
      for (const card of cards) {
        if (!card.payment_due_day) continue;
        const dueDay = card.payment_due_day;
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        let dueDate = new Date(currentYear, currentMonth, dueDay);
        if (isBefore(dueDate, now)) {
          dueDate = new Date(currentYear, currentMonth + 1, dueDay);
        }

        const daysDiff = differenceInDays(dueDate, now);
        const dateStr = dueDate.toISOString().split('T')[0];

        if (daysDiff === 3) {
          await dispatchNotification({
            userId,
            category: 'credit_cards',
            priority: 'high',
            title: `Credit Card Payment Approaching: ${card.nickname}`,
            body: `Your credit card payment is due in 3 days (${dateStr}).`,
            actionUrl: '/credit-cards',
            relatedType: 'credit_card',
            relatedId: card.id,
            deduplicationKey: `card:${card.id}:due:${dateStr}:3day`,
          });
        }
      }
    }

    // ─── 6. ZAKAT INTELLIGENCE REVIEW REMINDER ──────────────────────────────
    const { data: zakatPref } = await (supabase.from('user_zakat_preferences') as any)
      .select('zakat_anniversary_date, nisab_standard')
      .eq('user_id', userId)
      .maybeSingle();

    if (zakatPref?.zakat_anniversary_date) {
      const annivDate = parseISO(zakatPref.zakat_anniversary_date);
      const daysDiff = differenceInDays(annivDate, now);

      if (daysDiff === 14 || daysDiff === 3) {
        await dispatchNotification({
          userId,
          category: 'zakat',
          priority: 'normal',
          title: 'Zakat Review Date Approaching',
          body: `Your recorded eligible assets may indicate that Zakat is due. Review your calculation.`,
          actionUrl: '/zakat',
          relatedType: 'zakat',
          deduplicationKey: `zakat:anniv:${zakatPref.zakat_anniversary_date}:${daysDiff}day`,
        });
      }
    }

  } catch (err) {
    console.error('[NotificationEngine] Error evaluating rules:', err);
  }
}
