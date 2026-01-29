import { Prisma, QuoteStatus, CustomerTier } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { calculateCustomerPrice } from './pricing.service';

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
export async function generateQuoteNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Use a transaction to safely increment the counter
  const counter = await prisma.$transaction(async (tx) => {
    // Get or create the counter record
    let counter = await tx.quoteCounter.findUnique({
      where: { id: 'quote_counter' },
    });

    if (!counter) {
      // Initialize counter for this year
      counter = await tx.quoteCounter.create({
        data: {
          id: 'quote_counter',
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    // If year changed, reset counter
    if (counter.year !== currentYear) {
      counter = await tx.quoteCounter.update({
        where: { id: 'quote_counter' },
        data: {
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    // Increment counter for same year
    counter = await tx.quoteCounter.update({
      where: { id: 'quote_counter' },
      data: {
        count: { increment: 1 },
      },
    });

    return counter;
  });

  // Format: QUO-2025-00001
  const paddedCount = counter.count.toString().padStart(5, '0');
  return `QUO-${currentYear}-${paddedCount}`;
}

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
 * Add item to quote
 */
export async function addQuoteItem(
  quoteId: string,
  productId: string,
  quantity: number,
  userId: string
): Promise<{
  success: boolean;
  item?: { id: string; lineNumber: number; quantity: number; unitPrice: number; lineTotal: number };
  error?: string;
}> {
  // Get quote
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true, company: true },
  });

  if (!quote) {
    return { success: false, error: 'Quote not found' };
  }

  if (quote.status !== 'DRAFT') {
    return { success: false, error: 'Only DRAFT quotes can be modified' };
  }

  if (quote.deletedAt) {
    return { success: false, error: 'Quote has been deleted' };
  }

  // Get product
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

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

  // Check if product already in quote
  const existingItem = quote.items.find((item) => item.productId === productId);

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

    // Recalculate totals
    await recalculateQuoteTotals(quoteId, userId);

    return {
      success: true,
      item: {
        id: updatedItem.id,
        lineNumber: updatedItem.lineNumber,
        quantity: updatedItem.quantity,
        unitPrice,
        lineTotal: newLineTotal,
      },
    };
  }

  // Add new item
  const maxLineNumber = quote.items.length > 0 ? Math.max(...quote.items.map((i) => i.lineNumber)) : 0;

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

  // Recalculate totals
  await recalculateQuoteTotals(quoteId, userId);

  return {
    success: true,
    item: {
      id: newItem.id,
      lineNumber: newItem.lineNumber,
      quantity: newItem.quantity,
      unitPrice,
      lineTotal,
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
 * Finalize quote - change status from DRAFT to CREATED
 */
export async function finalizeQuote(
  quoteId: string,
  userId: string
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
 * Accept quote - change status from CREATED to ACCEPTED
 */
export async function acceptQuote(
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
    return { success: false, error: 'Only CREATED quotes can be accepted' };
  }

  // Check if expired
  if (quote.validUntil && new Date() > quote.validUntil) {
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'EXPIRED', updatedBy: userId },
    });
    return { success: false, error: 'Quote has expired' };
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: 'ACCEPTED',
      lastActivityAt: new Date(),
      updatedBy: userId,
    },
  });

  return { success: true };
}

/**
 * Reject quote - change status from CREATED to REJECTED
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

  return { success: true };
}

/**
 * Get quotes for a company with pagination and filtering
 */
export async function getQuotes(options: {
  companyId: string;
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
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const { companyId, status, page = 1, pageSize = 20 } = options;

  const where: Prisma.QuoteWhereInput = {
    companyId,
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
 * Get quote details
 */
export async function getQuoteById(quoteId: string, companyId: string) {
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      companyId, // Company isolation
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

  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    customerTier: quote.customerTier,
    company: quote.company,
    items: quote.items.map((item) => ({
      id: item.id,
      lineNumber: item.lineNumber,
      productId: item.productId,
      productSku: item.productSku,
      productDescription: item.productDescription,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
    subtotal: Number(quote.subtotal),
    vatRate: Number(quote.vatRate),
    vatAmount: Number(quote.vatAmount),
    total: Number(quote.total),
    customerNotes: quote.customerNotes,
    validUntil: quote.validUntil,
    finalizedAt: quote.finalizedAt,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
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
 * Delete a quote (soft delete, DRAFT only)
 */
export async function deleteQuote(
  quoteId: string,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      companyId,
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
function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}
