import { z } from 'zod';

// Supplier codes available for price list import
export const IMPORT_SUPPLIER_CODES = ['TECOM', 'CHIARAVALLI', 'REGINA', 'NUSAF'] as const;

// Valid unit of measure codes
export const UNIT_OF_MEASURE_CODES = ['EA', 'M', 'KG', 'BOX', 'SET', 'PAIR', 'ROLL'] as const;

// Column mapping field names
export const COLUMN_FIELDS = ['CODE', 'DESCRIPTION', 'PRICE', 'UM', 'CATEGORY', 'SUBCATEGORY', 'WEIGHT'] as const;

export type ColumnField = (typeof COLUMN_FIELDS)[number];

/**
 * Schema for file upload request
 */
export const uploadFileSchema = z.object({
  supplierCode: z.enum(IMPORT_SUPPLIER_CODES, {
    errorMap: () => ({ message: 'Supplier must be one of: TECOM, CHIARAVALLI, REGINA, NUSAF' }),
  }),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;

/**
 * Schema for column mapping
 * Maps Excel column letters/names to our expected fields
 */
export const columnMappingSchema = z.object({
  CODE: z.string().min(1, 'CODE column mapping is required'),
  DESCRIPTION: z.string().min(1, 'DESCRIPTION column mapping is required'),
  PRICE: z.string().min(1, 'PRICE column mapping is required'),
  UM: z.string().optional(), // Optional - defaults to 'EA'
  CATEGORY: z.string().min(1, 'CATEGORY column mapping is required'),
  SUBCATEGORY: z.string().optional(), // Optional - some products may not have subcategory
  WEIGHT: z.string().optional(), // Optional - product weight in kg
});

export type ColumnMapping = z.infer<typeof columnMappingSchema>;

/**
 * Schema for validation request
 */
export const validateImportSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
  supplierCode: z.enum(IMPORT_SUPPLIER_CODES),
  columnMapping: columnMappingSchema,
});

export type ValidateImportInput = z.infer<typeof validateImportSchema>;

/**
 * Schema for execute import request
 */
export const executeImportSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
  supplierCode: z.enum(IMPORT_SUPPLIER_CODES),
  columnMapping: columnMappingSchema,
  skipErrors: z.boolean().default(false), // If true, skip rows with errors
});

export type ExecuteImportInput = z.infer<typeof executeImportSchema>;

/**
 * Validation result for a single row
 */
export interface RowValidationResult {
  rowNumber: number;
  isValid: boolean;
  errors: RowError[];
  warnings: RowWarning[];
  data: {
    supplierSku: string;
    nusafSku: string;
    description: string;
    price: number;
    unitOfMeasure: string;
    categoryCode: string;
    subcategoryCode?: string;
    weight?: number; // Product weight in kg
  } | null;
}

export interface RowError {
  field: string;
  message: string;
}

export interface RowWarning {
  field: string;
  message: string;
}

/**
 * Validation result for entire file
 */
export interface ImportValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  errors: FileError[];
  rows: RowValidationResult[];
  summary: {
    newProducts: number;
    existingProducts: number;
    categoryBreakdown: Record<string, number>;
  };
}

export interface FileError {
  message: string;
  code: string;
}

/**
 * Import batch status
 */
export const IMPORT_STATUS = ['PENDING', 'VALIDATING', 'VALIDATED', 'IMPORTING', 'COMPLETED', 'FAILED'] as const;

export type ImportStatus = (typeof IMPORT_STATUS)[number];

/**
 * Import batch record
 */
export interface ImportBatch {
  id: string;
  fileName: string;
  supplierCode: string;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  columnMapping: ColumnMapping | null;
  errors: FileError[];
  createdAt: Date;
  createdBy: string;
  completedAt?: Date;
}

/**
 * Import row record
 */
export interface ImportRow {
  id: string;
  batchId: string;
  rowNumber: number;
  supplierSku: string;
  nusafSku?: string;
  description?: string;
  price?: number;
  unitOfMeasure?: string;
  categoryCode?: string;
  subcategoryCode?: string;
  weight?: number; // Product weight in kg
  status: 'PENDING' | 'SUCCESS' | 'ERROR' | 'SKIPPED';
  errors: RowError[];
  warnings: RowWarning[];
  productId?: string; // Set after successful import
  createdAt: Date;
}
