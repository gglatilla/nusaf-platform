import { Router, Request, Response } from 'express';
import { prisma } from '../../../../config/database';
import {
  createPublicQuoteRequestSchema,
  CreatePublicQuoteRequestInput,
} from '../../../../utils/validation/public-quote-request';
import { quoteRequestLimiter } from '../../../../middleware/rate-limit';
import {
  sendQuoteRequestNotification,
  sendQuoteRequestConfirmation,
} from '../../../../services/email.service';
import { ZodError } from 'zod';

const router = Router();

/**
 * POST /api/v1/public/quote-requests
 * Create a guest quote request (no authentication required)
 * Rate limited: 3 requests per IP per 15 minutes
 */
router.post('/', quoteRequestLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData: CreatePublicQuoteRequestInput = createPublicQuoteRequestSchema.parse(
      req.body
    );

    // Check honeypot - if filled, silently reject (looks like success to bot)
    if (validatedData.website) {
      console.log('[QuoteRequest] Honeypot triggered - bot detected');
      // Return fake success to not alert the bot
      res.status(201).json({
        success: true,
        data: {
          requestId: 'honeypot-' + Date.now(),
          message: 'Quote request submitted successfully. Our team will contact you shortly.',
        },
      });
      return;
    }

    // Check that at least some items exist (double validation)
    if (!validatedData.cartData.items || validatedData.cartData.items.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_CART',
          message: 'Quote request must contain at least one item',
        },
      });
      return;
    }

    // Create the QuoteRequest record
    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        sessionId: validatedData.cartData.sessionId,
        email: validatedData.email,
        companyName: validatedData.companyName,
        phone: validatedData.phone || null,
        notes: validatedData.notes || null,
        cartData: {
          name: validatedData.name,
          items: validatedData.cartData.items,
        },
      },
    });

    // Log the quote request
    console.log(
      `[QuoteRequest] New guest quote request: ${quoteRequest.id} from ${validatedData.email} (${validatedData.companyName})`
    );

    // Prepare email data
    const emailData = {
      requestId: quoteRequest.id,
      customerName: validatedData.name,
      customerEmail: validatedData.email,
      customerCompany: validatedData.companyName,
      customerPhone: validatedData.phone || undefined,
      customerNotes: validatedData.notes || undefined,
      items: validatedData.cartData.items.map((item) => ({
        sku: item.nusafSku,
        name: item.description,
        quantity: item.quantity,
      })),
      submittedAt: quoteRequest.createdAt,
    };

    // Send emails asynchronously (don't block the response)
    Promise.all([
      sendQuoteRequestNotification(emailData),
      sendQuoteRequestConfirmation(emailData),
    ]).then((results) => {
      const [notificationResult, confirmationResult] = results;
      if (!notificationResult.success) {
        console.error('[QuoteRequest] Failed to send notification email:', notificationResult.error);
      }
      if (!confirmationResult.success) {
        console.error('[QuoteRequest] Failed to send confirmation email:', confirmationResult.error);
      }
    }).catch((error) => {
      console.error('[QuoteRequest] Error sending emails:', error);
    });

    res.status(201).json({
      success: true,
      data: {
        requestId: quoteRequest.id,
        message: 'Quote request submitted successfully. Our team will contact you shortly.',
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    console.error('Error creating quote request:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit quote request. Please try again.',
      },
    });
  }
});

/**
 * GET /api/v1/public/quote-requests/:id
 * Get a quote request by ID (for confirmation page)
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        companyName: true,
        createdAt: true,
        isConverted: true,
        // Don't expose cartData in public endpoint
      },
    });

    if (!quoteRequest) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Quote request not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: quoteRequest,
    });
  } catch (error) {
    console.error('Error fetching quote request:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch quote request',
      },
    });
  }
});

export default router;
