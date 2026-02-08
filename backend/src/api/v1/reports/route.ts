import { Router } from 'express';
import { authenticate, requireRole } from '../../../middleware/auth';
import { getSalesReport } from '../../../services/sales-report.service';

const router = Router();

// All report routes require authentication and management/sales roles
router.use(authenticate);
router.use(requireRole('ADMIN', 'MANAGER', 'SALES'));

/**
 * GET /api/v1/reports/sales
 * Returns comprehensive sales report data for a date range.
 *
 * Query params:
 *   startDate - ISO date string (optional)
 *   endDate   - ISO date string (optional)
 */
router.get('/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Parse optional date params
    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate && typeof startDate === 'string') {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid startDate format' },
        });
      }
    }

    if (endDate && typeof endDate === 'string') {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid endDate format' },
        });
      }
    }

    const data = await getSalesReport(start, end);

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching sales report:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch sales report data',
      },
    });
  }
});

export default router;
