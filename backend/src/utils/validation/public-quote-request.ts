import { z } from 'zod';

export const createPublicQuoteRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(50, 'Phone number too long').nullable().optional(),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').nullable().optional(),
  cartData: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product ID is required'),
          nusafSku: z.string().min(1, 'SKU is required'),
          description: z.string(),
          quantity: z.number().int().positive('Quantity must be positive'),
        })
      )
      .min(1, 'At least one item is required'),
  }),
});

export type CreatePublicQuoteRequestInput = z.infer<typeof createPublicQuoteRequestSchema>;
