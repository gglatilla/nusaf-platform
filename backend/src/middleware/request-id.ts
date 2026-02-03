import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Middleware to add unique request ID to each request
 * - Generates a UUID for each request
 * - Adds it to request object for logging
 * - Returns it in X-Request-ID header for client correlation
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  // Use existing request ID from header if provided (for distributed tracing)
  const requestId = req.headers['x-request-id'] as string || randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
}
