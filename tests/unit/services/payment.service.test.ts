/**
 * Payment Service Unit Tests
 *
 * Tests the recordPayment() function, focusing on:
 * - Input validation (order not found, cancelled, invalid amounts)
 * - Payment creation and status sync
 * - Auto-fulfillment trigger for PREPAY/COD orders
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from '@prisma/client/runtime/library';

// =============================================================================
// MOCK SETUP
// =============================================================================

const {
  mockPrisma,
  mockGeneratePaymentNumber,
  mockGenerateFulfillmentPlan,
  mockExecuteFulfillmentPlan,
} = vi.hoisted(() => ({
  mockPrisma: {
    salesOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      aggregate: vi.fn(),
      create: vi.fn(),
    },
  } as Record<string, any>,
  mockGeneratePaymentNumber: vi.fn(),
  mockGenerateFulfillmentPlan: vi.fn(),
  mockExecuteFulfillmentPlan: vi.fn(),
}));

vi.mock('../../../backend/src/config/database', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../../backend/src/utils/number-generation', () => ({
  generatePaymentNumber: mockGeneratePaymentNumber,
}));

vi.mock('../../../backend/src/services/orchestration.service', () => ({
  generateFulfillmentPlan: mockGenerateFulfillmentPlan,
  executeFulfillmentPlan: mockExecuteFulfillmentPlan,
}));

// Must import AFTER vi.mock calls
import { recordPayment } from '../../../backend/src/services/payment.service';

// =============================================================================
// HELPERS
// =============================================================================

/** Use real Prisma Decimal so that service code `new Decimal(x).gt(balance)` works */
function dec(value: number): Decimal {
  return new Decimal(value);
}

const DEFAULT_PAYMENT_DATA = {
  amount: 500,
  paymentMethod: 'EFT' as const,
  paymentReference: 'REF-001',
  paymentDate: new Date('2026-01-15'),
  notes: 'Test payment',
};

// =============================================================================
// TESTS
// =============================================================================

