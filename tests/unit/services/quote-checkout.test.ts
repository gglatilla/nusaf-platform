/**
 * Quote Checkout Service Unit Tests
 *
 * Tests the checkoutQuote() function, focusing on:
 * - Validation (quote not found, wrong status, expired)
 * - Company isolation (can't checkout another company's quote)
 * - Successful checkout with all fields
 * - Successful checkout with minimal fields (PO only)
 * - Downstream actions (fulfillment for account, proforma for prepay)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from '@prisma/client/runtime/library';

// =============================================================================
// MOCK SETUP
// =============================================================================

const {
  mockPrisma,
  mockCreateOrderFromQuote,
  mockConfirmOrder,
  mockReleaseReservationsByReference,
  mockGenerateFulfillmentPlan,
  mockExecuteFulfillmentPlan,
  mockCreateProformaInvoice,
} = vi.hoisted(() => ({
  mockPrisma: {
    quote: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    salesOrder: {
      findUnique: vi.fn(),
    },
    companyAddress: {
      findFirst: vi.fn(),
    },
  } as Record<string, Record<string, ReturnType<typeof vi.fn>>>,
  mockCreateOrderFromQuote: vi.fn(),
  mockConfirmOrder: vi.fn(),
  mockReleaseReservationsByReference: vi.fn(),
  mockGenerateFulfillmentPlan: vi.fn(),
  mockExecuteFulfillmentPlan: vi.fn(),
  mockCreateProformaInvoice: vi.fn(),
}));

vi.mock('../../../backend/src/config/database', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../../backend/src/services/order.service', () => ({
  createOrderFromQuote: mockCreateOrderFromQuote,
  confirmOrder: mockConfirmOrder,
}));

vi.mock('../../../backend/src/services/inventory.service', () => ({
  releaseReservationsByReference: mockReleaseReservationsByReference,
}));

vi.mock('../../../backend/src/services/orchestration.service', () => ({
  generateFulfillmentPlan: mockGenerateFulfillmentPlan,
  executeFulfillmentPlan: mockExecuteFulfillmentPlan,
}));

vi.mock('../../../backend/src/services/proforma-invoice.service', () => ({
  createProformaInvoice: mockCreateProformaInvoice,
}));

vi.mock('../../../backend/src/services/pricing.service', () => ({
  calculateCustomerPrice: vi.fn(),
}));

vi.mock('../../../backend/src/utils/number-generation', () => ({
  generateQuoteNumber: vi.fn(),
}));

vi.mock('../../../backend/src/utils/math', () => ({
  roundTo2: (n: number) => Math.round(n * 100) / 100,
}));

vi.mock('../../../backend/src/utils/cash-customer', () => ({
  pickCashCustomerFields: vi.fn().mockReturnValue({}),
}));

// Must import AFTER vi.mock calls
import { checkoutQuote } from '../../../backend/src/services/quote.service';

// =============================================================================
// HELPERS
// =============================================================================

const COMPANY_ID = 'company-1';
const USER_ID = 'user-1';
const QUOTE_ID = 'quote-1';

function makeQuote(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: QUOTE_ID,
    companyId: COMPANY_ID,
    status: 'CREATED',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    quoteNumber: 'QUO-2026-00001',
    subtotal: new Decimal(1000),
    vatRate: new Decimal(15),
    vatAmount: new Decimal(150),
    total: new Decimal(1150),
    customerNotes: null,
    deletedAt: null,
    ...overrides,
  };
}

const DEFAULT_OPTIONS = {
  customerPoNumber: 'PO-12345',
  customerPoDate: null,
  requiredDate: null,
  customerNotes: null,
};

function setupSuccessfulCheckout(paymentTerms: string = 'NET_30'): void {
  mockPrisma.quote.findFirst.mockResolvedValue(makeQuote());
  mockPrisma.quote.update.mockResolvedValue({});
  mockCreateOrderFromQuote.mockResolvedValue({
    success: true,
    order: { id: 'order-1', orderNumber: 'SO-2026-00001' },
  });
  mockConfirmOrder.mockResolvedValue({ success: true });
  mockPrisma.salesOrder.findUnique.mockResolvedValue({ paymentTerms });
  mockGenerateFulfillmentPlan.mockResolvedValue({
    success: true,
    data: { orderId: 'order-1', canProceed: true, lines: [] },
  });
  mockExecuteFulfillmentPlan.mockResolvedValue({
    success: true,
    data: { createdDocuments: { pickingSlips: [], jobCards: [], transferRequests: [] } },
  });
  mockCreateProformaInvoice.mockResolvedValue({
    success: true,
    proformaInvoice: { proformaNumber: 'PI-2026-00001' },
  });
}

// =============================================================================
// TESTS
// =============================================================================

describe('Quote Service — checkoutQuote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Validation ----

  it('returns error when quote not found', async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(null);

    const result = await checkoutQuote(QUOTE_ID, USER_ID, COMPANY_ID, DEFAULT_OPTIONS);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quote not found');
  });

  it('returns error when quote is not CREATED status', async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(makeQuote({ status: 'DRAFT' }));

    const result = await checkoutQuote(QUOTE_ID, USER_ID, COMPANY_ID, DEFAULT_OPTIONS);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Only submitted quotes can be checked out');
  });

  it('returns error when quote has expired', async () => {
    const expiredDate = new Date(Date.now() - 1000); // 1 second ago
    mockPrisma.quote.findFirst.mockResolvedValue(makeQuote({ validUntil: expiredDate }));
    mockPrisma.quote.update.mockResolvedValue({});
    mockReleaseReservationsByReference.mockResolvedValue(undefined);

    const result = await checkoutQuote(QUOTE_ID, USER_ID, COMPANY_ID, DEFAULT_OPTIONS);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quote has expired');
    expect(mockPrisma.quote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'EXPIRED' }),
      })
    );
  });

  it('enforces company isolation (wrong company returns not found)', async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(null); // Prisma where clause filters by companyId

    const result = await checkoutQuote(QUOTE_ID, USER_ID, 'other-company', DEFAULT_OPTIONS);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quote not found');
    expect(mockPrisma.quote.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'other-company' }),
      })
    );
  });

  // ---- Successful checkout ----

  it('creates order with all checkout data', async () => {
    setupSuccessfulCheckout('NET_30');

    const result = await checkoutQuote(QUOTE_ID, USER_ID, COMPANY_ID, {
      customerPoNumber: 'PO-99999',
      customerPoDate: new Date('2026-03-01'),
      requiredDate: new Date('2026-03-15'),
      customerNotes: 'Deliver to loading bay 3',
      shippingAddressId: 'addr-1',
    });

    expect(result.success).toBe(true);
    expect(result.orderId).toBe('order-1');
    expect(result.orderNumber).toBe('SO-2026-00001');
    expect(mockCreateOrderFromQuote).toHaveBeenCalledWith(
      QUOTE_ID,
      USER_ID,
      COMPANY_ID,
      expect.objectContaining({
        customerPoNumber: 'PO-99999',
        shippingAddressId: 'addr-1',
        customerNotes: 'Deliver to loading bay 3',
      })
    );
  });

  it('creates order with minimal checkout data (PO only)', async () => {
    setupSuccessfulCheckout('NET_30');

    const result = await checkoutQuote(QUOTE_ID, USER_ID, COMPANY_ID, {
      customerPoNumber: 'PO-MIN',
      customerPoDate: null,
      requiredDate: null,
      customerNotes: null,
    });

    expect(result.success).toBe(true);
    expect(result.orderId).toBe('order-1');
    expect(mockCreateOrderFromQuote).toHaveBeenCalledWith(
      QUOTE_ID,
      USER_ID,
      COMPANY_ID,
      expect.objectContaining({
        customerPoNumber: 'PO-MIN',
        shippingAddressId: undefined,
      })
    );
  });

  // ---- Payment terms determine downstream flow ----

  it('triggers fulfillment for NET_30 account customer', async () => {
    setupSuccessfulCheckout('NET_30');

    const result = await checkoutQuote(QUOTE_ID, USER_ID, COMPANY_ID, DEFAULT_OPTIONS);

    expect(result.success).toBe(true);
    expect(result.paymentRequired).toBe(false);
    expect(result.fulfillmentTriggered).toBe(true);
    expect(result.proformaGenerated).toBe(false);
    expect(mockGenerateFulfillmentPlan).toHaveBeenCalledWith({ orderId: 'order-1', policyOverride: 'SHIP_PARTIAL' });
    expect(mockExecuteFulfillmentPlan).toHaveBeenCalled();
    expect(mockCreateProformaInvoice).not.toHaveBeenCalled();
  });

  it('generates proforma for PREPAY customer', async () => {
    setupSuccessfulCheckout('PREPAY');

    const result = await checkoutQuote(QUOTE_ID, USER_ID, COMPANY_ID, DEFAULT_OPTIONS);

    expect(result.success).toBe(true);
    expect(result.paymentRequired).toBe(true);
    expect(result.fulfillmentTriggered).toBe(false);
    expect(result.proformaGenerated).toBe(true);
    expect(mockCreateProformaInvoice).toHaveBeenCalled();
    expect(mockGenerateFulfillmentPlan).not.toHaveBeenCalled();
  });

  it('generates proforma for COD customer', async () => {
    setupSuccessfulCheckout('COD');

    const result = await checkoutQuote(QUOTE_ID, USER_ID, COMPANY_ID, DEFAULT_OPTIONS);

    expect(result.success).toBe(true);
    expect(result.paymentRequired).toBe(true);
    expect(result.proformaGenerated).toBe(true);
  });

  // ---- Quote status transitions ----

  it('sets quote to ACCEPTED before creating order', async () => {
    setupSuccessfulCheckout('NET_30');

    await checkoutQuote(QUOTE_ID, USER_ID, COMPANY_ID, DEFAULT_OPTIONS);

    expect(mockPrisma.quote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: QUOTE_ID },
        data: expect.objectContaining({ status: 'ACCEPTED' }),
      })
    );
  });

  // ---- Error handling ----

  it('returns error when order creation fails', async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(makeQuote());
    mockPrisma.quote.update.mockResolvedValue({});
    mockCreateOrderFromQuote.mockResolvedValue({
      success: false,
      error: 'Quote has no items',
    });

    const result = await checkoutQuote(QUOTE_ID, USER_ID, COMPANY_ID, DEFAULT_OPTIONS);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quote has no items');
  });

  it('still returns success when auto-confirm fails (order exists)', async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(makeQuote());
    mockPrisma.quote.update.mockResolvedValue({});
    mockCreateOrderFromQuote.mockResolvedValue({
      success: true,
      order: { id: 'order-1', orderNumber: 'SO-2026-00001' },
    });
    mockConfirmOrder.mockResolvedValue({ success: false, error: 'Confirm failed' });

    const result = await checkoutQuote(QUOTE_ID, USER_ID, COMPANY_ID, DEFAULT_OPTIONS);

    expect(result.success).toBe(true);
    expect(result.orderId).toBe('order-1');
    expect(result.fulfillmentTriggered).toBe(false);
  });
});
