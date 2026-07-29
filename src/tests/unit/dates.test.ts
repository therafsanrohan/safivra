import { describe, it, expect } from 'vitest';
import { formatDate, formatFullDate, getGreeting, todayString } from '../../lib/dates/formatter';

describe('Date & Timezone Formatter (Asia/Dhaka)', () => {
  it('formats dates in dd MMM yyyy format', () => {
    expect(formatDate('2026-07-29')).toBe('29 Jul 2026');
  });

  it('formats full date in dd MMMM yyyy format', () => {
    expect(formatFullDate('2026-07-29')).toBe('29 July 2026');
  });

  it('returns valid YYYY-MM-DD for todayString', () => {
    expect(todayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns appropriate greeting', () => {
    const greeting = getGreeting();
    expect(['Good morning', 'Good afternoon', 'Good evening', 'Good night']).toContain(greeting);
  });
});
