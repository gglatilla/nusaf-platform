import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { prisma } from '../../../../config/database';
import {
  createPublicQuoteRequestSchema,
  CreatePublicQuoteRequestInput,
  QUOTE_ATTACHMENT_ALLOWED_MIME_TYPES,
  QUOTE_ATTACHMENT_ALLOWED_EXTENSIONS,
  QUOTE_ATTACHMENT_MAX_SIZE,
  quoteAttachmentUploadSchema,
  QuoteAttachment,
} from '../../../../utils/validation/public-quote-request';
import { quoteRequestLimiter } from '../../../../middleware/rate-limit';
import {
  sendQuoteRequestNotification,
  sendQuoteRequestConfirmation,
} from '../../../../services/email.service';
import {
  isR2Configured,
  uploadToR2,
  generateQuoteRequestKey,
  getPublicUrl,
} from '../../../../services/r2-storage.service';
import { ZodError } from 'zod';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: QUOTE_ATTACHMENT_MAX_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    // Check MIME type
    const mimeTypeAllowed = QUOTE_ATTACHMENT_ALLOWED_MIME_TYPES.includes(file.mimetype);
    // Check extension (important for CAD files where MIME types are unreliable)
    const ext = path.extname(file.originalname).toLowerCase();
    const extensionAllowed = QUOTE_ATTACHMENT_ALLOWED_EXTENSIONS.includes(ext);

    if (mimeTypeAllowed || extensionAllowed) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `File type not allowed. Allowed types: PDF, JPEG, PNG, WebP, DXF, DWG, STEP`
        )
      );
    }
  },
});

/**
 * POST /api/v1/public/quote-requests/upload
 * Upload a file attachment for a quote request
 * Rate limited: same as quote request creation
 */
router.post(
  '/upload',
  quoteRequestLimiter,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate sessionId from body
      const bodyResult = quoteAttachmentUploadSchema.safeParse(req.body);
      if (!bodyResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Session ID is required',
            details: bodyResult.error.errors,
          },
        });
        return;
      }

      const { sessionId } = bodyResult.data;

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No file was uploaded',
          },
        });
        return;
      }

      // Check if R2 is configured
      if (!isR2Configured()) {
        console.warn('[QuoteRequest] R2 not configured, file upload disabled');
        res.status(503).json({
          success: false,
          error: {
            code: 'STORAGE_UNAVAILABLE',
            message: 'File storage is temporarily unavailable. Please try again later.',
          },
        });
        return;
      }

      // Generate storage key and upload
      const key = generateQuoteRequestKey(sessionId, req.file.originalname);

      try {
        await uploadToR2(key, req.file.buffer, req.file.mimetype);
      } catch (uploadError) {
        console.error('[QuoteRequest] R2 upload failed:', uploadError);
        res.status(500).json({
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: 'Failed to upload file. Please try again.',
          },
        });
        return;
      }

      // Build attachment metadata
      const attachment: QuoteAttachment = {
        key,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
      };

      console.log(
        `[QuoteRequest] File uploaded: ${req.file.originalname} (${req.file.size} bytes) -> ${key}`
      );

      res.status(201).json({
        success: true,
        data: {
          ...attachment,
          url: getPublicUrl(key),
        },
      });
    } catch (error) {
      // Handle multer errors
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: `File size exceeds maximum of ${QUOTE_ATTACHMENT_MAX_SIZE / (1024 * 1024)}MB`,
            },
          });
          return;
        }
      }

      console.error('[QuoteRequest] Upload error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to upload file',
        },
      });
    }
  }
);

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
        // Store attachment metadata if any files were uploaded
        attachments: validatedData.attachments && validatedData.attachments.length > 0
          ? validatedData.attachments
          : undefined,
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
      // Include attachment info for emails
      attachments: validatedData.attachments?.map((att) => ({
        filename: att.filename,
        url: getPublicUrl(att.key),
        sizeBytes: att.sizeBytes,
      })),
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
