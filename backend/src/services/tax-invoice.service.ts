import { Prisma, TaxInvoiceStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { generateInvoiceNumber } from '../utils/number-generation';

// ============================================
// TYPES
// ============================================

export interface TaxInvoiceData {
  id: string;
  invoiceNumber: string;
  companyId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerVatNumber: string | null;
  customerRegNumber: string | null;
  billingAddress: string | null;
  status: TaxInvoiceStatus;
  issueDate: Date;
  dueDate: Date | null;
  paymentTerms: string;
  subtotal: Prisma.Decimal;
  vatRate: Prisma.Decimal;
  vatAmount: Prisma.Decimal;
  total: Prisma.Decimal;
  pdfUrl: string | null;
  voidedAt: Date | null;
  voidedBy: string | null;
  voidReason: string | null;
  notes: string | null;
  issuedBy: string;
  issuedByName: string;
  lines: TaxInvoiceLineData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxInvoiceLineData {
  id: string;
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
}

export interface TaxInvoiceSummary {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  status: TaxInvoiceStatus;
  issueDate: Date;
  dueDate: Date | null;
  paymentTerms: string;
  total: Prisma.Decimal;
  createdAt: Date;
}

// ============================================
// NUMBER GENERATION
// ============================================

/**
 * Generate the next tax invoice number in format INV-YYYY-NNNNN
 */

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Create a tax invoice from a delivered sales order.
 * Snapshots order data + lines with pricing.
 * Auto-sets status to ISSUED.
 */
export async function createTaxInvoice(
  orderId: string,
  userId: string,
  companyId: string,
  notes?: string
): Promise<{ success: boolean; taxInvoice?: { id: string; invoiceNumber: string }; error?: string }> {
  // Validate the order exists
  const order = await prisma.salesOrder.findFirst({
    where: {
      id: orderId,
      companyId,
      deletedAt: null,
    },
    include: {
      company: {
        select: {
          name: true,
          vatNumber: true,
          registrationNumber: true,
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

  // Only allow invoice creation for delivered+ orders
  const allowedStatuses = ['DELIVERED', 'INVOICED', 'CLOSED'];
  if (!allowedStatuses.includes(order.status)) {
    return {
      success: false,
      error: `Cannot create tax invoice for an order with status ${order.status}. Order must be Delivered.`,
    };
  }

  if (order.lines.length === 0) {
    return { success: false, error: 'Order has no line items' };
  }

  // Check for existing active (ISSUED) tax invoice — only one allowed per order
  const existingActive = await prisma.taxInvoice.findFirst({
    where: { orderId, status: 'ISSUED' },
  });

  if (existingActive) {
    return {
      success: false,
      error: `An active tax invoice (${existingActive.invoiceNumber}) already exists for this order. Void it first to reissue.`,
    };
  }

  // Get issuer name
  const issuer = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });
  const issuedByName = issuer ? `${issuer.firstName} ${issuer.lastName}` : 'System';

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

  const invoiceNumber = await generateInvoiceNumber();
  const issueDate = new Date();

  // Calculate due date from order's payment terms
  const paymentTerms = order.paymentTerms ?? 'NET_30';
  const dueDate = new Date(issueDate);
  switch (paymentTerms) {
    case 'NET_60':
      dueDate.setDate(dueDate.getDate() + 60);
      break;
    case 'NET_90':
      dueDate.setDate(dueDate.getDate() + 90);
      break;
    case 'PREPAY':
    case 'COD':
      // Already paid / due immediately
      break;
    case 'NET_30':
    default:
      dueDate.setDate(dueDate.getDate() + 30);
      break;
  }

  const taxInvoice = await prisma.$transaction(async (tx) => {
    // Create the tax invoice
    const ti = await tx.taxInvoice.create({
      data: {
        invoiceNumber,
        companyId,
        orderId,
        orderNumber: order.orderNumber,
        customerName: order.company.name,
        customerVatNumber: order.company.vatNumber,
        customerRegNumber: order.company.registrationNumber,
        billingAddress,
        paymentTerms,
        status: 'ISSUED',
        issueDate,
        dueDate,
        subtotal: order.subtotal,
        vatRate: order.vatRate,
        vatAmount: order.vatAmount,
        total: order.total,
        notes: notes || null,
        issuedBy: userId,
        issuedByName,
      },
    });

    // Create line items from order lines
    const lineData = order.lines.map((line, index) => ({
      taxInvoiceId: ti.id,
      orderLineId: line.id,
      lineNumber: index + 1,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      unitOfMeasure: uomMap.get(line.productId) || 'EA',
      quantity: line.quantityOrdered,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    }));

    await tx.taxInvoiceLine.createMany({ data: lineData });

    // Transition order to INVOICED if currently DELIVERED
    if (order.status === 'DELIVERED') {
      await tx.salesOrder.update({
        where: { id: orderId },
        data: { status: 'INVOICED' },
      });
    }

    return ti;
  });

  logger.info(`Tax invoice ${invoiceNumber} created for order ${order.orderNumber}`);

  return {
    success: true,
    taxInvoice: {
      id: taxInvoice.id,
      invoiceNumber: taxInvoice.invoiceNumber,
    },
  };
}

/**
 * Get a tax invoice by ID with lines
 */
export async function getTaxInvoiceById(
  id: string,
  companyId?: string
): Promise<TaxInvoiceData | null> {
  const where: { id: string; companyId?: string } = { id };
  if (companyId) where.companyId = companyId;

  const ti = await prisma.taxInvoice.findFirst({
    where,
    include: {
      lines: { orderBy: { lineNumber: 'asc' } },
    },
  });

  if (!ti) return null;

  return mapToTaxInvoiceData(ti);
}

/**
 * Get tax invoices for a specific order
 */
export async function getTaxInvoicesForOrder(
  orderId: string,
  companyId?: string
): Promise<TaxInvoiceSummary[]> {
  const where: { orderId: string; companyId?: string } = { orderId };
  if (companyId) where.companyId = companyId;

  const invoices = await prisma.taxInvoice.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return invoices.map((ti) => ({
    id: ti.id,
    invoiceNumber: ti.invoiceNumber,
    orderId: ti.orderId,
    orderNumber: ti.orderNumber,
    customerName: ti.customerName,
    status: ti.status,
    issueDate: ti.issueDate,
    dueDate: ti.dueDate,
    paymentTerms: ti.paymentTerms,
    total: ti.total,
    createdAt: ti.createdAt,
  }));
}

/**
 * Get tax invoices for a company (customer portal)
 */
export async function getTaxInvoicesByCompany(
  companyId: string
): Promise<TaxInvoiceSummary[]> {
  const invoices = await prisma.taxInvoice.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  });

  return invoices.map((ti) => ({
    id: ti.id,
    invoiceNumber: ti.invoiceNumber,
    orderId: ti.orderId,
    orderNumber: ti.orderNumber,
    customerName: ti.customerName,
    status: ti.status,
    issueDate: ti.issueDate,
    dueDate: ti.dueDate,
    paymentTerms: ti.paymentTerms,
    total: ti.total,
    createdAt: ti.createdAt,
  }));
}

/**
 * Void a tax invoice (ISSUED → VOIDED)
 */
export async function voidTaxInvoice(
  id: string,
  userId: string,
  companyId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const ti = await prisma.taxInvoice.findFirst({
    where: { id, companyId },
  });

  if (!ti) {
    return { success: false, error: 'Tax invoice not found' };
  }

  if (ti.status !== 'ISSUED') {
    return { success: false, error: `Cannot void a tax invoice with status ${ti.status}` };
  }

  await prisma.taxInvoice.update({
    where: { id },
    data: {
      status: 'VOIDED',
      voidedAt: new Date(),
      voidedBy: userId,
      voidReason: reason,
    },
  });

  logger.info(`Tax invoice ${ti.invoiceNumber} voided by ${userId}: ${reason}`);

  return { success: true };
}

/**
 * List all tax invoices with filtering and pagination
 */
export async function getTaxInvoices(params: {
  status?: TaxInvoiceStatus;
  companyId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentTerms?: string;
  overdue?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{ data: TaxInvoiceSummary[]; total: number; page: number; pageSize: number }> {
  const page = params.page || 1;
  const pageSize = Math.min(params.pageSize || 20, 100);
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.companyId) {
    where.companyId = params.companyId;
  }

  if (params.paymentTerms) {
    where.paymentTerms = params.paymentTerms;
  }

  if (params.search) {
    where.OR = [
      { invoiceNumber: { contains: params.search, mode: 'insensitive' } },
      { orderNumber: { contains: params.search, mode: 'insensitive' } },
      { customerName: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  if (params.dateFrom || params.dateTo) {
    where.issueDate = {};
    if (params.dateFrom) {
      (where.issueDate as Record<string, unknown>).gte = new Date(params.dateFrom);
    }
    if (params.dateTo) {
      (where.issueDate as Record<string, unknown>).lte = new Date(params.dateTo);
    }
  }

  // Overdue filter: ISSUED invoices with dueDate in the past
  if (params.overdue) {
    where.status = 'ISSUED';
    where.dueDate = { lt: new Date() };
  }

  const [invoices, total] = await Promise.all([
    prisma.taxInvoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.taxInvoice.count({ where }),
  ]);

  return {
    data: invoices.map((ti) => ({
      id: ti.id,
      invoiceNumber: ti.invoiceNumber,
      orderId: ti.orderId,
      orderNumber: ti.orderNumber,
      customerName: ti.customerName,
      status: ti.status,
      issueDate: ti.issueDate,
      dueDate: ti.dueDate,
      paymentTerms: ti.paymentTerms,
      total: ti.total,
      createdAt: ti.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}

// ============================================
// HELPERS
// ============================================

function mapToTaxInvoiceData(ti: {
  id: string;
  invoiceNumber: string;
  companyId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerVatNumber: string | null;
  customerRegNumber: string | null;
  billingAddress: string | null;
  paymentTerms: string;
  status: TaxInvoiceStatus;
  issueDate: Date;
  dueDate: Date | null;
  subtotal: Prisma.Decimal;
  vatRate: Prisma.Decimal;
  vatAmount: Prisma.Decimal;
  total: Prisma.Decimal;
  pdfUrl: string | null;
  voidedAt: Date | null;
  voidedBy: string | null;
  voidReason: string | null;
  notes: string | null;
  issuedBy: string;
  issuedByName: string;
  lines: Array<{
    id: string;
    orderLineId: string;
    lineNumber: number;
    productId: string;
    productSku: string;
    productDescription: string;
    unitOfMeasure: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    lineTotal: Prisma.Decimal;
  }>;
  createdAt: Date;
  updatedAt: Date;
}): TaxInvoiceData {
  return {
    id: ti.id,
    invoiceNumber: ti.invoiceNumber,
    companyId: ti.companyId,
    orderId: ti.orderId,
    orderNumber: ti.orderNumber,
    customerName: ti.customerName,
    customerVatNumber: ti.customerVatNumber,
    customerRegNumber: ti.customerRegNumber,
    billingAddress: ti.billingAddress,
    paymentTerms: ti.paymentTerms,
    status: ti.status,
    issueDate: ti.issueDate,
    dueDate: ti.dueDate,
    subtotal: ti.subtotal,
    vatRate: ti.vatRate,
    vatAmount: ti.vatAmount,
    total: ti.total,
    pdfUrl: ti.pdfUrl,
    voidedAt: ti.voidedAt,
    voidedBy: ti.voidedBy,
    voidReason: ti.voidReason,
    notes: ti.notes,
    issuedBy: ti.issuedBy,
    issuedByName: ti.issuedByName,
    lines: ti.lines.map((line) => ({
      id: line.id,
      orderLineId: line.orderLineId,
      lineNumber: line.lineNumber,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      unitOfMeasure: line.unitOfMeasure,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    })),
    createdAt: ti.createdAt,
    updatedAt: ti.updatedAt,
  };
}
