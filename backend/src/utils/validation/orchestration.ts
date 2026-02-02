import { z } from 'zod';

/**
 * Validation schemas for orchestration endpoints
 */

// Generate plan request (optional policy override)
export const generatePlanSchema = z.object({
  policyOverride: z.enum(['SHIP_PARTIAL', 'SHIP_COMPLETE', 'SALES_DECISION']).optional(),
});

export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;

// Update order fulfillment policy override
export const updatePolicySchema = z.object({
  fulfillmentPolicyOverride: z.enum(['SHIP_PARTIAL', 'SHIP_COMPLETE', 'SALES_DECISION']).nullable(),
});

export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;

// Execute plan request - we accept the full plan object
// The plan is validated by comparing against a freshly generated one
export const executePlanSchema = z.object({
  plan: z.object({
    orderId: z.string(),
    orderNumber: z.string(),
    customerWarehouse: z.enum(['JHB', 'CT']),
    effectivePolicy: z.enum(['SHIP_PARTIAL', 'SHIP_COMPLETE', 'SALES_DECISION']),
    canProceed: z.boolean(),
    blockedReason: z.string().optional(),
    generatedAt: z.string().transform((s) => new Date(s)),
    pickingSlips: z.array(z.any()),
    jobCards: z.array(z.any()),
    transfers: z.array(z.any()),
    purchaseOrders: z.array(z.any()),
    summary: z.any(),
    warnings: z.array(z.string()),
  }),
});

export type ExecutePlanInput = z.infer<typeof executePlanSchema>;
