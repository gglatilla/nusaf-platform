import { z } from 'zod';

/**
 * Valid warehouses for receiving goods
 */
export const warehouses = ['JHB', 'CT'] as const;

/**
 * Schema for a single GRV line when creating a goods receipt
 */
export const grvLineInputSchema = z.object({
  poLineId: z.string().min(1, 'PO line ID is required'),
  quantityReceived: z.number().int().min(0, 'Quantity received must be 0 or greater'),
  quantityRejected: z.number().int().min(0, 'Quantity rejected must be 0 or greater').default(0),
  rejectionReason: z.string().max(500, 'Rejection reason must be 500 characters or less').optional(),
}).refine(
  (data) => {
    // If there are rejected items, a reason is required
    if (data.quantityRejected > 0 && !data.rejectionReason) {
      return false;
    }
    return true;
  },
  { message: 'Rejection reason is required when items are rejected', path: ['rejectionReason'] }
).refine(
  (data) => {
    // At least one of quantityReceived or quantityRejected must be > 0
    return data.quantityReceived > 0 || data.quantityRejected > 0;
  },
  { message: 'At least one item must be received or rejected', path: ['quantityReceived'] }
);

/**
 * Schema for creating a goods received voucher
 */
export const createGrvSchema = z.object({
  purchaseOrderId: z.string().min(1, 'Purchase order ID is required'),
  location: z.enum(warehouses).optional(), // Defaults to PO's delivery location if not specified
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
  lines: z.array(grvLineInputSchema).min(1, 'At least one line is required'),
});

/**
 * Schema for GRV list query parameters
 */
export const grvListQuerySchema = z.object({
  purchaseOrderId: z.string().optional(),
  location: z.enum(warehouses).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(), // Search by GRV number
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type GrvLineInput = z.infer<typeof grvLineInputSchema>;
export type CreateGrvInput = z.infer<typeof createGrvSchema>;
export type GrvListQuery = z.infer<typeof grvListQuerySchema>;
