import { Prisma, QuoteStatus, CustomerTier, Warehouse } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { calculateCustomerPrice } from './pricing.service';
import { createSoftReservation, releaseReservationsByReference } from './inventory.service';
import { createOrderFromQuote, confirmOrder } from './order.service';
import { generateFulfillmentPlan, executeFulfillmentPlan } from './orchestration.service';
import { createProformaInvoice } from './proforma-invoice.service';
import { generateQuoteNumber } from '../utils/number-generation';
import { roundTo2 } from '../utils/math';

/**
 * VAT rate for South Africa (%)
 */
export const VAT_RATE = 15;

/**
 * Quote validity period in days
 */
export const QUOTE_VALIDITY_DAYS = 30;

/**
 * Generate the next quote number in format QUO-YYYY-NNNNN
 */

/**
 * Calculate quote totals from items
 */
export function calculateQuoteTotals(items: Array<{ unitPrice: Decimal | number; quantity: number }>) {
  let subtotal = 0;

  for (const item of items) {
    const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : Number(item.unitPrice);
    subtotal += unitPrice * item.quantity;
  }

  const vatAmount = roundTo2(subtotal * (VAT_RATE / 100));
  const total = roundTo2(subtotal + vatAmount);

  return {
    subtotal: roundTo2(subtotal),
    vatRate: VAT_RATE,
    vatAmount,
    total,
  };
}

/**
 * Get or create a DRAFT quote for the user
 */
export async function getOrCreateDraftQuote(
  userId: string,
  companyId: string,
  customerTier: CustomerTier
): Promise<{ id: string; quoteNumber: string; isNew: boolean }> {
  // Find existing draft
  const existingDraft = await prisma.quote.findFirst({
    where: {
      userId,
      companyId,
      status: 'DRAFT',
      deletedAt: null,
    },
    select: { id: true, quoteNumber: true },
  });

  if (existingDraft) {
    // Update last activity
    await prisma.quote.update({
      where: { id: existingDraft.id },
      data: { lastActivityAt: new Date() },
    });
    return { ...existingDraft, isNew: false };
  }

  // Create new draft
  const quoteNumber = await generateQuoteNumber();
  const newQuote = await prisma.quote.create({
    data: {
      quoteNumber,
      companyId,
      userId,
      customerTier,
      createdBy: userId,
    },
    select: { id: true, quoteNumber: true },
  });

  return { ...newQuote, isNew: true };
}

/**
 * Check if requested quantity exceeds available stock across all warehouses.
 * Returns warning info if over-stocked, or null if stock is sufficient.
 */
async function checkStockWarning(productId: string, requestedQuantity: number): Promise<{ available: number; requested: number } | null> {
  const stockLevels = await prisma.stockLevel.findMany({
    where: { productId },
    select: { onHand: true, hardReserved: true },
  });
  const totalAvailable = stockLevels.reduce((sum, sl) => sum + (sl.onHand - sl.hardReserved), 0);
  if (requestedQuantity > totalAvailable) {
    return { available: Math.max(0, totalAvailable), requested: requestedQuantity };
  }
  return null;
}

/**
 * Add item to quote
 * Optimized: Fetches quote without items, checks for existing item directly via DB query
 */
