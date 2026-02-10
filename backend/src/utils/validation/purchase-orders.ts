import { z } from 'zod';

/**
 * Valid purchase order statuses
 */
export const purchaseOrderStatuses = [
  'DRAFT',
  'PENDING_APPROVAL',
  'SENT',
  'ACKNOWLEDGED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CLOSED',
  'CANCELLED',
] as const;

/**
 * Valid warehouses for delivery
 */
export const warehouses = ['JHB', 'CT'] as const;

/**
 * Schema for creating a purchase order
 */
export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  deliveryLocation: z.enum(warehouses).default('JHB'),
  expectedDate: z.coerce.date().optional(),
  internalNotes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
  supplierNotes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
  sourceOrderId: z.string().optional(),
});

/**
 * Schema for updating a purchase order
 */
export const updatePurchaseOrderSchema = z.object({
  deliveryLocation: z.enum(warehouses).optional(),
  expectedDate: z.coerce.date().optional().nullable(),
  internalNotes: z.string().max(2000, 'Notes must be 2000 characters or less').optional().nullable(),
  supplierNotes: z.string().max(2000, 'Notes must be 2000 characters or less').optional().nullable(),
  version: z.number().int().positive().optional(),
});

/**
 * Schema for adding a line to a purchase order
 */
export const addPurchaseOrderLineSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantityOrdered: z.number().int().positive('Quantity must be a positive integer'),
  unitCost: z.number().positive('Unit cost must be positive'),
});

/**
 * Schema for updating a purchase order line
 */
export const updatePurchaseOrderLineSchema = z.object({
  quantityOrdered: z.number().int().positive('Quantity must be a positive integer').optional(),
  unitCost: z.number().positive('Unit cost must be positive').optional(),
});

/**
 * Schema for purchase order list query parameters
 */
export const purchaseOrderListQuerySchema = z.object({
  status: z.enum(purchaseOrderStatuses).optional(),
  supplierId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Schema for rejecting a purchase order
 */
export const rejectPurchaseOrderSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be 500 characters or less'),
});

/**
 * Schema for sending a purchase order to supplier
 */
export const sendPurchaseOrderSchema = z.object({
  emailTo: z.string().email('Invalid email address').optional(),
  emailCc: z.array(z.string().email('Invalid email address')).optional(),
  message: z.string().max(2000, 'Message must be 2000 characters or less').optional(),
});

// Type exports
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type AddPurchaseOrderLineInput = z.infer<typeof addPurchaseOrderLineSchema>;
export type UpdatePurchaseOrderLineInput = z.infer<typeof updatePurchaseOrderLineSchema>;
export type PurchaseOrderListQuery = z.infer<typeof purchaseOrderListQuerySchema>;
export type RejectPurchaseOrderInput = z.infer<typeof rejectPurchaseOrderSchema>;
export type SendPurchaseOrderInput = z.infer<typeof sendPurchaseOrderSchema>;
