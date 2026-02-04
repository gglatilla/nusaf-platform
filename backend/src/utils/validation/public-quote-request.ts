import { z } from 'zod';

// Quote request attachment constraints
export const QUOTE_ATTACHMENT_ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  // Documents
  'application/pdf',
  // CAD formats (MIME types vary by system)
  'application/dxf',
  'image/vnd.dxf',
  'image/x-dxf',
  'application/acad',
  'application/x-acad',
  'image/vnd.dwg',
  'application/x-dwg',
  'model/step',
  'application/step',
  'application/stp',
  // Fallback for unknown CAD
  'application/octet-stream',
];

export const QUOTE_ATTACHMENT_ALLOWED_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.dxf',
  '.dwg',
  '.step',
  '.stp',
];

export const QUOTE_ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024; // 10MB per file
export const QUOTE_ATTACHMENT_MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB total
export const QUOTE_ATTACHMENT_MAX_FILES = 5;

// Schema for attachment metadata (after upload)
export const quoteAttachmentSchema = z.object({
  key: z.string().min(1, 'File key is required'),
  filename: z.string().min(1, 'Filename is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  sizeBytes: z.number().int().positive('File size must be positive'),
});

export type QuoteAttachment = z.infer<typeof quoteAttachmentSchema>;

export const createPublicQuoteRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(50, 'Phone number too long').nullable().optional(),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').nullable().optional(),
  // Honeypot field - must be empty. Named "website" to look like a legitimate field to bots
  website: z.string().max(0, 'This field must be empty').optional(),
  cartData: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product ID is required'),
          nusafSku: z.string().min(1, 'SKU is required'),
          description: z.string(),
          quantity: z.number().int().positive('Quantity must be positive'),
        })
      )
      .min(1, 'At least one item is required'),
  }),
  // Optional file attachments (already uploaded to R2)
  attachments: z
    .array(quoteAttachmentSchema)
    .max(QUOTE_ATTACHMENT_MAX_FILES, `Maximum ${QUOTE_ATTACHMENT_MAX_FILES} files allowed`)
    .optional(),
});

export type CreatePublicQuoteRequestInput = z.infer<typeof createPublicQuoteRequestSchema>;

// Schema for file upload request
export const quoteAttachmentUploadSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export type QuoteAttachmentUploadInput = z.infer<typeof quoteAttachmentUploadSchema>;