export async function addQuoteItem(
  quoteId: string,
  productId: string,
  quantity: number,
  userId: string,
  companyId?: string
): Promise<{
  success: boolean;
  item?: { id: string; lineNumber: number; quantity: number; unitPrice: number; lineTotal: number; stockWarning?: { available: number; requested: number } };
  error?: string;
}> {
  // Parallel fetch: quote (without items) and product
  const [quote, product] = await Promise.all([
    prisma.quote.findUnique({
      where: { id: quoteId },
      select: {
        id: true,
        status: true,
        customerTier: true,
        deletedAt: true,
        companyId: true,
      },
    }),
    prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        nusafSku: true,
        description: true,
        listPrice: true,
        isActive: true,
        deletedAt: true,
      },
    }),
  ]);

  if (!quote) {
    return { success: false, error: 'Quote not found' };
  }

  // Company isolation check (if companyId provided)
  if (companyId && quote.companyId !== companyId) {
    return { success: false, error: 'Quote not found' };
  }

  if (quote.status !== 'DRAFT') {
    return { success: false, error: 'Only DRAFT quotes can be modified' };
  }

  if (quote.deletedAt) {
    return { success: false, error: 'Quote has been deleted' };
  }

  if (!product || !product.isActive || product.deletedAt) {
    return { success: false, error: 'Product not found or inactive' };
  }

  if (!product.listPrice) {
    return { success: false, error: 'Product has no price' };
  }

  // Calculate unit price based on customer tier
  const listPrice = Number(product.listPrice);
  const unitPrice = calculateCustomerPrice(listPrice, quote.customerTier);
  const lineTotal = roundTo2(unitPrice * quantity);

  // Check if product already in quote (uses composite index)
  const existingItem = await prisma.quoteItem.findFirst({
    where: { quoteId, productId },
    select: { id: true, lineNumber: true, quantity: true },
  });

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + quantity;
    const newLineTotal = roundTo2(unitPrice * newQuantity);

    const updatedItem = await prisma.quoteItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: newQuantity,
        unitPrice: new Decimal(unitPrice),
        lineTotal: new Decimal(newLineTotal),
      },
    });

    // Recalculate totals using DB aggregation
    await recalculateQuoteTotalsOptimized(quoteId, userId);

    // Check available stock for warning
    const stockWarning = await checkStockWarning(productId, updatedItem.quantity);

    return {
      success: true,
      item: {
        id: updatedItem.id,
        lineNumber: updatedItem.lineNumber,
        quantity: updatedItem.quantity,
        unitPrice,
        lineTotal: newLineTotal,
        ...(stockWarning ? { stockWarning } : {}),
      },
    };
  }

  // Get max line number (single aggregate query)
  const maxLineResult = await prisma.quoteItem.aggregate({
    where: { quoteId },
    _max: { lineNumber: true },
  });
  const maxLineNumber = maxLineResult._max.lineNumber ?? 0;

  const newItem = await prisma.quoteItem.create({
    data: {
      quoteId,
      lineNumber: maxLineNumber + 1,
      productId,
      productSku: product.nusafSku,
      productDescription: product.description,
      quantity,
      unitPrice: new Decimal(unitPrice),
      lineTotal: new Decimal(lineTotal),
    },
  });

  // Recalculate totals using DB aggregation
  await recalculateQuoteTotalsOptimized(quoteId, userId);

  // Check available stock for warning
  const stockWarning = await checkStockWarning(productId, newItem.quantity);

  return {
    success: true,
    item: {
      id: newItem.id,
      lineNumber: newItem.lineNumber,
      quantity: newItem.quantity,
      unitPrice,
      lineTotal,
      ...(stockWarning ? { stockWarning } : {}),
    },
  };
}

/**
 * Update quote item quantity
 */
export async function updateQuoteItemQuantity(
  quoteId: string,
  itemId: string,
  quantity: number,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (quantity < 1) {
    return { success: false, error: 'Quantity must be at least 1' };
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: { where: { id: itemId } } },
  });

  if (!quote) {
    return { success: false, error: 'Quote not found' };
  }

  if (quote.status !== 'DRAFT') {
    return { success: false, error: 'Only DRAFT quotes can be modified' };
  }

  const item = quote.items[0];
  if (!item) {
    return { success: false, error: 'Item not found' };
  }

  const unitPrice = Number(item.unitPrice);
  const lineTotal = roundTo2(unitPrice * quantity);

  await prisma.quoteItem.update({
    where: { id: itemId },
    data: {
      quantity,
      lineTotal: new Decimal(lineTotal),
    },
  });

  await recalculateQuoteTotals(quoteId, userId);

  return { success: true };
}

