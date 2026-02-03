import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Environment variable schema with validation
const envSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGINS: z.string().optional(),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
});

// Validate environment variables at startup
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Environment validation failed:');
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  return result.data;
}

const env = validateEnv();

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  corsOrigins: env.CORS_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || ['http://localhost:3000'],

  // Auth
  jwtSecret: env.JWT_SECRET,
  accessTokenExpiry: '15m', // 15 minutes
  refreshTokenExpiry: '7d', // 7 days
  bcryptRounds: 12,

  // Security
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes in ms
};

export const isDev = config.nodeEnv === 'development';
export const isProd = config.nodeEnv === 'production';
