import { Router } from 'express';
import { authenticate, requireRole, type AuthenticatedRequest } from '../../../middleware/auth';
import {
  stockLevelListQuerySchema,
  stockMovementListQuerySchema,
  createStockAdjustmentSchema,
  stockAdjustmentListQuerySchema,
  rejectStockAdjustmentSchema,
  reservationListQuerySchema,
  releaseReservationSchema,
  createCycleCountSchema,
  submitCycleCountLinesSchema,
  cycleCountListQuerySchema,
} from '../../../utils/validation/inventory';
import {
  getStockLevel,
  getStockLevels,
  getProductStockAcrossLocations,
  getLowStockProducts,
  getStockMovements,
  getProductMovementHistory,
  createStockAdjustment,
  getStockAdjustment,
  getStockAdjustments,
  approveStockAdjustment,
  rejectStockAdjustment,
  getReservations,
  getProductReservations,
  releaseReservation,
  releaseExpiredSoftReservations,
  getInventorySummary,
  updateReorderSettings,
} from '../../../services/inventory.service';
import {
  createCycleCountSession,
  getCycleCountSession,
  getCycleCountSessions,
  submitCycleCountLines,
  completeCycleCountSession,
  reconcileCycleCountSession,
  reconcileAndApplyCycleCount,
  cancelCycleCountSession,
} from '../../../services/cycle-count.service';
import { getInventoryDashboard } from '../../../services/inventory-dashboard.service';
import { Warehouse } from '@prisma/client';

const router = Router();

// ============================================
// INVENTORY DASHBOARD SUMMARY
// ============================================

/**
 * GET /api/v1/inventory/summary
 * Get inventory summary counts for the dashboard
 */
router.get('/summary', authenticate, requireRole('ADMIN', 'MANAGER', 'SALES'), async (_req, res) => {
  try {
    const summary = await getInventorySummary();

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get inventory summary error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SUMMARY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch inventory summary',
      },
    });
  }
});

// ============================================
// INVENTORY DASHBOARD (AGGREGATED)
// ============================================

/**
 * GET /api/v1/inventory/dashboard
 * Get aggregated inventory dashboard data for all warehouses
 */
router.get('/dashboard', authenticate, requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'PURCHASER'), async (_req, res) => {
  try {
    const data = await getInventoryDashboard();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get inventory dashboard error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DASHBOARD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch inventory dashboard',
      },
    });
  }
});

// ============================================
// STOCK LEVEL ENDPOINTS
// ============================================

/**
 * GET /api/v1/inventory/stock
 * List stock levels with filtering and pagination
 */
router.get('/stock', authenticate, requireRole('ADMIN', 'MANAGER', 'SALES'), async (req, res) => {
  try {
    const queryResult = stockLevelListQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: queryResult.error.errors,
        },
      });
    }

    const result = await getStockLevels(queryResult.data);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List stock levels error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'STOCK_LEVELS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch stock levels',
      },
    });
  }
});

/**
 * GET /api/v1/inventory/stock/low
 * Get low stock products
 */
router.get('/stock/low', authenticate, requireRole('ADMIN', 'MANAGER', 'SALES', 'PURCHASER', 'WAREHOUSE'), async (req, res) => {
  try {
    const location = req.query.location as Warehouse | undefined;

    if (location && !['JHB', 'CT'].includes(location)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid location' },
      });
    }

    const result = await getLowStockProducts(location);

    return res.json({
      success: true,
      data: { lowStockProducts: result },
    });
  } catch (error) {
    console.error('Low stock products error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'LOW_STOCK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch low stock products',
      },
    });
  }
});

/**
 * GET /api/v1/inventory/stock/:productId
 * Get stock levels for a product across all locations
 */