/**
 * Remove item from quote
 */
export async function removeQuoteItem(
  quoteId: string,
  itemId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
  });

  if (!quote) {
    return { success: false, error: 'Quote not found' };
  }

  if (quote.status !== 'DRAFT') {
    return { success: false, error: 'Only DRAFT quotes can be modified' };
  }

  await prisma.quoteItem.delete({
    where: { id: itemId },
  });

  await recalculateQuoteTotals(quoteId, userId);

  return { success: true };
}

/**
 * Recalculate and save quote totals
 */
export async function recalculateQuoteTotals(quoteId: string, userId?: string): Promise<void> {
  const items = await prisma.quoteItem.findMany({
    where: { quoteId },
    select: { unitPrice: true, quantity: true },
  });

  const { subtotal, vatRate, vatAmount, total } = calculateQuoteTotals(items);

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      subtotal: new Decimal(subtotal),
      vatRate: new Decimal(vatRate),
      vatAmount: new Decimal(vatAmount),
      total: new Decimal(total),
      lastActivityAt: new Date(),
      updatedBy: userId,
    },
  });
}

/**
 * Recalculate quote totals using DB aggregation (optimized)
 * Uses SUM(line_total) instead of fetching all items
 */
export async function recalculateQuoteTotalsOptimized(quoteId: string, userId?: string): Promise<void> {
  // Use DB aggregation to sum line totals directly
  const result = await prisma.quoteItem.aggregate({
    where: { quoteId },
    _sum: { lineTotal: true },
  });

  const subtotal = result._sum.lineTotal ? Number(result._sum.lineTotal) : 0;
  const vatAmount = roundTo2(subtotal * (VAT_RATE / 100));
  const total = roundTo2(subtotal + vatAmount);

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      subtotal: new Decimal(subtotal),
      vatRate: new Decimal(VAT_RATE),
      vatAmount: new Decimal(vatAmount),
      total: new Decimal(total),
      lastActivityAt: new Date(),
      updatedBy: userId,
    },
  });
}

/**
 * Finalize quote - change status from DRAFT to CREATED
 * Also creates soft reservations for all quote items
 */
export async function finalizeQuote(
  quoteId: string,
  userId: string,
  options?: { warehouse?: Warehouse }
): Promise<{ success: boolean; error?: string; quote?: { id: string; quoteNumber: string; validUntil: Date } }> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true },
  });

  if (!quote) {
    return { success: false, error: 'Quote not found' };
  }

  if (quote.status !== 'DRAFT') {
    return { success: false, error: 'Only DRAFT quotes can be finalized' };
  }

  if (quote.items.length === 0) {
    return { success: false, error: 'Cannot finalize an empty quote' };
  }

  // Calculate validity date (30 days from now)
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + QUOTE_VALIDITY_DAYS);

  const updatedQuote = await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: 'CREATED',
      validUntil,
      finalizedAt: new Date(),
      lastActivityAt: new Date(),
      updatedBy: userId,
    },
    select: { id: true, quoteNumber: true, validUntil: true },
  });

  // Create soft reservations for all quote items
  // Default to JHB warehouse if not specified
  const warehouse = options?.warehouse ?? 'JHB';

  for (const item of quote.items) {
    await createSoftReservation(
      {
        productId: item.productId,
        location: warehouse,
        quantity: item.quantity,
        referenceType: 'Quote',
        referenceId: quoteId,
        referenceNumber: updatedQuote.quoteNumber,
        expiresAt: validUntil,
      },
      userId
    );
  }

  return {
    success: true,
    quote: {
      id: updatedQuote.id,
      quoteNumber: updatedQuote.quoteNumber,
      validUntil: updatedQuote.validUntil!,
    },
  };
}

