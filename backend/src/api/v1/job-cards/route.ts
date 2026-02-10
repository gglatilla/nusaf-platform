import { Router } from 'express';
import { authenticate, requireRole } from '../../../middleware/auth';
import {
  createJobCardSchema,
  assignJobCardSchema,
  putOnHoldSchema,
  updateNotesSchema,
  jobCardListQuerySchema,
} from '../../../utils/validation/job-cards';
import {
  createJobCard,
  getJobCards,
  getJobCardById,
  getJobCardsForOrder,
  assignJobCard,
  startJobCard,
  putOnHold,
  resumeJobCard,
  completeJobCard,
  updateNotes,
} from '../../../services/job-card.service';

const router = Router();

// Apply authentication and role-based access control to all routes
// Job cards can be managed by internal staff and warehouse personnel
router.use(authenticate);
router.use(requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE'));

/**
 * GET /api/v1/job-cards
 * List job cards with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const queryResult = jobCardListQuerySchema.safeParse(req.query);
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

    const { orderId, status, jobType, page, pageSize } = queryResult.data;

    const result = await getJobCards({
      companyId: req.user!.companyId,
      orderId,
      status,
      jobType,
      page,
      pageSize,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List job cards error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'JOB_CARDS_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch job cards',
      },
    });
  }
});

/**
 * GET /api/v1/job-cards/:id
 * Get job card details
 */
router.get('/:id', async (req, res) => {
  try {

    const { id } = req.params;

    const jobCard = await getJobCardById(id, req.user!.companyId);

    if (!jobCard) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Job card not found' },
      });
    }

    return res.json({
      success: true,
      data: jobCard,
    });
  } catch (error) {
    console.error('Get job card error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'JOB_CARD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch job card',
      },
    });
  }
});

/**
 * GET /api/v1/job-cards/order/:orderId
 * Get job cards for a specific order
 */
router.get('/order/:orderId', async (req, res) => {
  try {

    const { orderId } = req.params;

    const jobCards = await getJobCardsForOrder(orderId, req.user!.companyId);

    return res.json({
      success: true,
      data: jobCards,
    });
  } catch (error) {
    console.error('Get job cards for order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'JOB_CARDS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch job cards for order',
      },
    });
  }
});

/**
 * POST /api/v1/job-cards
 * Create a job card for an order line
 */
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const bodyResult = createJobCardSchema.safeParse(req.body);
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

    const result = await createJobCard(
      bodyResult.data,
      req.user!.id,
      req.user!.companyId
    );

    if (!result.success) {
      const statusCode = result.error === 'Order not found' || result.error === 'Order line not found' ? 404 : 400;
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
      data: result.jobCard,
    });
  } catch (error) {
    console.error('Create job card error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create job card',
      },
    });
  }
});

/**
 * POST /api/v1/job-cards/:id/assign
 * Assign a job card to a user
 */
router.post('/:id/assign', async (req, res) => {
  try {

    const { id } = req.params;

    // Validate request body
    const bodyResult = assignJobCardSchema.safeParse(req.body);
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

    const result = await assignJobCard(id, assignedTo, assignedToName, req.user!.id, req.user!.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Job card not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Job card not found' ? 'NOT_FOUND' : 'ASSIGN_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Job card assigned' },
    });
  } catch (error) {
    console.error('Assign job card error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ASSIGN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to assign job card',
      },
    });
  }
});

/**
 * POST /api/v1/job-cards/:id/start
 * Start job (PENDING -> IN_PROGRESS)
 */
router.post('/:id/start', async (req, res) => {
  try {

    const { id } = req.params;

    const result = await startJobCard(id, req.user!.id, req.user!.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Job card not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Job card not found' ? 'NOT_FOUND' : 'START_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        message: 'Job started',
        warnings: result.warnings,
      },
    });
  } catch (error) {
    console.error('Start job error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'START_ERROR',
        message: error instanceof Error ? error.message : 'Failed to start job',
      },
    });
  }
});

/**
 * POST /api/v1/job-cards/:id/hold
 * Put job on hold (IN_PROGRESS -> ON_HOLD)
 */
router.post('/:id/hold', async (req, res) => {
  try {

    const { id } = req.params;

    // Validate request body
    const bodyResult = putOnHoldSchema.safeParse(req.body);
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

    const { holdReason } = bodyResult.data;

    const result = await putOnHold(id, holdReason, req.user!.id, req.user!.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Job card not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Job card not found' ? 'NOT_FOUND' : 'HOLD_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Job put on hold' },
    });
  } catch (error) {
    console.error('Put on hold error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'HOLD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to put job on hold',
      },
    });
  }
});

/**
 * POST /api/v1/job-cards/:id/resume
 * Resume job (ON_HOLD -> IN_PROGRESS)
 */
router.post('/:id/resume', async (req, res) => {
  try {

    const { id } = req.params;

    const result = await resumeJobCard(id, req.user!.id, req.user!.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Job card not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Job card not found' ? 'NOT_FOUND' : 'RESUME_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Job resumed' },
    });
  } catch (error) {
    console.error('Resume job error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'RESUME_ERROR',
        message: error instanceof Error ? error.message : 'Failed to resume job',
      },
    });
  }
});

/**
 * POST /api/v1/job-cards/:id/complete
 * Complete job (IN_PROGRESS -> COMPLETE)
 */
router.post('/:id/complete', async (req, res) => {
  try {

    const { id } = req.params;

    const result = await completeJobCard(id, req.user!.id, req.user!.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Job card not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Job card not found' ? 'NOT_FOUND' : 'COMPLETE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Job completed' },
    });
  } catch (error) {
    console.error('Complete job error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'COMPLETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to complete job',
      },
    });
  }
});

/**
 * PATCH /api/v1/job-cards/:id/notes
 * Update job card notes
 */
router.patch('/:id/notes', async (req, res) => {
  try {

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

    const result = await updateNotes(id, notes, req.user!.id, req.user!.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Job card not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Job card not found' ? 'NOT_FOUND' : 'UPDATE_FAILED',
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
