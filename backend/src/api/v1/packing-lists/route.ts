import { Router } from 'express';
import { prisma } from '../../../config/database';
import { authenticate, requireRole } from '../../../middleware/auth';
import {
  createPackingListSchema,
  packingListListQuerySchema,
} from '../../../utils/validation/packing-lists';
import {
  createPackingList,
  getPackingListById,
  getPackingLists,
  getPackingListsForOrder,
  updatePackingList,
  finalizePackingList,
  cancelPackingList,
} from '../../../services/packing-list.service';
import { generatePackingListPDF } from '../../../services/pdf.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/packing-lists
 * List packing lists with filtering and pagination
 */
router.get('/', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE'), async (req, res) => {
  try {
    const queryResult = packingListListQuerySchema.safeParse(req.query);
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

    const result = await getPackingLists(req.user!.companyId, queryResult.data);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List packing lists error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PACKING_LISTS_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch packing lists',
      },
    });
  }
});

/**
 * GET /api/v1/packing-lists/order/:orderId
 * Get packing lists for a specific order
 * NOTE: Must be before /:id to avoid matching "order" as an ID
 */
router.get('/order/:orderId', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {

    const { orderId } = req.params;

    const packingLists = await getPackingListsForOrder(orderId, req.user!.companyId);

    return res.json({
      success: true,
      data: packingLists,
    });
  } catch (error) {
    console.error('Get packing lists for order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PACKING_LISTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch packing lists for order',
      },
    });
  }
});

/**
 * GET /api/v1/packing-lists/:id/pdf
 * Download packing list as PDF
 * NOTE: Must be before /:id to avoid matching "pdf" as an ID
 */
router.get('/:id/pdf', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {

    const { id } = req.params;

    const packingList = await getPackingListById(id, req.user!.companyId);

    if (!packingList) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Packing list not found' },
      });
    }

    const pdfBuffer = await generatePackingListPDF(packingList);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${packingList.packingListNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Download packing list PDF error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PDF_GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate PDF',
      },
    });
  }
});

/**
 * GET /api/v1/packing-lists/:id
 * Get packing list details with lines and packages
 */
router.get('/:id', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {

    const { id } = req.params;

    const packingList = await getPackingListById(id, req.user!.companyId);

    if (!packingList) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Packing list not found' },
      });
    }

    // Strip internal data for CUSTOMER role (Golden Rule 4)
    if (req.user!.role === 'CUSTOMER') {
      return res.json({
        success: true,
        data: {
          ...packingList,
          notes: undefined,
          createdBy: undefined,
          finalizedBy: undefined,
          handlingInstructions: undefined,
        },
      });
    }

    return res.json({
      success: true,
      data: packingList,
    });
  } catch (error) {
    console.error('Get packing list error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PACKING_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch packing list',
      },
    });
  }
});

/**
 * POST /api/v1/packing-lists/from-order/:orderId
 * Create a packing list from an order
 */
router.post('/from-order/:orderId', requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {

    const { orderId } = req.params;

    const bodyResult = createPackingListSchema.safeParse(req.body);
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

    const result = await createPackingList(
      orderId,
      bodyResult.data,
      req.user!.id,
      req.user!.companyId
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
      data: result.packingList,
    });
  } catch (error) {
    console.error('Create packing list error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create packing list',
      },
    });
  }
});

/**
 * PUT /api/v1/packing-lists/:id
 * Update a draft packing list
 */
router.put('/:id', requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {

    const { id } = req.params;

    const bodyResult = createPackingListSchema.safeParse(req.body);
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

    const result = await updatePackingList(
      id,
      bodyResult.data,
      req.user!.id,
      req.user!.companyId
    );

    if (!result.success) {
      const statusCode = result.error === 'Packing list not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Packing list not found' ? 'NOT_FOUND' : 'UPDATE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Packing list updated' },
    });
  } catch (error) {
    console.error('Update packing list error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update packing list',
      },
    });
  }
});

/**
 * POST /api/v1/packing-lists/:id/finalize
 * Finalize a packing list (DRAFT -> FINALIZED)
 */
router.post('/:id/finalize', requireRole('ADMIN', 'MANAGER', 'WAREHOUSE'), async (req, res) => {
  try {

    const { id } = req.params;

    // Fetch user name from database
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { firstName: true, lastName: true },
    });
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

    const result = await finalizePackingList(id, req.user!.id, userName, req.user!.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Packing list not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Packing list not found' ? 'NOT_FOUND' : 'FINALIZE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Packing list finalized' },
    });
  } catch (error) {
    console.error('Finalize packing list error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FINALIZE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to finalize packing list',
      },
    });
  }
});

/**
 * POST /api/v1/packing-lists/:id/cancel
 * Cancel a packing list (DRAFT or FINALIZED -> CANCELLED)
 */
router.post('/:id/cancel', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {

    const { id } = req.params;

    const result = await cancelPackingList(id, req.user!.id, req.user!.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Packing list not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Packing list not found' ? 'NOT_FOUND' : 'CANCEL_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Packing list cancelled' },
    });
  } catch (error) {
    console.error('Cancel packing list error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cancel packing list',
      },
    });
  }
});

export default router;
