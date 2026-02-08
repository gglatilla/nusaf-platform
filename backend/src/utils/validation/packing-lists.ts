import { z } from 'zod';

/**
 * Valid warehouses
 */
export const warehouses = ['JHB', 'CT'] as const;

/**
 * Valid packing list statuses
 */
export const packingListStatuses = ['DRAFT', 'FINALIZED', 'CANCELLED'] as const;

/**
 * Valid package types
 */
export const packageTypes = ['BOX', 'PALLET', 'CRATE', 'ENVELOPE', 'TUBE', 'OTHER'] as const;

/**
 * Schema for a packing list line when creating
 */
export const packingListLineInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productSku: z.string().min(1, 'Product SKU is required'),
  productDescription: z.string().min(1, 'Product description is required'),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  packageNumber: z.number().int().min(1, 'Package number must be at least 1'),
});

/**
 * Schema for a packing list package when creating
 */
export const packingListPackageInputSchema = z.object({
  packageNumber: z.number().int().min(1, 'Package number must be at least 1'),
  packageType: z.enum(packageTypes).default('BOX'),
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  grossWeight: z.number().min(0).optional(),
  netWeight: z.number().min(0).optional(),
  notes: z.string().max(500, 'Package notes must be 500 characters or less').optional(),
});

/**
 * Schema for creating a packing list from an order
 */
export const createPackingListSchema = z.object({
  deliveryNoteId: z.string().optional(),
  location: z.enum(warehouses).optional(),
  handlingInstructions: z.string().max(2000, 'Handling instructions must be 2000 characters or less').optional(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
  lines: z.array(packingListLineInputSchema).min(1, 'At least one line is required'),
  packages: z.array(packingListPackageInputSchema).min(1, 'At least one package is required'),
}).refine(
  (data) => {
    const packageNumbers = new Set(data.packages.map((p) => p.packageNumber));
    return data.lines.every((line) => packageNumbers.has(line.packageNumber));
  },
  { message: 'Every line must reference a valid package number', path: ['lines'] }
);

/**
 * Schema for packing list list query parameters
 */
export const packingListListQuerySchema = z.object({
  orderId: z.string().optional(),
  deliveryNoteId: z.string().optional(),
  status: z.enum(packingListStatuses).optional(),
  location: z.enum(warehouses).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type PackingListLineInput = z.infer<typeof packingListLineInputSchema>;
export type PackingListPackageInput = z.infer<typeof packingListPackageInputSchema>;
export type CreatePackingListInput = z.infer<typeof createPackingListSchema>;
export type PackingListListQuery = z.infer<typeof packingListListQuerySchema>;
