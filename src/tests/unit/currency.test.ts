import { describe, it, expect } from 'vitest';
import { formatCurrency, formatSignedCurrency, parseCurrency } from '../../lib/currency/formatter';

describe('Currency Formatter (en-BD / BDT)', () => {
  it('formats positive BDT values correctly with symbol ৳', () => {
    expect(formatCurrency(1500)).toContain('৳');
    expect(formatCurrency(1500)).toContain('1,500');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toContain('৳');
    expect(formatCurrency(0)).toContain('0');
  });

  it('formats signed currencies with explicit + and - prefix', () => {
    expect(formatSignedCurrency(500)).toContain('+');
    expect(formatSignedCurrency(-500)).toContain('-');
  });

  it('parses raw formatted currency strings back to numeric float', () => {
    expect(parseCurrency('৳ 1,500.50')).toBe(1500.5);
    expect(parseCurrency('৳ 0.00')).toBe(0);
  });
});
