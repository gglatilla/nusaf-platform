import { Router, Request } from 'express';
import { prisma } from '../../../config/database';
import { authenticate } from '../../../middleware/auth';
import type { UserRole } from '@prisma/client';
import {
  addQuoteItemSchema,
  updateQuoteItemSchema,
  updateQuoteNotesSchema,
  quoteListQuerySchema,
  cashCustomerSchema,
  checkoutQuoteSchema,
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
  updateCashCustomerDetails,
  finalizeQuote,
  acceptQuote,
  rejectQuote,
  deleteQuote,
  checkoutQuote,
} from '../../../services/quote.service';

const router = Router();

// Staff roles that can create quotes on behalf of customers
const QUOTE_STAFF_ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'SALES'];

function isQuoteStaff(role: UserRole): boolean {
  return QUOTE_STAFF_ROLES.includes(role);
}

/**
 * Get the effective companyId for quote access.
 * - CUSTOMER: always own companyId (strict isolation)
 * - Staff (ADMIN/MANAGER/SALES): undefined (can access all quotes)
 */
function getEffectiveCompanyId(req: Request): string | undefined {
  return isQuoteStaff(req.user!.role) ? undefined : req.user!.companyId;
}

// All routes require authentication
// Customers can manage their own quotes (company isolation enforced in service layer)
router.use(authenticate);

/**
 * POST /api/v1/quotes
 * Create a new draft quote or return existing draft.
 * Staff (ADMIN/MANAGER/SALES): must provide companyId in body for customer company.
 * CUSTOMER: always uses own company, body companyId is ignored.
 */
