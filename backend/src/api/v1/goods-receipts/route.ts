import { Router } from 'express';
import { authenticate, requireRole } from '../../../middleware/auth';
import { prisma } from '../../../config/database';
import {
  createGrvSchema,
  grvListQuerySchema,
} from '../../../utils/validation/goods-receipts';
import {
  createGoodsReceipt,
  getGoodsReceipts,
  getGoodsReceiptById,
  getGoodsReceiptsForPO,
  getPOReceivingSummary,
} from '../../../services/grv.service';

const router = Router();

// ============================================
// GRV ROUTES
// ============================================

/**
 * POST /api/v1/goods-receipts
 * Create a new goods received voucher
 * Only ADMIN and WAREHOUSE roles can receive goods
 */
router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'WAREHOUSE'),
  async (req, res) => {
    try {
      const bodyResult = createGrvSchema.safeParse(req.body);
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

      // Fetch user name from database
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { firstName: true, lastName: true },
      });

      const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

      const result = await createGoodsReceipt(
        bodyResult.data,
        req.user!.id,
        userName
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'GRV_CREATE_FAILED', message: result.error },
        });
      }

      return res.status(201).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Create goods receipt error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create goods receipt',
        },
      });
    }
  }
);

/**
 * GET /api/v1/goods-receipts
 * List goods receipts with filtering and pagination
 */
router.get(
  '/',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'),
  async (req, res) => {
    try {
      const queryResult = grvListQuerySchema.safeParse(req.query);
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

      const result = await getGoodsReceipts(queryResult.data);

      return res.json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('List goods receipts error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list goods receipts',
        },
      });
    }
  }
);

/**
 * GET /api/v1/goods-receipts/:id
 * Get a specific goods receipt by ID
 */
router.get(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'),
  async (req, res) => {
    try {
      const grv = await getGoodsReceiptById(req.params.id);

      if (!grv) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Goods receipt not found' },
        });
      }

      return res.json({
        success: true,
        data: grv,
      });
    } catch (error) {
      console.error('Get goods receipt error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get goods receipt',
        },
      });
    }
  }
);

// ============================================
// PO-RELATED GRV ROUTES
// These are mounted on /api/v1/purchase-orders/:id/...
// but we also provide them here for convenience
// ============================================

/**
 * GET /api/v1/goods-receipts/po/:purchaseOrderId
 * Get all goods receipts for a specific purchase order
 */
router.get(
  '/po/:purchaseOrderId',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'PURCHASER', 'WAREHOUSE'),
  async (req, res) => {
    try {
      const grvs = await getGoodsReceiptsForPO(req.params.purchaseOrderId);

      return res.json({
        success: true,
        data: grvs,
      });
    } catch (error) {
      console.error('Get PO goods receipts error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get goods receipts',
        },
      });
    }
  }
);

/**
 * GET /api/v1/goods-receipts/po/:purchaseOrderId/summary
 * Get receiving summary for a PO (what's been received vs outstanding)
 */
router.get(
  '/po/:purchaseOrderId/summary',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'PURCHASER', 'WAREHOUSE'),
  async (req, res) => {
    try {
      const summary = await getPOReceivingSummary(req.params.purchaseOrderId);

      if (!summary) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Purchase order not found' },
        });
      }

      return res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('Get PO receiving summary error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get receiving summary',
        },
      });
    }
  }
);

export default router;
