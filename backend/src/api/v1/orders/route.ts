import { Router } from 'express';
import { authenticate, requireRole, type AuthenticatedRequest } from '../../../middleware/auth';
import {
  createOrderFromQuoteSchema,
  updateOrderNotesSchema,
  holdOrderSchema,
  cancelOrderSchema,
  orderListQuerySchema,
} from '../../../utils/validation/orders';
import {
  generatePlanSchema,
  executePlanSchema,
  updatePolicySchema,
} from '../../../utils/validation/orchestration';
import {
  getOrders,
  getOrderById,
  createOrderFromQuote,
  confirmOrder,
  holdOrder,
  releaseHold,
  cancelOrder,
  updateOrderNotes,
} from '../../../services/order.service';
import { allocateForOrder } from '../../../services/allocation.service';
import {
  generateFulfillmentPlan,
  executeFulfillmentPlan,
  type OrchestrationPlan,
} from '../../../services/orchestration.service';

const router = Router();

// Apply authentication and role-based access control to all routes
// Orders can only be managed by internal staff, not customers
router.use(authenticate);
router.use(requireRole('ADMIN', 'MANAGER', 'SALES'));

/**
 * POST /api/v1/orders/from-quote
 * Create a new order from an accepted quote
 */
router.post('/from-quote', async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;

    // Validate request body
    const bodyResult = createOrderFromQuoteSchema.safeParse(req.body);
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

    const { quoteId, customerPoNumber, customerPoDate, requiredDate, customerNotes } = bodyResult.data;

    const result = await createOrderFromQuote(quoteId, authReq.user.id, authReq.user.companyId, {
      customerPoNumber,
      customerPoDate,
      requiredDate,
      customerNotes,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'ORDER_CREATE_FAILED', message: result.error },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.order,
    });
  } catch (error) {
    console.error('Create order from quote error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ORDER_CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create order',
      },
    });
  }
});

/**
 * GET /api/v1/orders
 * List orders for the user's company with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;

    const queryResult = orderListQuerySchema.safeParse(req.query);
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

    const { status, page, pageSize } = queryResult.data;

    const result = await getOrders({
      companyId: authReq.user.companyId,
      status,
      page,
      pageSize,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List orders error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ORDERS_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch orders',
      },
    });
  }
});

/**
 * GET /api/v1/orders/:id
 * Get order details
 */
router.get('/:id', async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const order = await getOrderById(id, authReq.user.companyId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ORDER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch order',
      },
    });
  }
});

/**
 * GET /api/v1/orders/:id/allocation-plan
 * Get allocation plan for an order (preview - does NOT create reservations)
 * Returns which warehouse(s) would fulfill each line item
 */
router.get('/:id/allocation-plan', async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    // Verify order exists and belongs to company
    const order = await getOrderById(id, authReq.user.companyId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
    }

    const result = await allocateForOrder(id);

    if ('error' in result) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALLOCATION_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get allocation plan error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ALLOCATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate allocation plan',
      },
    });
  }
});

/**
 * PATCH /api/v1/orders/:id
 * Update order notes
 */
router.patch('/:id', async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    // Validate request body
    const bodyResult = updateOrderNotesSchema.safeParse(req.body);
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

    // Verify order exists and belongs to company
    const order = await getOrderById(id, authReq.user.companyId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
    }

    const result = await updateOrderNotes(id, bodyResult.data, authReq.user.id, authReq.user.companyId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Order notes updated' },
    });
  } catch (error) {
    console.error('Update order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ORDER_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update order',
      },
    });
  }
});

/**
 * POST /api/v1/orders/:id/confirm
 * Confirm order (DRAFT -> CONFIRMED)
 */
router.post('/:id/confirm', async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const result = await confirmOrder(id, authReq.user.id, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Order not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Order not found' ? 'NOT_FOUND' : 'CONFIRM_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Order confirmed' },
    });
  } catch (error) {
    console.error('Confirm order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CONFIRM_ERROR',
        message: error instanceof Error ? error.message : 'Failed to confirm order',
      },
    });
  }
});

/**
 * POST /api/v1/orders/:id/hold
 * Put order on hold
 */