/**
 * Accept quote - change status from CREATED to ACCEPTED, then auto-create Sales Order.
 * For account customers (NET_30/60/90): auto-confirm → generate fulfillment → execute fulfillment
 * For prepay customers (PREPAY/COD): auto-confirm → generate proforma → STOP (wait for payment)
 */
export async function acceptQuote(
  quoteId: string,
  userId: string
): Promise<{
  success: boolean;
  error?: string;
  orderId?: string;
  orderNumber?: string;
  fulfillmentTriggered?: boolean;
  proformaGenerated?: boolean;
}> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
  });

  if (!quote) {
    return { success: false, error: 'Quote not found' };
  }

  if (quote.status !== 'CREATED') {
    return { success: false, error: 'Only CREATED quotes can be accepted' };
  }

  // Check if expired
  if (quote.validUntil && new Date() > quote.validUntil) {
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'EXPIRED', updatedBy: userId },
    });
    // Release soft reservations for expired quote
    await releaseReservationsByReference('Quote', quoteId, 'Quote expired', userId);
    return { success: false, error: 'Quote has expired' };
  }

  // Set status to ACCEPTED first
  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: 'ACCEPTED',
      lastActivityAt: new Date(),
      updatedBy: userId,
    },
  });

  // Auto-create Sales Order from the accepted quote
  let orderId: string | undefined;
  let orderNumber: string | undefined;

  try {
    const orderResult = await createOrderFromQuote(quoteId, userId, quote.companyId);

    if (!orderResult.success || !orderResult.order) {
      // Order creation failed — quote stays ACCEPTED for manual retry
      console.error('Auto order creation failed after quote acceptance:', orderResult.error);
      return { success: true }; // Quote acceptance still succeeded
    }

    orderId = orderResult.order.id;
    orderNumber = orderResult.order.orderNumber;
  } catch (error) {
    // Order creation threw — quote stays ACCEPTED for manual retry
    console.error('Auto order creation error after quote acceptance:', error);
    return { success: true }; // Quote acceptance still succeeded
  }

  // Order created successfully — now auto-confirm and trigger downstream actions
  let fulfillmentTriggered = false;
  let proformaGenerated = false;

  // Step 1: Auto-confirm order (DRAFT → CONFIRMED)
  try {
    const confirmResult = await confirmOrder(orderId, userId, quote.companyId);
    if (!confirmResult.success) {
      console.error(`Order ${orderNumber}: auto-confirm failed — ${confirmResult.error}. Staff can retry manually.`);
      return { success: true, orderId, orderNumber, fulfillmentTriggered: false, proformaGenerated: false };
    }
  } catch (error) {
    console.error(`Order ${orderNumber}: auto-confirm error:`, error);
    return { success: true, orderId, orderNumber, fulfillmentTriggered: false, proformaGenerated: false };
  }

  // Step 2: Read the order to determine payment terms
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
    select: { paymentTerms: true },
  });

  const paymentTerms = order?.paymentTerms ?? 'NET_30';
  const isAccountCustomer = !['PREPAY', 'COD'].includes(paymentTerms);

  if (isAccountCustomer) {
    // Account customer (NET_30/60/90): auto-trigger fulfillment
    try {
      const planResult = await generateFulfillmentPlan({ orderId });

      if (!planResult.success || !planResult.data) {
        console.error(`Account order ${orderNumber}: fulfillment plan generation failed — ${planResult.error}. Staff can retry manually.`);
        return { success: true, orderId, orderNumber, fulfillmentTriggered: false, proformaGenerated: false };
      }

      const execResult = await executeFulfillmentPlan({
        plan: planResult.data,
        userId,
        companyId: quote.companyId,
      });

      if (execResult.success && execResult.data) {
        const docs = execResult.data.createdDocuments;
        console.log(
          `Account order ${orderNumber}: auto-fulfillment triggered — ` +
          `${docs.pickingSlips.length} picking slips, ${docs.jobCards.length} job cards, ${docs.transferRequests.length} transfers`
        );
        fulfillmentTriggered = true;
      } else {
        console.error(`Account order ${orderNumber}: fulfillment execution failed — ${execResult.error}. Staff can retry manually.`);
      }
    } catch (error) {
      console.error(`Account order ${orderNumber}: fulfillment error:`, error);
      // Order stays CONFIRMED, staff can manually trigger fulfillment
    }
  } else {
    // Prepay/COD customer: auto-generate proforma invoice
    try {
      const proformaResult = await createProformaInvoice(
        orderId,
        { paymentTerms: paymentTerms === 'COD' ? 'Cash on Delivery' : 'Prepay — payment required before fulfillment' },
        userId,
        quote.companyId
      );

      if (proformaResult.success && proformaResult.proformaInvoice) {
        console.log(`Prepay order ${orderNumber}: proforma ${proformaResult.proformaInvoice.proformaNumber} generated`);
        proformaGenerated = true;
      } else {
        console.error(`Prepay order ${orderNumber}: proforma generation failed — ${proformaResult.error}. Staff can generate manually.`);
      }
    } catch (error) {
      console.error(`Prepay order ${orderNumber}: proforma generation error:`, error);
      // Order stays CONFIRMED, staff can manually generate proforma
    }
  }

  return { success: true, orderId, orderNumber, fulfillmentTriggered, proformaGenerated };
}