router.get('/stock/:productId', authenticate, requireRole('ADMIN', 'MANAGER', 'SALES'), async (req, res) => {
  try {
    const { productId } = req.params;
    const location = req.query.location as Warehouse | undefined;

    if (location) {
      // Get stock for specific location
      if (!['JHB', 'CT'].includes(location)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid location' },
        });
      }

      const stockLevel = await getStockLevel(productId, location);
      if (!stockLevel) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Stock level not found' },
        });
      }

      return res.json({
        success: true,
        data: stockLevel,
      });
    }

    // Get stock across all locations
    const stockLevels = await getProductStockAcrossLocations(productId);

    return res.json({
      success: true,
      data: { stockLevels },
    });
  } catch (error) {
    console.error('Get product stock error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_STOCK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch product stock',
      },
    });
  }
});

/**
 * PATCH /api/v1/inventory/stock/:productId
 * Update reorder settings for a product at a specific location
 */
router.patch('/stock/:productId', authenticate, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { productId } = req.params;
    const { location, reorderPoint, reorderQuantity, minimumStock, maximumStock } = req.body;

    // Validate location
    if (!location || !['JHB', 'CT'].includes(location)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid or missing location' },
      });
    }

    // Validate at least one field is being updated
    if (
      reorderPoint === undefined &&
      reorderQuantity === undefined &&
      minimumStock === undefined &&
      maximumStock === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'No fields to update' },
      });
    }

    // Update the stock level
    const result = await updateReorderSettings(
      productId,
      location as Warehouse,
      { reorderPoint, reorderQuantity, minimumStock, maximumStock },
      authReq.user.id
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Reorder settings updated successfully' },
    });
  } catch (error) {
    console.error('Update reorder settings error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_REORDER_SETTINGS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update reorder settings',
      },
    });
  }
});

// ============================================
// STOCK MOVEMENT ENDPOINTS
// ============================================

/**
 * GET /api/v1/inventory/movements
 * List stock movements with filtering and pagination
 */
router.get('/movements', authenticate, requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {
    const queryResult = stockMovementListQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: queryResult.error.errors,
        },
      });
    }

    const result = await getStockMovements(queryResult.data);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List stock movements error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'STOCK_MOVEMENTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch stock movements',
      },
    });
  }
});

/**
 * GET /api/v1/inventory/movements/:productId
 * Get movement history for a specific product
 */
router.get('/movements/:productId', authenticate, requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {
    const { productId } = req.params;
    const location = req.query.location as Warehouse | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(100, parseInt(req.query.pageSize as string) || 20);

    if (location && !['JHB', 'CT'].includes(location)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid location' },
      });
    }

    const result = await getProductMovementHistory(productId, {
      location,
      startDate,
      endDate,
      page,
      pageSize,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get product movement history error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'MOVEMENT_HISTORY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch movement history',
      },
    });
  }
});

// ============================================
// STOCK ADJUSTMENT ENDPOINTS
// ============================================

/**
 * POST /api/v1/inventory/adjustments
 * Create a new stock adjustment (pending approval)
 */
router.post('/adjustments', authenticate, requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const bodyResult = createStockAdjustmentSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: bodyResult.error.errors,
        },
      });
    }

    const result = await createStockAdjustment(bodyResult.data, authReq.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'ADJUSTMENT_CREATE_FAILED', message: result.error },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.adjustment,
    });
  } catch (error) {
    console.error('Create stock adjustment error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ADJUSTMENT_CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create adjustment',
      },
    });
  }
});

/**
 * GET /api/v1/inventory/adjustments
 * List stock adjustments with filtering and pagination
 */
router.get('/adjustments', authenticate, requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {
    const queryResult = stockAdjustmentListQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: queryResult.error.errors,
        },
      });
    }

    const result = await getStockAdjustments(queryResult.data);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List stock adjustments error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ADJUSTMENTS_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch adjustments',
      },
    });
  }
});

/**
 * GET /api/v1/inventory/adjustments/:id
 * Get stock adjustment details
 */
router.get('/adjustments/:id', authenticate, requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {
    const { id } = req.params;

    const adjustment = await getStockAdjustment(id);

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Adjustment not found' },
      });
    }

    return res.json({
      success: true,
      data: adjustment,
    });
  } catch (error) {
    console.error('Get stock adjustment error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ADJUSTMENT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch adjustment',
      },
    });
  }
});

