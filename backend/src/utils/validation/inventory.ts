import { z } from 'zod';

/**
 * Valid warehouses
 */
export const warehouses = ['JHB', 'CT'] as const;

/**
 * Valid stock movement types
 */
export const stockMovementTypes = [
  'RECEIPT',
  'ISSUE',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'MANUFACTURE_IN',
  'MANUFACTURE_OUT',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'SCRAP',
] as const;

/**
 * Valid stock adjustment reasons
 */
export const stockAdjustmentReasons = [
  'INITIAL_COUNT',
  'CYCLE_COUNT',
  'DAMAGED',
  'EXPIRED',
  'FOUND',
  'LOST',
  'DATA_CORRECTION',
  'OTHER',
] as const;

/**
 * Valid stock adjustment statuses
 */
export const stockAdjustmentStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;

/**
 * Schema for stock level list query parameters
 */
export const stockLevelListQuerySchema = z.object({
  location: z.enum(warehouses).optional(),
  categoryId: z.string().optional(),
  lowStockOnly: z.coerce.boolean().optional().default(false),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Schema for stock movement list query parameters
 */
export const stockMovementListQuerySchema = z.object({
  location: z.enum(warehouses).optional(),
  movementType: z.enum(stockMovementTypes).optional(),
  productId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Schema for a single adjustment line
 */
export const stockAdjustmentLineSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  adjustedQuantity: z.number().int().min(0, 'Quantity must be non-negative'),
  notes: z.string().max(500).optional(),
});

/**
 * Schema for creating a stock adjustment
 */
export const createStockAdjustmentSchema = z.object({
  location: z.enum(warehouses),
  reason: z.enum(stockAdjustmentReasons),
  notes: z.string().max(2000).optional(),
  lines: z.array(stockAdjustmentLineSchema).min(1, 'At least one adjustment line is required'),
});

/**
 * Schema for stock adjustment list query parameters
 */
export const stockAdjustmentListQuerySchema = z.object({
  location: z.enum(warehouses).optional(),
  status: z.enum(stockAdjustmentStatuses).optional(),
  reason: z.enum(stockAdjustmentReasons).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Schema for rejecting a stock adjustment
 */
export const rejectStockAdjustmentSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

/**
 * Valid reservation types
 */
export const reservationTypes = ['SOFT', 'HARD'] as const;

/**
 * Schema for reservation list query parameters
 */
export const reservationListQuerySchema = z.object({
  location: z.enum(warehouses).optional(),
  reservationType: z.enum(reservationTypes).optional(),
  referenceType: z.string().optional(),
  productId: z.string().optional(),
  includeExpired: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Schema for releasing a reservation
 */
export const releaseReservationSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

// Type exports
export type ReservationListQuery = z.infer<typeof reservationListQuerySchema>;
export type ReleaseReservationInput = z.infer<typeof releaseReservationSchema>;
export type StockLevelListQuery = z.infer<typeof stockLevelListQuerySchema>;
export type StockMovementListQuery = z.infer<typeof stockMovementListQuerySchema>;
export type CreateStockAdjustmentInput = z.infer<typeof createStockAdjustmentSchema>;
export type StockAdjustmentLineInput = z.infer<typeof stockAdjustmentLineSchema>;
export type StockAdjustmentListQuery = z.infer<typeof stockAdjustmentListQuerySchema>;
export type RejectStockAdjustmentInput = z.infer<typeof rejectStockAdjustmentSchema>;
