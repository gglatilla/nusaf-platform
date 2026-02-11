import { Prisma, ProformaInvoiceStatus } from '@prisma/client';
import { prisma } from '../config/database';
import type {
  CreateProformaInvoiceInput,
} from '../utils/validation/proforma-invoices';
import { generateProformaNumber } from '../utils/number-generation';
import { resolveCustomerName } from '../utils/cash-customer';

// ============================================
// TYPES
// ============================================

export interface ProformaInvoiceData {
  id: string;
  proformaNumber: string;
  companyId?: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPoNumber: string | null;
  billingAddress: string | null;
  status: ProformaInvoiceStatus;
  issueDate: Date;
  validUntil: Date;
  paymentTerms: string;
  subtotal: Prisma.Decimal;
  vatRate: Prisma.Decimal;
  vatAmount: Prisma.Decimal;
  total: Prisma.Decimal;
  voidedAt: Date | null;
  voidedBy: string | null;
  voidReason: string | null;
  notes: string | null;
  lines: ProformaInvoiceLineData[];
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
}

export interface ProformaInvoiceLineData {
  id: string;
  orderLineId: string;
  lineNumber: number;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
}

export interface ProformaInvoiceSummary {
  id: string;
  proformaNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  status: ProformaInvoiceStatus;
  issueDate: Date;
  total: Prisma.Decimal;
  createdAt: Date;
}

// ============================================
// NUMBER GENERATION
// ============================================

/**
 * Generate the next proforma invoice number in format PI-YYYY-NNNNN
 */

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Create a proforma invoice from a confirmed sales order.
 * Auto-voids any existing ACTIVE proforma for the same order.
 * Snapshots order data + lines with pricing.
 */
export async function createProformaInvoice(
  orderId: string,
  input: CreateProformaInvoiceInput,
  userId: string,
  companyId?: string
): Promise<{ success: boolean; proformaInvoice?: { id: string; proformaNumber: string }; error?: string }> {
  // Validate the order exists and is CONFIRMED
  const orderWhere: Prisma.SalesOrderWhereInput = { id: orderId, deletedAt: null };
  if (companyId) orderWhere.companyId = companyId;
  const order = await prisma.salesOrder.findFirst({
    where: orderWhere,
    include: {
      company: {
        select: {
          name: true,
          addresses: {
            where: { type: 'BILLING' },
            take: 1,
          },
        },
      },
      lines: {
        orderBy: { lineNumber: 'asc' },
      },
    },
  });

  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.status !== 'CONFIRMED') {
    return {
      success: false,
      error: `Cannot create proforma invoice for an order with status ${order.status}. Order must be Confirmed.`,
    };
  }

  if (order.lines.length === 0) {
    return { success: false, error: 'Order has no line items' };
  }

  // Format billing address as a single string snapshot
  const billingAddr = order.company.addresses[0];
  const billingAddress = billingAddr
    ? [billingAddr.line1, billingAddr.line2, billingAddr.city, billingAddr.province, billingAddr.postalCode, billingAddr.country]
        .filter(Boolean)
        .join(', ')
    : null;

  // Lookup UoM for each product on the order lines
  const productIds = order.lines.map((l) => l.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, unitOfMeasure: true },
  });
  const uomMap = new Map(products.map((p) => [p.id, p.unitOfMeasure]));

  // Derive companyId from the order when not provided
  const resolvedCompanyId = companyId ?? order.companyId;

  const proformaNumber = await generateProformaNumber();
  const issueDate = new Date();
  const validUntil = new Date(issueDate);
  validUntil.setDate(validUntil.getDate() + 30);

  const proformaInvoice = await prisma.$transaction(async (tx) => {
    // Auto-void any existing ACTIVE proforma for this order
    const voidWhere: Prisma.ProformaInvoiceWhereInput = { orderId, status: 'ACTIVE' };
    if (companyId) voidWhere.companyId = companyId;
    await tx.proformaInvoice.updateMany({
      where: voidWhere,
      data: {
        status: 'VOIDED',
        voidedAt: new Date(),
        voidedBy: userId,
        voidReason: 'Superseded by new proforma invoice',
      },
    });

    // Create the proforma invoice
    const pi = await tx.proformaInvoice.create({
      data: {
        proformaNumber,
        companyId: resolvedCompanyId,
        orderId,
        orderNumber: order.orderNumber,
        customerName: resolveCustomerName(order),
        customerPoNumber: order.customerPoNumber,
        billingAddress,
        status: 'ACTIVE',
        issueDate,
        validUntil,
        paymentTerms: input.paymentTerms || 'Payment required before shipment',
        subtotal: order.subtotal,
        vatRate: order.vatRate,
        vatAmount: order.vatAmount,
        total: order.total,
        notes: input.notes || null,
        createdBy: userId,
      },
    });

    // Create line items from order lines
    const lineData = order.lines.map((line, index) => ({
      proformaInvoiceId: pi.id,
      orderLineId: line.id,
      lineNumber: index + 1,
      productSku: line.productSku,
      productDescription: line.productDescription,
      unitOfMeasure: uomMap.get(line.productId) || 'EA',
      quantity: line.quantityOrdered,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    }));

    await tx.proformaInvoiceLine.createMany({ data: lineData });

    return pi;
  });

  return {
    success: true,
    proformaInvoice: {
      id: proformaInvoice.id,
      proformaNumber: proformaInvoice.proformaNumber,
    },
  };
}

