import { APP_CONFIG } from '@/config/app';

/**
 * Format a numeric amount as BDT currency.
 * Uses Intl.NumberFormat for locale-aware formatting.
 *
 * @param amount - The numeric value to format
 * @param options - Override formatting options
 */
export function formatCurrency(
  amount: number,
  options?: {
    showSymbol?: boolean;
    alwaysShowDecimals?: boolean;
    compact?: boolean;
  }
): string {
  const { showSymbol = true, alwaysShowDecimals = false, compact = false } = options ?? {};

  const hasDecimals = amount % 1 !== 0;
  const minimumFractionDigits = alwaysShowDecimals || hasDecimals ? 2 : 0;
  const maximumFractionDigits = 2;

  if (compact && Math.abs(amount) >= 100_000) {
    const lakh = amount / 100_000;
    const formatted = new Intl.NumberFormat(APP_CONFIG.currency.locale, {
      minimumFractionDigits: lakh % 1 !== 0 ? 1 : 0,
      maximumFractionDigits: 1,
    }).format(lakh);
    return showSymbol ? `${APP_CONFIG.currency.symbol}${formatted}L` : `${formatted}L`;
  }

  const formatter = new Intl.NumberFormat(APP_CONFIG.currency.locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  const formatted = formatter.format(Math.abs(amount));
  const prefix = showSymbol ? APP_CONFIG.currency.symbol : '';
  return `${prefix}${formatted}`;
}

/**
 * Format a signed amount (positive = income, negative = expense).
 * Adds +/- sign in addition to currency symbol.
 */
export function formatSignedCurrency(amount: number): string {
  const sign = amount >= 0 ? '+' : '-';
  return `${sign}${formatCurrency(Math.abs(amount))}`;
}

/**
 * Parse a currency string back to a number.
 * Handles the ৳ symbol and commas.
 */
export function parseCurrency(value: string): number {
  const cleaned = value
    .replace(APP_CONFIG.currency.symbol, '')
    .replace(/,/g, '')
    .trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a percentage value.
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Round to 2 decimal places safely (avoids floating-point errors).
 */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Add two monetary values safely.
 */
export function addMoney(a: number, b: number): number {
  return roundMoney(a + b);
}

/**
 * Subtract two monetary values safely.
 */
export function subtractMoney(a: number, b: number): number {
  return roundMoney(a - b);
}
