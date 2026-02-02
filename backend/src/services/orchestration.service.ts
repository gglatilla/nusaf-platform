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
import { prisma } from '../config/database';

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
// WORKING TYPES (internal use during plan generation)
// ============================================

interface PickingSlipLinesByWarehouse {
  warehouse: Warehouse;
  lines: PickingSlipLinePlan[];
  isTransferSource: boolean;
}

interface PurchaseOrderLinesBySupplier {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  currency: string;
  reason: PurchaseOrderReason;
  lines: PurchaseOrderLinePlan[];
}

// ============================================
// MAIN SERVICE FUNCTIONS
// ============================================

/**
 * Generate a fulfillment plan for an order
 * This is a preview - does not create any documents
 */
export async function generateFulfillmentPlan(
  options: GeneratePlanOptions
): Promise<ServiceResult<OrchestrationPlan>> {
  const { orderId, policyOverride } = options;

  try {
    // ============================================
    // STEP 1: Load Order with Lines and Company
    // ============================================
    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: {
        lines: { orderBy: { lineNumber: 'asc' } },
        company: {
          select: {
            id: true,
            fulfillmentPolicy: true,
            primaryWarehouse: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status !== 'CONFIRMED') {
      return { success: false, error: 'Order must be CONFIRMED to generate fulfillment plan' };
    }

    if (order.lines.length === 0) {
      return { success: false, error: 'Order has no lines' };
    }

    // ============================================
    // STEP 2: Determine Effective Fulfillment Policy
    // ============================================
    const effectivePolicy: FulfillmentPolicy =
      policyOverride ??
      order.fulfillmentPolicyOverride ??
      order.company.fulfillmentPolicy ??
      'SHIP_COMPLETE';

    const customerWarehouse = order.warehouse;

    // ============================================
    // STEP 3: Initialize Plan
    // ============================================
    const plan = initializePlan(
      order.id,
      order.orderNumber,
      customerWarehouse,
      effectivePolicy,
      order.lines.length
    );

    // Working maps for aggregation
    const pickingSlipsByWarehouse = new Map<Warehouse, PickingSlipLinesByWarehouse>();
    const purchaseOrdersBySupplier = new Map<string, PurchaseOrderLinesBySupplier>();
    const transferLines: TransferLinePlan[] = [];

    // ============================================
    // STEP 4: Process Each Order Line
    // ============================================
    for (const line of order.lines) {
      await processOrderLine(
        line,
        customerWarehouse,
        plan,
        pickingSlipsByWarehouse,
        purchaseOrdersBySupplier,
        transferLines
      );
    }

    // ============================================
    // STEP 5: Consolidate Plan
    // ============================================
    consolidatePlan(
      plan,
      pickingSlipsByWarehouse,
      purchaseOrdersBySupplier,
      transferLines,
      customerWarehouse
    );

    // ============================================
    // STEP 6: Apply Fulfillment Policy Check
    // ============================================
    applyFulfillmentPolicyCheck(plan, effectivePolicy);

    // ============================================
    // STEP 7: Calculate Final Summary
    // ============================================
    calculateFinalSummary(plan);

    return { success: true, data: plan };
  } catch (error) {
    console.error('Generate fulfillment plan error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate fulfillment plan',
    };
  }
}

// ============================================
// PLAN GENERATION HELPERS
// ============================================

/**
 * Process a single order line and add to working maps
 * Implemented in MT-4 (assembly) and MT-5 (stock)
 */
async function processOrderLine(
  line: {
    id: string;
    lineNumber: number;
    productId: string;
    productSku: string;
    productDescription: string;
    quantityOrdered: number;
  },
  customerWarehouse: Warehouse,
  plan: OrchestrationPlan,
  pickingSlipsByWarehouse: Map<Warehouse, PickingSlipLinesByWarehouse>,
  purchaseOrdersBySupplier: Map<string, PurchaseOrderLinesBySupplier>,
  transferLines: TransferLinePlan[]
): Promise<void> {
  // Get product details
  const product = await prisma.product.findUnique({
    where: { id: line.productId },
    select: {
      id: true,
      nusafSku: true,
      description: true,
      productType: true,
      supplierId: true,
      costPrice: true,
      supplier: {
        select: {
          id: true,
          code: true,
          name: true,
          currency: true,
        },
      },
    },
  });

  if (!product) {
    plan.warnings.push(`Product not found for line ${line.lineNumber}: ${line.productSku}`);
    return;
  }

  // Route to appropriate processor based on product type
  if (isAssemblyProduct(product.productType)) {
    await processAssemblyLine(
      line,
      product,
      plan,
      purchaseOrdersBySupplier
    );
  } else {
    await processStockLine(
      line,
      product,
      customerWarehouse,
      plan,
      pickingSlipsByWarehouse,
      purchaseOrdersBySupplier,
      transferLines
    );
  }
}

/**
 * Process an assembly product line (ASSEMBLY_REQUIRED, MADE_TO_ORDER)
 * Implemented in MT-4
 */
async function processAssemblyLine(
  _line: {
    id: string;
    lineNumber: number;
    productId: string;
    productSku: string;
    productDescription: string;
    quantityOrdered: number;
  },
  _product: {
    id: string;
    nusafSku: string;
    description: string;
    productType: ProductType;
    supplierId: string | null;
    costPrice: unknown;
    supplier: { id: string; code: string; name: string; currency: string } | null;
  },
  _plan: OrchestrationPlan,
  _purchaseOrdersBySupplier: Map<string, PurchaseOrderLinesBySupplier>
): Promise<void> {
  // TODO: Implement in MT-4
  // 1. Explode BOM using bom.service.explodeBom()
  // 2. Check component stock using bom.service.checkBomStock()
  // 3. Add to plan.jobCards
  // 4. If component shortages, add to purchaseOrdersBySupplier
}

/**
 * Process a stock product line (STOCK_ONLY, KIT)
 * Implemented in MT-5
 */
async function processStockLine(
  _line: {
    id: string;
    lineNumber: number;
    productId: string;
    productSku: string;
    productDescription: string;
    quantityOrdered: number;
  },
  _product: {
    id: string;
    nusafSku: string;
    description: string;
    productType: ProductType;
    supplierId: string | null;
    costPrice: unknown;
    supplier: { id: string; code: string; name: string; currency: string } | null;
  },
  _customerWarehouse: Warehouse,
  _plan: OrchestrationPlan,
  _pickingSlipsByWarehouse: Map<Warehouse, PickingSlipLinesByWarehouse>,
  _purchaseOrdersBySupplier: Map<string, PurchaseOrderLinesBySupplier>,
  _transferLines: TransferLinePlan[]
): Promise<void> {
  // TODO: Implement in MT-5
  // 1. Run allocation using allocation.service.checkProductAvailability()
  // 2. Add allocations to pickingSlipsByWarehouse
  // 3. If requires transfer, add to transferLines
  // 4. If backorder, add to purchaseOrdersBySupplier
}

/**
 * Consolidate working maps into final plan structure
 * Implemented in MT-6
 */
function consolidatePlan(
  plan: OrchestrationPlan,
  pickingSlipsByWarehouse: Map<Warehouse, PickingSlipLinesByWarehouse>,
  purchaseOrdersBySupplier: Map<string, PurchaseOrderLinesBySupplier>,
  transferLines: TransferLinePlan[],
  customerWarehouse: Warehouse
): void {
  // Convert picking slips map to array
  for (const [warehouse, data] of pickingSlipsByWarehouse) {
    if (data.lines.length > 0) {
      plan.pickingSlips.push({
        warehouse,
        lines: data.lines,
        isTransferSource: data.isTransferSource,
      });
    }
  }

  // Convert purchase orders map to array
  for (const [, data] of purchaseOrdersBySupplier) {
    if (data.lines.length > 0) {
      plan.purchaseOrders.push({
        supplierId: data.supplierId,
        supplierCode: data.supplierCode,
        supplierName: data.supplierName,
        currency: data.currency,
        reason: data.reason,
        lines: data.lines,
      });
    }
  }

  // Create transfer plans from transfer lines
  if (transferLines.length > 0 && customerWarehouse === 'CT') {
    // Find the JHB picking slip index
    const jhbPickingSlipIndex = plan.pickingSlips.findIndex(ps => ps.warehouse === 'JHB');

    plan.transfers.push({
      fromWarehouse: 'JHB',
      toWarehouse: 'CT',
      lines: transferLines,
      linkedPickingSlipIndex: jhbPickingSlipIndex >= 0 ? jhbPickingSlipIndex : 0,
    });
  }
}

/**
 * Apply fulfillment policy checks
 * Implemented in MT-6
 */
function applyFulfillmentPolicyCheck(
  plan: OrchestrationPlan,
  policy: FulfillmentPolicy
): void {
  const hasBackorders = plan.summary.linesBackordered > 0;
  const hasComponentShortages = plan.jobCards.some(
    jc => !jc.componentAvailability.allComponentsAvailable
  );

  switch (policy) {
    case 'SHIP_COMPLETE':
      if (hasBackorders || hasComponentShortages) {
        plan.canProceed = false;
        plan.blockedReason =
          'Cannot proceed with SHIP_COMPLETE policy: ' +
          (hasBackorders ? 'Some items are on backorder. ' : '') +
          (hasComponentShortages ? 'Some assembly components are short.' : '');
      }
      break;

    case 'SHIP_PARTIAL':
      plan.canProceed = true;
      if (hasBackorders || hasComponentShortages) {
        plan.warnings.push('Partial fulfillment: Some items will be backordered.');
      }
      break;

    case 'SALES_DECISION':
      plan.canProceed = false;
      plan.blockedReason = 'Fulfillment requires sales team decision.';
      break;
  }
}

/**
 * Calculate final summary statistics
 * Implemented in MT-6
 */
function calculateFinalSummary(plan: OrchestrationPlan): void {
  // Count documents to create
  plan.summary.pickingSlipsToCreate = plan.pickingSlips.length;
  plan.summary.jobCardsToCreate = plan.jobCards.length;
  plan.summary.transfersToCreate = plan.transfers.length;
  plan.summary.purchaseOrdersToCreate = plan.purchaseOrders.length;

  // Calculate fulfillment percentage
  const fulfillable = plan.summary.linesFromStock + plan.summary.linesRequiringAssembly;
  const total = plan.summary.totalOrderLines;

  plan.summary.immediatelyFulfillablePercent =
    total > 0 ? Math.round((fulfillable / total) * 100) : 0;

  plan.summary.canFulfillCompletely =
    plan.summary.linesBackordered === 0 &&
    plan.jobCards.every(jc => jc.componentAvailability.allComponentsAvailable);
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
