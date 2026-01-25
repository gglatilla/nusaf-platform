import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { connectDatabase } from './config/database';
import healthRoutes from './api/v1/health/route';

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

// Start server
async function start(): Promise<void> {
  await connectDatabase();

  app.listen(config.port, () => {
    console.log(`Backend running on http://localhost:${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
