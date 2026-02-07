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

import { Warehouse, FulfillmentPolicy, JobType, ProductType, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { checkBomStock } from './bom.service';
import { checkProductAvailability } from './allocation.service';
import { getStockLevel } from './inventory.service';

// Transaction client type for passing into helper functions
type TransactionClient = Prisma.TransactionClient;

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
      customerWarehouse,
      plan,
      purchaseOrdersBySupplier,
      transferLines
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
  line: {
    id: string;
    lineNumber: number;
    productId: string;
    productSku: string;
    productDescription: string;
    quantityOrdered: number;
  },
  product: {
    id: string;
    nusafSku: string;
    description: string;
    productType: ProductType;
    supplierId: string | null;
    costPrice: unknown;
    supplier: { id: string; code: string; name: string; currency: string } | null;
  },
  customerWarehouse: Warehouse,
  plan: OrchestrationPlan,
  purchaseOrdersBySupplier: Map<string, PurchaseOrderLinesBySupplier>,
  transferLines: TransferLinePlan[]
): Promise<void> {
  // Assembly always happens in JHB
  const assemblyWarehouse: Warehouse = 'JHB';

  // Check component stock (this internally explodes the BOM)
  const stockCheck = await checkBomStock(product.id, line.quantityOrdered, assemblyWarehouse);

  if (!stockCheck.success || !stockCheck.data) {
    plan.warnings.push(`Failed to check BOM stock for ${product.nusafSku}: ${stockCheck.error}`);
    return;
  }

  const bomResult = stockCheck.data;

  // Determine job type based on product type
  const jobType: JobType =
    product.productType === 'ASSEMBLY_REQUIRED' ? 'ASSEMBLY' : 'MACHINING';

  // Build component plans from stock check result
  const componentPlans: JobCardComponentPlan[] = bomResult.components.map(comp => ({
    productId: comp.productId,
    productSku: comp.nusafSku,
    productDescription: comp.description,
    requiredQuantity: comp.requiredQuantity,
    availableQuantity: comp.availableQuantity,
    shortfall: comp.shortfall,
    sourceWarehouse: assemblyWarehouse,
  }));

  // Build component shortfall list for PO generation
  const shortfallComponents: ComponentShortfall[] = bomResult.components
    .filter(comp => comp.shortfall > 0)
    .map(comp => ({
      productId: comp.productId,
      productSku: comp.nusafSku,
      productDescription: comp.description,
      requiredQuantity: comp.requiredQuantity,
      availableQuantity: comp.availableQuantity,
      shortfall: comp.shortfall,
      supplierId: null, // Will be looked up below
      supplierName: null,
    }));

  // Create job card plan
  const jobCardPlan: JobCardPlan = {
    orderLineId: line.id,
    productId: product.id,
    productSku: product.nusafSku,
    productDescription: product.description,
    productType: product.productType,
    quantity: line.quantityOrdered,
    jobType,
    components: componentPlans,
    componentAvailability: {
      allComponentsAvailable: bomResult.canFulfill,
      componentsWithShortfall: shortfallComponents,
    },
  };

  plan.jobCards.push(jobCardPlan);
  plan.summary.linesRequiringAssembly++;

  // If customer is CT, finished assembled goods need transfer from JHB → CT
  if (customerWarehouse === 'CT') {
    transferLines.push({
      orderLineId: line.id,
      lineNumber: line.lineNumber,
      productId: product.id,
      productSku: product.nusafSku,
      productDescription: product.description,
      quantity: line.quantityOrdered,
    });
    plan.summary.linesRequiringTransfer++;
  }

  // If components have shortfall, add to purchase orders
  if (!bomResult.canFulfill) {
    for (const comp of bomResult.components.filter(c => c.shortfall > 0)) {
      await addComponentToPurchaseOrders(
        comp.productId,
        comp.shortfall,
        line.id,
        purchaseOrdersBySupplier
      );
    }
  }
}

/**
 * Add a component shortage to purchase orders (grouped by supplier)
 */
