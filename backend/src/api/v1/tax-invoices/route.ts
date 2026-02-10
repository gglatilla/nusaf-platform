import { Router } from 'express';
import { authenticate, requireRole, type AuthenticatedRequest } from '../../../middleware/auth';
import {
  createTaxInvoiceSchema,
  voidTaxInvoiceSchema,
} from '../../../utils/validation/tax-invoices';
import {
  createTaxInvoice,
  getTaxInvoiceById,
  getTaxInvoicesForOrder,
  getTaxInvoices,
  voidTaxInvoice,
} from '../../../services/tax-invoice.service';
import { generateTaxInvoicePDF } from '../../../services/pdf.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/tax-invoices
 * List all tax invoices with filters (staff only)
 */
router.get('/', requireRole('ADMIN', 'MANAGER', 'SALES', 'CUSTOMER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const isCustomer = authReq.user.role === 'CUSTOMER';
    const { status, companyId, search, dateFrom, dateTo, paymentTerms, overdue, page, pageSize } = req.query;

    const result = await getTaxInvoices({
      // Customers can only see ISSUED invoices for their own company
      status: isCustomer ? 'ISSUED' : (status as string | undefined as 'ISSUED' | 'VOIDED' | 'DRAFT' | undefined),
      companyId: isCustomer ? authReq.user.companyId : (companyId as string | undefined),
      search: search as string | undefined,
      dateFrom: dateFrom as string | undefined,
      dateTo: dateTo as string | undefined,
      paymentTerms: paymentTerms as string | undefined,
      overdue: overdue === 'true',
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List tax invoices error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'TAX_INVOICES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch tax invoices',
      },
    });
  }
});

/**
 * GET /api/v1/tax-invoices/order/:orderId
 * Get tax invoices for a specific order
 * NOTE: Must be before /:id to avoid matching "order" as an ID
 */
router.get('/order/:orderId', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { orderId } = req.params;

    // For CUSTOMER role, scope to their company
    const companyId = authReq.user.role === 'CUSTOMER' ? authReq.user.companyId : undefined;

    const invoices = await getTaxInvoicesForOrder(orderId, companyId);

    // For CUSTOMER role, only return ISSUED invoices
    const filtered = authReq.user.role === 'CUSTOMER'
      ? invoices.filter((ti) => ti.status === 'ISSUED')
      : invoices;

    return res.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    console.error('Get tax invoices for order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'TAX_INVOICES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch tax invoices',
      },
    });
  }
});

/**
 * POST /api/v1/tax-invoices/from-order/:orderId
 * Manually create a tax invoice from a delivered order (fallback if auto-generation failed)
 */
router.post('/from-order/:orderId', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { orderId } = req.params;

    const bodyResult = createTaxInvoiceSchema.safeParse(req.body);
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

    const result = await createTaxInvoice(
      orderId,
      authReq.user.id,
      authReq.user.companyId,
      bodyResult.data.notes
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
      data: result.taxInvoice,
    });
  } catch (error) {
    console.error('Create tax invoice error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create tax invoice',
      },
    });
  }
});

/**
 * GET /api/v1/tax-invoices/:id/pdf
 * Download tax invoice as PDF
 * NOTE: Must be before /:id to avoid matching "pdf" route issues
 */
router.get('/:id/pdf', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    // For CUSTOMER role, scope to their company
    const companyId = authReq.user.role === 'CUSTOMER' ? authReq.user.companyId : undefined;

    const taxInvoice = await getTaxInvoiceById(id, companyId);

    if (!taxInvoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tax invoice not found' },
      });
    }

    // Customers can only download ISSUED invoices
    if (authReq.user.role === 'CUSTOMER' && taxInvoice.status !== 'ISSUED') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tax invoice not found' },
      });
    }

    const pdfBuffer = await generateTaxInvoicePDF(taxInvoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${taxInvoice.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Download tax invoice PDF error:', error);
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
 * GET /api/v1/tax-invoices/:id
 * Get tax invoice details with lines
 */
router.get('/:id', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    // For CUSTOMER role, scope to their company
    const companyId = authReq.user.role === 'CUSTOMER' ? authReq.user.companyId : undefined;

    const taxInvoice = await getTaxInvoiceById(id, companyId);

    if (!taxInvoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tax invoice not found' },
      });
    }

    // Strip internal data for CUSTOMER role (Golden Rule 4)
    if (authReq.user.role === 'CUSTOMER') {
      if (taxInvoice.status !== 'ISSUED') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Tax invoice not found' },
        });
      }

      return res.json({
        success: true,
        data: {
          ...taxInvoice,
          notes: undefined,
          issuedBy: undefined,
          issuedByName: undefined,
          voidedBy: undefined,
          voidReason: undefined,
        },
      });
    }

    return res.json({
      success: true,
      data: taxInvoice,
    });
  } catch (error) {
    console.error('Get tax invoice error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'TAX_INVOICE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch tax invoice',
      },
    });
  }
});

/**
 * POST /api/v1/tax-invoices/:id/void
 * Void a tax invoice (ISSUED -> VOIDED)
 */
router.post('/:id/void', requireRole('ADMIN'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const bodyResult = voidTaxInvoiceSchema.safeParse(req.body);
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

    const result = await voidTaxInvoice(
      id,
      authReq.user.id,
      authReq.user.companyId,
      bodyResult.data.reason
    );

    if (!result.success) {
      const statusCode = result.error === 'Tax invoice not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Tax invoice not found' ? 'NOT_FOUND' : 'VOID_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Tax invoice voided' },
    });
  } catch (error) {
    console.error('Void tax invoice error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'VOID_ERROR',
        message: error instanceof Error ? error.message : 'Failed to void tax invoice',
      },
    });
  }
});

export default router;
