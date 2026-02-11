/**
 * Orchestration Service — Backorder Persistence Tests
 *
 * Verifies that executeFulfillmentPlan():
 * 1. Persists quantityBackorder on SalesOrderLine for backordered items
 * 2. Populates salesOrderLineId on PurchaseOrderLine when sourceType is ORDER_LINE
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// =============================================================================
// MOCK SETUP
// =============================================================================

const {
  mockPrisma,
  mockCheckProductAvailability,
  mockCheckBomStock,
  mockGetStockLevel,
  mockUpdateStockLevel,
  mockGeneratePickingSlipNumberTx,
  mockGenerateJobCardNumberTx,
  mockGenerateTransferNumberTx,
  mockGeneratePurchaseOrderNumberTx,
} = vi.hoisted(() => {
  const salesOrderLineUpdate = vi.fn();
  const salesOrderFindUnique = vi.fn();
  const salesOrderUpdate = vi.fn();
  const pickingSlipCreate = vi.fn();
  const pickingSlipLineCreateMany = vi.fn();
  const jobCardCreate = vi.fn();
  const transferRequestCreate = vi.fn();
  const transferRequestLineCreateMany = vi.fn();
  const purchaseOrderCreate = vi.fn();
  const purchaseOrderLineCreateMany = vi.fn();
  const stockReservationCreate = vi.fn();
  const stockReservationFindMany = vi.fn();
  const stockReservationUpdate = vi.fn();

  // The transaction function: call the callback with the tx client
  const transactionMock = vi.fn(async (cb: (tx: unknown) => Promise<void>) => {
    const txClient = {
      salesOrderLine: { update: salesOrderLineUpdate },
      salesOrder: { update: salesOrderUpdate },
      pickingSlip: { create: pickingSlipCreate },
      pickingSlipLine: { createMany: pickingSlipLineCreateMany },
      jobCard: { create: jobCardCreate },
      transferRequest: { create: transferRequestCreate },
      transferRequestLine: { createMany: transferRequestLineCreateMany },
      purchaseOrder: { create: purchaseOrderCreate },
      purchaseOrderLine: { createMany: purchaseOrderLineCreateMany },
      stockReservation: { create: stockReservationCreate, findMany: stockReservationFindMany, update: stockReservationUpdate },
    };
    await cb(txClient);
  });

  return {
    mockPrisma: {
      salesOrder: { findUnique: salesOrderFindUnique, update: salesOrderUpdate },
      salesOrderLine: { update: salesOrderLineUpdate },
      purchaseOrder: { create: purchaseOrderCreate },
      purchaseOrderLine: { createMany: purchaseOrderLineCreateMany },
      stockReservation: { findMany: stockReservationFindMany, update: stockReservationUpdate, create: stockReservationCreate },
      $transaction: transactionMock,
    },
    mockCheckProductAvailability: vi.fn(),
    mockCheckBomStock: vi.fn(),
    mockGetStockLevel: vi.fn(),
    mockUpdateStockLevel: vi.fn(),
    mockGeneratePickingSlipNumberTx: vi.fn(),
    mockGenerateJobCardNumberTx: vi.fn(),
    mockGenerateTransferNumberTx: vi.fn(),
    mockGeneratePurchaseOrderNumberTx: vi.fn(),
  };
});

vi.mock('../../../backend/src/config/database', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../../backend/src/services/allocation.service', () => ({
  checkProductAvailability: mockCheckProductAvailability,
}));

vi.mock('../../../backend/src/services/bom.service', () => ({
  checkBomStock: mockCheckBomStock,
}));

vi.mock('../../../backend/src/services/inventory.service', () => ({
  getStockLevel: mockGetStockLevel,
  updateStockLevel: mockUpdateStockLevel,
}));

vi.mock('../../../backend/src/utils/number-generation', () => ({
  generatePickingSlipNumberTx: mockGeneratePickingSlipNumberTx,
  generateJobCardNumberTx: mockGenerateJobCardNumberTx,
  generateTransferNumberTx: mockGenerateTransferNumberTx,
  generatePurchaseOrderNumberTx: mockGeneratePurchaseOrderNumberTx,
}));

import { executeFulfillmentPlan } from '../../../backend/src/services/orchestration.service';
import type { OrchestrationPlan } from '../../../backend/src/services/orchestration.service';

// =============================================================================
// TEST HELPERS
// =============================================================================

function makeBasePlan(overrides: Partial<OrchestrationPlan> = {}): OrchestrationPlan {
  return {
    orderId: 'order-1',
    orderNumber: 'ORD-2026-00001',
    customerWarehouse: 'JHB' as const,
    effectivePolicy: 'SHIP_PARTIAL' as const,
    canProceed: true,
    pickingSlips: [],
    jobCards: [],
    transfers: [],
    purchaseOrders: [],
    summary: {
      totalOrderLines: 2,
      linesFromStock: 1,
      linesRequiringAssembly: 0,
      linesRequiringTransfer: 0,
      linesBackordered: 1,
      pickingSlipsToCreate: 0,
      jobCardsToCreate: 0,
      transfersToCreate: 0,
      purchaseOrdersToCreate: 1,
      canFulfillCompletely: false,
      immediatelyFulfillablePercent: 50,
    },
    warnings: [],
    generatedAt: new Date(Date.now() - 1000), // 1 second ago
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('executeFulfillmentPlan — backorder persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: order exists, CONFIRMED, same company
    mockPrisma.salesOrder.findUnique.mockResolvedValue({
      id: 'order-1',
      status: 'CONFIRMED',
      companyId: 'company-1',
      updatedAt: new Date(Date.now() - 60000), // 1 min ago (before plan generation)
    });

    // No existing reservations to release
    mockPrisma.stockReservation.findMany.mockResolvedValue([]);

    // PO number generation
    mockGeneratePurchaseOrderNumberTx.mockResolvedValue('PO-2026-00001');

    // PO creation returns an id
    mockPrisma.purchaseOrder.create.mockResolvedValue({
      id: 'po-1',
      poNumber: 'PO-2026-00001',
    });

    // PO line creation succeeds
    mockPrisma.purchaseOrderLine.createMany.mockResolvedValue({ count: 1 });

    // Order line update succeeds
    mockPrisma.salesOrderLine.update.mockResolvedValue({});

    // Order status update succeeds
    mockPrisma.salesOrder.update.mockResolvedValue({});
  });

  it('should set quantityBackorder on sales order lines when backorders exist', async () => {
    const plan = makeBasePlan({
      purchaseOrders: [
        {
          supplierId: 'supplier-1',
          supplierCode: 'SUP001',
          supplierName: 'Test Supplier',
          currency: 'EUR',
          reason: 'FINISHED_GOODS_BACKORDER' as const,
          lines: [
            {
              productId: 'product-1',
              productSku: 'NDT-001',
              productDescription: 'Test Product',
              quantity: 10,
              sourceType: 'ORDER_LINE',
              sourceId: 'order-line-1',
              estimatedUnitCost: 5.0,
            },
          ],
        },
      ],
    });

    const result = await executeFulfillmentPlan({
      plan,
      userId: 'user-1',
      companyId: 'company-1',
    });

    expect(result.success).toBe(true);

    // Verify salesOrderLine.update was called with quantityBackorder
    expect(mockPrisma.salesOrderLine.update).toHaveBeenCalledWith({
      where: { id: 'order-line-1' },
      data: { quantityBackorder: 10 },
    });
  });

  it('should populate salesOrderLineId on purchase order lines', async () => {
    const plan = makeBasePlan({
      purchaseOrders: [
        {
          supplierId: 'supplier-1',
          supplierCode: 'SUP001',
          supplierName: 'Test Supplier',
          currency: 'EUR',
          reason: 'FINISHED_GOODS_BACKORDER' as const,
          lines: [
            {
              productId: 'product-1',
              productSku: 'NDT-001',
              productDescription: 'Test Product',
              quantity: 5,
              sourceType: 'ORDER_LINE',
              sourceId: 'order-line-1',
              estimatedUnitCost: 10.0,
            },
          ],
        },
      ],
    });

    await executeFulfillmentPlan({
      plan,
      userId: 'user-1',
      companyId: 'company-1',
    });

    // Verify PO line createMany includes salesOrderLineId
    expect(mockPrisma.purchaseOrderLine.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          salesOrderLineId: 'order-line-1',
          productId: 'product-1',
          quantityOrdered: 5,
        }),
      ],
    });
  });

  it('should NOT set salesOrderLineId for JOB_CARD_COMPONENT PO lines', async () => {
    const plan = makeBasePlan({
      purchaseOrders: [
        {
          supplierId: 'supplier-1',
          supplierCode: 'SUP001',
          supplierName: 'Test Supplier',
          currency: 'EUR',
          reason: 'COMPONENT_SHORTAGE' as const,
          lines: [
            {
              productId: 'component-1',
              productSku: 'CMP-001',
              productDescription: 'Component',
              quantity: 20,
              sourceType: 'JOB_CARD_COMPONENT',
              sourceId: 'job-card-1',
              estimatedUnitCost: 2.0,
            },
          ],
        },
      ],
    });

    await executeFulfillmentPlan({
      plan,
      userId: 'user-1',
      companyId: 'company-1',
    });

    // PO line should have null salesOrderLineId
    expect(mockPrisma.purchaseOrderLine.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          salesOrderLineId: null,
          productId: 'component-1',
        }),
      ],
    });

    // No sales order line update for backorder (component shortage is not a line backorder)
    expect(mockPrisma.salesOrderLine.update).not.toHaveBeenCalled();
  });

  it('should aggregate backorder quantities across multiple POs for the same line', async () => {
    // Edge case: same order line appears in two supplier POs (shouldn't happen normally, but defensive)
    const plan = makeBasePlan({
      purchaseOrders: [
        {
          supplierId: 'supplier-1',
          supplierCode: 'SUP001',
          supplierName: 'Supplier 1',
          currency: 'EUR',
          reason: 'FINISHED_GOODS_BACKORDER' as const,
          lines: [
            {
              productId: 'product-1',
              productSku: 'NDT-001',
              productDescription: 'Test Product',
              quantity: 7,
              sourceType: 'ORDER_LINE',
              sourceId: 'order-line-1',
              estimatedUnitCost: 5.0,
            },
          ],
        },
        {
          supplierId: 'supplier-2',
          supplierCode: 'SUP002',
          supplierName: 'Supplier 2',
          currency: 'EUR',
          reason: 'FINISHED_GOODS_BACKORDER' as const,
          lines: [
            {
              productId: 'product-1',
              productSku: 'NDT-001',
              productDescription: 'Test Product',
              quantity: 3,
              sourceType: 'ORDER_LINE',
              sourceId: 'order-line-1',
              estimatedUnitCost: 6.0,
            },
          ],
        },
      ],
    });

    // Second PO also needs a number
    mockGeneratePurchaseOrderNumberTx.mockResolvedValueOnce('PO-2026-00001').mockResolvedValueOnce('PO-2026-00002');
    mockPrisma.purchaseOrder.create.mockResolvedValueOnce({ id: 'po-1', poNumber: 'PO-2026-00001' })
      .mockResolvedValueOnce({ id: 'po-2', poNumber: 'PO-2026-00002' });
    mockPrisma.purchaseOrderLine.createMany.mockResolvedValue({ count: 1 });

    await executeFulfillmentPlan({
      plan,
      userId: 'user-1',
      companyId: 'company-1',
    });

    // Should aggregate: 7 + 3 = 10
    expect(mockPrisma.salesOrderLine.update).toHaveBeenCalledTimes(1);
    expect(mockPrisma.salesOrderLine.update).toHaveBeenCalledWith({
      where: { id: 'order-line-1' },
      data: { quantityBackorder: 10 },
    });
  });

  it('should not update any order lines when plan has no backorders', async () => {
    const plan = makeBasePlan({
      purchaseOrders: [],
      summary: {
        totalOrderLines: 2,
        linesFromStock: 2,
        linesRequiringAssembly: 0,
        linesRequiringTransfer: 0,
        linesBackordered: 0,
        pickingSlipsToCreate: 1,
        jobCardsToCreate: 0,
        transfersToCreate: 0,
        purchaseOrdersToCreate: 0,
        canFulfillCompletely: true,
        immediatelyFulfillablePercent: 100,
      },
    });

    await executeFulfillmentPlan({
      plan,
      userId: 'user-1',
      companyId: 'company-1',
    });

    // No backorder updates
    expect(mockPrisma.salesOrderLine.update).not.toHaveBeenCalled();
  });
});
