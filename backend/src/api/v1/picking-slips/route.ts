import { Router } from 'express';
import { Warehouse } from '@prisma/client';
import { authenticate, requireRole } from '../../../middleware/auth';
import {
  generatePickingSlipsSchema,
  assignPickingSlipSchema,
  updateLinePickedSchema,
  pickingSlipListQuerySchema,
} from '../../../utils/validation/picking-slips';
import {
  createPickingSlip,
  getPickingSlips,
  getPickingSlipById,
  assignPickingSlip,
  startPicking,
  updateLinePicked,
  completePicking,
  getPickingSlipsForOrder,
  type CreatePickingSlipLineInput,
} from '../../../services/picking-slip.service';

const router = Router();

// Apply authentication and role-based access control to all routes
// Picking slips can be managed by internal staff and warehouse personnel
router.use(authenticate);
router.use(requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE'));

/**
 * GET /api/v1/picking-slips
 * List picking slips with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const queryResult = pickingSlipListQuerySchema.safeParse(req.query);
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

    const { orderId, location, status, page, pageSize } = queryResult.data;

    const result = await getPickingSlips({
      companyId: req.user!.companyId,
      orderId,
      location,
      status,
      page,
      pageSize,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List picking slips error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PICKING_SLIPS_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch picking slips',
      },
    });
  }
});

/**
 * GET /api/v1/picking-slips/:id
 * Get picking slip details with lines
 */
router.get('/:id', async (req, res) => {
  try {

    const { id } = req.params;

    const pickingSlip = await getPickingSlipById(id, req.user!.companyId);

    if (!pickingSlip) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Picking slip not found' },
      });
    }

    return res.json({
      success: true,
      data: pickingSlip,
    });
  } catch (error) {
    console.error('Get picking slip error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PICKING_SLIP_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch picking slip',
      },
    });
  }
});

/**
 * GET /api/v1/picking-slips/order/:orderId
 * Get picking slips for a specific order
 */
router.get('/order/:orderId', async (req, res) => {
  try {

    const { orderId } = req.params;

    const pickingSlips = await getPickingSlipsForOrder(orderId, req.user!.companyId);

    return res.json({
      success: true,
      data: pickingSlips,
    });
  } catch (error) {
    console.error('Get picking slips for order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PICKING_SLIPS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch picking slips for order',
      },
    });
  }
});

/**
 * POST /api/v1/picking-slips/generate/:orderId
 * Generate picking slips for a confirmed order
 */
router.post('/generate/:orderId', async (req, res) => {
  try {

    const { orderId } = req.params;

    // Validate request body
    const bodyResult = generatePickingSlipsSchema.safeParse(req.body);
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

    const { lines } = bodyResult.data;

    // Group lines by location
    const linesByLocation = new Map<Warehouse, CreatePickingSlipLineInput[]>();
    for (const line of lines) {
      const location = line.location as Warehouse;
      if (!linesByLocation.has(location)) {
        linesByLocation.set(location, []);
      }
      linesByLocation.get(location)!.push({
        orderLineId: line.orderLineId,
        lineNumber: line.lineNumber,
        productId: line.productId,
        productSku: line.productSku,
        productDescription: line.productDescription,
        quantityToPick: line.quantityToPick,
      });
    }

    // Create picking slips for each location
    const createdSlips: Array<{ id: string; pickingSlipNumber: string; location: Warehouse }> = [];
    const errors: string[] = [];

    for (const [location, locationLines] of linesByLocation) {
      const result = await createPickingSlip(
        orderId,
        location,
        locationLines,
        req.user!.id,
        req.user!.companyId
      );

      if (result.success && result.pickingSlip) {
        createdSlips.push({
          id: result.pickingSlip.id,
          pickingSlipNumber: result.pickingSlip.pickingSlipNumber,
          location,
        });
      } else if (result.error) {
        errors.push(`${location}: ${result.error}`);
      }
    }

    if (createdSlips.length === 0 && errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'GENERATE_FAILED',
          message: errors.join('; '),
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        pickingSlips: createdSlips,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Generate picking slips error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'GENERATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate picking slips',
      },
    });
  }
});

/**
 * POST /api/v1/picking-slips/:id/assign
 * Assign a picking slip to a user
 */
router.post('/:id/assign', async (req, res) => {
  try {

    const { id } = req.params;

    // Validate request body
    const bodyResult = assignPickingSlipSchema.safeParse(req.body);
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

    const { assignedTo, assignedToName } = bodyResult.data;

    const result = await assignPickingSlip(id, assignedTo, assignedToName, req.user!.id, req.user!.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Picking slip not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Picking slip not found' ? 'NOT_FOUND' : 'ASSIGN_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Picking slip assigned' },
    });
  } catch (error) {
    console.error('Assign picking slip error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ASSIGN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to assign picking slip',
      },
    });
  }
});

/**
 * POST /api/v1/picking-slips/:id/start
 * Start picking (PENDING -> IN_PROGRESS)
 */
router.post('/:id/start', async (req, res) => {
  try {

    const { id } = req.params;

    const result = await startPicking(id, req.user!.id, req.user!.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Picking slip not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Picking slip not found' ? 'NOT_FOUND' : 'START_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Picking started' },
    });
  } catch (error) {
    console.error('Start picking error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'START_ERROR',
        message: error instanceof Error ? error.message : 'Failed to start picking',
      },
    });
  }
});

/**
 * PATCH /api/v1/picking-slips/:id/lines/:lineId
 * Update line picked quantity
 */
router.patch('/:id/lines/:lineId', async (req, res) => {
  try {

    const { id, lineId } = req.params;

    // Validate request body
    const bodyResult = updateLinePickedSchema.safeParse(req.body);
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

    const { quantityPicked } = bodyResult.data;

    const result = await updateLinePicked(id, lineId, quantityPicked, req.user!.id, req.user!.companyId);

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
      data: { message: 'Line quantity updated' },
    });
  } catch (error) {
    console.error('Update line picked error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update line quantity',
      },
    });
  }
});

/**
 * POST /api/v1/picking-slips/:id/complete
 * Complete picking (IN_PROGRESS -> COMPLETE)
 */
router.post('/:id/complete', async (req, res) => {
  try {

    const { id } = req.params;

    const result = await completePicking(id, req.user!.id, req.user!.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Picking slip not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Picking slip not found' ? 'NOT_FOUND' : 'COMPLETE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Picking completed' },
    });
  } catch (error) {
    console.error('Complete picking error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'COMPLETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to complete picking',
      },
    });
  }
});

export default router;
