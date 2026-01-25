import { Router, Request, Response } from 'express';
import { prisma } from '../../../config/database';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'down',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
    });
  }
});

export default router;
