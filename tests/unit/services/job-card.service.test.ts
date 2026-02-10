/**
 * Job Card Service Unit Tests — Reservation Release
 *
 * Focuses on the reservation release logic in completeJobCard():
 * - Hard reservations are released when job card completes
 * - Released quantity matches original reservation
 * - BOM snapshot path is used when snapshot exists
 *
 * Note: Basic MANUFACTURE_IN/OUT flows are tested in stock-flows.test.ts.
 * This file tests the reservation release and BOM snapshot consumption paths.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// =============================================================================
// MOCK SETUP
// =============================================================================

const { mockPrisma, mockUpdateStockLevel, mockCreateStockMovement } = vi.hoisted(() => ({
  mockPrisma: {
    jobCard: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  } as Record<string, any>,
  mockUpdateStockLevel: vi.fn(),
  mockCreateStockMovement: vi.fn(),
}));

vi.mock('../../../backend/src/config/database', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../../backend/src/services/inventory.service', () => ({
  updateStockLevel: mockUpdateStockLevel,
  createStockMovement: mockCreateStockMovement,
}));

vi.mock('../../../backend/src/services/bom.service', () => ({
  checkBomStock: vi.fn(),
  explodeBom: vi.fn(),
}));

vi.mock('../../../backend/src/utils/number-generation', () => ({
  generateJobCardNumber: vi.fn().mockResolvedValue('JC-2026-00001'),
}));

import { completeJobCard } from '../../../backend/src/services/job-card.service';

// =============================================================================
// HELPERS
// =============================================================================

function mockDecimal(value: number) {
  return {
    toNumber: () => value,
    toString: () => value.toString(),
  };
}

const DEFAULT_STOCK_LEVEL = { onHand: 100, softReserved: 0, hardReserved: 0, onOrder: 0 };

const mockJobCard = {
  id: 'jc-1',
  companyId: 'company-1',
  jobCardNumber: 'JC-2026-00001',
  orderId: 'order-1',
  orderNumber: 'SO-2026-00001',
  orderLineId: 'ol-1',
  productId: 'finished-prod',
  productSku: 'FINISHED-001',
  productDescription: 'Finished Product',
  quantity: 10,
  jobType: 'MANUFACTURE',
  status: 'IN_PROGRESS',
};

function createMockTx() {
  return {
    jobCard: {
      update: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([{ status: 'COMPLETE' }]),
    },
    jobCardBomLine: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    bomItem: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    stockReservation: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    pickingSlip: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    transferRequest: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    salesOrder: {
      findUnique: vi.fn().mockResolvedValue({ status: 'PROCESSING' }),
      update: vi.fn().mockResolvedValue({}),
    },
  };
}

let mockTx: ReturnType<typeof createMockTx>;

// =============================================================================
// TESTS
// =============================================================================

describe('Job Card Service — completeJobCard (reservation release)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = createMockTx();
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockTx));
    mockUpdateStockLevel.mockResolvedValue(DEFAULT_STOCK_LEVEL);
    mockCreateStockMovement.mockResolvedValue({});
  });

  describe('reservation release on completion', () => {
    it('releases all hard reservations for the completed job card', async () => {
      const reservations = [
        {
          id: 'res-1',
          productId: 'component-a',
          location: 'JHB',
          reservationType: 'HARD',
          quantity: 20,
        },
        {
          id: 'res-2',
          productId: 'component-b',
          location: 'JHB',
          reservationType: 'HARD',
          quantity: 30,
        },
      ];

      mockPrisma.jobCard.findFirst.mockResolvedValue(mockJobCard);
      mockTx.stockReservation.findMany.mockResolvedValue(reservations);

      const result = await completeJobCard('jc-1', 'user-1', 'company-1');

      expect(result.success).toBe(true);

      // Both reservations should be released
      expect(mockTx.stockReservation.update).toHaveBeenCalledTimes(2);

      // First reservation
      expect(mockTx.stockReservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res-1' },
          data: expect.objectContaining({
            releasedBy: 'user-1',
            releaseReason: expect.stringContaining('JC-2026-00001'),
          }),
        })
      );

      // Second reservation
      expect(mockTx.stockReservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res-2' },
          data: expect.objectContaining({
            releasedBy: 'user-1',
            releaseReason: expect.stringContaining('completed'),
          }),
        })
      );
    });

    it('decreases hardReserved stock level for each released reservation', async () => {
      const reservations = [
        {
          id: 'res-1',
          productId: 'component-a',
          location: 'JHB',
          reservationType: 'HARD',
          quantity: 20,
        },
        {
          id: 'res-2',
          productId: 'component-b',
          location: 'JHB',
          reservationType: 'HARD',
          quantity: 15,
        },
      ];

      mockPrisma.jobCard.findFirst.mockResolvedValue(mockJobCard);
      mockTx.stockReservation.findMany.mockResolvedValue(reservations);

      await completeJobCard('jc-1', 'user-1', 'company-1');

      // hardReserved decreases should match original reservation quantities
      expect(mockUpdateStockLevel).toHaveBeenCalledWith(
        mockTx,
        'component-a',
        'JHB',
        { hardReserved: -20 },
        'user-1'
      );
      expect(mockUpdateStockLevel).toHaveBeenCalledWith(
        mockTx,
        'component-b',
        'JHB',
        { hardReserved: -15 },
        'user-1'
      );
    });

    it('queries only unreleased HARD reservations for the job card', async () => {
      mockPrisma.jobCard.findFirst.mockResolvedValue(mockJobCard);

      await completeJobCard('jc-1', 'user-1', 'company-1');

      expect(mockTx.stockReservation.findMany).toHaveBeenCalledWith({
        where: {
          referenceType: 'JobCard',
          referenceId: 'jc-1',
          reservationType: 'HARD',
          releasedAt: null,
        },
      });
    });

    it('handles zero reservations gracefully', async () => {
      mockPrisma.jobCard.findFirst.mockResolvedValue(mockJobCard);
      mockTx.stockReservation.findMany.mockResolvedValue([]);

      const result = await completeJobCard('jc-1', 'user-1', 'company-1');

      expect(result.success).toBe(true);
      expect(mockTx.stockReservation.update).not.toHaveBeenCalled();
    });
  });

  describe('BOM snapshot consumption', () => {
    it('uses BOM snapshot lines when available instead of live BOM', async () => {
      const snapshotLines = [
        {
          componentProductId: 'comp-a',
          componentSku: 'COMP-A-001',
          componentName: 'Component A',
          totalRequired: mockDecimal(20),
          isOptional: false,
          sortOrder: 0,
        },
        {
          componentProductId: 'comp-b',
          componentSku: 'COMP-B-001',
          componentName: 'Component B',
          totalRequired: mockDecimal(15),
          isOptional: false,
          sortOrder: 1,
        },
      ];

      mockPrisma.jobCard.findFirst.mockResolvedValue(mockJobCard);
      mockTx.jobCardBomLine.findMany.mockResolvedValue(snapshotLines);

      await completeJobCard('jc-1', 'user-1', 'company-1');

      // Should NOT query live BOM items (fallback path)
      expect(mockTx.bomItem.findMany).not.toHaveBeenCalled();

      // Should consume snapshot quantities
      // 1 MANUFACTURE_IN + 2 MANUFACTURE_OUT = 3 movements
      expect(mockCreateStockMovement).toHaveBeenCalledTimes(3);

      expect(mockCreateStockMovement).toHaveBeenCalledWith(
        mockTx,
        expect.objectContaining({
          productId: 'comp-a',
          movementType: 'MANUFACTURE_OUT',
          quantity: 20, // Math.ceil(20) = 20
        })
      );

      expect(mockCreateStockMovement).toHaveBeenCalledWith(
        mockTx,
        expect.objectContaining({
          productId: 'comp-b',
          movementType: 'MANUFACTURE_OUT',
          quantity: 15,
        })
      );
    });

    it('skips optional BOM snapshot lines', async () => {
      const snapshotLines = [
        {
          componentProductId: 'comp-required',
          componentSku: 'REQ-001',
          componentName: 'Required Component',
          totalRequired: mockDecimal(10),
          isOptional: false,
          sortOrder: 0,
        },
      ];

      mockPrisma.jobCard.findFirst.mockResolvedValue(mockJobCard);
      // Snapshot query filters isOptional: false at query level
      mockTx.jobCardBomLine.findMany.mockResolvedValue(snapshotLines);

      await completeJobCard('jc-1', 'user-1', 'company-1');

      // Query should filter for non-optional only
      expect(mockTx.jobCardBomLine.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            jobCardId: 'jc-1',
            isOptional: false,
          }),
        })
      );
    });

    it('applies Math.ceil to fractional snapshot quantities', async () => {
      const snapshotLines = [
        {
          componentProductId: 'comp-a',
          componentSku: 'COMP-A-001',
          componentName: 'Component A',
          totalRequired: mockDecimal(7.3), // Should ceil to 8
          isOptional: false,
          sortOrder: 0,
        },
      ];

      mockPrisma.jobCard.findFirst.mockResolvedValue(mockJobCard);
      mockTx.jobCardBomLine.findMany.mockResolvedValue(snapshotLines);

      await completeJobCard('jc-1', 'user-1', 'company-1');

      expect(mockUpdateStockLevel).toHaveBeenCalledWith(
        mockTx,
        'comp-a',
        'JHB',
        { onHand: -8 }, // Math.ceil(7.3) = 8
        'user-1'
      );
    });

    it('skips zero-quantity BOM lines', async () => {
      const snapshotLines = [
        {
          componentProductId: 'comp-a',
          componentSku: 'COMP-A-001',
          componentName: 'Component A',
          totalRequired: mockDecimal(0),
          isOptional: false,
          sortOrder: 0,
        },
      ];

      mockPrisma.jobCard.findFirst.mockResolvedValue(mockJobCard);
      mockTx.jobCardBomLine.findMany.mockResolvedValue(snapshotLines);

      await completeJobCard('jc-1', 'user-1', 'company-1');

      // Only MANUFACTURE_IN for finished product, no MANUFACTURE_OUT
      expect(mockCreateStockMovement).toHaveBeenCalledTimes(1);
      expect(mockCreateStockMovement).toHaveBeenCalledWith(
        mockTx,
        expect.objectContaining({
          movementType: 'MANUFACTURE_IN',
        })
      );
    });

    it('falls back to live BOM when no snapshot exists', async () => {
      const liveBomItems = [
        {
          id: 'bom-1',
          parentProductId: 'finished-prod',
          componentProductId: 'comp-live',
          quantity: mockDecimal(2), // 2 per unit * 10 quantity = 20
          isOptional: false,
        },
      ];

      mockPrisma.jobCard.findFirst.mockResolvedValue(mockJobCard);
      mockTx.jobCardBomLine.findMany.mockResolvedValue([]); // No snapshot
      mockTx.bomItem.findMany.mockResolvedValue(liveBomItems);

      await completeJobCard('jc-1', 'user-1', 'company-1');

      // Should fall back to live BOM
      expect(mockTx.bomItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            parentProductId: 'finished-prod',
            isOptional: false,
          }),
        })
      );

      expect(mockUpdateStockLevel).toHaveBeenCalledWith(
        mockTx,
        'comp-live',
        'JHB',
        { onHand: -20 },
        'user-1'
      );
    });
  });

  describe('status validation', () => {
    it('rejects if job card not found', async () => {
      mockPrisma.jobCard.findFirst.mockResolvedValue(null);

      const result = await completeJobCard('jc-1', 'user-1', 'company-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('rejects if job card is PENDING', async () => {
      mockPrisma.jobCard.findFirst.mockResolvedValue({ ...mockJobCard, status: 'PENDING' });

      const result = await completeJobCard('jc-1', 'user-1', 'company-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('PENDING');
    });

    it('rejects if job card is already COMPLETE', async () => {
      mockPrisma.jobCard.findFirst.mockResolvedValue({ ...mockJobCard, status: 'COMPLETE' });

      const result = await completeJobCard('jc-1', 'user-1', 'company-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('COMPLETE');
    });
  });

  describe('order status propagation', () => {
    it('sets order to READY_TO_SHIP when all jobs, pickings, and transfers complete', async () => {
      mockPrisma.jobCard.findFirst.mockResolvedValue(mockJobCard);
      mockTx.jobCard.findMany.mockResolvedValue([{ status: 'COMPLETE' }]);
      mockTx.pickingSlip.findMany.mockResolvedValue([{ status: 'COMPLETE' }]);
      mockTx.transferRequest.findMany.mockResolvedValue([{ status: 'RECEIVED' }]);
      mockTx.salesOrder.findUnique.mockResolvedValue({ status: 'PROCESSING' });

      await completeJobCard('jc-1', 'user-1', 'company-1');

      expect(mockTx.salesOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: { status: 'READY_TO_SHIP' },
        })
      );
    });

    it('sets order to PROCESSING when some fulfillment still pending', async () => {
      mockPrisma.jobCard.findFirst.mockResolvedValue(mockJobCard);
      mockTx.jobCard.findMany.mockResolvedValue([
        { status: 'COMPLETE' },
        { status: 'IN_PROGRESS' }, // Still running
      ]);
      mockTx.pickingSlip.findMany.mockResolvedValue([]);
      mockTx.transferRequest.findMany.mockResolvedValue([]);
      mockTx.salesOrder.findUnique.mockResolvedValue({ status: 'CONFIRMED' });

      await completeJobCard('jc-1', 'user-1', 'company-1');

      expect(mockTx.salesOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: { status: 'PROCESSING' },
        })
      );
    });
  });
});
