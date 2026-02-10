import { Router } from 'express';
import { authenticate, requireRole } from '../../../middleware/auth';
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
import { recordPaymentSchema, voidPaymentSchema } from '../../../utils/validation/payments';
import {
  getOrders,
  getOrderById,
  createOrderFromQuote,
  confirmOrder,
  holdOrder,
  releaseHold,
  cancelOrder,
  closeOrder,
  updateOrderNotes,
} from '../../../services/order.service';
import { getOrderTimeline } from '../../../services/order-timeline.service';
import { allocateForOrder } from '../../../services/allocation.service';
import {
  generateFulfillmentPlan,
  executeFulfillmentPlan,
  type OrchestrationPlan,
} from '../../../services/orchestration.service';
import {
  recordPayment,
  getPaymentsByOrder,
  getPaymentById,
  voidPayment,
} from '../../../services/payment.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Staff-only middleware for write operations
const staffOnly = requireRole('ADMIN', 'MANAGER', 'SALES');

const STAFF_ROLES = ['ADMIN', 'MANAGER', 'SALES'];

/**
 * Get the effective companyId for order access.
 * Staff can access all orders (returns undefined = no company filter).
 * Customers are strictly isolated to their own company.
 */
function getEffectiveCompanyId(req: { user?: { role: string; companyId: string } }): string | undefined {
  return STAFF_ROLES.includes(req.user!.role) ? undefined : req.user!.companyId;
}

/**
 * POST /api/v1/orders/from-quote
 * Create a new order from an accepted quote
 */
router.post('/from-quote', staffOnly, async (req, res) => {
  try {
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

    // Staff users operate on behalf of customers — use the quote's companyId, not staff's own
    const isStaff = ['ADMIN', 'MANAGER', 'SALES'].includes(req.user!.role);
    let targetCompanyId = req.user!.companyId;

    if (isStaff) {
      const { prisma } = await import('../../../config/database');
      const quote = await prisma.quote.findFirst({
        where: { id: quoteId, deletedAt: null },
        select: { companyId: true },
      });
      if (!quote) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Quote not found' },
        });
      }
      targetCompanyId = quote.companyId;
    }

    const result = await createOrderFromQuote(quoteId, req.user!.id, targetCompanyId, {
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
      companyId: getEffectiveCompanyId(req),
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

    const { id } = req.params;

    const order = await getOrderById(id, getEffectiveCompanyId(req));

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
    }

    // Golden Rule 4: Strip internal data for CUSTOMER role
    const isCustomer = req.user!.role === 'CUSTOMER';
    const responseData = isCustomer
      ? { ...order, internalNotes: undefined, warehouse: undefined }
      : order;

    return res.json({
      success: true,
      data: responseData,
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
 * GET /api/v1/orders/:id/timeline
 * Get chronological activity log for an order
 */
router.get('/:id/timeline', async (req, res) => {
  try {

    const { id } = req.params;

    const events = await getOrderTimeline(id, getEffectiveCompanyId(req));

    return res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Get order timeline error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'TIMELINE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch order timeline',
      },
    });
  }
});

/**
 * GET /api/v1/orders/:id/allocation-plan
 * Get allocation plan for an order (preview - does NOT create reservations)
 * Returns which warehouse(s) would fulfill each line item
 */