/**
 * Reject quote - change status from CREATED to REJECTED
 * Also releases any soft reservations
 */
export async function rejectQuote(
  quoteId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
  });

  if (!quote) {
    return { success: false, error: 'Quote not found' };
  }

  if (quote.status !== 'CREATED') {
    return { success: false, error: 'Only CREATED quotes can be rejected' };
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: 'REJECTED',
      lastActivityAt: new Date(),
      updatedBy: userId,
    },
  });

  // Release soft reservations
  await releaseReservationsByReference('Quote', quoteId, 'Quote rejected', userId);

  return { success: true };
}

/**
 * Get quotes with pagination and filtering.
 * companyId is optional — when undefined, returns quotes across all companies (for staff).
 * userId is optional — when provided, filters to quotes created by that user.
 */
export async function getQuotes(options: {
  companyId?: string;
  userId?: string;
  status?: QuoteStatus;
  page?: number;
  pageSize?: number;
}): Promise<{
  quotes: Array<{
    id: string;
    quoteNumber: string;
    status: QuoteStatus;
    itemCount: number;
    total: number;
    validUntil: Date | null;
    createdAt: Date;
    companyName?: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const { companyId, userId, status, page = 1, pageSize = 20 } = options;

  const where: Prisma.QuoteWhereInput = {
    ...(companyId ? { companyId } : {}),
    ...(userId ? { userId } : {}),
    deletedAt: null,
  };

  if (status) {
    where.status = status;
  }

  const [total, quotes] = await Promise.all([
    prisma.quote.count({ where }),
    prisma.quote.findMany({
      where,
      include: {
        _count: { select: { items: true } },
        company: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    quotes: quotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      status: q.status,
      itemCount: q._count.items,
      total: Number(q.total),
      validUntil: q.validUntil,
      createdAt: q.createdAt,
      companyName: q.company.name,
    })),
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get quote details.
 * companyId is optional — when undefined, skips company isolation (for staff access).
 */
export async function getQuoteById(quoteId: string, companyId?: string) {
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      ...(companyId ? { companyId } : {}), // Company isolation (skipped for staff)
      deletedAt: null,
    },
    include: {
      items: {
        orderBy: { lineNumber: 'asc' },
      },
      company: {
        select: { id: true, name: true },
      },
    },
  });

  if (!quote) {
    return null;
  }

  // Find converted order if quote is ACCEPTED or CONVERTED
  let convertedOrder: { id: string; orderNumber: string } | null = null;
  if (quote.status === 'ACCEPTED' || quote.status === 'CONVERTED') {
    const order = await prisma.salesOrder.findFirst({
      where: { quoteId },
      select: { id: true, orderNumber: true },
    });
    if (order) {
      convertedOrder = order;
    }
  }

  // Check stock warnings for DRAFT quotes
  const stockWarnings = new Map<string, { available: number; requested: number }>();
  if (quote.status === 'DRAFT' && quote.items.length > 0) {
    const productIds = quote.items.map((item) => item.productId);
    const stockLevels = await prisma.stockLevel.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, onHand: true, hardReserved: true },
    });
    // Sum available per product across warehouses
    const availableMap = new Map<string, number>();
    for (const sl of stockLevels) {
      const current = availableMap.get(sl.productId) ?? 0;
      availableMap.set(sl.productId, current + (sl.onHand - sl.hardReserved));
    }
    for (const item of quote.items) {
      const available = Math.max(0, availableMap.get(item.productId) ?? 0);
      if (item.quantity > available) {
        stockWarnings.set(item.productId, { available, requested: item.quantity });
      }
    }
  }

  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    customerTier: quote.customerTier,
    company: quote.company,
    items: quote.items.map((item) => {
      const warning = stockWarnings.get(item.productId);
      return {
        id: item.id,
        lineNumber: item.lineNumber,
        productId: item.productId,
        productSku: item.productSku,
        productDescription: item.productDescription,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        ...(warning ? { stockWarning: warning } : {}),
      };
    }),
    subtotal: Number(quote.subtotal),
    vatRate: Number(quote.vatRate),
    vatAmount: Number(quote.vatAmount),
    total: Number(quote.total),
    customerNotes: quote.customerNotes,
    validUntil: quote.validUntil,
    finalizedAt: quote.finalizedAt,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
    convertedOrder,
  };
}

