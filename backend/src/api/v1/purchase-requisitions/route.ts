import { Router } from 'express';
import { authenticate, requireRole } from '../../../middleware/auth';
import { getEffectiveCompanyId } from '../../../utils/company-scope';
import {
  createPurchaseRequisitionSchema,
  rejectPurchaseRequisitionSchema,
  purchaseRequisitionListQuerySchema,
} from '../../../utils/validation/purchase-requisitions';
import {
  createPurchaseRequisition,
  getPurchaseRequisitions,
  getPurchaseRequisitionById,
  approvePurchaseRequisition,
  rejectPurchaseRequisition,
  cancelPurchaseRequisition,
} from '../../../services/purchase-requisition.service';
import { prisma } from '../../../config/database';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/purchase-requisitions
 * List purchase requisitions with filters and pagination
 */
router.get('/', requireRole('ADMIN', 'MANAGER', 'SALES', 'PURCHASER', 'WAREHOUSE'), async (req, res) => {
  try {
    const queryResult = purchaseRequisitionListQuerySchema.safeParse(req.query);
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
    const result = await getPurchaseRequisitions(queryResult.data, getEffectiveCompanyId(req));

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List purchase requisitions error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to list purchase requisitions',
      },
    });
  }
});

/**
 * GET /api/v1/purchase-requisitions/:id
 * Get purchase requisition details with lines
 */
router.get('/:id', requireRole('ADMIN', 'MANAGER', 'SALES', 'PURCHASER', 'WAREHOUSE'), async (req, res) => {
  try {

    const { id } = req.params;

    const pr = await getPurchaseRequisitionById(id, getEffectiveCompanyId(req));

    if (!pr) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Purchase requisition not found' },
      });
    }

    return res.json({
      success: true,
      data: pr,
    });
  } catch (error) {
    console.error('Get purchase requisition error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch purchase requisition',
      },
    });
  }
});

/**
 * POST /api/v1/purchase-requisitions
 * Create a new purchase requisition
 */
router.post('/', requireRole('ADMIN', 'MANAGER', 'SALES', 'PURCHASER', 'WAREHOUSE'), async (req, res) => {
  try {
    const bodyResult = createPurchaseRequisitionSchema.safeParse(req.body);
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

    // Resolve user name
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { firstName: true, lastName: true },
    });
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

    const result = await createPurchaseRequisition(
      bodyResult.data,
      req.user!.id,
      userName,
      getEffectiveCompanyId(req) ?? req.user!.companyId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'CREATE_FAILED', message: result.error },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Create purchase requisition error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create purchase requisition',
      },
    });
  }
});

/**
 * POST /api/v1/purchase-requisitions/:id/approve
 * Approve a purchase requisition and auto-create draft PO(s)
 */
router.post('/:id/approve', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {

    const { id } = req.params;

    // Resolve user name
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { firstName: true, lastName: true },
    });
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

    const result = await approvePurchaseRequisition(
      id,
      req.user!.id,
      userName,
      getEffectiveCompanyId(req)
    );

    if (!result.success) {
      const statusCode = result.error === 'Purchase requisition not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Purchase requisition not found' ? 'NOT_FOUND' : 'APPROVE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        message: 'Purchase requisition approved',
        generatedPOIds: result.data?.generatedPOIds || [],
      },
    });
  } catch (error) {
    console.error('Approve purchase requisition error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'APPROVE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to approve purchase requisition',
      },
    });
  }
});

/**
 * POST /api/v1/purchase-requisitions/:id/reject
 * Reject a purchase requisition
 */
router.post('/:id/reject', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const bodyResult = rejectPurchaseRequisitionSchema.safeParse(req.body);
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
    const { id } = req.params;

    const result = await rejectPurchaseRequisition(
      id,
      bodyResult.data.reason,
      req.user!.id,
      getEffectiveCompanyId(req)
    );

    if (!result.success) {
      const statusCode = result.error === 'Purchase requisition not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Purchase requisition not found' ? 'NOT_FOUND' : 'REJECT_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Purchase requisition rejected' },
    });
  } catch (error) {
    console.error('Reject purchase requisition error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'REJECT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to reject purchase requisition',
      },
    });
  }
});

/**
 * POST /api/v1/purchase-requisitions/:id/cancel
 * Cancel a purchase requisition (only by creator)
 */
router.post('/:id/cancel', requireRole('ADMIN', 'MANAGER', 'SALES', 'PURCHASER', 'WAREHOUSE'), async (req, res) => {
  try {

    const { id } = req.params;

    const result = await cancelPurchaseRequisition(
      id,
      req.user!.id,
      getEffectiveCompanyId(req)
    );

    if (!result.success) {
      const statusCode = result.error === 'Purchase requisition not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Purchase requisition not found' ? 'NOT_FOUND' : 'CANCEL_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Purchase requisition cancelled' },
    });
  } catch (error) {
    console.error('Cancel purchase requisition error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cancel purchase requisition',
      },
    });
  }
});

export default router;
