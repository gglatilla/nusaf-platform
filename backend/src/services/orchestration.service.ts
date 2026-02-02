/**
 * Fulfillment Orchestration Service
 *
 * Ties together:
 * - Allocation service (stock sources)
 * - BOM service (assembly components)
 * - Document creation services (picking slips, job cards, transfers, POs)
 *
 * Two-step approach:
 * 1. generateFulfillmentPlan() - Preview what will be created
 * 2. executeFulfillmentPlan() - Create all documents in a transaction
 */

import { Warehouse, FulfillmentPolicy, JobType, ProductType } from '@prisma/client';
// prisma import will be used when implementation is complete
// import { prisma } from '../config/database';

// ============================================
// COMMON TYPES
// ============================================

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// PLAN STRUCTURE
// ============================================

/**
 * Complete orchestration plan for an order
 */
export interface OrchestrationPlan {
  /** Order being fulfilled */
  orderId: string;
  orderNumber: string;
  customerWarehouse: Warehouse;

  /** Effective fulfillment policy (order override -> company policy -> default) */
  effectivePolicy: FulfillmentPolicy;

  /** Can the order be completely fulfilled based on current stock and policy? */
  canProceed: boolean;

  /** If canProceed is false, why? */
  blockedReason?: string;

  /** Lines that need picking from existing stock */
  pickingSlips: PickingSlipPlan[];

  /** Lines that need assembly/manufacturing (with BOM explosion) */
  jobCards: JobCardPlan[];

  /** Transfers needed (JHB -> CT for CT customers) */
  transfers: TransferPlan[];

  /** Purchase orders needed for backorders and component shortages */
  purchaseOrders: PurchaseOrderPlan[];

  /** Summary statistics */
  summary: OrchestrationSummary;

  /** Generated timestamp */
  generatedAt: Date;

  /** Warnings/notes for review */
  warnings: string[];
}

// ============================================
// PICKING SLIP PLAN
// ============================================

/**
 * Picking slip to be created (per warehouse)
 */
export interface PickingSlipPlan {
  warehouse: Warehouse;
  /** Lines to pick */
  lines: PickingSlipLinePlan[];
  /** Is this a transfer source (will be shipped to customer's warehouse)? */
  isTransferSource: boolean;
}

export interface PickingSlipLinePlan {
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityToPick: number;
}

// ============================================
// JOB CARD PLAN
// ============================================

/**
 * Job card to be created for assembly/manufacturing
 */
export interface JobCardPlan {
  orderLineId: string;
  productId: string;
  productSku: string;
  productDescription: string;
  productType: ProductType;
  quantity: number;
  jobType: JobType;

  /** Exploded BOM components needed */
  components: JobCardComponentPlan[];

  /** Component stock check result */
  componentAvailability: ComponentAvailabilityResult;
}

export interface JobCardComponentPlan {
  productId: string;
  productSku: string;
  productDescription: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortfall: number;
  /** Where this component should be sourced from */
  sourceWarehouse: Warehouse;
}

export interface ComponentAvailabilityResult {
  allComponentsAvailable: boolean;
  componentsWithShortfall: ComponentShortfall[];
}

export interface ComponentShortfall {
  productId: string;
  productSku: string;
  productDescription: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortfall: number;
  supplierId: string | null;
  supplierName: string | null;
}

// ============================================
// TRANSFER PLAN
// ============================================

/**
 * Transfer request to be created (JHB -> CT)
 */
export interface TransferPlan {
  fromWarehouse: Warehouse;
  toWarehouse: Warehouse;
  lines: TransferLinePlan[];
  /** Associated picking slip index (created in JHB) */
  linkedPickingSlipIndex: number;
}

export interface TransferLinePlan {
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
}

// ============================================
// PURCHASE ORDER PLAN
// ============================================

/**
 * Purchase order to be created (grouped by supplier)
 */
export interface PurchaseOrderPlan {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  currency: string;
  reason: PurchaseOrderReason;
  lines: PurchaseOrderLinePlan[];
}

export enum PurchaseOrderReason {
  FINISHED_GOODS_BACKORDER = 'FINISHED_GOODS_BACKORDER',
  COMPONENT_SHORTAGE = 'COMPONENT_SHORTAGE',
}

