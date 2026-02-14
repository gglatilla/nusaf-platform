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
  nusafSku: z.string().min(1).max(100)
    .regex(/^[A-Za-z0-9\-_.\/]+$/, 'SKU can only contain letters, numbers, hyphens, dots, underscores, and forward slashes')
    .optional(),
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

// ============================================
// PRODUCT DOCUMENT SCHEMAS
// ============================================

export const productDocumentTypeEnum = z.enum([
  'DATASHEET',
  'CATALOG',
  'CAD_DRAWING',
  'INSTALLATION_MANUAL',
  'CERTIFICATE',
  'MSDS',
  'OTHER',
]);

export type ProductDocumentType = z.infer<typeof productDocumentTypeEnum>;

/**
 * Schema for creating a product document
 * File is uploaded separately via multipart form
 */
export const createProductDocumentSchema = z.object({
  type: productDocumentTypeEnum,
  name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters'),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateProductDocumentInput = z.infer<typeof createProductDocumentSchema>;

/**
 * Schema for updating a product document
 */
export const updateProductDocumentSchema = z.object({
  type: productDocumentTypeEnum.optional(),
  name: z.string().min(1).max(200).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateProductDocumentInput = z.infer<typeof updateProductDocumentSchema>;

// ============================================
// PRODUCT IMAGE SCHEMAS
// ============================================

/**
 * Schema for creating a product image
 * File is uploaded separately via multipart form
 */
export const createProductImageSchema = z.object({
  altText: z.string().max(200).optional().nullable(),
  caption: z.string().max(500).optional().nullable(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateProductImageInput = z.infer<typeof createProductImageSchema>;

/**
 * Schema for updating a product image
 */
export const updateProductImageSchema = z.object({
  altText: z.string().max(200).optional().nullable(),
  caption: z.string().max(500).optional().nullable(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type UpdateProductImageInput = z.infer<typeof updateProductImageSchema>;

// ============================================
// PRODUCT CROSS-REFERENCE SCHEMAS
// ============================================

/**
 * Schema for creating a product cross-reference
 */
export const createCrossReferenceSchema = z.object({
  competitorBrand: z
    .string()
    .min(1, 'Competitor brand is required')
    .max(100, 'Competitor brand must be at most 100 characters'),
  competitorSku: z
    .string()
    .min(1, 'Competitor SKU is required')
    .max(100, 'Competitor SKU must be at most 100 characters'),
  notes: z.string().max(500).optional().nullable(),
  isExact: z.boolean().optional(),
});

export type CreateCrossReferenceInput = z.infer<typeof createCrossReferenceSchema>;

/**
 * Schema for updating a product cross-reference
 */
export const updateCrossReferenceSchema = z.object({
  competitorBrand: z.string().min(1).max(100).optional(),
  competitorSku: z.string().min(1).max(100).optional(),
  notes: z.string().max(500).optional().nullable(),
  isExact: z.boolean().optional(),
});

export type UpdateCrossReferenceInput = z.infer<typeof updateCrossReferenceSchema>;

// ============================================
// PRODUCT MARKETING/PUBLISHING SCHEMAS
// ============================================

/**
 * Schema for updating product marketing content
 */
export const updateProductMarketingSchema = z.object({
  marketingTitle: z.string().max(200).optional().nullable(),
  marketingDescription: z.string().max(5000).optional().nullable(),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  specifications: z.record(z.string()).optional().nullable(),
  isPublished: z.boolean().optional(),
});

export type UpdateProductMarketingInput = z.infer<typeof updateProductMarketingSchema>;
