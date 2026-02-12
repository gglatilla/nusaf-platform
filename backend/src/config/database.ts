import { PrismaClient } from '@prisma/client';
import { isDev, isProd } from './index';
import { logger } from '../utils/logger';

/**
 * Database connection pool configuration
 *
 * Connection pool settings are configured via DATABASE_URL query parameters:
 * - connection_limit: Max connections in pool (default: 10 for serverless, adjust for containers)
 * - pool_timeout: Seconds to wait for a connection (default: 10)
 *
 * Recommended DATABASE_URL format:
 * postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10
 *
 * For Railway deployments with dedicated containers, connection_limit=20 is recommended.
 * For serverless (Vercel functions), use connection_limit=1 with pgbouncer.
 */

// Prevent multiple instances during development (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: isProd
    ? [{ emit: 'event', level: 'error' }]
    : [
        { emit: 'stdout', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
});

// Log slow queries in production
if (isProd) {
  // @ts-expect-error Prisma event types
  prisma.$on('query', (e: { duration: number; query: string }) => {
    if (e.duration > 1000) {
      logger.warn('Slow query detected', {
        duration: e.duration,
        query: e.query.substring(0, 200),
      });
    }
  });
}

if (isDev) {
  globalForPrisma.prisma = prisma;
}

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

export async function connectDatabase(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await prisma.$connect();
      logger.info('Database connected successfully');
      return;
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        logger.error(`Failed to connect to database after ${MAX_RETRIES} attempts`, error);
        process.exit(1);
      }
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      logger.warn(`Database connection attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${delay}ms...`, {
        error: error instanceof Error ? error.message : String(error),
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