/**
 * Get active draft quote for cart display
 */
export async function getActiveDraftQuote(userId: string, companyId: string) {
  const draft = await prisma.quote.findFirst({
    where: {
      userId,
      companyId,
      status: 'DRAFT',
      deletedAt: null,
    },
    include: {
      items: {
        orderBy: { lineNumber: 'asc' },
        select: {
          id: true,
          lineNumber: true,
          productId: true,
          productSku: true,
          productDescription: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
        },
      },
    },
  });

  if (!draft) {
    return null;
  }

  return {
    id: draft.id,
    quoteNumber: draft.quoteNumber,
    itemCount: draft.items.length,
    items: draft.items.map((item) => ({
      id: item.id,
      lineNumber: item.lineNumber,
      productId: item.productId,
      productSku: item.productSku,
      productDescription: item.productDescription,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
    subtotal: Number(draft.subtotal),
    vatAmount: Number(draft.vatAmount),
    total: Number(draft.total),
  };
}

/**
 * Update quote customer notes
 */
export async function updateQuoteNotes(
  quoteId: string,
  notes: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
  });

  if (!quote) {
    return { success: false, error: 'Quote not found' };
  }

  if (quote.status !== 'DRAFT') {
    return { success: false, error: 'Only DRAFT quotes can be modified' };
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      customerNotes: notes,
      lastActivityAt: new Date(),
      updatedBy: userId,
    },
  });

  return { success: true };
}

/**
 * Delete a quote (soft delete, DRAFT only).
 * companyId is optional — when undefined, skips company isolation (for staff access).
 */
export async function deleteQuote(
  quoteId: string,
  userId: string,
  companyId?: string
): Promise<{ success: boolean; error?: string }> {
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      ...(companyId ? { companyId } : {}),
      deletedAt: null,
    },
  });

  if (!quote) {
    return { success: false, error: 'Quote not found' };
  }

  if (quote.status !== 'DRAFT') {
    return { success: false, error: 'Only DRAFT quotes can be deleted' };
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      deletedAt: new Date(),
      deletedBy: userId,
    },
  });

  return { success: true };
}

// Utility function for rounding
