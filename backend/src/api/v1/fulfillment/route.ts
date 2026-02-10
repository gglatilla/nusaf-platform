import { Router } from 'express';
import { authenticate, requireRole } from '../../../middleware/auth';
import { getFulfillmentDashboard } from '../../../services/fulfillment-dashboard.service';

const router = Router();

// All fulfillment dashboard routes require authentication and staff roles
router.use(authenticate);
router.use(requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'PURCHASER'));

/**
 * GET /api/v1/fulfillment/dashboard
 * Returns aggregated fulfillment data: picking queue, jobs, transfers, POs, ready-to-ship orders, exceptions
 */
router.get('/dashboard', async (req, res) => {
  try {

    const data = await getFulfillmentDashboard(req.user!.companyId);

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching fulfillment dashboard:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch fulfillment dashboard data',
      },
    });
  }
});

export default router;
