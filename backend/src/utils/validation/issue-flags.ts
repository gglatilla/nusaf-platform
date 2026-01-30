import { z } from 'zod';

/**
 * Valid issue flag categories
 */
export const issueFlagCategories = ['STOCK', 'QUALITY', 'PRODUCTION', 'TIMING', 'DOCUMENTATION'] as const;

/**
 * Valid issue flag severities
 */
export const issueFlagSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

/**
 * Valid issue flag statuses
 */
export const issueFlagStatuses = ['OPEN', 'IN_PROGRESS', 'PENDING_INFO', 'RESOLVED', 'CLOSED'] as const;

/**
 * Schema for creating an issue flag
 */
export const createIssueFlagSchema = z.object({
  pickingSlipId: z.string().min(1).optional(),
  jobCardId: z.string().min(1).optional(),
  category: z.enum(issueFlagCategories, { errorMap: () => ({ message: 'Invalid category' }) }),
  severity: z.enum(issueFlagSeverities, { errorMap: () => ({ message: 'Invalid severity' }) }),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be 2000 characters or less'),
}).refine(
  (data) => data.pickingSlipId || data.jobCardId,
  { message: 'Either pickingSlipId or jobCardId is required' }
).refine(
  (data) => !(data.pickingSlipId && data.jobCardId),
  { message: 'Only one of pickingSlipId or jobCardId can be specified' }
);

/**
 * Schema for updating issue status
 */
export const updateStatusSchema = z.object({
  status: z.enum(issueFlagStatuses, { errorMap: () => ({ message: 'Invalid status' }) }),
});

/**
 * Schema for adding a comment
 */
export const addCommentSchema = z.object({
  content: z.string().min(1, 'Comment is required').max(2000, 'Comment must be 2000 characters or less'),
});

/**
 * Schema for resolving an issue
 */
export const resolveIssueSchema = z.object({
  resolution: z.string().min(1, 'Resolution text is required').max(2000, 'Resolution must be 2000 characters or less'),
});

/**
 * Schema for issue flag list query parameters
 */
export const issueFlagListQuerySchema = z.object({
  pickingSlipId: z.string().optional(),
  jobCardId: z.string().optional(),
  status: z.enum(issueFlagStatuses).optional(),
  severity: z.enum(issueFlagSeverities).optional(),
  category: z.enum(issueFlagCategories).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type CreateIssueFlagInput = z.infer<typeof createIssueFlagSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
export type ResolveIssueInput = z.infer<typeof resolveIssueSchema>;
export type IssueFlagListQuery = z.infer<typeof issueFlagListQuerySchema>;