/**
 * POST /api/v1/inventory/adjustments/:id/approve
 * Approve a stock adjustment (applies changes to stock levels)
 */
router.post('/adjustments/:id/approve', authenticate, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const result = await approveStockAdjustment(id, authReq.user.id);

    if (!result.success) {
      const statusCode = result.error === 'Adjustment not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Adjustment not found' ? 'NOT_FOUND' : 'APPROVE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Adjustment approved and applied' },
    });
  } catch (error) {
    console.error('Approve stock adjustment error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'APPROVE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to approve adjustment',
      },
    });
  }
});

/**
 * POST /api/v1/inventory/adjustments/:id/reject
 * Reject a stock adjustment
 */
router.post('/adjustments/:id/reject', authenticate, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const bodyResult = rejectStockAdjustmentSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: bodyResult.error.errors,
        },
      });
    }

    const result = await rejectStockAdjustment(id, bodyResult.data.reason, authReq.user.id);

    if (!result.success) {
      const statusCode = result.error === 'Adjustment not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Adjustment not found' ? 'NOT_FOUND' : 'REJECT_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Adjustment rejected' },
    });
  } catch (error) {
    console.error('Reject stock adjustment error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'REJECT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to reject adjustment',
      },
    });
  }
});

// ============================================
// STOCK RESERVATION ENDPOINTS
// ============================================

/**
 * GET /api/v1/inventory/reservations
 * List active reservations with filtering
 */
router.get('/reservations', authenticate, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const queryResult = reservationListQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: queryResult.error.errors,
        },
      });
    }

    const result = await getReservations(queryResult.data);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List reservations error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'RESERVATIONS_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch reservations',
      },
    });
  }
});

/**
 * GET /api/v1/inventory/reservations/:productId
 * Get reservations for a specific product
 */
router.get('/reservations/:productId', authenticate, requireRole('ADMIN', 'MANAGER', 'SALES'), async (req, res) => {
  try {
    const { productId } = req.params;
    const location = req.query.location as Warehouse | undefined;

    if (location && !['JHB', 'CT'].includes(location)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid location' },
      });
    }

    const reservations = await getProductReservations(productId, location);

    return res.json({
      success: true,
      data: { reservations },
    });
  } catch (error) {
    console.error('Get product reservations error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_RESERVATIONS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch product reservations',
      },
    });
  }
});

/**
 * POST /api/v1/inventory/reservations/:id/release
 * Manually release a reservation (admin action)
 */
router.post('/reservations/:id/release', authenticate, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const bodyResult = releaseReservationSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: bodyResult.error.errors,
        },
      });
    }

    const result = await releaseReservation(id, bodyResult.data.reason, authReq.user.id);

    if (!result.success) {
      const statusCode = result.error === 'Reservation not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Reservation not found' ? 'NOT_FOUND' : 'RELEASE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Reservation released' },
    });
  } catch (error) {
    console.error('Release reservation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'RELEASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to release reservation',
      },
    });
  }
});

/**
 * POST /api/v1/inventory/reservations/cleanup-expired
 * Release all expired soft reservations (admin action, can be called by cron)
 */
router.post('/reservations/cleanup-expired', authenticate, requireRole('ADMIN'), async (_req, res) => {
  try {
    const result = await releaseExpiredSoftReservations();

    return res.json({
      success: true,
      data: {
        message: `Released ${result.releasedCount} expired reservations`,
        releasedCount: result.releasedCount,
      },
    });
  } catch (error) {
    console.error('Cleanup expired reservations error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CLEANUP_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cleanup expired reservations',
      },
    });
  }
});

// ============================================
// CYCLE COUNT ENDPOINTS
// ============================================

/**
 * POST /api/v1/inventory/cycle-counts
 * Create a new cycle count session
 */
router.post('/cycle-counts', authenticate, requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const bodyResult = createCycleCountSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: bodyResult.error.errors,
        },
      });
    }

    const result = await createCycleCountSession(
      bodyResult.data.location as Warehouse,
      bodyResult.data.productIds,
      bodyResult.data.notes,
      authReq.user.id
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'CYCLE_COUNT_CREATE_FAILED', message: result.error },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.session,
    });
  } catch (error) {
    console.error('Create cycle count session error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CYCLE_COUNT_CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create cycle count session',
      },
    });
  }
});

