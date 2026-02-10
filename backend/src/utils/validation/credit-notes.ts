import { z } from 'zod';

/**
 * Schema for voiding a credit note
 */
export const voidCreditNoteSchema = z.object({
  reason: z.string().min(1, 'Void reason is required').max(500, 'Reason must be 500 characters or less'),
});

// Type exports
export type VoidCreditNoteInput = z.infer<typeof voidCreditNoteSchema>;
