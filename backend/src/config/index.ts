import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiry: process.env.JWT_EXPIRY || '24h',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
};

export const isDev = config.nodeEnv === 'development';
export const isProd = config.nodeEnv === 'production';
