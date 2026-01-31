import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  // Fix: trim whitespace from CORS origins to handle "origin1, origin2" format
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

// Validate required environment variables
if (!config.databaseUrl) {
  console.error('[CONFIG] FATAL: DATABASE_URL is required');
  process.exit(1);
}

// Warn about default JWT secret instead of failing
if (config.jwtSecret === 'dev-secret-change-in-production') {
  console.warn('[CONFIG] WARNING: Using default JWT_SECRET - set JWT_SECRET env var for production!');
}

// Log configuration for debugging
console.log('[CONFIG] Loaded configuration:');
console.log(`  Environment: ${config.nodeEnv}`);
console.log(`  Port: ${config.port}`);
console.log(`  CORS Origins: ${JSON.stringify(config.corsOrigins)}`);
console.log(`  Database: ${config.databaseUrl ? '[SET]' : '[NOT SET]'}`);
console.log(`  JWT Secret: ${config.jwtSecret === 'dev-secret-change-in-production' ? '[DEFAULT]' : '[SET]'}`);
console.log('[CONFIG] Configuration loaded successfully');

export const isDev = config.nodeEnv === 'development';
export const isProd = config.nodeEnv === 'production';
