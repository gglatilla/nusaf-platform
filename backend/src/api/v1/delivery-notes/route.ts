import { Router } from 'express';
import { prisma } from '../../../config/database';
import { authenticate, requireRole } from '../../../middleware/auth';
import { getEffectiveCompanyId } from '../../../utils/company-scope';
import {
  createDeliveryNoteSchema,
  confirmDeliverySchema,
  deliveryNoteListQuerySchema,
} from '../../../utils/validation/delivery-notes';
import {
  createDeliveryNote,
  getDeliveryNoteById,
  getDeliveryNotes,
  getDeliveryNotesForOrder,
  dispatchDeliveryNote,
  confirmDelivery,
  cancelDeliveryNote,
} from '../../../services/delivery-note.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/delivery-notes
 * List delivery notes with filtering and pagination
 */
router.get('/', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {
    const queryResult = deliveryNoteListQuerySchema.safeParse(req.query);
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

    const result = await getDeliveryNotes(queryResult.data, getEffectiveCompanyId(req));

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List delivery notes error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELIVERY_NOTES_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch delivery notes',
      },
    });
  }
});

/**
 * GET /api/v1/delivery-notes/order/:orderId
 * Get delivery notes for a specific order
 * NOTE: Must be before /:id to avoid matching "order" as an ID
 */
router.get('/order/:orderId', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {

    const { orderId } = req.params;

    const deliveryNotes = await getDeliveryNotesForOrder(orderId, getEffectiveCompanyId(req));

    return res.json({
      success: true,
      data: deliveryNotes,
    });
  } catch (error) {
    console.error('Get delivery notes for order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELIVERY_NOTES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch delivery notes for order',
      },
    });
  }
});

/**
 * GET /api/v1/delivery-notes/:id
 * Get delivery note details with lines
 */
router.get('/:id', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {

    const { id } = req.params;

    const deliveryNote = await getDeliveryNoteById(id, getEffectiveCompanyId(req));

    if (!deliveryNote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Delivery note not found' },
      });
    }

    // Strip internal data for CUSTOMER role (Golden Rule 4)
    if (req.user!.role === 'CUSTOMER') {
      return res.json({
        success: true,
        data: {
          ...deliveryNote,
          notes: undefined,
          createdBy: undefined,
          dispatchedBy: undefined,
        },
      });
    }

    return res.json({
      success: true,
      data: deliveryNote,
    });
  } catch (error) {
    console.error('Get delivery note error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELIVERY_NOTE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch delivery note',
      },
    });
  }
});

/**
 * POST /api/v1/delivery-notes/from-order/:orderId
 * Create a delivery note from an order
 */
router.post('/from-order/:orderId', requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {

    const { orderId } = req.params;

    const bodyResult = createDeliveryNoteSchema.safeParse(req.body);
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

    const result = await createDeliveryNote(
      orderId,
      bodyResult.data,
      req.user!.id,
      getEffectiveCompanyId(req)
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: result.error,
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.deliveryNote,
    });
  } catch (error) {
    console.error('Create delivery note error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create delivery note',
      },
    });
  }
});

/**
 * POST /api/v1/delivery-notes/:id/dispatch
 * Mark a delivery note as dispatched (DRAFT -> DISPATCHED)
 */
router.post('/:id/dispatch', requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {

    const { id } = req.params;

    // Fetch user name from database
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { firstName: true, lastName: true },
    });
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

    const result = await dispatchDeliveryNote(id, req.user!.id, userName, getEffectiveCompanyId(req));

    if (!result.success) {
      const statusCode = result.error === 'Delivery note not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Delivery note not found' ? 'NOT_FOUND' : 'DISPATCH_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Delivery note dispatched' },
    });
  } catch (error) {
    console.error('Dispatch delivery note error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DISPATCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to dispatch delivery note',
      },
    });
  }
});

/**
 * POST /api/v1/delivery-notes/:id/confirm-delivery
 * Confirm delivery receipt (DISPATCHED -> DELIVERED)
 */
router.post('/:id/confirm-delivery', requireRole('ADMIN', 'MANAGER', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {

    const { id } = req.params;

    const bodyResult = confirmDeliverySchema.safeParse(req.body);
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

    const result = await confirmDelivery(id, bodyResult.data, req.user!.id, getEffectiveCompanyId(req));

    if (!result.success) {
      const statusCode = result.error === 'Delivery note not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Delivery note not found' ? 'NOT_FOUND' : 'CONFIRM_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Delivery confirmed' },
    });
  } catch (error) {
    console.error('Confirm delivery error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CONFIRM_ERROR',
        message: error instanceof Error ? error.message : 'Failed to confirm delivery',
      },
    });
  }
});

/**
 * POST /api/v1/delivery-notes/:id/cancel
 * Cancel a delivery note (DRAFT or DISPATCHED -> CANCELLED)
 */
router.post('/:id/cancel', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {

    const { id } = req.params;

    const result = await cancelDeliveryNote(id, req.user!.id, getEffectiveCompanyId(req));

    if (!result.success) {
      const statusCode = result.error === 'Delivery note not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Delivery note not found' ? 'NOT_FOUND' : 'CANCEL_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Delivery note cancelled' },
    });
  } catch (error) {
    console.error('Cancel delivery note error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cancel delivery note',
      },
    });
  }
});

export default router;
