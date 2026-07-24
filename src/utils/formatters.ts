import type { CurrencyCode } from '../types/finance';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
  INR: '₹',
  CHF: 'CHF ',
  SGD: 'S$',
};

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'USD',
  compact: boolean = false
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';

  if (compact && Math.abs(amount) >= 1_000_000) {
    return `${symbol}${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(amount) >= 10_000) {
    return `${symbol}${(amount / 1_000).toFixed(1)}k`;
  }

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol}${formattedNumber}`;
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatRelativeMonth(offset: number = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(d);
}
