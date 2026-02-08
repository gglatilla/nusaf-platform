import { z } from 'zod';

/**
 * Schema for creating a tax invoice from a delivered order
 */
export const createTaxInvoiceSchema = z.object({
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
});

/**
 * Schema for voiding a tax invoice
 */
export const voidTaxInvoiceSchema = z.object({
  reason: z.string().min(1, 'Void reason is required').max(500, 'Reason must be 500 characters or less'),
});

// Type exports
export type CreateTaxInvoiceInput = z.infer<typeof createTaxInvoiceSchema>;
export type VoidTaxInvoiceInput = z.infer<typeof voidTaxInvoiceSchema>;
