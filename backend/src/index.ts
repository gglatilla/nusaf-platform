// Build: 2026-01-27-v2
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { connectDatabase } from './config/database';
import healthRoutes from './api/v1/health/route';
import authRoutes from './api/v1/auth/route';
import importsRoutes from './api/v1/admin/imports/route';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin/imports', importsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
    },
  });
});

// Helper to log registered routes
function logRoutes(app: express.Application): void {
  console.log('Registered routes:');
  app._router.stack.forEach((middleware: { route?: { path: string; methods: Record<string, boolean> }; name?: string; handle?: { stack?: Array<{ route?: { path: string; methods: Record<string, boolean> } }> }; regexp?: RegExp }) => {
    if (middleware.route) {
      // Direct routes
      console.log(`  ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router' && middleware.handle?.stack) {
      // Router middleware
      const path = middleware.regexp?.source
        .replace('\\/?(?=\\/|$)', '')
        .replace(/\\\//g, '/')
        .replace('^', '')
        .replace('(?:\\/)?$', '');
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          console.log(`  ${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${path}${handler.route.path}`);
        }
      });
    }
  });
}

// Start server
async function start(): Promise<void> {
  await connectDatabase();

  app.listen(config.port, () => {
    console.log(`Backend running on http://localhost:${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    logRoutes(app);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