describe('Payment Service — recordPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGeneratePaymentNumber.mockResolvedValue('PAY-2026-00001');
    mockPrisma.payment.create.mockResolvedValue({
      id: 'pay-1',
      paymentNumber: 'PAY-2026-00001',
    });
  });

  describe('validation', () => {
    it('returns error when order not found', async () => {
      mockPrisma.salesOrder.findUnique.mockResolvedValue(null);

      const result = await recordPayment('order-1', DEFAULT_PAYMENT_DATA, 'user-1', 'Test User');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });

    it('returns error for cancelled order', async () => {
      mockPrisma.salesOrder.findUnique.mockResolvedValue({
        id: 'order-1',
        companyId: 'company-1',
        total: dec(1000),
        status: 'CANCELLED',
      });

      const result = await recordPayment('order-1', DEFAULT_PAYMENT_DATA, 'user-1', 'Test User');

      expect(result.success).toBe(false);
      expect(result.error).toContain('cancelled');
    });

    it('returns error when amount is zero', async () => {
      mockPrisma.salesOrder.findUnique.mockResolvedValue({
        id: 'order-1',
        companyId: 'company-1',
        total: dec(1000),
        status: 'CONFIRMED',
      });
      mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });

      const result = await recordPayment(
        'order-1',
        { ...DEFAULT_PAYMENT_DATA, amount: 0 },
        'user-1',
        'Test User'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('positive');
    });

    it('returns error when amount is negative', async () => {
      mockPrisma.salesOrder.findUnique.mockResolvedValue({
        id: 'order-1',
        companyId: 'company-1',
        total: dec(1000),
        status: 'CONFIRMED',
      });
      mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });

      const result = await recordPayment(
        'order-1',
        { ...DEFAULT_PAYMENT_DATA, amount: -100 },
        'user-1',
        'Test User'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('positive');
    });

    it('returns error when amount exceeds balance', async () => {
      mockPrisma.salesOrder.findUnique.mockResolvedValue({
        id: 'order-1',
        companyId: 'company-1',
        total: dec(1000),
        status: 'CONFIRMED',
      });
      // Already paid 800 of 1000
      mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: dec(800) } });

      const result = await recordPayment(
        'order-1',
        { ...DEFAULT_PAYMENT_DATA, amount: 300 }, // 300 > 200 remaining
        'user-1',
        'Test User'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds balance');
    });
  });

  describe('successful payment recording', () => {
    /**
     * Sets up mocks for a successful payment flow.
     * The service calls findUnique 3 times and aggregate 2 times sequentially.
     */
    function setupSuccessfulPayment(overrides?: {
      paymentTerms?: string;
      orderStatus?: string;
      existingPaid?: number;
      orderTotal?: number;
      paymentAmount?: number;
    }) {
      const total = overrides?.orderTotal ?? 1000;
      const existingPaid = overrides?.existingPaid ?? 0;
      const amount = overrides?.paymentAmount ?? total - existingPaid;
      const finalPaid = existingPaid + amount;
      const paymentStatus = finalPaid >= total ? 'PAID' : finalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
      const status = overrides?.orderStatus ?? 'CONFIRMED';

      // 1st findUnique: order lookup (line 72)
      // 2nd findUnique: calculatePaymentStatus → order.total (line 16)
      // 3rd findUnique: fulfillment trigger check (line 131)
      mockPrisma.salesOrder.findUnique
        .mockResolvedValueOnce({
          id: 'order-1',
          companyId: 'company-1',
          total: dec(total),
          status,
        })
        .mockResolvedValueOnce({
          total: dec(total),
        })
        .mockResolvedValueOnce({
          paymentTerms: overrides?.paymentTerms ?? 'NET_30',
          paymentStatus,
          status,
          orderNumber: 'SO-2026-00001',
          companyId: 'company-1',
        });

      // 1st aggregate: balance check (line 92)
      // 2nd aggregate: calculatePaymentStatus (line 23)
      mockPrisma.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: existingPaid > 0 ? dec(existingPaid) : null } })
        .mockResolvedValueOnce({ _sum: { amount: dec(finalPaid) } });

      mockPrisma.salesOrder.update.mockResolvedValue({});

      return { amount };
    }

    it('creates payment and returns success', async () => {
      const { amount } = setupSuccessfulPayment();

      const result = await recordPayment(
        'order-1',
        { ...DEFAULT_PAYMENT_DATA, amount },
        'user-1',
        'Test User'
      );

      expect(result.success).toBe(true);
      expect(result.payment).toEqual({
        id: 'pay-1',
        paymentNumber: 'PAY-2026-00001',
      });
    });

    it('syncs order payment status after recording', async () => {
      setupSuccessfulPayment({ paymentAmount: 500, orderTotal: 1000 });

      await recordPayment(
        'order-1',
        { ...DEFAULT_PAYMENT_DATA, amount: 500 },
        'user-1',
        'Test User'
      );

      // syncOrderPaymentStatus calls salesOrder.update with computed status
      expect(mockPrisma.salesOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: { paymentStatus: expect.any(String) },
        })
      );
    });
  });

  describe('fulfillment auto-trigger', () => {
    function setupPrepayPayment(overrides?: {
      paymentTerms?: string;
      orderStatus?: string;
      fulfillmentPlanSuccess?: boolean;
      fulfillmentExecSuccess?: boolean;
    }) {
      const terms = overrides?.paymentTerms ?? 'PREPAY';
      const status = overrides?.orderStatus ?? 'CONFIRMED';

      // 1st findUnique: order lookup
      mockPrisma.salesOrder.findUnique
        .mockResolvedValueOnce({
          id: 'order-1',
          companyId: 'company-1',
          total: dec(1000),
          status,
        })
        // 2nd findUnique: calculatePaymentStatus
        .mockResolvedValueOnce({
          total: dec(1000),
        })
        // 3rd findUnique: fulfillment trigger check
        .mockResolvedValueOnce({
          paymentTerms: terms,
          paymentStatus: 'PAID',
          status,
          orderNumber: 'SO-2026-00001',
          companyId: 'company-1',
        });

      // 1st aggregate: balance check (no existing payments)
      // 2nd aggregate: calculatePaymentStatus (fully paid after this payment)
      mockPrisma.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: dec(1000) } });

      mockPrisma.salesOrder.update.mockResolvedValue({});

      // Fulfillment plan
      if (overrides?.fulfillmentPlanSuccess !== false) {
        mockGenerateFulfillmentPlan.mockResolvedValue({
          success: true,
          data: { planId: 'plan-1' },
        });
      } else {
        mockGenerateFulfillmentPlan.mockResolvedValue({
          success: false,
          error: 'Plan generation failed',
        });
      }

      // Fulfillment execution
      if (overrides?.fulfillmentExecSuccess !== false) {
        mockExecuteFulfillmentPlan.mockResolvedValue({
          success: true,
          data: {
            createdDocuments: {
              pickingSlips: ['PS-001'],
              jobCards: ['JC-001'],
              transferRequests: [],
            },
          },
        });
      } else {
        mockExecuteFulfillmentPlan.mockResolvedValue({
          success: false,
          error: 'Execution failed',
        });
      }
    }

    it('triggers fulfillment for PREPAY order reaching PAID + CONFIRMED', async () => {
      setupPrepayPayment({ paymentTerms: 'PREPAY' });

      const result = await recordPayment(
        'order-1',
        { ...DEFAULT_PAYMENT_DATA, amount: 1000 },
        'user-1',
        'Test User'
      );

      expect(result.success).toBe(true);
      expect(result.fulfillmentTriggered).toBe(true);
      expect(mockGenerateFulfillmentPlan).toHaveBeenCalledWith({ orderId: 'order-1' });
      expect(mockExecuteFulfillmentPlan).toHaveBeenCalled();
    });

    it('triggers fulfillment for COD order reaching PAID + CONFIRMED', async () => {
      setupPrepayPayment({ paymentTerms: 'COD' });

      const result = await recordPayment(
        'order-1',
        { ...DEFAULT_PAYMENT_DATA, amount: 1000 },
        'user-1',
        'Test User'
      );

      expect(result.success).toBe(true);
      expect(result.fulfillmentTriggered).toBe(true);
    });

    it('does NOT trigger fulfillment for NET_30 terms', async () => {
      setupPrepayPayment({ paymentTerms: 'NET_30' });

      const result = await recordPayment(
        'order-1',
        { ...DEFAULT_PAYMENT_DATA, amount: 1000 },
        'user-1',
        'Test User'
      );

      expect(result.success).toBe(true);
      expect(result.fulfillmentTriggered).toBe(false);
      expect(mockGenerateFulfillmentPlan).not.toHaveBeenCalled();
    });

    it('does NOT trigger fulfillment when order is not CONFIRMED', async () => {
      setupPrepayPayment({ paymentTerms: 'PREPAY', orderStatus: 'PROCESSING' });

      const result = await recordPayment(
        'order-1',
        { ...DEFAULT_PAYMENT_DATA, amount: 1000 },
        'user-1',
        'Test User'
      );

      expect(result.success).toBe(true);
      expect(result.fulfillmentTriggered).toBe(false);
      expect(mockGenerateFulfillmentPlan).not.toHaveBeenCalled();
    });

    it('records payment successfully even when fulfillment plan fails', async () => {
      setupPrepayPayment({ fulfillmentPlanSuccess: false });

      const result = await recordPayment(
        'order-1',
        { ...DEFAULT_PAYMENT_DATA, amount: 1000 },
        'user-1',
        'Test User'
      );

      expect(result.success).toBe(true);
      expect(result.payment).toBeDefined();
      expect(result.fulfillmentTriggered).toBe(false);
      expect(result.fulfillmentError).toContain('Plan generation failed');
    });

    it('records payment successfully even when fulfillment execution fails', async () => {
      setupPrepayPayment({ fulfillmentExecSuccess: false });

      const result = await recordPayment(
        'order-1',
        { ...DEFAULT_PAYMENT_DATA, amount: 1000 },
        'user-1',
        'Test User'
      );

      expect(result.success).toBe(true);
      expect(result.payment).toBeDefined();
      expect(result.fulfillmentTriggered).toBe(false);
      expect(result.fulfillmentError).toContain('Execution failed');
    });

    it('records payment when fulfillment throws an exception', async () => {
      setupPrepayPayment();
      mockGenerateFulfillmentPlan.mockRejectedValue(new Error('Network error'));

      const result = await recordPayment(
        'order-1',
        { ...DEFAULT_PAYMENT_DATA, amount: 1000 },
        'user-1',
        'Test User'
      );

      expect(result.success).toBe(true);
      expect(result.payment).toBeDefined();
      expect(result.fulfillmentTriggered).toBe(false);
      expect(result.fulfillmentError).toBe('Network error');
    });
  });
});
