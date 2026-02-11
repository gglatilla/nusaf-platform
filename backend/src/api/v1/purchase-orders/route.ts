import { Router } from 'express';
import { authenticate, requireRole } from '../../../middleware/auth';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  addPurchaseOrderLineSchema,
  updatePurchaseOrderLineSchema,
  purchaseOrderListQuerySchema,
  rejectPurchaseOrderSchema,
  sendPurchaseOrderSchema,
} from '../../../utils/validation/purchase-orders';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  cancelPurchaseOrder,
  addPurchaseOrderLine,
  updatePurchaseOrderLine,
  removePurchaseOrderLine,
  submitForApproval,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  sendToSupplier,
  getPurchaseOrderPDF,
  acknowledgePurchaseOrder,
} from '../../../services/purchase-order.service';

const router = Router();

// ============================================
// CRUD ROUTES
// ============================================

/**
 * POST /api/v1/purchase-orders
 * Create a new purchase order
 */
router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'PURCHASER'),
  async (req, res) => {
    try {
      const bodyResult = createPurchaseOrderSchema.safeParse(req.body);
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

      const result = await createPurchaseOrder(bodyResult.data, req.user!.id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'PO_CREATE_FAILED', message: result.error },
        });
      }

      return res.status(201).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Create purchase order error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create purchase order',
        },
      });
    }
  }
);

/**
 * GET /api/v1/purchase-orders
 * List purchase orders with filtering and pagination
 */
router.get(
  '/',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'PURCHASER', 'WAREHOUSE'),
  async (req, res) => {
    try {
      const queryResult = purchaseOrderListQuerySchema.safeParse(req.query);
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

      const result = await getPurchaseOrders(queryResult.data);

      return res.json({
        success: true,
        data: {
          purchaseOrders: result.items,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      console.error('List purchase orders error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list purchase orders',
        },
      });
    }
  }
);

/**
 * GET /api/v1/purchase-orders/:id
 * Get purchase order by ID
 */
router.get(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'PURCHASER', 'WAREHOUSE'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const po = await getPurchaseOrderById(id);

      if (!po) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Purchase order not found' },
        });
      }

      return res.json({
        success: true,
        data: po,
      });
    } catch (error) {
      console.error('Get purchase order error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get purchase order',
        },
      });
    }
  }
);

/**
 * PATCH /api/v1/purchase-orders/:id
 * Update purchase order
 */
router.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'PURCHASER'),
  async (req, res) => {
    try {

      const { id } = req.params;

      const bodyResult = updatePurchaseOrderSchema.safeParse(req.body);
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

      const result = await updatePurchaseOrder(id, bodyResult.data, req.user!.id);

      if (!result.success) {
        const statusCode = result.error?.startsWith('VERSION_CONFLICT') ? 409 : 400;
        const errorCode = statusCode === 409 ? 'VERSION_CONFLICT' : 'PO_UPDATE_FAILED';
        return res.status(statusCode).json({
          success: false,
          error: { code: errorCode, message: result.error?.replace('VERSION_CONFLICT: ', '') },
        });
      }

      return res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Update purchase order error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update purchase order',
        },
      });
    }
  }
);

/**
 * DELETE /api/v1/purchase-orders/:id
 * Cancel purchase order
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'MANAGER'),
  async (req, res) => {
    try {

      const { id } = req.params;

      const result = await cancelPurchaseOrder(id, req.user!.id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'PO_CANCEL_FAILED', message: result.error },
        });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Cancel purchase order error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to cancel purchase order',
        },
      });
    }
  }
);

// ============================================
// LINE MANAGEMENT ROUTES
// ============================================

/**
 * POST /api/v1/purchase-orders/:id/lines
 * Add a line to purchase order
 */
router.post(
  '/:id/lines',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'PURCHASER'),
  async (req, res) => {
    try {

      const { id } = req.params;

      const bodyResult = addPurchaseOrderLineSchema.safeParse(req.body);
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

      const result = await addPurchaseOrderLine(id, bodyResult.data, req.user!.id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'LINE_ADD_FAILED', message: result.error },
        });
      }

      return res.status(201).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Add PO line error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to add line',
        },
      });
    }
  }
);

/**
 * PATCH /api/v1/purchase-orders/:id/lines/:lineId
 * Update a purchase order line
 */
router.patch(
  '/:id/lines/:lineId',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'PURCHASER'),
  async (req, res) => {
    try {

      const { id, lineId } = req.params;

      const bodyResult = updatePurchaseOrderLineSchema.safeParse(req.body);
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

      const result = await updatePurchaseOrderLine(id, lineId, bodyResult.data, req.user!.id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'LINE_UPDATE_FAILED', message: result.error },
        });
      }

      return res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Update PO line error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update line',
        },
      });
    }
  }
);

/**
 * DELETE /api/v1/purchase-orders/:id/lines/:lineId
 * Remove a line from purchase order
 */
router.delete(
  '/:id/lines/:lineId',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'PURCHASER'),
  async (req, res) => {
    try {

      const { id, lineId } = req.params;

      const result = await removePurchaseOrderLine(id, lineId, req.user!.id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'LINE_REMOVE_FAILED', message: result.error },
        });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Remove PO line error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to remove line',
        },
      });
    }
  }
);

// ============================================
// WORKFLOW ROUTES
// ============================================

/**
 * POST /api/v1/purchase-orders/:id/submit
 * Submit purchase order for approval (PURCHASER only)
 */
