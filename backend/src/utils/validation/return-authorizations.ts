import { z } from 'zod';

/**
 * Valid return authorization statuses
 */
export const returnAuthorizationStatuses = [
  'REQUESTED', 'APPROVED', 'REJECTED', 'ITEMS_RECEIVED', 'COMPLETED', 'CANCELLED',
] as const;

/**
 * Valid return reasons
 */
export const returnReasons = [
  'DEFECTIVE', 'DAMAGED_IN_TRANSIT', 'WRONG_ITEM', 'NOT_AS_DESCRIBED', 'NO_LONGER_NEEDED', 'OTHER',
] as const;

/**
 * Valid return resolutions
 */
export const returnResolutions = ['RESTOCK', 'SCRAP', 'REPLACE'] as const;

/**
 * Valid warehouses
 */
const warehouses = ['JHB', 'CT'] as const;

/**
 * Schema for a return authorization line when creating
 */
export const returnAuthorizationLineInputSchema = z.object({
  orderLineId: z.string().optional(),
  deliveryNoteLineId: z.string().optional(),
  productId: z.string().min(1, 'Product ID is required'),
  productSku: z.string().min(1, 'Product SKU is required'),
  productDescription: z.string().min(1, 'Product description is required'),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
  quantityReturned: z.number().int().min(1, 'Quantity to return must be at least 1'),
  returnReason: z.enum(returnReasons, { errorMap: () => ({ message: 'Invalid return reason' }) }),
  reasonNotes: z.string().max(500, 'Reason notes must be 500 characters or less').optional(),
}).refine(
  (data) => {
    if (data.returnReason === 'OTHER' && !data.reasonNotes) {
      return false;
    }
    return true;
  },
  { message: 'Reason notes are required when reason is "Other"', path: ['reasonNotes'] }
);

/**
 * Schema for creating a return authorization
 */
export const createReturnAuthorizationSchema = z.object({
  orderId: z.string().optional(),
  deliveryNoteId: z.string().optional(),
  orderNumber: z.string().optional(),
  deliveryNoteNumber: z.string().optional(),
  customerName: z.string().max(200).optional(),
  warehouse: z.enum(warehouses).optional(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
  lines: z.array(returnAuthorizationLineInputSchema).min(1, 'At least one line is required'),
}).refine(
  (data) => data.orderId || data.deliveryNoteId,
  { message: 'At least one of orderId or deliveryNoteId is required', path: ['orderId'] }
);

/**
 * Schema for rejecting a return authorization
 */
export const rejectReturnAuthorizationSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500, 'Rejection reason must be 500 characters or less'),
});

/**
 * Schema for a receive items line
 */
export const receiveItemsLineSchema = z.object({
  lineId: z.string().min(1, 'Line ID is required'),
  quantityReceived: z.number().int().min(0, 'Quantity received must be 0 or greater'),
});

/**
 * Schema for receiving returned items
 */
export const receiveItemsSchema = z.object({
  lines: z.array(receiveItemsLineSchema).min(1, 'At least one line is required'),
});

/**
 * Schema for a complete return line
 */
export const completeLineSchema = z.object({
  lineId: z.string().min(1, 'Line ID is required'),
  resolution: z.enum(returnResolutions, { errorMap: () => ({ message: 'Invalid resolution' }) }),
});

/**
 * Schema for completing a return authorization
 */
export const completeReturnAuthorizationSchema = z.object({
  lines: z.array(completeLineSchema).min(1, 'At least one line is required'),
});

/**
 * Schema for return authorization list query parameters
 */
export const returnAuthorizationListQuerySchema = z.object({
  orderId: z.string().optional(),
  deliveryNoteId: z.string().optional(),
  status: z.enum(returnAuthorizationStatuses).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type ReturnAuthorizationLineInput = z.infer<typeof returnAuthorizationLineInputSchema>;
export type CreateReturnAuthorizationInput = z.infer<typeof createReturnAuthorizationSchema>;
export type RejectReturnAuthorizationInput = z.infer<typeof rejectReturnAuthorizationSchema>;
export type ReceiveItemsLineInput = z.infer<typeof receiveItemsLineSchema>;
export type ReceiveItemsInput = z.infer<typeof receiveItemsSchema>;
export type CompleteLineInput = z.infer<typeof completeLineSchema>;
export type CompleteReturnAuthorizationInput = z.infer<typeof completeReturnAuthorizationSchema>;
export type ReturnAuthorizationListQuery = z.infer<typeof returnAuthorizationListQuerySchema>;
