import { z } from 'zod';

/**
 * Schema for creating a proforma invoice from an order
 */
export const createProformaInvoiceSchema = z.object({
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
  paymentTerms: z.string().max(500, 'Payment terms must be 500 characters or less').optional(),
});

/**
 * Schema for voiding a proforma invoice
 */
export const voidProformaInvoiceSchema = z.object({
  reason: z.string().min(1, 'Void reason is required').max(500, 'Reason must be 500 characters or less'),
});

// Type exports
export type CreateProformaInvoiceInput = z.infer<typeof createProformaInvoiceSchema>;
export type VoidProformaInvoiceInput = z.infer<typeof voidProformaInvoiceSchema>;
