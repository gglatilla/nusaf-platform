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

/**
 * Schema for cash customer details on a quote
 */
export const cashCustomerSchema = z.object({
  cashCustomerName: z.string().max(200).optional(),
  cashCustomerPhone: z.string().max(30).optional(),
  cashCustomerEmail: z.string().email().max(254).optional().or(z.literal('')),
  cashCustomerCompany: z.string().max(200).optional(),
  cashCustomerVat: z.string().max(20).optional(),
  cashCustomerAddress: z.string().max(500).optional(),
});

/**
 * Schema for quote checkout (accept quote + create order with checkout data)
 */
export const checkoutQuoteSchema = z.object({
  shippingAddressId: z.string().min(1).optional(),
  customerPoNumber: z.string().min(1, 'PO number is required').max(50),
  customerPoDate: z.string().datetime().optional().nullable(),
  requiredDate: z.string().datetime().optional().nullable(),
  customerNotes: z.string().max(2000).optional().nullable(),
});

// Type exports
export type AddQuoteItemInput = z.infer<typeof addQuoteItemSchema>;
export type UpdateQuoteItemInput = z.infer<typeof updateQuoteItemSchema>;
export type UpdateQuoteNotesInput = z.infer<typeof updateQuoteNotesSchema>;
export type QuoteListQuery = z.infer<typeof quoteListQuerySchema>;
export type CashCustomerInput = z.infer<typeof cashCustomerSchema>;
export type CheckoutQuoteInput = z.infer<typeof checkoutQuoteSchema>;
