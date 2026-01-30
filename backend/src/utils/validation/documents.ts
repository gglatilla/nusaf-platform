import { z } from 'zod';

/**
 * Valid document types
 */
export const documentTypes = ['CUSTOMER_PO', 'SIGNED_DELIVERY_NOTE'] as const;

/**
 * Schema for document upload metadata
 */
export const uploadDocumentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  type: z.enum(documentTypes, { errorMap: () => ({ message: 'Invalid document type' }) }),
});

/**
 * Schema for document list query parameters
 */
export const documentListQuerySchema = z.object({
  orderId: z.string().optional(),
  type: z.enum(documentTypes).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;
