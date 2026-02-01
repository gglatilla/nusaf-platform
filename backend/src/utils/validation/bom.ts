import { z } from 'zod';

// ============================================
// BOM VALIDATION SCHEMAS
// ============================================

/**
 * Schema for adding a component to a product's BOM
 */
export const addBomComponentSchema = z.object({
  componentProductId: z.string().min(1, 'Component product ID is required'),
  quantity: z.number().positive('Quantity must be a positive number'),
  unitOverride: z.string().max(20, 'Unit override must be at most 20 characters').optional().nullable(),
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional().nullable(),
  sortOrder: z.number().int().min(0, 'Sort order must be non-negative').optional().default(0),
  isOptional: z.boolean().optional().default(false),
});

export type AddBomComponentInput = z.infer<typeof addBomComponentSchema>;

/**
 * Schema for updating a BOM component
 * All fields are optional
 */
export const updateBomComponentSchema = z.object({
  quantity: z.number().positive('Quantity must be a positive number').optional(),
  unitOverride: z.string().max(20, 'Unit override must be at most 20 characters').optional().nullable(),
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional().nullable(),
  sortOrder: z.number().int().min(0, 'Sort order must be non-negative').optional(),
  isOptional: z.boolean().optional(),
});

export type UpdateBomComponentInput = z.infer<typeof updateBomComponentSchema>;

/**
 * Schema for BOM stock check query parameters
 */
export const checkBomStockQuerySchema = z.object({
  quantity: z.coerce.number().positive('Quantity must be a positive number').default(1),
  warehouse: z.enum(['JHB', 'CT'], { required_error: 'Warehouse is required' }),
});

export type CheckBomStockQuery = z.infer<typeof checkBomStockQuerySchema>;

/**
 * Schema for explode BOM query parameters
 */
export const explodeBomQuerySchema = z.object({
  quantity: z.coerce.number().positive('Quantity must be a positive number').default(1),
  maxDepth: z.coerce.number().int().min(1).max(10).optional(),
  includeOptional: z.coerce.boolean().optional().default(true),
});

export type ExplodeBomQuery = z.infer<typeof explodeBomQuerySchema>;