/**
 * Get a proforma invoice by ID with lines
 */
export async function getProformaInvoiceById(
  id: string,
  companyId?: string
): Promise<ProformaInvoiceData | null> {
  const where: Prisma.ProformaInvoiceWhereInput = { id };
  if (companyId) where.companyId = companyId;
  const pi = await prisma.proformaInvoice.findFirst({
    where,
    include: {
      lines: { orderBy: { lineNumber: 'asc' } },
    },
  });

  if (!pi) return null;

  return {
    id: pi.id,
    proformaNumber: pi.proformaNumber,
    companyId: pi.companyId,
    orderId: pi.orderId,
    orderNumber: pi.orderNumber,
    customerName: pi.customerName,
    customerPoNumber: pi.customerPoNumber,
    billingAddress: pi.billingAddress,
    status: pi.status,
    issueDate: pi.issueDate,
    validUntil: pi.validUntil,
    paymentTerms: pi.paymentTerms,
    subtotal: pi.subtotal,
    vatRate: pi.vatRate,
    vatAmount: pi.vatAmount,
    total: pi.total,
    voidedAt: pi.voidedAt,
    voidedBy: pi.voidedBy,
    voidReason: pi.voidReason,
    notes: pi.notes,
    lines: pi.lines.map((line) => ({
      id: line.id,
      orderLineId: line.orderLineId,
      lineNumber: line.lineNumber,
      productSku: line.productSku,
      productDescription: line.productDescription,
      unitOfMeasure: line.unitOfMeasure,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    })),
    createdAt: pi.createdAt,
    createdBy: pi.createdBy,
    updatedAt: pi.updatedAt,
  };
}

/**
 * Get proforma invoices for a specific order (for order detail page)
 */
export async function getProformaInvoicesForOrder(
  orderId: string,
  companyId?: string
): Promise<ProformaInvoiceSummary[]> {
  const orderWhere: Prisma.ProformaInvoiceWhereInput = { orderId };
  if (companyId) orderWhere.companyId = companyId;
  const proformas = await prisma.proformaInvoice.findMany({
    where: orderWhere,
    orderBy: { createdAt: 'desc' },
  });

  return proformas.map((pi) => ({
    id: pi.id,
    proformaNumber: pi.proformaNumber,
    orderId: pi.orderId,
    orderNumber: pi.orderNumber,
    customerName: pi.customerName,
    status: pi.status,
    issueDate: pi.issueDate,
    total: pi.total,
    createdAt: pi.createdAt,
  }));
}

/**
 * Void a proforma invoice (ACTIVE → VOIDED)
 */
export async function voidProformaInvoice(
  id: string,
  userId: string,
  reason: string,
  companyId?: string
): Promise<{ success: boolean; error?: string }> {
  const voidWhere: Prisma.ProformaInvoiceWhereInput = { id };
  if (companyId) voidWhere.companyId = companyId;
  const pi = await prisma.proformaInvoice.findFirst({
    where: voidWhere,
  });

  if (!pi) {
    return { success: false, error: 'Proforma invoice not found' };
  }

  if (pi.status !== 'ACTIVE') {
    return { success: false, error: `Cannot void a proforma invoice with status ${pi.status}` };
  }

  await prisma.proformaInvoice.update({
    where: { id },
    data: {
      status: 'VOIDED',
      voidedAt: new Date(),
      voidedBy: userId,
      voidReason: reason,
    },
  });

  return { success: true };
}
