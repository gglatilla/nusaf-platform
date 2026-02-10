import { Router } from 'express';
import { authenticate, requireRole, type AuthenticatedRequest } from '../../../middleware/auth';
import { voidCreditNoteSchema } from '../../../utils/validation/credit-notes';
import {
  getCreditNoteById,
  getCreditNotesForRA,
  getCreditNotesForOrder,
  getCreditNotes,
  voidCreditNote,
} from '../../../services/credit-note.service';
import { generateCreditNotePDF } from '../../../services/pdf.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/credit-notes
 * List all credit notes with filters (staff only)
 */
router.get('/', requireRole('ADMIN', 'MANAGER', 'SALES'), async (req, res) => {
  try {
    const { status, companyId, search, dateFrom, dateTo, page, pageSize } = req.query;

    const result = await getCreditNotes({
      status: status as 'ISSUED' | 'VOIDED' | 'DRAFT' | undefined,
      companyId: companyId as string | undefined,
      search: search as string | undefined,
      dateFrom: dateFrom as string | undefined,
      dateTo: dateTo as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List credit notes error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREDIT_NOTES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch credit notes',
      },
    });
  }
});

/**
 * GET /api/v1/credit-notes/ra/:raId
 * Get credit notes for a specific return authorization
 * NOTE: Must be before /:id to avoid matching "ra" as an ID
 */
router.get('/ra/:raId', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { raId } = req.params;

    // For CUSTOMER role, scope to their company
    const companyId = authReq.user.role === 'CUSTOMER' ? authReq.user.companyId : undefined;

    const creditNotes = await getCreditNotesForRA(raId, companyId);

    // For CUSTOMER role, only return ISSUED credit notes
    const filtered = authReq.user.role === 'CUSTOMER'
      ? creditNotes.filter((cn) => cn.status === 'ISSUED')
      : creditNotes;

    return res.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    console.error('Get credit notes for RA error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREDIT_NOTES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch credit notes',
      },
    });
  }
});

/**
 * GET /api/v1/credit-notes/order/:orderId
 * Get credit notes for a specific order
 * NOTE: Must be before /:id to avoid matching "order" as an ID
 */
router.get('/order/:orderId', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { orderId } = req.params;

    // For CUSTOMER role, scope to their company
    const companyId = authReq.user.role === 'CUSTOMER' ? authReq.user.companyId : undefined;

    const creditNotes = await getCreditNotesForOrder(orderId, companyId);

    // For CUSTOMER role, only return ISSUED credit notes
    const filtered = authReq.user.role === 'CUSTOMER'
      ? creditNotes.filter((cn) => cn.status === 'ISSUED')
      : creditNotes;

    return res.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    console.error('Get credit notes for order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREDIT_NOTES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch credit notes',
      },
    });
  }
});

/**
 * GET /api/v1/credit-notes/:id/pdf
 * Download credit note as PDF
 * NOTE: Must be before /:id to avoid route conflicts
 */
router.get('/:id/pdf', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    // For CUSTOMER role, scope to their company
    const companyId = authReq.user.role === 'CUSTOMER' ? authReq.user.companyId : undefined;

    const creditNote = await getCreditNoteById(id, companyId);

    if (!creditNote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Credit note not found' },
      });
    }

    // Customers can only download ISSUED credit notes
    if (authReq.user.role === 'CUSTOMER' && creditNote.status !== 'ISSUED') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Credit note not found' },
      });
    }

    const pdfBuffer = await generateCreditNotePDF(creditNote);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${creditNote.creditNoteNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Download credit note PDF error:', error);
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
 * GET /api/v1/credit-notes/:id
 * Get credit note details with lines
 */
router.get('/:id', requireRole('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'CUSTOMER'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    // For CUSTOMER role, scope to their company
    const companyId = authReq.user.role === 'CUSTOMER' ? authReq.user.companyId : undefined;

    const creditNote = await getCreditNoteById(id, companyId);

    if (!creditNote) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Credit note not found' },
      });
    }

    // Strip internal data for CUSTOMER role
    if (authReq.user.role === 'CUSTOMER') {
      if (creditNote.status !== 'ISSUED') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Credit note not found' },
        });
      }

      return res.json({
        success: true,
        data: {
          ...creditNote,
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
      data: creditNote,
    });
  } catch (error) {
    console.error('Get credit note error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREDIT_NOTE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch credit note',
      },
    });
  }
});

/**
 * POST /api/v1/credit-notes/:id/void
 * Void a credit note (ISSUED -> VOIDED)
 */
router.post('/:id/void', requireRole('ADMIN'), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const bodyResult = voidCreditNoteSchema.safeParse(req.body);
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

    const result = await voidCreditNote(
      id,
      authReq.user.id,
      authReq.user.companyId,
      bodyResult.data.reason
    );

    if (!result.success) {
      const statusCode = result.error === 'Credit note not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error === 'Credit note not found' ? 'NOT_FOUND' : 'VOID_FAILED',
          message: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Credit note voided' },
    });
  } catch (error) {
    console.error('Void credit note error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'VOID_ERROR',
        message: error instanceof Error ? error.message : 'Failed to void credit note',
      },
    });
  }
});

export default router;
