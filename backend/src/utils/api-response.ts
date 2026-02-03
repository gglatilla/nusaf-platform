import { Response } from 'express';

/**
 * Standardized API response format
 * All API responses should use this format for consistency
 */

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

// Common error codes
export const ErrorCodes = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * Send a success response
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
  } satisfies ApiSuccessResponse<T>);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  } satisfies ApiErrorResponse);
}

// Convenience methods for common errors

export function badRequest(res: Response, message: string, details?: unknown): void {
  sendError(res, 400, ErrorCodes.BAD_REQUEST, message, details);
}

export function unauthorized(res: Response, message = 'Authentication required'): void {
  sendError(res, 401, ErrorCodes.UNAUTHORIZED, message);
}

export function forbidden(res: Response, message = 'Access denied'): void {
  sendError(res, 403, ErrorCodes.FORBIDDEN, message);
}

export function notFound(res: Response, resource = 'Resource'): void {
  sendError(res, 404, ErrorCodes.NOT_FOUND, `${resource} not found`);
}

export function conflict(res: Response, message: string): void {
  sendError(res, 409, ErrorCodes.CONFLICT, message);
}

export function validationError(res: Response, errors: unknown): void {
  sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', errors);
}

export function internalError(res: Response, message = 'Internal server error'): void {
  sendError(res, 500, ErrorCodes.INTERNAL_ERROR, message);
}