async function addComponentToPurchaseOrders(
  productId: string,
  quantity: number,
  sourceOrderLineId: string,
  purchaseOrdersBySupplier: Map<string, PurchaseOrderLinesBySupplier>
): Promise<void> {
  // Get product with supplier info
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      nusafSku: true,
      description: true,
      costPrice: true,
      supplierId: true,
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

  if (!product || !product.supplier) {
    // Cannot create PO without supplier
    return;
  }

  const supplierId = product.supplier.id;

  // Get or create supplier entry in map
  let supplierPO = purchaseOrdersBySupplier.get(supplierId);
  if (!supplierPO) {
    supplierPO = {
      supplierId: product.supplier.id,
      supplierCode: product.supplier.code,
      supplierName: product.supplier.name,
      currency: product.supplier.currency,
      reason: PurchaseOrderReason.COMPONENT_SHORTAGE,
      lines: [],
    };
    purchaseOrdersBySupplier.set(supplierId, supplierPO);
  }

  // Check if product already has a line (might happen with multiple job cards)
  const existingLine = supplierPO.lines.find(l => l.productId === productId);
  if (existingLine) {
    existingLine.quantity += quantity;
  } else {
    supplierPO.lines.push({
      productId: product.id,
      productSku: product.nusafSku,
      productDescription: product.description,
      quantity,
      sourceType: 'JOB_CARD_COMPONENT',
      sourceId: sourceOrderLineId,
      estimatedUnitCost: Number(product.costPrice) || 0,
    });
  }
}

/**
 * Process a stock product line (STOCK_ONLY, KIT)
 * Implemented in MT-5
 */
async function processStockLine(
  line: {
    id: string;
    lineNumber: number;
    productId: string;
    productSku: string;
    productDescription: string;
    quantityOrdered: number;
  },
  product: {
    id: string;
    nusafSku: string;
    description: string;
    productType: ProductType;
    supplierId: string | null;
    costPrice: unknown;
    supplier: { id: string; code: string; name: string; currency: string } | null;
  },
  customerWarehouse: Warehouse,
  plan: OrchestrationPlan,
  pickingSlipsByWarehouse: Map<Warehouse, PickingSlipLinesByWarehouse>,
  purchaseOrdersBySupplier: Map<string, PurchaseOrderLinesBySupplier>,
  transferLines: TransferLinePlan[]
): Promise<void> {
  // Run allocation
  const allocationResult = await checkProductAvailability(
    product.id,
    line.quantityOrdered,
    customerWarehouse
  );

  // Check for error
  if ('error' in allocationResult) {
    plan.warnings.push(`Allocation failed for ${product.nusafSku}: ${allocationResult.error}`);
    return;
  }

  // Process allocations (stock available)
  for (const allocation of allocationResult.allocations) {
    // Create picking slip line
    const pickingLine: PickingSlipLinePlan = {
      orderLineId: line.id,
      lineNumber: line.lineNumber,
      productId: allocation.productId,
      productSku: allocation.productSku,
      productDescription: allocation.productDescription,
      quantityToPick: allocation.quantityAllocated,
    };

    // Get or create warehouse entry
    let warehouseData = pickingSlipsByWarehouse.get(allocation.warehouse);
    if (!warehouseData) {
      warehouseData = {
        warehouse: allocation.warehouse,
        lines: [],
        isTransferSource: false,
      };
      pickingSlipsByWarehouse.set(allocation.warehouse, warehouseData);
    }

    // Add line to warehouse picking slip
    warehouseData.lines.push(pickingLine);

    // If requires transfer (JHB -> CT for CT customer)
    if (allocation.requiresTransfer) {
      warehouseData.isTransferSource = true;

      transferLines.push({
        orderLineId: line.id,
        lineNumber: line.lineNumber,
        productId: allocation.productId,
        productSku: allocation.productSku,
        productDescription: allocation.productDescription,
        quantity: allocation.quantityAllocated,
      });

      plan.summary.linesRequiringTransfer++;
    }

    plan.summary.linesFromStock++;
  }

  // Process backorders (not in stock)
  for (const backorder of allocationResult.backorders) {
    await addBackorderToPurchaseOrders(
      backorder.productId,
      backorder.quantityBackorder,
      line.id,
      product,
      purchaseOrdersBySupplier
    );

    plan.summary.linesBackordered++;
  }
}