router.post('/', async (req, res) => {
  try {

    const staff = isQuoteStaff(req.user!.role);

    let targetCompanyId: string;

    if (staff) {
      // Staff must select a customer company
      const { companyId } = req.body;
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Customer company must be selected' },
        });
      }
      targetCompanyId = companyId;
    } else {
      // CUSTOMER: always own company
      targetCompanyId = req.user!.companyId;
    }

    // Get target company for tier + cash account status
    const company = await prisma.company.findUnique({
      where: { id: targetCompanyId },
      select: { id: true, name: true, tier: true, isCashAccount: true },
    });

    if (!company) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_COMPANY', message: staff ? 'Customer company not found' : 'User company not found' },
      });
    }

    // Parse optional cash customer details from body
    const cashParsed = cashCustomerSchema.safeParse(req.body);
    const cashCustomer = cashParsed.success ? cashParsed.data : undefined;

    const result = await getOrCreateDraftQuote(
      req.user!.id,
      targetCompanyId,
      company.tier,
      cashCustomer
    );

    return res.status(result.isNew ? 201 : 200).json({
      success: true,
      data: {
        id: result.id,
        quoteNumber: result.quoteNumber,
        isNew: result.isNew,
        ...(staff ? { companyName: company.name, companyTier: company.tier, isCashAccount: company.isCashAccount } : {}),
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
router.get('/', async (req, res) => {
  try {
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

    const staff = isQuoteStaff(req.user!.role);
    // Staff can optionally filter by companyId query param; customers always see own
    const companyId = staff
      ? (req.query.companyId as string | undefined)
      : req.user!.companyId;

    const result = await getQuotes({
      companyId,
      userId: staff ? req.user!.id : undefined,
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
 * Get the active draft quote for the current user (for cart display).
 * Staff can pass ?companyId=xxx to get the draft for a specific customer company.
 */
router.get('/active', async (req, res) => {
  try {

    const staff = isQuoteStaff(req.user!.role);

    // Staff must specify which customer company's draft to fetch
    const targetCompanyId = staff
      ? (req.query.companyId as string | undefined)
      : req.user!.companyId;

    if (staff && !targetCompanyId) {
      return res.status(400).json({
        success: false,
        error: { code: 'COMPANY_REQUIRED', message: 'Customer company must be selected' },
      });
    }

    const draft = await getActiveDraftQuote(req.user!.id, targetCompanyId!);

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
router.get('/:id', async (req, res) => {
  try {

    const { id } = req.params;

    // Prevent "active" from being treated as an ID
    if (id === 'active') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Use GET /quotes/active for active draft' },
      });
    }

    const quote = await getQuoteById(id, getEffectiveCompanyId(req));

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
router.patch('/:id', async (req, res) => {
  try {

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

    // Verify quote access (staff can access any company's quotes)
    const quote = await getQuoteById(id, getEffectiveCompanyId(req));
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quote not found' },
      });
    }

    const result = await updateQuoteNotes(id, bodyResult.data.customerNotes || '', req.user!.id);

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
 * PATCH /api/v1/quotes/:id/cash-customer
 * Update cash customer details on a DRAFT quote
 */
router.patch('/:id/cash-customer', async (req, res) => {
  try {
    const { id } = req.params;

    const bodyResult = cashCustomerSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid cash customer details',
          details: bodyResult.error.errors,
        },
      });
    }

    const result = await updateCashCustomerDetails(
      id,
      bodyResult.data,
      req.user!.id,
      getEffectiveCompanyId(req)
    );

    if (!result.success) {
      const statusCode = result.error === 'Quote not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: { code: statusCode === 404 ? 'NOT_FOUND' : 'UPDATE_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Cash customer details updated' },
    });
  } catch (error) {
    console.error('Update cash customer error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CASH_CUSTOMER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update cash customer details',
      },
    });
  }
});

/**
 * DELETE /api/v1/quotes/:id
 * Delete a DRAFT quote (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {

    const { id } = req.params;

    const result = await deleteQuote(id, req.user!.id, getEffectiveCompanyId(req));

    if (!result.success) {
      const statusCode = result.error === 'Quote not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Quote not found' ? 'NOT_FOUND' : 'DELETE_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Quote deleted' },
    });
  } catch (error) {
    console.error('Delete quote error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete quote',
      },
    });
  }
});

/**
 * POST /api/v1/quotes/:id/items
 * Add item to quote
 * Optimized: Company isolation check happens inside addQuoteItem service
 */
router.post('/:id/items', async (req, res) => {
  try {

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

    // addQuoteItem handles company isolation internally; staff bypass via undefined
    const result = await addQuoteItem(
      id,
      bodyResult.data.productId,
      bodyResult.data.quantity,
      req.user!.id,
      getEffectiveCompanyId(req)
    );

    if (!result.success) {
      // Check if it's a not found error
      const statusCode = result.error === 'Quote not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: { code: statusCode === 404 ? 'NOT_FOUND' : 'ADD_ITEM_FAILED', message: result.error },
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
router.patch('/:id/items/:itemId', async (req, res) => {
  try {

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

    // Verify quote access (staff can access any company's quotes)
    const quote = await getQuoteById(id, getEffectiveCompanyId(req));
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
      req.user!.id
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
router.delete('/:id/items/:itemId', async (req, res) => {
  try {

    const { id, itemId } = req.params;

    // Verify quote access (staff can access any company's quotes)
    const quote = await getQuoteById(id, getEffectiveCompanyId(req));
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quote not found' },
      });
    }

    const result = await removeQuoteItem(id, itemId, req.user!.id);

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
router.post('/:id/finalize', async (req, res) => {
  try {

    const { id } = req.params;

    // Verify quote access (staff can access any company's quotes)
    const quote = await getQuoteById(id, getEffectiveCompanyId(req));
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quote not found' },
      });
    }

    const result = await finalizeQuote(id, req.user!.id);

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
 * POST /api/v1/quotes/:id/checkout
 * Unified checkout flow — accepts quote and creates order with checkout data.
 * Available to both staff and customers.
 */
router.post('/:id/checkout', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate body
    const parsed = checkoutQuoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    // Verify quote access (staff can access any, customers only their own)
    const quote = await getQuoteById(id, getEffectiveCompanyId(req));
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quote not found' },
      });
    }

    // Use quote's companyId for the checkout (staff may operate on any company's quote)
    const result = await checkoutQuote(id, req.user!.id, quote.company.id, {
      shippingAddressId: parsed.data.shippingAddressId,
      customerPoNumber: parsed.data.customerPoNumber,
      customerPoDate: parsed.data.customerPoDate ? new Date(parsed.data.customerPoDate) : null,
      requiredDate: parsed.data.requiredDate ? new Date(parsed.data.requiredDate) : null,
      customerNotes: parsed.data.customerNotes,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'CHECKOUT_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: {
        message: 'Order created successfully',
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        paymentRequired: result.paymentRequired ?? false,
        fulfillmentTriggered: result.fulfillmentTriggered ?? false,
        proformaGenerated: result.proformaGenerated ?? false,
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CHECKOUT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to checkout quote',
      },
    });
  }
});

/**
 * POST /api/v1/quotes/:id/accept
 * Accept quote (CREATED -> ACCEPTED) — legacy endpoint, use /checkout for new flows
 */
router.post('/:id/accept', async (req, res) => {
  try {

    const { id } = req.params;

    // Verify quote access (staff can access any company's quotes)
    const quote = await getQuoteById(id, getEffectiveCompanyId(req));
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quote not found' },
      });
    }

    const result = await acceptQuote(id, req.user!.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'ACCEPT_FAILED', message: result.error },
      });
    }

    return res.json({
      success: true,
      data: {
        message: 'Quote accepted',
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        fulfillmentTriggered: result.fulfillmentTriggered ?? false,
        proformaGenerated: result.proformaGenerated ?? false,
      },
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
router.post('/:id/reject', async (req, res) => {
  try {

    const { id } = req.params;

    // Verify quote access (staff can access any company's quotes)
    const quote = await getQuoteById(id, getEffectiveCompanyId(req));
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quote not found' },
      });
    }

    const result = await rejectQuote(id, req.user!.id);

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
