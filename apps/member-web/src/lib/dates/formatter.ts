import { format, parseISO, isValid, differenceInDays, isBefore, isAfter, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { bn, enUS } from 'date-fns/locale';
import { APP_CONFIG } from '@/config/app';

const TZ = APP_CONFIG.timezone;

/**
 * Get the current date/time in Asia/Dhaka timezone.
 */
export function nowInDhaka(): Date {
  return toZonedTime(new Date(), TZ);
}

/**
 * Format a date string for display: "29 Jul 2026"
 */
export function formatDate(dateStr: string | Date, localeStr: 'en' | 'bn' = 'en'): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '—';
  const locale = localeStr === 'bn' ? bn : enUS;
  return formatInTimeZone(date, TZ, 'dd MMM yyyy', { locale });
}

/**
 * Format a date string fully: "29 July 2026"
 */
export function formatFullDate(dateStr: string | Date, localeStr: 'en' | 'bn' = 'en'): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '—';
  const locale = localeStr === 'bn' ? bn : enUS;
  return formatInTimeZone(date, TZ, 'dd MMMM yyyy', { locale });
}

/**
 * Format a time string: "10:23 AM"
 */
export function formatTime(dateStr: string | Date, localeStr: 'en' | 'bn' = 'en'): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '—';
  const locale = localeStr === 'bn' ? bn : enUS;
  return formatInTimeZone(date, TZ, 'hh:mm a', { locale });
}

/**
 * Format a date and time combined: "29 Jul 2026 · 10:23 AM"
 */
export function formatDateTime(dateStr: string | Date, localeStr: 'en' | 'bn' = 'en'): string {
  return `${formatDate(dateStr, localeStr)} · ${formatTime(dateStr, localeStr)}`;
}

/**
 * Format a date for use in HTML date inputs (YYYY-MM-DD).
 */
export function formatDateInput(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '';
  return formatInTimeZone(date, TZ, 'yyyy-MM-dd');
}

/**
 * Format a month label for charts: "Jul"
 */
export function formatMonthShort(dateStr: string | Date, localeStr: 'en' | 'bn' = 'en'): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '';
  const locale = localeStr === 'bn' ? bn : enUS;
  return formatInTimeZone(date, TZ, 'MMM', { locale });
}

/**
 * Format a month + year: "July 2026"
 */
export function formatMonthYear(dateStr: string | Date, localeStr: 'en' | 'bn' = 'en'): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '';
  const locale = localeStr === 'bn' ? bn : enUS;
  return formatInTimeZone(date, TZ, 'MMMM yyyy', { locale });
}

/**
 * Get a relative due label: "Due today", "Due in 3 days", "Overdue by 2 days"
 */
export function formatDueLabel(dateStr: string, localeStr: 'en' | 'bn' = 'en'): string {
  const now = nowInDhaka();
  const date = toZonedTime(parseISO(dateStr), TZ);
  const diff = differenceInDays(date, now);

  const isBn = localeStr === 'bn';

  if (diff === 0) return isBn ? 'আজকে ডিউ' : 'Due today';
  if (diff === 1) return isBn ? 'আগামীকাল ডিউ' : 'Due tomorrow';
  if (diff > 1) return isBn ? `${diff} দিন পর ডিউ` : `Due in ${diff} days`;
  if (diff === -1) return isBn ? '১ দিন ওভারডিউ' : 'Overdue by 1 day';
  return isBn ? `${Math.abs(diff)} দিন ওভারডিউ` : `Overdue by ${Math.abs(diff)} days`;
}

/**
 * Check if a date is overdue (in the past).
 */
export function isOverdue(dateStr: string): boolean {
  return isBefore(toZonedTime(parseISO(dateStr), TZ), nowInDhaka());
}

/**
 * Check if a date is upcoming within N days.
 */
export function isUpcoming(dateStr: string, withinDays = 7): boolean {
  const now = nowInDhaka();
  const date = toZonedTime(parseISO(dateStr), TZ);
  const future = toZonedTime(new Date(now.getTime() + withinDays * 86_400_000), TZ);
  return isAfter(date, now) && isBefore(date, future);
}

/**
 * Get greeting based on current hour in Asia/Dhaka.
 */
export function getGreeting(localeStr: 'en' | 'bn' = 'en'): string {
  const hour = nowInDhaka().getHours();
  const isBn = localeStr === 'bn';
  if (hour < 12) return isBn ? 'শুভ সকাল' : 'Good morning';
  if (hour < 17) return isBn ? 'শুভ অপরাহ্ন' : 'Good afternoon';
  if (hour < 21) return isBn ? 'শুভ সন্ধ্যা' : 'Good evening';
  return isBn ? 'শুভ রাত্রি' : 'Good night';
}

/**
 * Format a header date string: "Tuesday, July 29"
 */
export function formatHeaderDate(localeStr: 'en' | 'bn' = 'en'): string {
  const locale = localeStr === 'bn' ? bn : enUS;
  return formatInTimeZone(nowInDhaka(), TZ, 'EEEE, MMMM do', { locale });
}

/**
 * Get today's date string in YYYY-MM-DD for Asia/Dhaka.
 */
export function todayString(): string {
  return formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');
}

/**
 * Get start and end of current month as ISO strings.
 */
export function currentMonthRange(): { start: string; end: string } {
  const now = nowInDhaka();
  return {
    start: formatInTimeZone(startOfMonth(now), TZ, 'yyyy-MM-dd'),
    end: formatInTimeZone(endOfMonth(now), TZ, 'yyyy-MM-dd'),
  };
}

/**
 * Get an array of the last N months as { start, end, label } for chart data.
 */
export function lastNMonths(n: number, localeStr: 'en' | 'bn' = 'en'): Array<{ start: string; end: string; label: string; year: number; month: number }> {
  const now = nowInDhaka();
  const locale = localeStr === 'bn' ? bn : enUS;
  return Array.from({ length: n }, (_, i) => {
    const date = subMonths(now, n - 1 - i);
    return {
      start: formatInTimeZone(startOfMonth(date), TZ, 'yyyy-MM-dd'),
      end: formatInTimeZone(endOfMonth(date), TZ, 'yyyy-MM-dd'),
      label: formatInTimeZone(date, TZ, 'MMM', { locale }),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };
  });
}
