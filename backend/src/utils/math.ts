/**
 * Round a number to 2 decimal places.
 * Used for final monetary values (prices, totals, VAT amounts).
 */
export function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Round a number to 4 decimal places.
 * Used for intermediate precision in complex calculations
 * (e.g., discount rates, freight multipliers, margin divisors)
 * to avoid accumulated rounding errors.
 */
export function roundTo4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
