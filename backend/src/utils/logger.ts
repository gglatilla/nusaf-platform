/**
 * Simple logger utility for consistent logging across the application.
 * Can be extended to integrate with external logging services (e.g., Sentry, LogDNA).
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('Failed to process order', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level based on environment
const MIN_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.message}\n${error.stack || ''}`;
  }
  return String(error);
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, context));
    }
  },

  warn(message: string, context?: LogContext): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, context));
    }
  },

  error(message: string, error?: unknown, context?: LogContext): void {
    if (shouldLog('error')) {
      const errorStr = error ? `\n${formatError(error)}` : '';
      console.error(formatMessage('error', message, context) + errorStr);
    }
  },

  /**
   * Log security-related events (always logs in production)
   */
  security(message: string, context?: LogContext): void {
    console.error(formatMessage('error', `[SECURITY] ${message}`, context));
  },
};

export default logger;