router.post('/:id/hold', async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    // Validate request body
    const bodyResult = holdOrderSchema.safeParse(req.body);
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

    const result = await holdOrder(id, bodyResult.data.reason, authReq.user.id, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Order not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Order not found' ? 'NOT_FOUND' : 'HOLD_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Order put on hold' },
    });
  } catch (error) {
    console.error('Hold order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'HOLD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to put order on hold',
      },
    });
  }
});

/**
 * POST /api/v1/orders/:id/release
 * Release order from hold
 */
router.post('/:id/release', async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const result = await releaseHold(id, authReq.user.id, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Order not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Order not found' ? 'NOT_FOUND' : 'RELEASE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Order released from hold' },
    });
  } catch (error) {
    console.error('Release order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'RELEASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to release order from hold',
      },
    });
  }
});

/**
 * POST /api/v1/orders/:id/cancel
 * Cancel order
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    // Validate request body
    const bodyResult = cancelOrderSchema.safeParse(req.body);
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

    const result = await cancelOrder(id, bodyResult.data.reason, authReq.user.id, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Order not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Order not found' ? 'NOT_FOUND' : 'CANCEL_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Order cancelled' },
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cancel order',
      },
    });
  }
});

// ============================================
// ORCHESTRATION ENDPOINTS
// ============================================

/**
 * POST /api/v1/orders/:id/fulfillment-plan
 * Generate a fulfillment plan for an order (preview)
 */
router.post('/:id/fulfillment-plan', async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    // Validate request body (optional)
    const bodyResult = generatePlanSchema.safeParse(req.body || {});
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

    // Verify order belongs to company
    const order = await import('../../../config/database').then(m => m.prisma.salesOrder.findFirst({
      where: { id, companyId: authReq.user.companyId, deletedAt: null },
      select: { id: true },
    }));

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
    }

    const result = await generateFulfillmentPlan({
      orderId: id,
      policyOverride: bodyResult.data.policyOverride as 'SHIP_PARTIAL' | 'SHIP_COMPLETE' | 'SALES_DECISION' | undefined,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'PLAN_GENERATION_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Generate fulfillment plan error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PLAN_GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate fulfillment plan',
      },
    });
  }
});

/**
 * POST /api/v1/orders/:id/fulfillment-plan/execute
 * Execute a fulfillment plan (create documents)
 */
router.post('/:id/fulfillment-plan/execute', async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    // Validate request body
    const bodyResult = executePlanSchema.safeParse(req.body);
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

    const { plan } = bodyResult.data;

    // Verify plan is for this order
    if (plan.orderId !== id) {
      return res.status(400).json({
        success: false,
        error: { code: 'PLAN_MISMATCH', message: 'Plan does not match order ID' },
      });
    }

    const result = await executeFulfillmentPlan({
      plan: plan as OrchestrationPlan,
      userId: authReq.user.id,
      companyId: authReq.user.companyId,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'EXECUTION_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Execute fulfillment plan error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to execute fulfillment plan',
      },
    });
  }
});

/**
 * PATCH /api/v1/orders/:id/fulfillment-policy
 * Update the fulfillment policy override for an order
 */
router.patch('/:id/fulfillment-policy', async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    // Validate request body
    const bodyResult = updatePolicySchema.safeParse(req.body);
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

    const { prisma } = await import('../../../config/database');

    // Verify order belongs to company
    const order = await prisma.salesOrder.findFirst({
      where: { id, companyId: authReq.user.companyId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
    }

    // Only allow policy change for CONFIRMED orders
    if (order.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Fulfillment policy can only be changed for CONFIRMED orders',
        },
      });
    }

    // Update policy
    const updated = await prisma.salesOrder.update({
      where: { id },
      data: {
        fulfillmentPolicyOverride: bodyResult.data.fulfillmentPolicyOverride as 'SHIP_PARTIAL' | 'SHIP_COMPLETE' | 'SALES_DECISION' | null,
        updatedBy: authReq.user.id,
      },
      select: { id: true, fulfillmentPolicyOverride: true },
    });

    return res.json({
      success: true,
      data: { fulfillmentPolicyOverride: updated.fulfillmentPolicyOverride },
    });
  } catch (error) {
    console.error('Update fulfillment policy error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update fulfillment policy',
      },
    });
  }
});

export default router;
