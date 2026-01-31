import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  // Fix: trim whitespace from CORS origins
  corsOrigins: process.env.CORS_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || ['http://localhost:3000'],

  // Auth
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  accessTokenExpiry: '15m', // 15 minutes
  refreshTokenExpiry: '7d', // 7 days
  bcryptRounds: 12,

  // Security
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes in ms
};

export const isDev = config.nodeEnv === 'development';
export const isProd = config.nodeEnv === 'production';
