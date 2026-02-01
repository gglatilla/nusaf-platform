import { z } from 'zod';

// ============================================
// PRODUCT ENUMS
// ============================================

export const productTypeEnum = z.enum([
  'STOCK_ONLY',
  'ASSEMBLY_REQUIRED',
  'MADE_TO_ORDER',
  'KIT',
]);

export const unitOfMeasureEnum = z.enum(['EA', 'MTR', 'KG', 'SET', 'PR', 'ROL', 'BX']);

// ============================================
// PRODUCT SCHEMAS
// ============================================

/**
 * Schema for creating a product manually
 */
export const createProductSchema = z.object({
  // Required fields
  supplierSku: z
    .string()
    .min(1, 'Supplier SKU is required')
    .max(100, 'Supplier SKU must be at most 100 characters'),
  nusafSku: z
    .string()
    .min(1, 'Nusaf SKU is required')
    .max(100, 'Nusaf SKU must be at most 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be at most 500 characters'),
  supplierId: z.string().min(1, 'Supplier is required'),
  categoryId: z.string().min(1, 'Category is required'),

  // Optional fields
  subCategoryId: z.string().optional().nullable(),
  unitOfMeasure: unitOfMeasureEnum.optional(),

  // Pricing (independent, manually set)
  costPrice: z.number().min(0, 'Cost price must be positive').optional().nullable(),
  listPrice: z.number().min(0, 'List price must be positive').optional().nullable(),

  // Classification
  productType: productTypeEnum.optional(),
  assemblyLeadDays: z.number().int().min(0).optional().nullable(),
  isConfigurable: z.boolean().optional(),

  // Extended info
  longDescription: z.string().max(5000).optional().nullable(),
  weight: z.number().min(0).optional().nullable(),
  dimensionsJson: z
    .object({
      length: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      unit: z.enum(['mm', 'cm', 'm', 'in']).optional(),
    })
    .optional()
    .nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable().or(z.literal('')),

  // Inventory defaults
  defaultReorderPoint: z.number().int().min(0).optional().nullable(),
  defaultReorderQty: z.number().int().min(0).optional().nullable(),
  defaultMinStock: z.number().int().min(0).optional().nullable(),
  defaultMaxStock: z.number().int().min(0).optional().nullable(),
  leadTimeDays: z.number().int().min(0).optional().nullable(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

/**
 * Schema for updating a product
 * All fields are optional
 */
export const updateProductSchema = z.object({
  // Core fields
  supplierSku: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  supplierId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  subCategoryId: z.string().optional().nullable(),
  unitOfMeasure: unitOfMeasureEnum.optional(),
  isActive: z.boolean().optional(),

  // Pricing (independent, manually set)
  costPrice: z.number().min(0).optional().nullable(),
  listPrice: z.number().min(0).optional().nullable(),

  // Classification
  productType: productTypeEnum.optional(),
  assemblyLeadDays: z.number().int().min(0).optional().nullable(),
  isConfigurable: z.boolean().optional(),

  // Extended info
  longDescription: z.string().max(5000).optional().nullable(),
  weight: z.number().min(0).optional().nullable(),
  dimensionsJson: z
    .object({
      length: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      unit: z.enum(['mm', 'cm', 'm', 'in']).optional(),
    })
    .optional()
    .nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable().or(z.literal('')),

  // Inventory defaults
  defaultReorderPoint: z.number().int().min(0).optional().nullable(),
  defaultReorderQty: z.number().int().min(0).optional().nullable(),
  defaultMinStock: z.number().int().min(0).optional().nullable(),
  defaultMaxStock: z.number().int().min(0).optional().nullable(),
  leadTimeDays: z.number().int().min(0).optional().nullable(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
