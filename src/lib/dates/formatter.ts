import { format, parseISO, isValid, differenceInDays, isBefore, isAfter, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
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
export function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '—';
  return formatInTimeZone(date, TZ, 'dd MMM yyyy');
}

/**
 * Format a date string fully: "29 July 2026"
 */
export function formatFullDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '—';
  return formatInTimeZone(date, TZ, 'dd MMMM yyyy');
}

/**
 * Format a time string: "10:23 AM"
 */
export function formatTime(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '—';
  return formatInTimeZone(date, TZ, 'hh:mm a');
}

/**
 * Format a date and time combined: "29 Jul 2026 · 10:23 AM"
 */
export function formatDateTime(dateStr: string | Date): string {
  return `${formatDate(dateStr)} · ${formatTime(dateStr)}`;
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
export function formatMonthShort(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '';
  return formatInTimeZone(date, TZ, 'MMM');
}

/**
 * Format a month + year: "July 2026"
 */
export function formatMonthYear(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (!isValid(date)) return '';
  return formatInTimeZone(date, TZ, 'MMMM yyyy');
}

/**
 * Get a relative due label: "Due today", "Due in 3 days", "Overdue by 2 days"
 */
export function formatDueLabel(dateStr: string): string {
  const now = nowInDhaka();
  const date = toZonedTime(parseISO(dateStr), TZ);
  const diff = differenceInDays(date, now);

  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff > 1) return `Due in ${diff} days`;
  if (diff === -1) return 'Overdue by 1 day';
  return `Overdue by ${Math.abs(diff)} days`;
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
export function getGreeting(): string {
  const hour = nowInDhaka().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
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
export function lastNMonths(n: number): Array<{ start: string; end: string; label: string; year: number; month: number }> {
  const now = nowInDhaka();
  return Array.from({ length: n }, (_, i) => {
    const date = subMonths(now, n - 1 - i);
    return {
      start: formatInTimeZone(startOfMonth(date), TZ, 'yyyy-MM-dd'),
      end: formatInTimeZone(endOfMonth(date), TZ, 'yyyy-MM-dd'),
      label: formatInTimeZone(date, TZ, 'MMM'),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };
  });
}

/**
 * Format a header date: "Wednesday, 29 July"
 */
export function formatHeaderDate(): string {
  return formatInTimeZone(new Date(), TZ, 'EEEE, dd MMMM');
}

export { parseISO, isValid, isBefore, isAfter, addMonths, subMonths, startOfMonth, endOfMonth, format };
