import { z } from 'zod';

/**
 * Valid urgency levels
 */
export const urgencyLevels = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as const;

/**
 * Valid PR statuses
 */
export const purchaseRequisitionStatuses = ['PENDING', 'CONVERTED_TO_PO', 'REJECTED', 'CANCELLED'] as const;

/**
 * Valid warehouses
 */
const warehouses = ['JHB', 'CT'] as const;

/**
 * Schema for a purchase requisition line when creating
 */
export const purchaseRequisitionLineInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productSku: z.string().min(1, 'Product SKU is required'),
  productDescription: z.string().min(1, 'Product description is required'),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  estimatedUnitCost: z.number().min(0).optional(),
  deliveryLocation: z.enum(warehouses).default('JHB'),
  lineNotes: z.string().max(500, 'Line notes must be 500 characters or less').optional(),
});

/**
 * Schema for creating a purchase requisition
 */
export const createPurchaseRequisitionSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(2000, 'Reason must be 2000 characters or less'),
  urgency: z.enum(urgencyLevels).default('NORMAL'),
  department: z.string().max(100, 'Department must be 100 characters or less').optional(),
  requiredByDate: z.coerce.date().optional(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
  lines: z.array(purchaseRequisitionLineInputSchema).min(1, 'At least one line is required'),
});

/**
 * Schema for rejecting a purchase requisition
 */
export const rejectPurchaseRequisitionSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500, 'Rejection reason must be 500 characters or less'),
});

/**
 * Schema for purchase requisition list query parameters
 */
export const purchaseRequisitionListQuerySchema = z.object({
  status: z.enum(purchaseRequisitionStatuses).optional(),
  urgency: z.enum(urgencyLevels).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type PurchaseRequisitionLineInput = z.infer<typeof purchaseRequisitionLineInputSchema>;
export type CreatePurchaseRequisitionInput = z.infer<typeof createPurchaseRequisitionSchema>;
export type RejectPurchaseRequisitionInput = z.infer<typeof rejectPurchaseRequisitionSchema>;
export type PurchaseRequisitionListQuery = z.infer<typeof purchaseRequisitionListQuerySchema>;
