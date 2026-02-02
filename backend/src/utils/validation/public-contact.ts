import { z } from 'zod';

export const createContactMessageSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  company: z.string().max(200, 'Company name too long').nullable().optional(),
  phone: z.string().max(50, 'Phone number too long').nullable().optional(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters'),
  // Honeypot field - must be empty
  website: z.string().max(0, 'This field must be empty').optional(),
});

export type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>;
