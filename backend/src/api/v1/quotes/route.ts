import { Router } from 'express';
import { prisma } from '../../../config/database';
import { authenticate, type AuthenticatedRequest } from '../../../middleware/auth';
import {
  addQuoteItemSchema,
  updateQuoteItemSchema,
  updateQuoteNotesSchema,
  quoteListQuerySchema,
} from '../../../utils/validation/quotes';
import {
  getOrCreateDraftQuote,
  getQuotes,
  getQuoteById,
  getActiveDraftQuote,
  addQuoteItem,
  updateQuoteItemQuantity,
  removeQuoteItem,
  updateQuoteNotes,
  finalizeQuote,
  acceptQuote,
  rejectQuote,
} from '../../../services/quote.service';

const router = Router();

/**
 * POST /api/v1/quotes
 * Create a new draft quote or return existing draft
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // Get company tier
    const company = await prisma.company.findUnique({
      where: { id: authReq.user.companyId },
    });

    if (!company) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_COMPANY', message: 'User company not found' },
      });
    }

    const result = await getOrCreateDraftQuote(
      authReq.user.id,
      authReq.user.companyId,
      company.tier
    );

    return res.status(result.isNew ? 201 : 200).json({
      success: true,
      data: {
        id: result.id,
        quoteNumber: result.quoteNumber,
        isNew: result.isNew,
      },
    });
  } catch (error) {
    console.error('Create quote error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'QUOTE_CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create quote',
      },
    });
  }
});

/**
 * GET /api/v1/quotes
 * List quotes for the user's company with filtering and pagination
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const queryResult = quoteListQuerySchema.safeParse(req.query);
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

    const result = await getQuotes({
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
    console.error('List quotes error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'QUOTES_LIST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch quotes',
      },
    });
  }
});

/**
 * GET /api/v1/quotes/active
 * Get the active draft quote for the current user (for cart display)
 */
router.get('/active', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const draft = await getActiveDraftQuote(authReq.user.id, authReq.user.companyId);

    return res.json({
      success: true,
      data: draft, // null if no active draft
    });
  } catch (error) {
    console.error('Get active quote error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ACTIVE_QUOTE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch active quote',
      },
    });
  }
});

/**
 * GET /api/v1/quotes/:id
 * Get quote details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Prevent "active" from being treated as an ID
    if (id === 'active') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Use GET /quotes/active for active draft' },
      });
    }

    const quote = await getQuoteById(id, authReq.user.companyId);

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quote not found' },
      });
    }

    return res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error('Get quote error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'QUOTE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch quote',
      },
    });
  }
});

/**
 * PATCH /api/v1/quotes/:id
 * Update quote notes (DRAFT only)
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Validate request body
    const bodyResult = updateQuoteNotesSchema.safeParse(req.body);
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

    // Verify quote belongs to company
    const quote = await getQuoteById(id, authReq.user.companyId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quote not found' },
      });
    }

    const result = await updateQuoteNotes(id, bodyResult.data.customerNotes || '', authReq.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Quote notes updated' },
    });
  } catch (error) {
    console.error('Update quote error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'QUOTE_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update quote',
      },
    });
  }
});

/**
 * POST /api/v1/quotes/:id/items
 * Add item to quote
 */
router.post('/:id/items', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Validate request body
    const bodyResult = addQuoteItemSchema.safeParse(req.body);
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

    // Verify quote belongs to company
    const quote = await getQuoteById(id, authReq.user.companyId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quote not found' },
      });
    }

    const result = await addQuoteItem(
      id,
      bodyResult.data.productId,
      bodyResult.data.quantity,
      authReq.user.id
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'ADD_ITEM_FAILED', message: result.error },
      });
    }

    return res.status(201).json({
      success: true,
      data: result.item,
    });
  } catch (error) {
    console.error('Add quote item error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ADD_ITEM_ERROR',
        message: error instanceof Error ? error.message : 'Failed to add item to quote',
      },
    });
  }
});

/**
 * PATCH /api/v1/quotes/:id/items/:itemId
 * Update item quantity
 */
router.patch('/:id/items/:itemId', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id, itemId } = req.params;

    // Validate request body
    const bodyResult = updateQuoteItemSchema.safeParse(req.body);
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

    // Verify quote belongs to company
    const quote = await getQuoteById(id, authReq.user.companyId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quote not found' },
      });
    }

    const result = await updateQuoteItemQuantity(
      id,
      itemId,
      bodyResult.data.quantity,
      authReq.user.id
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'UPDATE_ITEM_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Item quantity updated' },
    });
  } catch (error) {
    console.error('Update quote item error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ITEM_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update item',
      },
    });
  }
});

/**
 * DELETE /api/v1/quotes/:id/items/:itemId
 * Remove item from quote
 */
router.delete('/:id/items/:itemId', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id, itemId } = req.params;

    // Verify quote belongs to company
    const quote = await getQuoteById(id, authReq.user.companyId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quote not found' },
      });
    }

    const result = await removeQuoteItem(id, itemId, authReq.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'REMOVE_ITEM_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Item removed' },
    });
  } catch (error) {
    console.error('Remove quote item error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'REMOVE_ITEM_ERROR',
        message: error instanceof Error ? error.message : 'Failed to remove item',
      },
    });
  }
});

/**
 * POST /api/v1/quotes/:id/finalize
 * Finalize quote (DRAFT -> CREATED)
 */
router.post('/:id/finalize', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Verify quote belongs to company
    const quote = await getQuoteById(id, authReq.user.companyId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quote not found' },
      });
    }

    const result = await finalizeQuote(id, authReq.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'FINALIZE_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: result.quote,
    });
  } catch (error) {
    console.error('Finalize quote error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FINALIZE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to finalize quote',
      },
    });
  }
});

/**
 * POST /api/v1/quotes/:id/accept
 * Accept quote (CREATED -> ACCEPTED)
 */
router.post('/:id/accept', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Verify quote belongs to company
    const quote = await getQuoteById(id, authReq.user.companyId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quote not found' },
      });
    }

    const result = await acceptQuote(id, authReq.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'ACCEPT_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Quote accepted' },
    });
  } catch (error) {
    console.error('Accept quote error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ACCEPT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to accept quote',
      },
    });
  }
});

/**
 * POST /api/v1/quotes/:id/reject
 * Reject quote (CREATED -> REJECTED)
 */
router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Verify quote belongs to company
    const quote = await getQuoteById(id, authReq.user.companyId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quote not found' },
      });
    }

    const result = await rejectQuote(id, authReq.user.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'REJECT_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Quote rejected' },
    });
  } catch (error) {
    console.error('Reject quote error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'REJECT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to reject quote',
      },
    });
  }
});

export default router;