export interface PurchaseOrderLinePlan {
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
  /** Which order line or job card triggered this */
  sourceType: 'ORDER_LINE' | 'JOB_CARD_COMPONENT';
  sourceId: string;
  /** Estimated unit cost (from last purchase or cost price) */
  estimatedUnitCost: number;
}

// ============================================
// SUMMARY
// ============================================

/**
 * Summary statistics for the plan
 */
export interface OrchestrationSummary {
  totalOrderLines: number;

  /** Lines fulfillable from stock */
  linesFromStock: number;
  /** Lines requiring assembly/manufacturing */
  linesRequiringAssembly: number;
  /** Lines requiring transfer (JHB -> CT) */
  linesRequiringTransfer: number;
  /** Lines on backorder (no stock, no BOM) */
  linesBackordered: number;

  /** Total picking slips to create */
  pickingSlipsToCreate: number;
  /** Total job cards to create */
  jobCardsToCreate: number;
  /** Total transfer requests to create */
  transfersToCreate: number;
  /** Total purchase orders to create */
  purchaseOrdersToCreate: number;

  /** Can fulfill completely? */
  canFulfillCompletely: boolean;
  /** Percentage fulfillable immediately (0-100) */
  immediatelyFulfillablePercent: number;
}

// ============================================
// EXECUTION RESULT
// ============================================

export interface ExecutionResult {
  success: boolean;
  error?: string;

  /** Documents created */
  createdDocuments: {
    pickingSlips: Array<{ id: string; number: string; warehouse: Warehouse }>;
    jobCards: Array<{ id: string; number: string }>;
    transferRequests: Array<{ id: string; number: string }>;
    purchaseOrders: Array<{ id: string; number: string; supplierId: string }>;
  };

  /** Reservations made */
  reservationsCreated: number;

  /** Order status updated to */
  orderStatusUpdated: string;
}

// ============================================
// INPUT TYPES
// ============================================

export interface GeneratePlanOptions {
  orderId: string;
  /** Override effective fulfillment policy for this generation */
  policyOverride?: FulfillmentPolicy;
}

export interface ExecutePlanOptions {
  plan: OrchestrationPlan;
  userId: string;
  companyId: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if product requires assembly/manufacturing
 */
export function isAssemblyProduct(productType: ProductType): boolean {
  return productType === 'ASSEMBLY_REQUIRED' || productType === 'MADE_TO_ORDER';
}

/**
 * Initialize empty summary
 */
export function initializeSummary(totalOrderLines: number): OrchestrationSummary {
  return {
    totalOrderLines,
    linesFromStock: 0,
    linesRequiringAssembly: 0,
    linesRequiringTransfer: 0,
    linesBackordered: 0,
    pickingSlipsToCreate: 0,
    jobCardsToCreate: 0,
    transfersToCreate: 0,
    purchaseOrdersToCreate: 0,
    canFulfillCompletely: true,
    immediatelyFulfillablePercent: 0,
  };
}

/**
 * Initialize empty plan
 */
export function initializePlan(
  orderId: string,
  orderNumber: string,
  customerWarehouse: Warehouse,
  effectivePolicy: FulfillmentPolicy,
  totalOrderLines: number
): OrchestrationPlan {
  return {
    orderId,
    orderNumber,
    customerWarehouse,
    effectivePolicy,
    canProceed: true,
    pickingSlips: [],
    jobCards: [],
    transfers: [],
    purchaseOrders: [],
    summary: initializeSummary(totalOrderLines),
    generatedAt: new Date(),
    warnings: [],
  };
}

// ============================================
// MAIN SERVICE FUNCTIONS (TO BE IMPLEMENTED)
// ============================================

/**
 * Generate a fulfillment plan for an order
 * This is a preview - does not create any documents
 */
export async function generateFulfillmentPlan(
  _options: GeneratePlanOptions
): Promise<ServiceResult<OrchestrationPlan>> {
  // TODO: Implement in MT-3 through MT-6
  return { success: false, error: 'Not yet implemented' };
}

/**
 * Execute a fulfillment plan - creates all documents in a transaction
 */
export async function executeFulfillmentPlan(
  _options: ExecutePlanOptions
): Promise<ServiceResult<ExecutionResult>> {
  // TODO: Implement in MT-7 through MT-9
  return { success: false, error: 'Not yet implemented' };
}
