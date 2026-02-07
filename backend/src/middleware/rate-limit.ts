import rateLimit from 'express-rate-limit';

/**
 * NOTE: All rate limiters rely on Express `trust proxy` being set in index.ts.
 * Railway runs behind a reverse proxy, so `req.ip` is correct when trust proxy
 * is enabled. No custom keyGenerator needed.
 */

/**
 * Rate limiter for quote requests
 * Limits: 3 requests per IP per 15 minutes
 */
export const quoteRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many quote requests. Please try again in 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for contact form
 * Limits: 5 requests per IP per hour
 */
export const contactFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many contact form submissions. Please try again in an hour.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter
 * Limits: 100 requests per IP per minute
 */
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter for login attempts
 * Limits: 5 login attempts per IP per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please try again in 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
