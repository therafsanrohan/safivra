import { APP_CONFIG } from '@/config/app';

/**
 * Format a numeric amount as BDT currency.
 * Uses Intl.NumberFormat for locale-aware formatting.
 *
 * @param amount - The numeric value to format
 * @param options - Override formatting options
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options?: {
    showSymbol?: boolean;
    alwaysShowDecimals?: boolean;
    compact?: boolean;
    forceEnglish?: boolean;
  }
): string {
  // Sanitize input: handle NaN, null, undefined, or string
  let numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount ?? 0));
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    numAmount = 0;
  }

  const { showSymbol = true, alwaysShowDecimals = false, compact = false, forceEnglish = false } = options ?? {};

  const hasDecimals = numAmount % 1 !== 0;
  const minimumFractionDigits = alwaysShowDecimals || hasDecimals ? 2 : 0;
  const maximumFractionDigits = 2;
  
  // Pick up user locale if possible, fallback to config
  let userLocale = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      userLocale = window.localStorage.getItem('safivra_locale');
    }
  } catch (e) {
    // Ignore errors in test environments
  }
  const computedLocale = userLocale === 'bn' ? 'bn-BD' : APP_CONFIG.currency.locale;
  const locale = forceEnglish ? 'en-US' : computedLocale;

  if (compact && Math.abs(numAmount) >= 100_000) {
    const lakh = numAmount / 100_000;
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: lakh % 1 !== 0 ? 1 : 0,
      maximumFractionDigits: 1,
    }).format(lakh);
    return showSymbol ? `${APP_CONFIG.currency.symbol}${formatted}L` : `${formatted}L`;
  }

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  const formatted = formatter.format(Math.abs(numAmount));
  const prefix = showSymbol ? APP_CONFIG.currency.symbol : '';
  const sign = numAmount < 0 ? '-' : '';
  return `${sign}${prefix}${formatted}`;
}

/**
 * Format a signed amount (positive = income, negative = expense).
 * Adds +/- sign in addition to currency symbol.
 */
export function formatSignedCurrency(amount: number | string | null | undefined): string {
  const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount ?? 0));
  const safeNum = isNaN(numAmount) || !isFinite(numAmount) ? 0 : numAmount;
  const sign = safeNum >= 0 ? '+' : '-';
  return `${sign}${formatCurrency(Math.abs(safeNum))}`;
}

/**
 * Parse a currency string back to a number.
 * Handles the ৳ symbol and commas.
 */
export function parseCurrency(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const cleaned = String(value)
    .replace(APP_CONFIG.currency.symbol, '')
    .replace(/,/g, '')
    .trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a percentage value.
 */
export function formatPercent(value: number | string | null | undefined, decimals = 0): string {
  const numVal = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
  const safeVal = isNaN(numVal) || !isFinite(numVal) ? 0 : numVal;
  return `${safeVal.toFixed(decimals)}%`;
}

/**
 * Round to 2 decimal places safely (avoids floating-point errors).
 */
export function roundMoney(value: number | string | null | undefined): number {
  const numVal = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
  const safeVal = isNaN(numVal) || !isFinite(numVal) ? 0 : numVal;
  return Math.round(safeVal * 100) / 100;
}

/**
 * Add two monetary values safely.
 */
export function addMoney(a: number, b: number): number {
  return roundMoney((roundMoney(a) || 0) + (roundMoney(b) || 0));
}

/**
 * Subtract two monetary values safely.
 */
export function subtractMoney(a: number, b: number): number {
  return roundMoney((roundMoney(a) || 0) - (roundMoney(b) || 0));
}
