import { z } from 'zod';

/**
 * Valid sales order statuses
 */
export const salesOrderStatuses = [
  'DRAFT',
  'CONFIRMED',
  'PROCESSING',
  'READY_TO_SHIP',
  'PARTIALLY_SHIPPED',
  'SHIPPED',
  'DELIVERED',
  'INVOICED',
  'CLOSED',
  'ON_HOLD',
  'CANCELLED',
] as const;

/**
 * Schema for creating an order from a quote
 */
export const createOrderFromQuoteSchema = z.object({
  quoteId: z.string().min(1, 'Quote ID is required'),
  customerPoNumber: z.string().max(50).optional(),
  customerPoDate: z.coerce.date().optional(),
  requiredDate: z.coerce.date().optional(),
  customerNotes: z.string().max(2000).optional(),
});

/**
 * Schema for updating order notes
 */
export const updateOrderNotesSchema = z.object({
  internalNotes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
  customerNotes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
});

/**
 * Schema for putting an order on hold
 */
export const holdOrderSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be 500 characters or less'),
});

/**
 * Schema for cancelling an order
 */
export const cancelOrderSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be 500 characters or less'),
});

/**
 * Schema for order list query parameters
 */
export const orderListQuerySchema = z.object({
  status: z.enum(salesOrderStatuses).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type CreateOrderFromQuoteInput = z.infer<typeof createOrderFromQuoteSchema>;
export type UpdateOrderNotesInput = z.infer<typeof updateOrderNotesSchema>;
export type HoldOrderInput = z.infer<typeof holdOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
