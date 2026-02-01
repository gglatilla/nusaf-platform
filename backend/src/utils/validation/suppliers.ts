import { z } from 'zod';

// ============================================
// SUPPLIER SCHEMAS
// ============================================

export const supplierListQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  currency: z.enum(['EUR', 'ZAR']).optional(),
  isLocal: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100)),
});

export type SupplierListQuery = z.infer<typeof supplierListQuerySchema>;

export const createSupplierSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(20, 'Code must be at most 20 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code must only contain letters, numbers, hyphens, and underscores'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  country: z.string().max(100).optional(),
  currency: z.enum(['EUR', 'ZAR']).optional(),
  skuHandling: z.enum(['DIRECT', 'TECOM_CONVERSION', 'NUSAF_INTERNAL']),
  isLocal: z.boolean().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  paymentTerms: z.string().max(100).optional(),
  minimumOrderValue: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const updateSupplierSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  country: z.string().max(100).optional(),
  currency: z.enum(['EUR', 'ZAR']).optional(),
  skuHandling: z.enum(['DIRECT', 'TECOM_CONVERSION', 'NUSAF_INTERNAL']).optional(),
  isLocal: z.boolean().optional(),
  isActive: z.boolean().optional(),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  addressLine1: z.string().max(200).optional().nullable(),
  addressLine2: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  paymentTerms: z.string().max(100).optional().nullable(),
  minimumOrderValue: z.number().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

// ============================================
// SUPPLIER CONTACT SCHEMAS
// ============================================

export const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email'),
  phone: z.string().max(50).optional(),
  role: z.string().max(100).optional(),
  isPrimary: z.boolean().optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;

export const updateContactSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().max(50).optional().nullable(),
  role: z.string().max(100).optional().nullable(),
  isPrimary: z.boolean().optional(),
});

export type UpdateContactInput = z.infer<typeof updateContactSchema>;
