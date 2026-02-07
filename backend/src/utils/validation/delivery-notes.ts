import { z } from 'zod';

/**
 * Valid warehouses
 */
export const warehouses = ['JHB', 'CT'] as const;

/**
 * Valid delivery note statuses
 */
export const deliveryNoteStatuses = ['DRAFT', 'DISPATCHED', 'DELIVERED', 'CANCELLED'] as const;

/**
 * Schema for a delivery note line when creating
 */
export const deliveryNoteLineInputSchema = z.object({
  orderLineId: z.string().min(1, 'Order line ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  productSku: z.string().min(1, 'Product SKU is required'),
  productDescription: z.string().min(1, 'Product description is required'),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
  quantityOrdered: z.number().int().min(1, 'Quantity ordered must be at least 1'),
  quantityDispatched: z.number().int().min(1, 'Quantity dispatched must be at least 1'),
});

/**
 * Schema for creating a delivery note from an order
 */
export const createDeliveryNoteSchema = z.object({
  location: z.enum(warehouses).optional(),
  deliveryAddress: z.string().max(2000, 'Delivery address must be 2000 characters or less').optional(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
  lines: z.array(deliveryNoteLineInputSchema).min(1, 'At least one line is required'),
});

/**
 * Schema for a confirm delivery line
 */
export const confirmDeliveryLineSchema = z.object({
  lineId: z.string().min(1, 'Line ID is required'),
  quantityReceived: z.number().int().min(0, 'Quantity received must be 0 or greater'),
  quantityDamaged: z.number().int().min(0, 'Quantity damaged must be 0 or greater').default(0),
  damageNotes: z.string().max(500, 'Damage notes must be 500 characters or less').optional(),
}).refine(
  (data) => {
    if (data.quantityDamaged > 0 && !data.damageNotes) {
      return false;
    }
    return true;
  },
  { message: 'Damage notes are required when items are damaged', path: ['damageNotes'] }
);

/**
 * Schema for confirming delivery receipt
 */
export const confirmDeliverySchema = z.object({
  deliveredByName: z.string().min(1, 'Receiver name is required').max(200),
  signatureNotes: z.string().max(2000, 'Signature notes must be 2000 characters or less').optional(),
  lines: z.array(confirmDeliveryLineSchema).min(1, 'At least one line is required'),
});

/**
 * Schema for delivery note list query parameters
 */
export const deliveryNoteListQuerySchema = z.object({
  orderId: z.string().optional(),
  status: z.enum(deliveryNoteStatuses).optional(),
  location: z.enum(warehouses).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type DeliveryNoteLineInput = z.infer<typeof deliveryNoteLineInputSchema>;
export type CreateDeliveryNoteInput = z.infer<typeof createDeliveryNoteSchema>;
export type ConfirmDeliveryLineInput = z.infer<typeof confirmDeliveryLineSchema>;
export type ConfirmDeliveryInput = z.infer<typeof confirmDeliverySchema>;
export type DeliveryNoteListQuery = z.infer<typeof deliveryNoteListQuerySchema>;
