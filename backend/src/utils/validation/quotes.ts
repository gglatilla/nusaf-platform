import { z } from 'zod';

/**
 * Schema for adding an item to a quote
 */
export const addQuoteItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

/**
 * Schema for updating an item quantity
 */
export const updateQuoteItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

/**
 * Schema for updating quote notes
 */
export const updateQuoteNotesSchema = z.object({
  customerNotes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
});

/**
 * Schema for quote list query parameters
 */
export const quoteListQuerySchema = z.object({
  status: z.enum(['DRAFT', 'CREATED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'CONVERTED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type AddQuoteItemInput = z.infer<typeof addQuoteItemSchema>;
export type UpdateQuoteItemInput = z.infer<typeof updateQuoteItemSchema>;
export type UpdateQuoteNotesInput = z.infer<typeof updateQuoteNotesSchema>;
export type QuoteListQuery = z.infer<typeof quoteListQuerySchema>;
