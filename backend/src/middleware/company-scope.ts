import { Request, Response, NextFunction } from 'express';

// ScopedRequest kept for backwards compatibility during migration.
// Prefer using req.companyScope directly (via Express declaration merging in types/express.d.ts).
export type ScopedRequest = Request & {
  user: NonNullable<Request['user']>;
  companyScope: string;
};

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
  if (!req.user) {
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
  req.companyScope = req.user.companyId;

  next();
}

/**
 * Helper to get company filter for Prisma queries
 */
export function getCompanyFilter(req: Request): { companyId: string } {
  return { companyId: req.companyScope! };
}