/**
 * Add a backorder item to purchase orders (grouped by supplier)
 */
async function addBackorderToPurchaseOrders(
  productId: string,
  quantity: number,
  sourceOrderLineId: string,
  product: {
    id: string;
    nusafSku: string;
    description: string;
    costPrice: unknown;
    supplierId: string | null;
    supplier: { id: string; code: string; name: string; currency: string } | null;
  },
  purchaseOrdersBySupplier: Map<string, PurchaseOrderLinesBySupplier>
): Promise<void> {
  if (!product.supplier) {
    // Cannot create PO without supplier - this is a warning case
    // The orchestration will proceed but item won't have a PO
    return;
  }

  const supplierId = product.supplier.id;

  // Get or create supplier entry in map
  let supplierPO = purchaseOrdersBySupplier.get(supplierId);
  if (!supplierPO) {
    supplierPO = {
      supplierId: product.supplier.id,
      supplierCode: product.supplier.code,
      supplierName: product.supplier.name,
      currency: product.supplier.currency,
      reason: PurchaseOrderReason.FINISHED_GOODS_BACKORDER,
      lines: [],
    };
    purchaseOrdersBySupplier.set(supplierId, supplierPO);
  }

  // Check if product already has a line (shouldn't happen for finished goods, but be safe)
  const existingLine = supplierPO.lines.find(l => l.productId === productId);
  if (existingLine) {
    existingLine.quantity += quantity;
  } else {
    supplierPO.lines.push({
      productId: product.id,
      productSku: product.nusafSku,
      productDescription: product.description,
      quantity,
      sourceType: 'ORDER_LINE',
      sourceId: sourceOrderLineId,
      estimatedUnitCost: Number(product.costPrice) || 0,
    });
  }
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
  options: ExecutePlanOptions
): Promise<ServiceResult<ExecutionResult>> {
  const { plan, userId, companyId } = options;

  try {
    // ============================================
    // STEP 1: Validate Plan
    // ============================================

    // Verify order exists and belongs to company
    const order = await prisma.salesOrder.findUnique({
      where: { id: plan.orderId },
      select: {
        id: true,
        status: true,
        companyId: true,
        updatedAt: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.companyId !== companyId) {
      return { success: false, error: 'Order does not belong to this company' };
    }

    if (order.status !== 'CONFIRMED') {
      return { success: false, error: `Order must be CONFIRMED to execute fulfillment. Current status: ${order.status}` };
    }

    if (!plan.canProceed) {
      return { success: false, error: plan.blockedReason || 'Plan cannot proceed' };
    }

    // Check for stale plan (order modified after plan generation)
    if (order.updatedAt > plan.generatedAt) {
      return {
        success: false,
        error: 'Plan is stale - order was modified after plan generation. Please regenerate the plan.',
      };
    }

    // P1-4 FIX: Verify stock levels haven't changed since plan generation
    // This catches cases where inventory changed but the order wasn't modified
    const stockIssues: string[] = [];
    for (const psPlan of plan.pickingSlips) {
      for (const line of psPlan.lines) {
        const currentStock = await getStockLevel(line.productId, psPlan.warehouse);
        // Available = onHand - hardReserved (softReserved is for quotes, not confirmed orders)
        const availableQty = currentStock
          ? currentStock.onHand - currentStock.hardReserved
          : 0;

        if (availableQty < line.quantityToPick) {
          stockIssues.push(
            `${line.productSku} at ${psPlan.warehouse}: need ${line.quantityToPick}, only ${availableQty} available`
          );
        }
      }
    }

    if (stockIssues.length > 0) {
      return {
        success: false,
        error: `Stock levels have changed since plan generation. Please regenerate the plan.\nIssues:\n- ${stockIssues.join('\n- ')}`,
      };
    }

    // ============================================
    // STEP 2: Initialize Result
    // ============================================
    const result: ExecutionResult = {
      success: true,
      createdDocuments: {
        pickingSlips: [],
        jobCards: [],
        transferRequests: [],
        purchaseOrders: [],
      },
      reservationsCreated: 0,
      orderStatusUpdated: 'PROCESSING',
    };

    // ============================================
    // STEP 3: Execute in Transaction
    // ============================================
    await prisma.$transaction(async (tx) => {
      // Create picking slips (MT-8)
      for (const psPlan of plan.pickingSlips) {
        const psResult = await createPickingSlipFromPlan(
          tx,
          plan.orderId,
          plan.orderNumber,
          psPlan,
          userId,
          companyId
        );

        if (psResult) {
          result.createdDocuments.pickingSlips.push(psResult);

          // Create hard reservations for picked items
          for (const line of psPlan.lines) {
            await createReservationFromPlan(
              tx,
              line.productId,
              psPlan.warehouse,
              line.quantityToPick,
              'PickingSlip',
              psResult.id,
              psResult.number,
              userId
            );
            result.reservationsCreated++;
          }
        }
      }

      // Create job cards (MT-8)
      for (const jcPlan of plan.jobCards) {
        const jcResult = await createJobCardFromPlan(
          tx,
          plan.orderId,
          plan.orderNumber,
          jcPlan,
          userId,
          companyId
        );

        if (jcResult) {
          result.createdDocuments.jobCards.push(jcResult);

          // Create component reservations (only for available components)
          for (const component of jcPlan.components) {
            if (component.shortfall === 0) {
              await createReservationFromPlan(
                tx,
                component.productId,
                component.sourceWarehouse,
                component.requiredQuantity,
                'JobCard',
                jcResult.id,
                jcResult.number,
                userId
              );
              result.reservationsCreated++;
            }
          }
        }
      }

      // Create transfer requests (MT-8)
      for (const trPlan of plan.transfers) {
        const trResult = await createTransferFromPlan(
          tx,
          plan.orderId,
          plan.orderNumber,
          trPlan,
          userId,
          companyId
        );

        if (trResult) {
          result.createdDocuments.transferRequests.push(trResult);
        }
      }

      // Create draft purchase orders (MT-9)
      for (const poPlan of plan.purchaseOrders) {
        const poResult = await createPurchaseOrderFromPlan(
          tx,
          plan.orderId,
          plan.orderNumber,
          poPlan,
          userId
        );

        if (poResult) {
          result.createdDocuments.purchaseOrders.push(poResult);
        }
      }

      // Update order status to PROCESSING
      await tx.salesOrder.update({
        where: { id: plan.orderId },
        data: {
          status: 'PROCESSING',
          updatedBy: userId,
        },
      });
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Execute fulfillment plan error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute fulfillment plan',
    };
  }
}

// ============================================
// EXECUTION HELPERS (TO BE IMPLEMENTED IN MT-8, MT-9)
// ============================================

/**
 * Generate picking slip number within transaction
 */
async function generatePickingSlipNumberTx(tx: TransactionClient): Promise<string> {
  const currentYear = new Date().getFullYear();

  let counter = await tx.pickingSlipCounter.findUnique({
    where: { id: 'picking_slip_counter' },
  });

  if (!counter) {
    counter = await tx.pickingSlipCounter.create({
      data: { id: 'picking_slip_counter', year: currentYear, count: 1 },
    });
  } else if (counter.year !== currentYear) {
    counter = await tx.pickingSlipCounter.update({
      where: { id: 'picking_slip_counter' },
      data: { year: currentYear, count: 1 },
    });
  } else {
    counter = await tx.pickingSlipCounter.update({
      where: { id: 'picking_slip_counter' },
      data: { count: { increment: 1 } },
    });
  }

  return `PS-${counter.year}-${String(counter.count).padStart(5, '0')}`;
}

/**
 * Generate job card number within transaction
 */
async function generateJobCardNumberTx(tx: TransactionClient): Promise<string> {
  const currentYear = new Date().getFullYear();

  let counter = await tx.jobCardCounter.findUnique({
    where: { id: 'job_card_counter' },
  });

  if (!counter) {
    counter = await tx.jobCardCounter.create({
      data: { id: 'job_card_counter', year: currentYear, count: 1 },
    });
  } else if (counter.year !== currentYear) {
    counter = await tx.jobCardCounter.update({
      where: { id: 'job_card_counter' },
      data: { year: currentYear, count: 1 },
    });
  } else {
    counter = await tx.jobCardCounter.update({
      where: { id: 'job_card_counter' },
      data: { count: { increment: 1 } },
    });
  }

  return `JC-${counter.year}-${String(counter.count).padStart(5, '0')}`;
}

/**
 * Generate transfer request number within transaction
 */
async function generateTransferNumberTx(tx: TransactionClient): Promise<string> {
  const currentYear = new Date().getFullYear();

  let counter = await tx.transferRequestCounter.findUnique({
    where: { id: 'transfer_request_counter' },
  });

  if (!counter) {
    counter = await tx.transferRequestCounter.create({
      data: { id: 'transfer_request_counter', year: currentYear, count: 1 },
    });
  } else if (counter.year !== currentYear) {
    counter = await tx.transferRequestCounter.update({
      where: { id: 'transfer_request_counter' },
      data: { year: currentYear, count: 1 },
    });
  } else {
    counter = await tx.transferRequestCounter.update({
      where: { id: 'transfer_request_counter' },
      data: { count: { increment: 1 } },
    });
  }

  return `TR-${counter.year}-${String(counter.count).padStart(5, '0')}`;
}

/**
 * Generate purchase order number within transaction
 */
async function generatePurchaseOrderNumberTx(tx: TransactionClient): Promise<string> {
  const currentYear = new Date().getFullYear();

  let counter = await tx.purchaseOrderCounter.findUnique({
    where: { id: 'purchase_order_counter' },
  });

  if (!counter) {
    counter = await tx.purchaseOrderCounter.create({
      data: { id: 'purchase_order_counter', year: currentYear, count: 1 },
    });
  } else if (counter.year !== currentYear) {
    counter = await tx.purchaseOrderCounter.update({
      where: { id: 'purchase_order_counter' },
      data: { year: currentYear, count: 1 },
    });
  } else {
    counter = await tx.purchaseOrderCounter.update({
      where: { id: 'purchase_order_counter' },
      data: { count: { increment: 1 } },
    });
  }

  return `PO-${counter.year}-${String(counter.count).padStart(5, '0')}`;
}

/**
 * Create a picking slip from plan
 */
async function createPickingSlipFromPlan(
  tx: TransactionClient,
  orderId: string,
  orderNumber: string,
  plan: PickingSlipPlan,
  userId: string,
  companyId: string
): Promise<{ id: string; number: string; warehouse: Warehouse } | null> {
  if (plan.lines.length === 0) return null;

  const pickingSlipNumber = await generatePickingSlipNumberTx(tx);

  const pickingSlip = await tx.pickingSlip.create({
    data: {
      pickingSlipNumber,
      companyId,
      orderId,
      orderNumber,
      location: plan.warehouse,
      status: 'PENDING',
      createdBy: userId,
    },
  });

  // Create picking slip lines
  await tx.pickingSlipLine.createMany({
    data: plan.lines.map((line) => ({
      pickingSlipId: pickingSlip.id,
      orderLineId: line.orderLineId,
      lineNumber: line.lineNumber,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      quantityToPick: line.quantityToPick,
    })),
  });

  return {
    id: pickingSlip.id,
    number: pickingSlipNumber,
    warehouse: plan.warehouse,
  };
}

/**
 * Create a job card from plan
 */
async function createJobCardFromPlan(
  tx: TransactionClient,
  orderId: string,
  orderNumber: string,
  plan: JobCardPlan,
  userId: string,
  companyId: string
): Promise<{ id: string; number: string } | null> {
  const jobCardNumber = await generateJobCardNumberTx(tx);

  const jobCard = await tx.jobCard.create({
    data: {
      jobCardNumber,
      companyId,
      orderId,
      orderNumber,
      orderLineId: plan.orderLineId,
      productId: plan.productId,
      productSku: plan.productSku,
      productDescription: plan.productDescription,
      quantity: plan.quantity,
      jobType: plan.jobType,
      status: 'PENDING',
      notes: `Auto-generated by orchestration engine for ${plan.quantity}x ${plan.productSku}`,
      createdBy: userId,
    },
  });

  return {
    id: jobCard.id,
    number: jobCardNumber,
  };
}

/**
 * Create a transfer request from plan
 */
async function createTransferFromPlan(
  tx: TransactionClient,
  orderId: string,
  orderNumber: string,
  plan: TransferPlan,
  userId: string,
  companyId: string
): Promise<{ id: string; number: string } | null> {
  if (plan.lines.length === 0) return null;

  const transferNumber = await generateTransferNumberTx(tx);

  const transfer = await tx.transferRequest.create({
    data: {
      transferNumber,
      companyId,
      orderId,
      orderNumber,
      fromLocation: plan.fromWarehouse,
      toLocation: plan.toWarehouse,
      status: 'PENDING',
      createdBy: userId,
    },
  });

  // Create transfer request lines
  await tx.transferRequestLine.createMany({
    data: plan.lines.map((line, index) => ({
      transferRequestId: transfer.id,
      orderLineId: line.orderLineId,
      lineNumber: index + 1,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      quantity: line.quantity,
    })),
  });

  return {
    id: transfer.id,
    number: transferNumber,
  };
}

/**
 * Create a draft purchase order from plan
 */
async function createPurchaseOrderFromPlan(
  tx: TransactionClient,
  orderId: string,
  orderNumber: string,
  plan: PurchaseOrderPlan,
  userId: string
): Promise<{ id: string; number: string; supplierId: string } | null> {
  if (plan.lines.length === 0) return null;

  const poNumber = await generatePurchaseOrderNumberTx(tx);

  // Calculate totals
  let subtotal = 0;
  for (const line of plan.lines) {
    subtotal += line.quantity * line.estimatedUnitCost;
  }

  const purchaseOrder = await tx.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: plan.supplierId,
      status: 'DRAFT',
      deliveryLocation: 'JHB', // Default to JHB for receiving
      currency: plan.currency as 'EUR' | 'ZAR',
      subtotal,
      total: subtotal,
      sourceOrderId: orderId,
      internalNotes: `Auto-generated for order ${orderNumber}. Reason: ${plan.reason}`,
      createdBy: userId,
    },
  });

  // Create purchase order lines
  await tx.purchaseOrderLine.createMany({
    data: plan.lines.map((line, index) => ({
      purchaseOrderId: purchaseOrder.id,
      lineNumber: index + 1,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      quantityOrdered: line.quantity,
      unitCost: line.estimatedUnitCost,
      lineTotal: line.quantity * line.estimatedUnitCost,
    })),
  });

  return {
    id: purchaseOrder.id,
    number: poNumber,
    supplierId: plan.supplierId,
  };
}

/**
 * Create a hard reservation
 */
async function createReservationFromPlan(
  tx: TransactionClient,
  productId: string,
  location: Warehouse,
  quantity: number,
  referenceType: string,
  referenceId: string,
  referenceNumber: string,
  userId: string
): Promise<void> {
  // Create reservation record
  await tx.stockReservation.create({
    data: {
      productId,
      location,
      reservationType: 'HARD',
      quantity,
      referenceType,
      referenceId,
      referenceNumber,
      createdBy: userId,
    },
  });

  // Update stock level hard reserved count
  await tx.stockLevel.upsert({
    where: {
      productId_location: { productId, location },
    },
    create: {
      productId,
      location,
      onHand: 0,
      softReserved: 0,
      hardReserved: quantity,
      onOrder: 0,
    },
    update: {
      hardReserved: { increment: quantity },
    },
  });
}