router.get('/:id/allocation-plan', staffOnly, async (req, res) => {
  try {

    const { id } = req.params;

    // Verify order exists
    const order = await getOrderById(id, getEffectiveCompanyId(req));
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
router.patch('/:id', staffOnly, async (req, res) => {
  try {

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

    // Verify order exists
    const order = await getOrderById(id, getEffectiveCompanyId(req));
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
    }

    const result = await updateOrderNotes(id, bodyResult.data, req.user!.id, getEffectiveCompanyId(req));

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
router.post('/:id/confirm', staffOnly, async (req, res) => {
  try {

    const { id } = req.params;

    const result = await confirmOrder(id, req.user!.id, getEffectiveCompanyId(req));

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
router.post('/:id/hold', staffOnly, async (req, res) => {
  try {

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

    const result = await holdOrder(id, bodyResult.data.reason, req.user!.id, getEffectiveCompanyId(req));

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
router.post('/:id/release', staffOnly, async (req, res) => {
  try {

    const { id } = req.params;

    const result = await releaseHold(id, req.user!.id, getEffectiveCompanyId(req));

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
router.post('/:id/cancel', staffOnly, async (req, res) => {
  try {

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

    const result = await cancelOrder(id, bodyResult.data.reason, req.user!.id, getEffectiveCompanyId(req));

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

/**
 * POST /api/v1/orders/:id/close
 * Close order (INVOICED -> CLOSED) — ADMIN/MANAGER only
 */
router.post('/:id/close', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {

    const { id } = req.params;

    const result = await closeOrder(id, req.user!.id, getEffectiveCompanyId(req));

    if (!result.success) {
      const statusCode = result.error === 'Order not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Order not found' ? 'NOT_FOUND' : 'CLOSE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Order closed' },
    });
  } catch (error) {
    console.error('Close order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CLOSE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to close order',
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
router.post('/:id/fulfillment-plan', staffOnly, async (req, res) => {
  try {

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

    // Verify order exists
    const order = await getOrderById(id, getEffectiveCompanyId(req));

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
router.post('/:id/fulfillment-plan/execute', staffOnly, async (req, res) => {
  try {

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
      userId: req.user!.id,
      companyId: getEffectiveCompanyId(req) ?? req.user!.companyId,
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
router.patch('/:id/fulfillment-policy', staffOnly, async (req, res) => {
  try {

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

    // Verify order exists
    const effectiveCompanyId = getEffectiveCompanyId(req);
    const orderWhere: Record<string, unknown> = { id, deletedAt: null };
    if (effectiveCompanyId) orderWhere.companyId = effectiveCompanyId;

    const order = await prisma.salesOrder.findFirst({
      where: orderWhere,
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
        updatedBy: req.user!.id,
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

// ============================================
// PAYMENT ENDPOINTS
// ============================================

/**
 * POST /api/v1/orders/:id/payments
 * Record a payment against an order
 */
router.post('/:id/payments', requireRole('ADMIN', 'MANAGER', 'SALES'), async (req, res) => {
  try {

    const { id } = req.params;

    const bodyResult = recordPaymentSchema.safeParse(req.body);
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

    // Verify order exists
    const order = await getOrderById(id, getEffectiveCompanyId(req));
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
    }

    const result = await recordPayment(
      id,
      bodyResult.data,
      req.user!.id,
      req.user!.email
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'PAYMENT_FAILED', message: result.error },
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        ...result.payment,
        fulfillmentTriggered: result.fulfillmentTriggered ?? false,
        fulfillmentError: result.fulfillmentError,
      },
    });
  } catch (error) {
    console.error('Record payment error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PAYMENT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to record payment',
      },
    });
  }
});

/**
 * GET /api/v1/orders/:id/payments
 * List payments for an order
 */
router.get('/:id/payments', async (req, res) => {
  try {

    const { id } = req.params;

    // Verify order exists
    const order = await getOrderById(id, getEffectiveCompanyId(req));
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
    }

    const payments = await getPaymentsByOrder(id);

    // Golden Rule 4: Strip internal data for CUSTOMER role
    const isCustomer = req.user!.role === 'CUSTOMER';
    const responseData = isCustomer
      ? payments
          .filter((p) => p.status !== 'VOIDED')
          .map((p) => ({
            id: p.id,
            paymentNumber: p.paymentNumber,
            amount: p.amount,
            paymentDate: p.paymentDate,
            status: p.status,
          }))
      : payments;

    return res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('List payments error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PAYMENTS_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch payments',
      },
    });
  }
});

/**
 * GET /api/v1/orders/payments/:paymentId
 * Get payment detail
 */
router.get('/payments/:paymentId', async (req, res) => {
  try {

    const { paymentId } = req.params;

    const payment = await getPaymentById(paymentId);

    const effectiveId = getEffectiveCompanyId(req);
    if (!payment || (effectiveId && payment.companyId !== effectiveId)) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Payment not found' },
      });
    }

    return res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Get payment error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PAYMENT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch payment',
      },
    });
  }
});

/**
 * POST /api/v1/orders/payments/:paymentId/void
 * Void a payment (ADMIN/MANAGER only)
 */
router.post('/payments/:paymentId/void', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {

    const { paymentId } = req.params;

    const bodyResult = voidPaymentSchema.safeParse(req.body);
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

    // Verify payment exists (staff can access all, customers isolated)
    const payment = await getPaymentById(paymentId);
    const effectivePaymentCompanyId = getEffectiveCompanyId(req);
    if (!payment || (effectivePaymentCompanyId && payment.companyId !== effectivePaymentCompanyId)) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Payment not found' },
      });
    }

    const result = await voidPayment(paymentId, bodyResult.data.reason, req.user!.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VOID_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Payment voided' },
    });
  } catch (error) {
    console.error('Void payment error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'VOID_ERROR',
        message: error instanceof Error ? error.message : 'Failed to void payment',
      },
    });
  }
});

export default router;