router.post(
  '/:id/submit',
  authenticate,
  requireRole('PURCHASER'),
  async (req, res) => {
    try {

      const { id } = req.params;

      const result = await submitForApproval(id, req.user!.id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'SUBMIT_FAILED', message: result.error },
        });
      }

      return res.json({
        success: true,
        message: 'Purchase order submitted for approval',
      });
    } catch (error) {
      console.error('Submit PO error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to submit purchase order',
        },
      });
    }
  }
);

/**
 * POST /api/v1/purchase-orders/:id/approve
 * Approve purchase order (ADMIN/MANAGER only)
 */
router.post(
  '/:id/approve',
  authenticate,
  requireRole('ADMIN', 'MANAGER'),
  async (req, res) => {
    try {

      const { id } = req.params;

      const result = await approvePurchaseOrder(id, req.user!.id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'APPROVE_FAILED', message: result.error },
        });
      }

      return res.json({
        success: true,
        message: 'Purchase order approved',
      });
    } catch (error) {
      console.error('Approve PO error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to approve purchase order',
        },
      });
    }
  }
);

/**
 * POST /api/v1/purchase-orders/:id/reject
 * Reject purchase order (ADMIN/MANAGER only)
 */
router.post(
  '/:id/reject',
  authenticate,
  requireRole('ADMIN', 'MANAGER'),
  async (req, res) => {
    try {

      const { id } = req.params;

      const bodyResult = rejectPurchaseOrderSchema.safeParse(req.body);
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

      const result = await rejectPurchaseOrder(id, bodyResult.data.reason, req.user!.id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'REJECT_FAILED', message: result.error },
        });
      }

      return res.json({
        success: true,
        message: 'Purchase order rejected',
      });
    } catch (error) {
      console.error('Reject PO error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to reject purchase order',
        },
      });
    }
  }
);

/**
 * POST /api/v1/purchase-orders/:id/send
 * Send purchase order to supplier
 * - Generates PDF and emails to supplier
 * - ADMIN/MANAGER can send directly from DRAFT
 * - PURCHASER can only send after approval
 */
router.post(
  '/:id/send',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'PURCHASER'),
  async (req, res) => {
    try {

      const { id } = req.params;

      // Validate optional send options
      const bodyResult = sendPurchaseOrderSchema.safeParse(req.body || {});
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

      // Get the PO to check status and user role
      const po = await getPurchaseOrderById(id);
      if (!po) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Purchase order not found' },
        });
      }

      // PURCHASER can only send if PO was approved
      if (req.user!.role === 'PURCHASER') {
        if (po.status !== 'PENDING_APPROVAL' || !po.approvedAt) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Purchase order must be approved before sending' },
          });
        }
      }

      // Send to supplier (generates PDF, sends email, updates status)
      const result = await sendToSupplier(id, bodyResult.data, req.user!.id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'SEND_FAILED', message: result.error },
        });
      }

      return res.json({
        success: true,
        message: 'Purchase order sent to supplier',
        data: {
          emailSent: result.data?.emailSent,
          recipientEmail: result.data?.recipientEmail,
          emailError: result.data?.emailError,
        },
      });
    } catch (error) {
      console.error('Send PO error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send purchase order',
        },
      });
    }
  }
);

/**
 * POST /api/v1/purchase-orders/:id/acknowledge
 * Mark purchase order as acknowledged by supplier
 */
router.post(
  '/:id/acknowledge',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'PURCHASER'),
  async (req, res) => {
    try {

      const { id } = req.params;

      const result = await acknowledgePurchaseOrder(id, req.user!.id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'ACKNOWLEDGE_FAILED', message: result.error },
        });
      }

      return res.json({
        success: true,
        message: 'Purchase order acknowledged',
      });
    } catch (error) {
      console.error('Acknowledge PO error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to acknowledge purchase order',
        },
      });
    }
  }
);

/**
 * GET /api/v1/purchase-orders/:id/pdf
 * Download purchase order PDF
 */
router.get(
  '/:id/pdf',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'PURCHASER', 'WAREHOUSE'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const po = await getPurchaseOrderById(id);
      if (!po) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Purchase order not found' },
        });
      }

      const result = await getPurchaseOrderPDF(id);

      if (!result.success || !result.data) {
        return res.status(400).json({
          success: false,
          error: { code: 'PDF_GENERATION_FAILED', message: result.error || 'Failed to generate PDF' },
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${po.poNumber}.pdf"`);
      res.setHeader('Content-Length', result.data.length);
      return res.send(result.data);
    } catch (error) {
      console.error('Download PO PDF error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate PDF',
        },
      });
    }
  }
);

// ============================================
// GOODS RECEIPT ROUTES (on PO)
// ============================================

import { getGoodsReceiptsForPO, getPOReceivingSummary } from '../../../services/grv.service';

/**
 * GET /api/v1/purchase-orders/:id/goods-receipts
 * Get all goods receipts for this purchase order
 */
router.get(
  '/:id/goods-receipts',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'PURCHASER', 'WAREHOUSE'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verify PO exists
      const po = await getPurchaseOrderById(id);
      if (!po) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Purchase order not found' },
        });
      }

      const grvs = await getGoodsReceiptsForPO(id);

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
 * GET /api/v1/purchase-orders/:id/receiving-summary
 * Get receiving summary for this purchase order
 */
router.get(
  '/:id/receiving-summary',
  authenticate,
  requireRole('ADMIN', 'MANAGER', 'PURCHASER', 'WAREHOUSE'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const summary = await getPOReceivingSummary(id);

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
