import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, type AuthenticatedRequest } from '../../../../middleware/auth';
import { getSettings, updateEurZarRate } from '../../../../services/settings.service';
import { recalculateProductPrices } from '../../../../services/pricing.service';

const router = Router();

// Apply authentication and admin role check to all routes
router.use(authenticate);
router.use(requireRole('ADMIN', 'MANAGER'));

// Validation schema for updating EUR/ZAR rate
const updateRateSchema = z.object({
  eurZarRate: z.number().positive('Rate must be positive').max(1000, 'Rate seems unreasonably high'),
});

/**
 * GET /api/v1/admin/settings
 * Get current global settings
 */
router.get('/', async (_req, res) => {
  try {
    const settings = await getSettings();

    return res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SETTINGS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get settings',
      },
    });
  }
});

/**
 * PATCH /api/v1/admin/settings
 * Update global settings (currently only EUR/ZAR rate)
 */
router.patch('/', async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const parseResult = updateRateSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const { eurZarRate } = parseResult.data;
    const settings = await updateEurZarRate(eurZarRate, authReq.user.id);

    // Auto-recalculate all product prices with the new EUR/ZAR rate
    try {
      const result = await recalculateProductPrices({ userId: authReq.user.id });
      console.log(`EUR/ZAR rate updated: recalculated ${result.updated}/${result.total} products`);
    } catch (recalcError) {
      console.error('Price recalculation failed after EUR/ZAR rate update:', recalcError);
      // Don't fail the request - the rate was updated successfully
    }

    return res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update settings',
      },
    });
  }
});

export default router;
