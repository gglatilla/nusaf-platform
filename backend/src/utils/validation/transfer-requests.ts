import { z } from 'zod';

/**
 * Valid transfer request statuses
 */
export const transferRequestStatuses = ['PENDING', 'IN_TRANSIT', 'RECEIVED'] as const;

/**
 * Schema for a transfer request line when creating from an order
 */
const transferRequestLineFromOrderSchema = z.object({
  orderLineId: z.string().min(1, 'Order line ID is required'),
  lineNumber: z.number().int().min(1),
  productId: z.string().min(1, 'Product ID is required'),
  productSku: z.string().min(1, 'Product SKU is required'),
  productDescription: z.string().min(1, 'Product description is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

/**
 * Schema for creating a transfer request from an order
 */
export const createTransferRequestFromOrderSchema = z.object({
  lines: z.array(transferRequestLineFromOrderSchema).min(1, 'At least one line is required'),
});

/**
 * Schema for a transfer request line when creating standalone
 */
const standaloneTransferRequestLineSchema = z.object({
  lineNumber: z.number().int().min(1),
  productId: z.string().min(1, 'Product ID is required'),
  productSku: z.string().min(1, 'Product SKU is required'),
  productDescription: z.string().min(1, 'Product description is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

/**
 * Schema for creating a standalone transfer request
 */
export const createStandaloneTransferRequestSchema = z.object({
  lines: z.array(standaloneTransferRequestLineSchema).min(1, 'At least one line is required'),
  notes: z.string().optional().nullable(),
});

/**
 * Schema for shipping a transfer (name required for audit)
 */
export const shipTransferSchema = z.object({
  shippedByName: z.string().min(1, 'Name is required'),
});

/**
 * Schema for updating received quantity on a line
 */
export const updateLineReceivedSchema = z.object({
  receivedQuantity: z.number().int().min(0, 'Received quantity cannot be negative'),
});

/**
 * Schema for receiving a transfer (name required for audit)
 */
export const receiveTransferSchema = z.object({
  receivedByName: z.string().min(1, 'Name is required'),
});

/**
 * Schema for updating notes on a transfer request
 */
export const updateNotesSchema = z.object({
  notes: z.string(),
});

/**
 * Schema for transfer request list query parameters
 */
export const transferRequestListQuerySchema = z.object({
  orderId: z.string().optional(),
  status: z.enum(transferRequestStatuses).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type CreateTransferRequestFromOrderInput = z.infer<typeof createTransferRequestFromOrderSchema>;
export type CreateStandaloneTransferRequestInput = z.infer<typeof createStandaloneTransferRequestSchema>;
export type ShipTransferInput = z.infer<typeof shipTransferSchema>;
export type UpdateLineReceivedInput = z.infer<typeof updateLineReceivedSchema>;
export type ReceiveTransferInput = z.infer<typeof receiveTransferSchema>;
export type UpdateNotesInput = z.infer<typeof updateNotesSchema>;
export type TransferRequestListQuery = z.infer<typeof transferRequestListQuerySchema>;
