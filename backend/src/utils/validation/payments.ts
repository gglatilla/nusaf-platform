import { z } from 'zod';

export const paymentMethods = ['EFT', 'CREDIT_CARD', 'CASH', 'CHEQUE', 'OTHER'] as const;

/**
 * Schema for recording a payment
 */
export const recordPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(paymentMethods, { required_error: 'Payment method is required' }),
  paymentReference: z.string().min(1, 'Payment reference is required').max(200),
  paymentDate: z.coerce.date(),
  notes: z.string().max(2000).optional(),
});

/**
 * Schema for voiding a payment
 */
export const voidPaymentSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

// Type exports
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type VoidPaymentInput = z.infer<typeof voidPaymentSchema>;
