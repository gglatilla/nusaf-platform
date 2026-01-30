import { z } from 'zod';

/**
 * Valid job card statuses
 */
export const jobCardStatuses = ['PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETE'] as const;

/**
 * Valid job types
 */
export const jobTypes = ['MACHINING', 'ASSEMBLY'] as const;

/**
 * Schema for creating a job card
 */
export const createJobCardSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  orderLineId: z.string().min(1, 'Order line ID is required'),
  jobType: z.enum(jobTypes, { errorMap: () => ({ message: 'Invalid job type' }) }),
  notes: z.string().optional(),
});

/**
 * Schema for assigning a job card to a user
 */
export const assignJobCardSchema = z.object({
  assignedTo: z.string().min(1, 'User ID is required'),
  assignedToName: z.string().min(1, 'User name is required'),
});

/**
 * Schema for putting a job card on hold
 */
export const putOnHoldSchema = z.object({
  holdReason: z.string().min(1, 'Hold reason is required'),
});

/**
 * Schema for updating notes on a job card
 */
export const updateNotesSchema = z.object({
  notes: z.string(),
});

/**
 * Schema for job card list query parameters
 */
export const jobCardListQuerySchema = z.object({
  orderId: z.string().optional(),
  status: z.enum(jobCardStatuses).optional(),
  jobType: z.enum(jobTypes).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type CreateJobCardInput = z.infer<typeof createJobCardSchema>;
export type AssignJobCardInput = z.infer<typeof assignJobCardSchema>;
export type PutOnHoldInput = z.infer<typeof putOnHoldSchema>;
export type UpdateNotesInput = z.infer<typeof updateNotesSchema>;
export type JobCardListQuery = z.infer<typeof jobCardListQuerySchema>;
