import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from '../../../middleware/auth';
import {
  createIssueFlagSchema,
  updateStatusSchema,
  addCommentSchema,
  resolveIssueSchema,
  issueFlagListQuerySchema,
} from '../../../utils/validation/issue-flags';
import {
  createIssueFlag,
  getIssueFlags,
  getIssueFlagById,
  getIssuesForPickingSlip,
  getIssuesForJobCard,
  getIssueStats,
  updateStatus,
  addComment,
  resolveIssue,
  closeIssue,
} from '../../../services/issue-flag.service';

const router = Router();

/**
 * GET /api/v1/issues
 * List issue flags with filtering and pagination
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const queryResult = issueFlagListQuerySchema.safeParse(req.query);
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

    const { pickingSlipId, jobCardId, status, severity, category, page, pageSize } = queryResult.data;

    const result = await getIssueFlags({
      companyId: authReq.user.companyId,
      pickingSlipId,
      jobCardId,
      status,
      severity,
      category,
      page,
      pageSize,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List issues error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ISSUES_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch issues',
      },
    });
  }
});

/**
 * GET /api/v1/issues/stats
 * Get dashboard stats for issues
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const stats = await getIssueStats(authReq.user.companyId);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get issue stats error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'STATS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch issue stats',
      },
    });
  }
});

/**
 * GET /api/v1/issues/picking-slip/:id
 * Get issues for a specific picking slip
 */
router.get('/picking-slip/:id', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const issues = await getIssuesForPickingSlip(id, authReq.user.companyId);

    return res.json({
      success: true,
      data: issues,
    });
  } catch (error) {
    console.error('Get issues for picking slip error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ISSUES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch issues for picking slip',
      },
    });
  }
});

/**
 * GET /api/v1/issues/job-card/:id
 * Get issues for a specific job card
 */
router.get('/job-card/:id', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const issues = await getIssuesForJobCard(id, authReq.user.companyId);

    return res.json({
      success: true,
      data: issues,
    });
  } catch (error) {
    console.error('Get issues for job card error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ISSUES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch issues for job card',
      },
    });
  }
});

/**
 * GET /api/v1/issues/:id
 * Get issue flag details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const issueFlag = await getIssueFlagById(id, authReq.user.companyId);

    if (!issueFlag) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Issue not found' },
      });
    }

    return res.json({
      success: true,
      data: issueFlag,
    });
  } catch (error) {
    console.error('Get issue error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ISSUE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch issue',
      },
    });
  }
});

/**
 * POST /api/v1/issues
 * Create a new issue flag
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // Validate request body
    const bodyResult = createIssueFlagSchema.safeParse(req.body);
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

    const result = await createIssueFlag(
      bodyResult.data,
      authReq.user.id,
      authReq.user.companyId
    );

    if (!result.success) {
      const statusCode = result.error?.includes('not found') ? 404 : 400;
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
      data: result.issueFlag,
    });
  } catch (error) {
    console.error('Create issue error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create issue',
      },
    });
  }
});

/**
 * PATCH /api/v1/issues/:id
 * Update issue status
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Validate request body
    const bodyResult = updateStatusSchema.safeParse(req.body);
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

    const { status } = bodyResult.data;

    const result = await updateStatus(id, status, authReq.user.id, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Issue flag not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Issue flag not found' ? 'NOT_FOUND' : 'UPDATE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Status updated' },
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update status',
      },
    });
  }
});

/**
 * POST /api/v1/issues/:id/comments
 * Add a comment to an issue
 */
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Validate request body
    const bodyResult = addCommentSchema.safeParse(req.body);
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

    const { content } = bodyResult.data;

    const result = await addComment(id, content, authReq.user.id, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Issue flag not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Issue flag not found' ? 'NOT_FOUND' : 'COMMENT_FAILED',
          message: result.error,
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.comment,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'COMMENT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to add comment',
      },
    });
  }
});

/**
 * POST /api/v1/issues/:id/resolve
 * Resolve an issue with resolution text
 */
router.post('/:id/resolve', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Validate request body
    const bodyResult = resolveIssueSchema.safeParse(req.body);
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

    const { resolution } = bodyResult.data;

    const result = await resolveIssue(id, resolution, authReq.user.id, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Issue flag not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Issue flag not found' ? 'NOT_FOUND' : 'RESOLVE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Issue resolved' },
    });
  } catch (error) {
    console.error('Resolve issue error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'RESOLVE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to resolve issue',
      },
    });
  }
});

/**
 * POST /api/v1/issues/:id/close
 * Close a resolved issue
 */
router.post('/:id/close', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    const result = await closeIssue(id, authReq.user.id, authReq.user.companyId);

    if (!result.success) {
      const statusCode = result.error === 'Issue flag not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Issue flag not found' ? 'NOT_FOUND' : 'CLOSE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Issue closed' },
    });
  } catch (error) {
    console.error('Close issue error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CLOSE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to close issue',
      },
    });
  }
});

export default router;
