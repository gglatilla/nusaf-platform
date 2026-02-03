import { Router, Request, Response } from 'express';
import { prisma } from '../../../config/database';

const router = Router();

// Track server start time for uptime calculation
const startTime = Date.now();

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and database connectivity
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: "0.1.0"
 *                 uptime:
 *                   type: integer
 *                   description: Uptime in seconds
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: healthy
 *                         latency:
 *                           type: integer
 *                           description: Database response time in ms
 *       503:
 *         description: Service is unhealthy
 */
router.get('/', async (_req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version || '0.1.0';
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  try {
    // Check database connectivity with timing
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    res.json({
      status: 'healthy',
      timestamp,
      version,
      uptime,
      checks: {
        database: {
          status: 'healthy',
          latency: dbLatency,
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp,
      version,
      uptime,
      checks: {
        database: {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Database connection failed',
        },
      },
    });
  }
});

export default router;
