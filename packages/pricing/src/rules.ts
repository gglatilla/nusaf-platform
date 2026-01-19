import { FreightType, PricingRule as PrismaPricingRule } from "@nusaf/database";

interface RuleMatchCriteria {
  categoryId?: string;
  subCategoryId?: string;
  supplierId?: string;
  brand?: string;
}

/**
 * Find the most specific pricing rule that matches the given criteria
 * Rules are matched by priority (higher = more specific)
 */
export function findMatchingRule(
  rules: PrismaPricingRule[],
  criteria: RuleMatchCriteria
): PrismaPricingRule | null {
  // Filter active rules that match the criteria
  const matchingRules = rules.filter((rule) => {
    if (!rule.isActive) return false;

    // Check each criterion - rule must match if it specifies a value
    if (rule.categoryId && rule.categoryId !== criteria.categoryId) return false;
    if (rule.subCategoryId && rule.subCategoryId !== criteria.subCategoryId) return false;
    if (rule.supplierId && rule.supplierId !== criteria.supplierId) return false;
    if (rule.brand && rule.brand !== criteria.brand) return false;

    return true;
  });

  if (matchingRules.length === 0) return null;

  // Sort by priority (descending) and return the highest priority match
  matchingRules.sort((a, b) => b.priority - a.priority);
  return matchingRules[0] ?? null;
}

/**
 * Calculate rule priority based on specificity
 * More specific rules (more fields specified) get higher priority
 */
export function calculateRulePriority(rule: Partial<PrismaPricingRule>): number {
  let priority = 0;

  if (rule.supplierId) priority += 1;
  if (rule.categoryId) priority += 2;
  if (rule.subCategoryId) priority += 4;
  if (rule.brand) priority += 8;

  return priority;
}

/**
 * Default pricing rules for common scenarios
 */
export const DEFAULT_MARGIN_FACTORS: Record<string, number> = {
  // Default margin factor (50% margin)
  default: 0.5,
  // Higher margin for specialized items
  custom_machined: 0.4,
  // Lower margin for high-volume items
  standard_components: 0.55,
};

/**
 * Validate a pricing rule
 */
export function validatePricingRule(rule: Partial<PrismaPricingRule>): string[] {
  const errors: string[] = [];

  if (rule.marginFactor !== undefined) {
    const margin = Number(rule.marginFactor);
    if (margin <= 0 || margin >= 1) {
      errors.push("Margin factor must be between 0 and 1 (e.g., 0.5 for 50% margin)");
    }
  }

  if (rule.dealerDiscountPercent !== undefined) {
    const discount = Number(rule.dealerDiscountPercent);
    if (discount < 0 || discount > 100) {
      errors.push("Dealer discount must be between 0 and 100");
    }
  }

  return errors;
}
