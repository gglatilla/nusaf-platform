import { Router, Request, Response } from 'express';
import {
  createContactMessageSchema,
  CreateContactMessageInput,
} from '../../../../utils/validation/public-contact';
import { contactFormLimiter } from '../../../../middleware/rate-limit';
import { sendContactFormNotification } from '../../../../services/email.service';
import { ZodError } from 'zod';

const router = Router();

/**
 * POST /api/v1/public/contact
 * Submit a contact form message
 * Rate limited: 5 requests per IP per hour
 */
router.post('/', contactFormLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData: CreateContactMessageInput = createContactMessageSchema.parse(req.body);

    // Check honeypot - if filled, silently reject (looks like success to bot)
    if (validatedData.website) {
      console.log('[Contact] Honeypot triggered - bot detected');
      res.status(200).json({
        success: true,
        data: {
          message: 'Thank you for your message. We will get back to you shortly.',
        },
      });
      return;
    }

    // Log the contact message
    console.log(
      `[Contact] New message from ${validatedData.email} (${validatedData.name}${
        validatedData.company ? `, ${validatedData.company}` : ''
      })`
    );

    // Send email notification
    const emailResult = await sendContactFormNotification({
      name: validatedData.name,
      email: validatedData.email,
      company: validatedData.company || undefined,
      phone: validatedData.phone || undefined,
      message: validatedData.message,
      submittedAt: new Date(),
    });

    if (!emailResult.success) {
      console.error('[Contact] Failed to send notification email:', emailResult.error);
      // Don't fail the request - the message was logged
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Thank you for your message. We will get back to you shortly.',
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

    console.error('Error processing contact form:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send message. Please try again.',
      },
    });
  }
});

export default router;
