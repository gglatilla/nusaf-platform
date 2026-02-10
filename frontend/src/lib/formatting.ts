/**
 * Shared formatting utilities for currency, dates, and numbers.
 * All formatters use 'en-ZA' locale by default (South African English).
 *
 * Usage:
 *   import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatting';
 */

// ============================================
// CURRENCY
// ============================================

/**
 * Format a monetary amount as currency.
 *
 * @param amount - The numeric amount (or null/undefined)
 * @param currency - Currency code (default: 'ZAR'). Also supports 'EUR'.
 * @param options - Override Intl.NumberFormat options
 * @returns Formatted currency string, or '—' if amount is null/undefined
 *
 * @example
 *   formatCurrency(1234.56)           // "R 1 234,56"
 *   formatCurrency(1234.56, 'EUR')    // "€1 234,56"
 *   formatCurrency(null)              // "—"
 *   formatCurrency(50000, 'ZAR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'ZAR',
  options?: Partial<Intl.NumberFormatOptions>
): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    ...options,
  }).format(amount);
}

/**
 * Format a currency amount with 4 decimal places (for supplier costs in EUR).
 *
 * @example
 *   formatCurrencyPrecise(12.3456, 'EUR')  // "EUR 12.3456"
 */
export function formatCurrencyPrecise(
  amount: number | null | undefined,
  currency: string = 'EUR'
): string {
  if (amount == null) return '—';
  if (currency === 'EUR') {
    return `EUR ${amount.toFixed(4)}`;
  }
  return formatCurrency(amount, currency);
}

// ============================================
// DATES
// ============================================

/**
 * Format a date string as short date: "2 Jan 2026"
 *
 * @param dateString - ISO date string or Date (or null)
 * @returns Formatted date or '—' if null
 *
 * @example
 *   formatDate('2026-01-15T10:30:00Z')  // "15 Jan 2026"
 *   formatDate(null)                     // "—"
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

/**
 * Format a date string as long date: "15 January 2026"
 */
export function formatDateLong(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

/**
 * Format a date string as compact date (no year): "15 Jan"
 */
export function formatDateCompact(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

/**
 * Format a date string with time: "15 Jan 2026, 10:30"
 */
export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

/**
 * Format a date string as long date with time: "15 January 2026, 10:30"
 */
export function formatDateTimeLong(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

// ============================================
// NUMBERS
// ============================================

/**
 * Format a plain number with locale-appropriate separators.
 *
 * @example
 *   formatNumber(12345)  // "12 345"
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-ZA').format(value);
}
