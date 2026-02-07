import { Router } from 'express';
import { authenticate, requireRole, type AuthenticatedRequest } from '../../../middleware/auth';
import {
  createProformaInvoiceSchema,
  voidProformaInvoiceSchema,
} from '../../../utils/validation/proforma-invoices';
import {
  createProformaInvoice,
  getProformaInvoiceById,
  getProformaInvoicesForOrder,
  voidProformaInvoice,
} from '../../../services/proforma-invoice.service';
import { generateProformaInvoicePDF } from '../../../services/pdf.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/proforma-invoices/order/:orderId
 * Get proforma invoices for a specific order
 * NOTE: Must be before /:id to avoid matching "order" as an ID
 */
router.get('/order/:orderId', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { orderId } = req.params;

    const proformas = await getProformaInvoicesForOrder(orderId, authReq.user.companyId);

    // For CUSTOMER role, only return ACTIVE proformas
    const filtered = authReq.user.role === 'CUSTOMER'
      ? proformas.filter((pi) => pi.status === 'ACTIVE')
      : proformas;

    return res.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    console.error('Get proforma invoices for order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PROFORMA_INVOICES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch proforma invoices',
      },
    });
  }
});

/**
 * GET /api/v1/proforma-invoices/:id/pdf
 * Download proforma invoice as PDF
 * NOTE: Must be before /:id to avoid matching "pdf" route issues
 */
router.get('/:id/pdf', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const proforma = await getProformaInvoiceById(id, authReq.user.companyId);

    if (!proforma) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Proforma invoice not found' },
      });
    }

    const pdfBuffer = await generateProformaInvoicePDF(proforma);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${proforma.proformaNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Download proforma invoice PDF error:', error);
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
 * GET /api/v1/proforma-invoices/:id
 * Get proforma invoice details with lines
 */
router.get('/:id', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const proforma = await getProformaInvoiceById(id, authReq.user.companyId);

    if (!proforma) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Proforma invoice not found' },
      });
    }

    // Strip internal data for CUSTOMER role (Golden Rule 4)
    if (authReq.user.role === 'CUSTOMER') {
      return res.json({
        success: true,
        data: {
          ...proforma,
          notes: undefined,
          createdBy: undefined,
          voidedBy: undefined,
          voidReason: undefined,
        },
      });
    }

    return res.json({
      success: true,
      data: proforma,
    });
  } catch (error) {
    console.error('Get proforma invoice error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PROFORMA_INVOICE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch proforma invoice',
      },
    });
  }
});

/**
 * POST /api/v1/proforma-invoices/from-order/:orderId
 * Create a proforma invoice from a confirmed order
 */
router.post('/from-order/:orderId', requireRole('ADMIN', 'MANAGER', 'SALES'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { orderId } = req.params;

    const bodyResult = createProformaInvoiceSchema.safeParse(req.body);
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

    const result = await createProformaInvoice(
      orderId,
      bodyResult.data,
      authReq.user.id,
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
      data: result.proformaInvoice,
    });
  } catch (error) {
    console.error('Create proforma invoice error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create proforma invoice',
      },
    });
  }
});

/**
 * POST /api/v1/proforma-invoices/:id/void
 * Void a proforma invoice (ACTIVE -> VOIDED)
 */
router.post('/:id/void', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const bodyResult = voidProformaInvoiceSchema.safeParse(req.body);
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

    const result = await voidProformaInvoice(
      id,
      authReq.user.id,
      authReq.user.companyId,
      bodyResult.data.reason
    );

    if (!result.success) {
      const statusCode = result.error === 'Proforma invoice not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Proforma invoice not found' ? 'NOT_FOUND' : 'VOID_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Proforma invoice voided' },
    });
  } catch (error) {
    console.error('Void proforma invoice error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'VOID_ERROR',
        message: error instanceof Error ? error.message : 'Failed to void proforma invoice',
      },
    });
  }
});

export default router;
