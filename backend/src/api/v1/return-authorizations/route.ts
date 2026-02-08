import { Router } from 'express';
import { prisma } from '../../../config/database';
import { authenticate, requireRole, type AuthenticatedRequest } from '../../../middleware/auth';
import {
  createReturnAuthorizationSchema,
  rejectReturnAuthorizationSchema,
  receiveItemsSchema,
  completeReturnAuthorizationSchema,
  returnAuthorizationListQuerySchema,
} from '../../../utils/validation/return-authorizations';
import {
  createReturnAuthorization,
  getReturnAuthorizationById,
  getReturnAuthorizations,
  getReturnAuthorizationsForOrder,
  approveReturnAuthorization,
  rejectReturnAuthorization,
  receiveItems,
  completeReturnAuthorization,
  cancelReturnAuthorization,
} from '../../../services/return-authorization.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/return-authorizations
 * List return authorizations with filtering and pagination
 */
router.get('/', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;

    const queryResult = returnAuthorizationListQuerySchema.safeParse(req.query);
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

    const result = await getReturnAuthorizations(authReq.user.companyId, queryResult.data);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List return authorizations error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'RETURN_AUTHORIZATIONS_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch return authorizations',
      },
    });
  }
});

/**
 * GET /api/v1/return-authorizations/order/:orderId
 * Get return authorizations for a specific order
 * NOTE: Must be before /:id to avoid matching "order" as an ID
 */
router.get('/order/:orderId', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { orderId } = req.params;

    const returnAuthorizations = await getReturnAuthorizationsForOrder(orderId, authReq.user.companyId);

    return res.json({
      success: true,
      data: returnAuthorizations,
    });
  } catch (error) {
    console.error('Get return authorizations for order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'RETURN_AUTHORIZATIONS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch return authorizations for order',
      },
    });
  }
});

/**
 * GET /api/v1/return-authorizations/:id
 * Get return authorization details with lines
 */
router.get('/:id', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const ra = await getReturnAuthorizationById(id, authReq.user.companyId);

    if (!ra) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Return authorization not found' },
      });
    }

    // Strip internal data for CUSTOMER role (Golden Rule 4)
    if (authReq.user.role === 'CUSTOMER') {
      return res.json({
        success: true,
        data: {
          ...ra,
          notes: undefined,
          approvedBy: undefined,
          approvedByName: undefined,
          rejectedBy: undefined,
          itemsReceivedBy: undefined,
          itemsReceivedByName: undefined,
          completedBy: undefined,
          completedByName: undefined,
          warehouse: undefined,
        },
      });
    }

    return res.json({
      success: true,
      data: ra,
    });
  } catch (error) {
    console.error('Get return authorization error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'RETURN_AUTHORIZATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch return authorization',
      },
    });
  }
});

/**
 * POST /api/v1/return-authorizations
 * Create a return authorization
 */
router.post('/', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;

    const bodyResult = createReturnAuthorizationSchema.safeParse(req.body);
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
      where: { id: authReq.user.id },
      select: { firstName: true, lastName: true },
    });
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

    const result = await createReturnAuthorization(
      bodyResult.data,
      authReq.user.id,
      userName,
      authReq.user.role,
      authReq.user.companyId
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
      data: result.returnAuthorization,
    });
  } catch (error) {
    console.error('Create return authorization error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create return authorization',
      },
    });
  }
});

/**
 * POST /api/v1/return-authorizations/:id/approve
 * Approve a return authorization (REQUESTED -> APPROVED)
 */
router.post('/:id/approve', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    // Fetch user name
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: { firstName: true, lastName: true },
    });
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

    const result = await approveReturnAuthorization(id, authReq.user.id, userName, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Return authorization not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Return authorization not found' ? 'NOT_FOUND' : 'APPROVE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Return authorization approved' },
    });
  } catch (error) {
    console.error('Approve return authorization error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'APPROVE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to approve return authorization',
      },
    });
  }
});

/**
 * POST /api/v1/return-authorizations/:id/reject
 * Reject a return authorization (REQUESTED -> REJECTED)
 */
router.post('/:id/reject', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const bodyResult = rejectReturnAuthorizationSchema.safeParse(req.body);
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

    const result = await rejectReturnAuthorization(id, bodyResult.data, authReq.user.id, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Return authorization not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Return authorization not found' ? 'NOT_FOUND' : 'REJECT_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Return authorization rejected' },
    });
  } catch (error) {
    console.error('Reject return authorization error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'REJECT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to reject return authorization',
      },
    });
  }
});

/**
 * POST /api/v1/return-authorizations/:id/receive-items
 * Record received items (APPROVED -> ITEMS_RECEIVED)
 */
router.post('/:id/receive-items', requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const bodyResult = receiveItemsSchema.safeParse(req.body);
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

    // Fetch user name
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: { firstName: true, lastName: true },
    });
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

    const result = await receiveItems(id, bodyResult.data, authReq.user.id, userName, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Return authorization not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Return authorization not found' ? 'NOT_FOUND' : 'RECEIVE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Items received recorded' },
    });
  } catch (error) {
    console.error('Receive items error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'RECEIVE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to record received items',
      },
    });
  }
});

/**
 * POST /api/v1/return-authorizations/:id/complete
 * Complete a return authorization (ITEMS_RECEIVED -> COMPLETED)
 */
router.post('/:id/complete', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const bodyResult = completeReturnAuthorizationSchema.safeParse(req.body);
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

    // Fetch user name
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: { firstName: true, lastName: true },
    });
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

    const result = await completeReturnAuthorization(id, bodyResult.data, authReq.user.id, userName, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Return authorization not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Return authorization not found' ? 'NOT_FOUND' : 'COMPLETE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Return authorization completed' },
    });
  } catch (error) {
    console.error('Complete return authorization error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'COMPLETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to complete return authorization',
      },
    });
  }
});

/**
 * POST /api/v1/return-authorizations/:id/cancel
 * Cancel a return authorization (REQUESTED or APPROVED -> CANCELLED)
 */
router.post('/:id/cancel', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const result = await cancelReturnAuthorization(id, authReq.user.id, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Return authorization not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Return authorization not found' ? 'NOT_FOUND' : 'CANCEL_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Return authorization cancelled' },
    });
  } catch (error) {
    console.error('Cancel return authorization error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cancel return authorization',
      },
    });
  }
});

export default router;
