import { z } from 'zod';

/**
 * Valid picking slip statuses
 */
export const pickingSlipStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETE'] as const;

/**
 * Valid warehouse locations
 */
export const warehouses = ['JHB', 'CT'] as const;

/**
 * Schema for generating picking slips from an order
 */
export const generatePickingSlipsSchema = z.object({
  lines: z
    .array(
      z.object({
        orderLineId: z.string().min(1, 'Order line ID is required'),
        lineNumber: z.number().int().min(1),
        productId: z.string().min(1, 'Product ID is required'),
        productSku: z.string().min(1, 'Product SKU is required'),
        productDescription: z.string().min(1, 'Product description is required'),
        quantityToPick: z.number().int().min(1, 'Quantity must be at least 1'),
        location: z.enum(warehouses),
      })
    )
    .min(1, 'At least one line is required'),
});

/**
 * Schema for assigning a picking slip to a user
 */
export const assignPickingSlipSchema = z.object({
  assignedTo: z.string().min(1, 'User ID is required'),
  assignedToName: z.string().min(1, 'User name is required'),
});

/**
 * Schema for updating line picked quantity
 */
export const updateLinePickedSchema = z.object({
  quantityPicked: z.number().int().min(0, 'Quantity must be at least 0'),
});

/**
 * Schema for picking slip list query parameters
 */
export const pickingSlipListQuerySchema = z.object({
  orderId: z.string().optional(),
  location: z.enum(warehouses).optional(),
  status: z.enum(pickingSlipStatuses).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type GeneratePickingSlipsInput = z.infer<typeof generatePickingSlipsSchema>;
export type AssignPickingSlipInput = z.infer<typeof assignPickingSlipSchema>;
export type UpdateLinePickedInput = z.infer<typeof updateLinePickedSchema>;
export type PickingSlipListQuery = z.infer<typeof pickingSlipListQuerySchema>;
