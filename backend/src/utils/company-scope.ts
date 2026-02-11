import type { UserRole } from '@prisma/client';
import type { Request } from 'express';

/**
 * All internal staff roles. Only CUSTOMER users should be company-isolated.
 */
const STAFF_ROLES: readonly UserRole[] = ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'PURCHASER'];

/**
 * Returns true if the role belongs to an internal staff member.
 */
export function isStaffRole(role: UserRole): boolean {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

/**
 * Get the effective companyId for data-access scoping.
 * - Staff (ADMIN, MANAGER, SALES, WAREHOUSE, PURCHASER): returns undefined — no company filter
 * - Customer: returns their own companyId — strict tenant isolation
 */
export function getEffectiveCompanyId(req: Request): string | undefined {
  return isStaffRole(req.user!.role) ? undefined : req.user!.companyId;
}
