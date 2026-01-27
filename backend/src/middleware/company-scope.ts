import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export interface ScopedRequest extends AuthenticatedRequest {
  companyScope: string;
}

/**
 * Middleware to enforce company scope for multi-tenant isolation
 *
 * This middleware adds a `companyScope` property to the request that should
 * be used in all database queries to ensure data isolation between companies.
 */
export function enforceCompanyScope(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  // Admin users can optionally specify a company to scope to
  // For now, all users are scoped to their own company
  (req as ScopedRequest).companyScope = authReq.user.companyId;

  next();
}

/**
 * Helper to get company filter for Prisma queries
 */
export function getCompanyFilter(req: Request): { companyId: string } {
  const scopedReq = req as ScopedRequest;
  return { companyId: scopedReq.companyScope };
}