/**
 * GET /api/v1/inventory/cycle-counts
 * List cycle count sessions with filtering and pagination
 */
router.get('/cycle-counts', authenticate, requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {
    const queryResult = cycleCountListQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: queryResult.error.errors,
        },
      });
    }

    const result = await getCycleCountSessions(queryResult.data);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List cycle count sessions error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CYCLE_COUNTS_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch cycle count sessions',
      },
    });
  }
});

/**
 * GET /api/v1/inventory/cycle-counts/:id
 * Get cycle count session details with lines
 */
router.get('/cycle-counts/:id', authenticate, requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {
    const { id } = req.params;

    const session = await getCycleCountSession(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cycle count session not found' },
      });
    }

    return res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Get cycle count session error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CYCLE_COUNT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch cycle count session',
      },
    });
  }
});

/**
 * PATCH /api/v1/inventory/cycle-counts/:id/count
 * Submit counted quantities for lines
 */
router.patch('/cycle-counts/:id/count', authenticate, requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const bodyResult = submitCycleCountLinesSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: bodyResult.error.errors,
        },
      });
    }

    const result = await submitCycleCountLines(id, bodyResult.data.lines, authReq.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'SUBMIT_COUNT_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Counts submitted successfully' },
    });
  } catch (error) {
    console.error('Submit cycle count lines error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SUBMIT_COUNT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to submit counts',
      },
    });
  }
});

/**
 * POST /api/v1/inventory/cycle-counts/:id/complete
 * Mark counting as complete (all lines must be counted)
 */
router.post('/cycle-counts/:id/complete', authenticate, requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const result = await completeCycleCountSession(id, authReq.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'COMPLETE_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Cycle count completed' },
    });
  } catch (error) {
    console.error('Complete cycle count session error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'COMPLETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to complete cycle count',
      },
    });
  }
});

/**
 * POST /api/v1/inventory/cycle-counts/:id/reconcile
 * Reconcile variances by creating a stock adjustment
 */
router.post('/cycle-counts/:id/reconcile', authenticate, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const result = await reconcileCycleCountSession(id, authReq.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'RECONCILE_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: {
        message: result.adjustmentId
          ? 'Cycle count reconciled — stock adjustment created'
          : 'Cycle count reconciled — no variances found',
        adjustmentId: result.adjustmentId,
        adjustmentNumber: result.adjustmentNumber,
      },
    });
  } catch (error) {
    console.error('Reconcile cycle count session error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'RECONCILE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to reconcile cycle count',
      },
    });
  }
});

/**
 * POST /api/v1/inventory/cycle-counts/:id/reconcile-and-apply
 * Reconcile variances AND auto-approve adjustment in one step
 */
router.post('/cycle-counts/:id/reconcile-and-apply', authenticate, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const result = await reconcileAndApplyCycleCount(id, authReq.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'RECONCILE_APPLY_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: {
        message: result.applied
          ? 'Cycle count reconciled and stock adjustment applied'
          : result.adjustmentId
            ? `Reconciled but auto-approval failed. ${result.error}`
            : 'Cycle count reconciled — no variances found',
        adjustmentId: result.adjustmentId,
        adjustmentNumber: result.adjustmentNumber,
        applied: result.applied,
      },
    });
  } catch (error) {
    console.error('Reconcile and apply cycle count error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'RECONCILE_APPLY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to reconcile and apply cycle count',
      },
    });
  }
});

/**
 * POST /api/v1/inventory/cycle-counts/:id/cancel
 * Cancel a cycle count session
 */
router.post('/cycle-counts/:id/cancel', authenticate, requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const result = await cancelCycleCountSession(id, authReq.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'CANCEL_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Cycle count session cancelled' },
    });
  } catch (error) {
    console.error('Cancel cycle count session error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cancel cycle count session',
      },
    });
  }
});

export default router;
