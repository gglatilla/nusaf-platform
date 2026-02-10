import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from '../../../middleware/auth';
import {
  createTransferRequestFromOrderSchema,
  createStandaloneTransferRequestSchema,
  shipTransferSchema,
  updateLineReceivedSchema,
  receiveTransferSchema,
  updateNotesSchema,
  transferRequestListQuerySchema,
} from '../../../utils/validation/transfer-requests';
import {
  createTransferRequest,
  createStandaloneTransferRequest,
  getTransferRequests,
  getTransferRequestById,
  getTransferRequestsForOrder,
  shipTransfer,
  updateLineReceived,
  receiveTransfer,
  updateNotes,
} from '../../../services/transfer-request.service';

const router = Router();

/**
 * GET /api/v1/transfer-requests
 * List transfer requests with filtering and pagination
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const queryResult = transferRequestListQuerySchema.safeParse(req.query);
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

    const { orderId, status, page, pageSize } = queryResult.data;

    const result = await getTransferRequests({
      companyId: authReq.user.companyId,
      orderId,
      status,
      page,
      pageSize,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List transfer requests error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'TRANSFER_REQUESTS_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch transfer requests',
      },
    });
  }
});

/**
 * GET /api/v1/transfer-requests/order/:orderId
 * Get transfer requests for a specific order (summary)
 */
router.get('/order/:orderId', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { orderId } = req.params;

    const transferRequests = await getTransferRequestsForOrder(orderId, authReq.user.companyId);

    return res.json({
      success: true,
      data: transferRequests,
    });
  } catch (error) {
    console.error('Get transfer requests for order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'TRANSFER_REQUESTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch transfer requests for order',
      },
    });
  }
});

/**
 * GET /api/v1/transfer-requests/:id
 * Get transfer request details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const transferRequest = await getTransferRequestById(id, authReq.user.companyId);

    if (!transferRequest) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Transfer request not found' },
      });
    }

    return res.json({
      success: true,
      data: transferRequest,
    });
  } catch (error) {
    console.error('Get transfer request error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'TRANSFER_REQUEST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch transfer request',
      },
    });
  }
});

/**
 * POST /api/v1/transfer-requests/generate/:orderId
 * Create a transfer request from an order
 */
router.post('/generate/:orderId', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { orderId } = req.params;

    // Validate request body
    const bodyResult = createTransferRequestFromOrderSchema.safeParse(req.body);
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

    const result = await createTransferRequest(
      orderId,
      bodyResult.data.lines,
      authReq.user.id,
      authReq.user.companyId
    );

    if (!result.success) {
      const statusCode = result.error === 'Order not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error?.includes('not found') ? 'NOT_FOUND' : 'CREATE_FAILED',
          message: result.error,
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.transferRequest,
    });
  } catch (error) {
    console.error('Create transfer request error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create transfer request',
      },
    });
  }
});

/**
 * POST /api/v1/transfer-requests
 * Create a standalone transfer request (stock replenishment)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // Validate request body
    const bodyResult = createStandaloneTransferRequestSchema.safeParse(req.body);
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

    const result = await createStandaloneTransferRequest(
      bodyResult.data.lines,
      bodyResult.data.notes || null,
      authReq.user.id,
      authReq.user.companyId,
      bodyResult.data.fromLocation,
      bodyResult.data.toLocation
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
      data: result.transferRequest,
    });
  } catch (error) {
    console.error('Create standalone transfer request error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create transfer request',
      },
    });
  }
});

/**
 * POST /api/v1/transfer-requests/:id/ship
 * Ship transfer (PENDING -> IN_TRANSIT)
 */
router.post('/:id/ship', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Validate request body
    const bodyResult = shipTransferSchema.safeParse(req.body);
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

    const { shippedByName } = bodyResult.data;

    const result = await shipTransfer(id, authReq.user.id, shippedByName, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Transfer request not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Transfer request not found' ? 'NOT_FOUND' : 'SHIP_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Transfer shipped' },
    });
  } catch (error) {
    console.error('Ship transfer error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SHIP_ERROR',
        message: error instanceof Error ? error.message : 'Failed to ship transfer',
      },
    });
  }
});

/**
 * PATCH /api/v1/transfer-requests/:id/lines/:lineId
 * Update received quantity for a line
 */
router.patch('/:id/lines/:lineId', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id, lineId } = req.params;

    // Validate request body
    const bodyResult = updateLineReceivedSchema.safeParse(req.body);
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

    const { receivedQuantity } = bodyResult.data;

    const result = await updateLineReceived(id, lineId, receivedQuantity, authReq.user.id, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error?.includes('not found') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error?.includes('not found') ? 'NOT_FOUND' : 'UPDATE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Line updated' },
    });
  } catch (error) {
    console.error('Update line received error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update line',
      },
    });
  }
});

/**
 * POST /api/v1/transfer-requests/:id/receive
 * Receive transfer (IN_TRANSIT -> RECEIVED)
 */
router.post('/:id/receive', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Validate request body
    const bodyResult = receiveTransferSchema.safeParse(req.body);
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

    const { receivedByName } = bodyResult.data;

    const result = await receiveTransfer(id, authReq.user.id, receivedByName, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Transfer request not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Transfer request not found' ? 'NOT_FOUND' : 'RECEIVE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Transfer received' },
    });
  } catch (error) {
    console.error('Receive transfer error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'RECEIVE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to receive transfer',
      },
    });
  }
});

/**
 * PATCH /api/v1/transfer-requests/:id/notes
 * Update transfer request notes
 */
router.patch('/:id/notes', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Validate request body
    const bodyResult = updateNotesSchema.safeParse(req.body);
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

    const { notes } = bodyResult.data;

    const result = await updateNotes(id, notes, authReq.user.id, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Transfer request not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Transfer request not found' ? 'NOT_FOUND' : 'UPDATE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Notes updated' },
    });
  } catch (error) {
    console.error('Update notes error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update notes',
      },
    });
  }
});

export default router;
