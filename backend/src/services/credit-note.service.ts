import { Prisma, CreditNoteStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

export interface CreditNoteData {
  id: string;
  creditNoteNumber: string;
  companyId: string;
  orderId: string | null;
  orderNumber: string | null;
  returnAuthorizationId: string;
  raNumber: string;
  customerName: string;
  customerVatNumber: string | null;
  customerRegNumber: string | null;
  billingAddress: string | null;
  status: CreditNoteStatus;
  issueDate: Date;
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
  lines: CreditNoteLineData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditNoteLineData {
  id: string;
  returnAuthorizationLineId: string | null;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
  resolution: string | null;
}

export interface CreditNoteSummary {
  id: string;
  creditNoteNumber: string;
  orderId: string | null;
  orderNumber: string | null;
  raNumber: string;
  customerName: string;
  status: CreditNoteStatus;
  issueDate: Date;
  total: Prisma.Decimal;
  createdAt: Date;
}

// ============================================
// NUMBER GENERATION
// ============================================

/**
 * Generate the next credit note number in format CN-YYYY-NNNNN
 */
export async function generateCreditNoteNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();

  const counter = await prisma.$transaction(async (tx) => {
    let counter = await tx.creditNoteCounter.findUnique({
      where: { id: 'cn_counter' },
    });

    if (!counter) {
      counter = await tx.creditNoteCounter.create({
        data: {
          id: 'cn_counter',
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    if (counter.year !== currentYear) {
      counter = await tx.creditNoteCounter.update({
        where: { id: 'cn_counter' },
        data: {
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    counter = await tx.creditNoteCounter.update({
      where: { id: 'cn_counter' },
      data: {
        count: { increment: 1 },
      },
    });

    return counter;
  });

  const paddedCount = counter.count.toString().padStart(5, '0');
  return `CN-${currentYear}-${paddedCount}`;
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Create a credit note from a completed return authorization.
 * Snapshots RA data + lines with pricing from original order lines.
 * Auto-sets status to ISSUED.
 */
export async function createCreditNote(
  raId: string,
  userId: string
): Promise<{ success: boolean; creditNote?: { id: string; creditNoteNumber: string }; error?: string }> {
  // Load the RA with lines
  const ra = await prisma.returnAuthorization.findUnique({
    where: { id: raId },
    include: { lines: { orderBy: { lineNumber: 'asc' } } },
  });

  if (!ra) {
    return { success: false, error: 'Return authorization not found' };
  }

  if (ra.status !== 'COMPLETED') {
    return {
      success: false,
      error: `Cannot create credit note for RA with status ${ra.status}. RA must be Completed.`,
    };
  }

  // Check for existing active (ISSUED) credit note for this RA
  const existingActive = await prisma.creditNote.findFirst({
    where: { returnAuthorizationId: raId, status: 'ISSUED' },
  });

  if (existingActive) {
    return {
      success: false,
      error: `An active credit note (${existingActive.creditNoteNumber}) already exists for this RA. Void it first to reissue.`,
    };
  }

  // Get issuer name
  const issuer = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });
  const issuedByName = issuer ? `${issuer.firstName} ${issuer.lastName}` : 'System';

  // Get company info for snapshots
  const company = await prisma.company.findUnique({
    where: { id: ra.companyId },
    select: {
      name: true,
      vatNumber: true,
      registrationNumber: true,
      addresses: {
        where: { type: 'BILLING' },
        take: 1,
      },
    },
  });

  const customerName = company?.name ?? ra.customerName;
  const customerVatNumber = company?.vatNumber ?? null;
  const customerRegNumber = company?.registrationNumber ?? null;
  const billingAddr = company?.addresses[0];
  const billingAddress = billingAddr
    ? [billingAddr.line1, billingAddr.line2, billingAddr.city, billingAddr.province, billingAddr.postalCode, billingAddr.country]
        .filter(Boolean)
        .join(', ')
    : null;

  // Look up original order line prices for each RA line
  const orderLineIds = ra.lines
    .map((l) => l.orderLineId)
    .filter((id): id is string => id !== null);

  const orderLines = orderLineIds.length > 0
    ? await prisma.salesOrderLine.findMany({
        where: { id: { in: orderLineIds } },
        select: { id: true, unitPrice: true },
      })
    : [];
  const orderLinePriceMap = new Map(orderLines.map((ol) => [ol.id, ol.unitPrice]));

  // Look up UoM for each product
  const productIds = ra.lines.map((l) => l.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, unitOfMeasure: true },
  });
  const uomMap = new Map(products.map((p) => [p.id, p.unitOfMeasure]));

  const creditNoteNumber = await generateCreditNoteNumber();
  const issueDate = new Date();

  // Calculate line totals and overall totals
  const VAT_RATE = new Prisma.Decimal(15);
  let subtotal = new Prisma.Decimal(0);

  const lineData = ra.lines.map((line, index) => {
    // Use quantityReceived (what was actually returned) for credit, not quantityReturned (what was requested)
    const quantity = line.quantityReceived;
    const unitPrice = line.orderLineId
      ? (orderLinePriceMap.get(line.orderLineId) ?? new Prisma.Decimal(0))
      : new Prisma.Decimal(0);
    const lineTotal = unitPrice.mul(quantity);
    subtotal = subtotal.add(lineTotal);

    return {
      lineNumber: index + 1,
      returnAuthorizationLineId: line.id,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      unitOfMeasure: uomMap.get(line.productId) || line.unitOfMeasure,
      quantity,
      unitPrice,
      lineTotal,
      resolution: line.resolution,
    };
  });

  const vatAmount = subtotal.mul(VAT_RATE).div(100).toDecimalPlaces(2);
  const total = subtotal.add(vatAmount);

  const creditNote = await prisma.$transaction(async (tx) => {
    const cn = await tx.creditNote.create({
      data: {
        creditNoteNumber,
        companyId: ra.companyId,
        orderId: ra.orderId,
        orderNumber: ra.orderNumber,
        returnAuthorizationId: raId,
        raNumber: ra.raNumber,
        customerName,
        customerVatNumber,
        customerRegNumber,
        billingAddress,
        status: 'ISSUED',
        issueDate,
        subtotal,
        vatRate: VAT_RATE,
        vatAmount,
        total,
        issuedBy: userId,
        issuedByName,
      },
    });

    await tx.creditNoteLine.createMany({
      data: lineData.map((line) => ({
        creditNoteId: cn.id,
        ...line,
      })),
    });

    return cn;
  });

  logger.info(`Credit note ${creditNoteNumber} created for RA ${ra.raNumber}`);

  return {
    success: true,
    creditNote: {
      id: creditNote.id,
      creditNoteNumber: creditNote.creditNoteNumber,
    },
  };
}

/**
 * Get a credit note by ID with lines
 */
export async function getCreditNoteById(
  id: string,
  companyId?: string
): Promise<CreditNoteData | null> {
  const where: { id: string; companyId?: string } = { id };
  if (companyId) where.companyId = companyId;

  const cn = await prisma.creditNote.findFirst({
    where,
    include: {
      lines: { orderBy: { lineNumber: 'asc' } },
    },
  });

  if (!cn) return null;

  return mapToCreditNoteData(cn);
}

/**
 * Get credit notes for a specific RA
 */
export async function getCreditNotesForRA(
  raId: string,
  companyId?: string
): Promise<CreditNoteSummary[]> {
  const where: { returnAuthorizationId: string; companyId?: string } = { returnAuthorizationId: raId };
  if (companyId) where.companyId = companyId;

  const notes = await prisma.creditNote.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return notes.map(mapToCreditNoteSummary);
}

/**
 * Get credit notes for a company (customer portal)
 */
export async function getCreditNotesByCompany(
  companyId: string
): Promise<CreditNoteSummary[]> {
  const notes = await prisma.creditNote.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  });

  return notes.map(mapToCreditNoteSummary);
}

/**
 * Void a credit note (ISSUED → VOIDED)
 */
export async function voidCreditNote(
  id: string,
  userId: string,
  companyId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const cn = await prisma.creditNote.findFirst({
    where: { id, companyId },
  });

  if (!cn) {
    return { success: false, error: 'Credit note not found' };
  }

  if (cn.status !== 'ISSUED') {
    return { success: false, error: `Cannot void a credit note with status ${cn.status}` };
  }

  await prisma.creditNote.update({
    where: { id },
    data: {
      status: 'VOIDED',
      voidedAt: new Date(),
      voidedBy: userId,
      voidReason: reason,
    },
  });

  logger.info(`Credit note ${cn.creditNoteNumber} voided by ${userId}: ${reason}`);

  return { success: true };
}

/**
 * List all credit notes with filtering and pagination
 */
export async function getCreditNotes(params: {
  status?: CreditNoteStatus;
  companyId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: CreditNoteSummary[]; total: number; page: number; pageSize: number }> {
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

  if (params.search) {
    where.OR = [
      { creditNoteNumber: { contains: params.search, mode: 'insensitive' } },
      { raNumber: { contains: params.search, mode: 'insensitive' } },
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

  const [notes, total] = await Promise.all([
    prisma.creditNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.creditNote.count({ where }),
  ]);

  return {
    data: notes.map(mapToCreditNoteSummary),
    total,
    page,
    pageSize,
  };
}

// ============================================
// HELPERS
// ============================================

function mapToCreditNoteSummary(cn: {
  id: string;
  creditNoteNumber: string;
  orderId: string | null;
  orderNumber: string | null;
  raNumber: string;
  customerName: string;
  status: CreditNoteStatus;
  issueDate: Date;
  total: Prisma.Decimal;
  createdAt: Date;
}): CreditNoteSummary {
  return {
    id: cn.id,
    creditNoteNumber: cn.creditNoteNumber,
    orderId: cn.orderId,
    orderNumber: cn.orderNumber,
    raNumber: cn.raNumber,
    customerName: cn.customerName,
    status: cn.status,
    issueDate: cn.issueDate,
    total: cn.total,
    createdAt: cn.createdAt,
  };
}

function mapToCreditNoteData(cn: {
  id: string;
  creditNoteNumber: string;
  companyId: string;
  orderId: string | null;
  orderNumber: string | null;
  returnAuthorizationId: string;
  raNumber: string;
  customerName: string;
  customerVatNumber: string | null;
  customerRegNumber: string | null;
  billingAddress: string | null;
  status: CreditNoteStatus;
  issueDate: Date;
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
    returnAuthorizationLineId: string | null;
    lineNumber: number;
    productId: string;
    productSku: string;
    productDescription: string;
    unitOfMeasure: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    lineTotal: Prisma.Decimal;
    resolution: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}): CreditNoteData {
  return {
    id: cn.id,
    creditNoteNumber: cn.creditNoteNumber,
    companyId: cn.companyId,
    orderId: cn.orderId,
    orderNumber: cn.orderNumber,
    returnAuthorizationId: cn.returnAuthorizationId,
    raNumber: cn.raNumber,
    customerName: cn.customerName,
    customerVatNumber: cn.customerVatNumber,
    customerRegNumber: cn.customerRegNumber,
    billingAddress: cn.billingAddress,
    status: cn.status,
    issueDate: cn.issueDate,
    subtotal: cn.subtotal,
    vatRate: cn.vatRate,
    vatAmount: cn.vatAmount,
    total: cn.total,
    pdfUrl: cn.pdfUrl,
    voidedAt: cn.voidedAt,
    voidedBy: cn.voidedBy,
    voidReason: cn.voidReason,
    notes: cn.notes,
    issuedBy: cn.issuedBy,
    issuedByName: cn.issuedByName,
    lines: cn.lines.map((line) => ({
      id: line.id,
      returnAuthorizationLineId: line.returnAuthorizationLineId,
      lineNumber: line.lineNumber,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      unitOfMeasure: line.unitOfMeasure,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
      resolution: line.resolution,
    })),
    createdAt: cn.createdAt,
    updatedAt: cn.updatedAt,
  };
}
