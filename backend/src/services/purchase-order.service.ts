import { Prisma, PurchaseOrderStatus, Warehouse, SupplierCurrency } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { generatePurchaseOrderPDF } from './pdf.service';
import { sendEmail, generatePurchaseOrderEmail } from './email.service';
import { updateStockLevel } from './inventory.service';
import type {
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  AddPurchaseOrderLineInput,
  UpdatePurchaseOrderLineInput,
  PurchaseOrderListQuery,
  SendPurchaseOrderInput,
} from '../utils/validation/purchase-orders';

// ============================================
// TYPES
// ============================================

export interface PurchaseOrderData {
  id: string;
  poNumber: string;
  supplier: {
    id: string;
    code: string;
    name: string;
    currency: SupplierCurrency;
    email: string | null;
  };
  status: PurchaseOrderStatus;
  deliveryLocation: Warehouse;
  expectedDate: Date | null;
  currency: SupplierCurrency;
  subtotal: number;
  total: number;
  sourceOrderId: string | null;
  internalNotes: string | null;
  supplierNotes: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  sentAt: Date | null;
  sentBy: string | null;
  lines: PurchaseOrderLineData[];
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export interface PurchaseOrderLineData {
  id: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  lineTotal: number;
  salesOrderLineId: string | null;
}

export interface PurchaseOrderSummary {
  id: string;
  poNumber: string;
  supplier: { id: string; code: string; name: string };
  status: PurchaseOrderStatus;
  currency: SupplierCurrency;
  lineCount: number;
  total: number;
  expectedDate: Date | null;
  createdAt: Date;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ============================================
// STATUS TRANSITIONS
// ============================================

/**
 * Valid status transitions for purchase orders
 * Note: DRAFT -> SENT is for ADMIN/MANAGER, DRAFT -> PENDING_APPROVAL is for PURCHASER
 */
export const PO_STATUS_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  DRAFT: ['PENDING_APPROVAL', 'SENT', 'CANCELLED'],
  PENDING_APPROVAL: ['SENT', 'CANCELLED'], // After approval
  SENT: ['ACKNOWLEDGED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  ACKNOWLEDGED: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  PARTIALLY_RECEIVED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

/**
 * Check if a status transition is valid
 */
export function isValidPOTransition(
  currentStatus: PurchaseOrderStatus,
  newStatus: PurchaseOrderStatus
): boolean {
  const validNextStatuses = PO_STATUS_TRANSITIONS[currentStatus];
  return validNextStatuses.includes(newStatus);
}

// ============================================
// NUMBER GENERATION
// ============================================

/**
 * Generate the next PO number in format PO-YYYY-NNNNN
 */
export async function generatePONumber(): Promise<string> {
  const currentYear = new Date().getFullYear();

  const counter = await prisma.$transaction(async (tx) => {
    let counter = await tx.purchaseOrderCounter.findUnique({
      where: { id: 'po_counter' },
    });

    if (!counter) {
      counter = await tx.purchaseOrderCounter.create({
        data: {
          id: 'po_counter',
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    if (counter.year !== currentYear) {
      counter = await tx.purchaseOrderCounter.update({
        where: { id: 'po_counter' },
        data: {
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    counter = await tx.purchaseOrderCounter.update({
      where: { id: 'po_counter' },
      data: {
        count: { increment: 1 },
      },
    });

    return counter;
  });

  const paddedCount = counter.count.toString().padStart(5, '0');
  return `PO-${currentYear}-${paddedCount}`;
}

// ============================================
// CORE CRUD
// ============================================

/**
 * Create a new purchase order
 */
export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput,
  userId: string
): Promise<ServiceResult<PurchaseOrderData>> {
  // Get supplier to inherit currency
  const supplier = await prisma.supplier.findUnique({
    where: { id: input.supplierId },
    select: { id: true, code: true, name: true, currency: true, email: true, isActive: true },
  });

  if (!supplier) {
    return { success: false, error: 'Supplier not found' };
  }

  if (!supplier.isActive) {
    return { success: false, error: 'Supplier is not active' };
  }

  const poNumber = await generatePONumber();

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: input.supplierId,
      deliveryLocation: input.deliveryLocation || 'JHB',
      expectedDate: input.expectedDate,
      currency: supplier.currency,
      subtotal: 0,
      total: 0,
      sourceOrderId: input.sourceOrderId,
      internalNotes: input.internalNotes,
      supplierNotes: input.supplierNotes,
      createdBy: userId,
      updatedAt: new Date(),
    },
    include: {
      supplier: {
        select: { id: true, code: true, name: true, currency: true, email: true },
      },
      lines: true,
    },
  });

  return {
    success: true,
    data: mapPurchaseOrderToData(po),
  };
}

/**
 * Get purchase orders with pagination and filtering
 */
export async function getPurchaseOrders(
  query: PurchaseOrderListQuery
): Promise<PaginatedResult<PurchaseOrderSummary>> {
  const { status, supplierId, startDate, endDate, search, page = 1, pageSize = 20 } = query;

  const where: Prisma.PurchaseOrderWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (supplierId) {
    where.supplierId = supplierId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  if (search) {
    where.OR = [
      { poNumber: { contains: search, mode: 'insensitive' } },
      { supplier: { name: { contains: search, mode: 'insensitive' } } },
      { supplier: { code: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [total, purchaseOrders] = await Promise.all([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: { id: true, code: true, name: true },
        },
        _count: { select: { lines: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: purchaseOrders.map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      supplier: po.supplier,
      status: po.status,
      currency: po.currency,
      lineCount: po._count.lines,
      total: Number(po.total),
      expectedDate: po.expectedDate,
      createdAt: po.createdAt,
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
 * Get purchase order by ID
 */
export async function getPurchaseOrderById(id: string): Promise<PurchaseOrderData | null> {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: {
        select: { id: true, code: true, name: true, currency: true, email: true },
      },
      lines: {
        orderBy: { lineNumber: 'asc' },
      },
    },
  });

  if (!po) {
    return null;
  }

  return mapPurchaseOrderToData(po);
}

/**
 * Update a purchase order
 */
export async function updatePurchaseOrder(
  id: string,
  input: UpdatePurchaseOrderInput,
  userId: string
): Promise<ServiceResult<PurchaseOrderData>> {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
  });

  if (!po) {
    return { success: false, error: 'Purchase order not found' };
  }

  // Only allow updates on DRAFT or PENDING_APPROVAL status
  if (po.status !== 'DRAFT' && po.status !== 'PENDING_APPROVAL') {
    return { success: false, error: `Cannot update purchase order with status ${po.status}` };
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      ...(input.deliveryLocation !== undefined && { deliveryLocation: input.deliveryLocation }),
      ...(input.expectedDate !== undefined && { expectedDate: input.expectedDate }),
      ...(input.internalNotes !== undefined && { internalNotes: input.internalNotes }),
      ...(input.supplierNotes !== undefined && { supplierNotes: input.supplierNotes }),
      updatedBy: userId,
    },
    include: {
      supplier: {
        select: { id: true, code: true, name: true, currency: true, email: true },
      },
      lines: {
        orderBy: { lineNumber: 'asc' },
      },
    },
  });

  return {
    success: true,
    data: mapPurchaseOrderToData(updated),
  };
}

/**
 * Cancel a purchase order
 */
export async function cancelPurchaseOrder(
  id: string,
  userId: string
): Promise<ServiceResult<void>> {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { lines: true },
  });

  if (!po) {
    return { success: false, error: 'Purchase order not found' };
  }

  if (!isValidPOTransition(po.status, 'CANCELLED')) {
    return { success: false, error: `Cannot cancel purchase order with status ${po.status}` };
  }

  // If PO was SENT or ACKNOWLEDGED, onOrder was incremented — decrement unreceived quantities
  const needsOnOrderRollback = po.status === 'SENT' || po.status === 'ACKNOWLEDGED';

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedBy: userId,
      },
    });

    if (needsOnOrderRollback) {
      for (const line of po.lines) {
        const unreceived = line.quantityOrdered - line.quantityReceived;
        if (unreceived > 0) {
          // Use Math.max logic via a safe decrement: read current, compute safe delta
          const stockLevel = await tx.stockLevel.findUnique({
            where: { productId_location: { productId: line.productId, location: po.deliveryLocation } },
          });
          if (stockLevel) {
            const safeDecrement = Math.min(unreceived, stockLevel.onOrder);
            if (safeDecrement > 0) {
              await updateStockLevel(
                tx,
                line.productId,
                po.deliveryLocation,
                { onOrder: -safeDecrement },
                userId
              );
            }
          }
        }
      }
    }
  });

  return { success: true };
}

// ============================================
// LINE MANAGEMENT
// ============================================

/**
 * Add a line to a purchase order
 */
export async function addPurchaseOrderLine(
  poId: string,
  input: AddPurchaseOrderLineInput,
  userId: string
): Promise<ServiceResult<PurchaseOrderLineData>> {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { lines: true },
  });

  if (!po) {
    return { success: false, error: 'Purchase order not found' };
  }

  if (po.status !== 'DRAFT' && po.status !== 'PENDING_APPROVAL') {
    return { success: false, error: `Cannot add lines to purchase order with status ${po.status}` };
  }

  // Get product details
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, nusafSku: true, description: true, isActive: true, deletedAt: true },
  });

  if (!product || product.deletedAt) {
    return { success: false, error: 'Product not found' };
  }

  if (!product.isActive) {
    return { success: false, error: 'Product is not active' };
  }

  // Check if product already exists in PO
  const existingLine = po.lines.find((l) => l.productId === input.productId);
  if (existingLine) {
    return { success: false, error: 'Product already exists in this purchase order' };
  }

  // Calculate line total
  const lineTotal = roundTo2(input.quantityOrdered * input.unitCost);

  // Get next line number
  const maxLineNumber = po.lines.reduce((max, l) => Math.max(max, l.lineNumber), 0);

  const line = await prisma.purchaseOrderLine.create({
    data: {
      purchaseOrderId: poId,
      lineNumber: maxLineNumber + 1,
      productId: product.id,
      productSku: product.nusafSku,
      productDescription: product.description,
      quantityOrdered: input.quantityOrdered,
      unitCost: input.unitCost,
      lineTotal,
    },
  });

  // Recalculate totals
  await recalculatePOTotals(poId, userId);

  return {
    success: true,
    data: mapLineToData(line),
  };
}

/**
 * Update a purchase order line
 */
export async function updatePurchaseOrderLine(
  poId: string,
  lineId: string,
  input: UpdatePurchaseOrderLineInput,
  userId: string
): Promise<ServiceResult<PurchaseOrderLineData>> {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
  });

  if (!po) {
    return { success: false, error: 'Purchase order not found' };
  }

  if (po.status !== 'DRAFT' && po.status !== 'PENDING_APPROVAL') {
    return { success: false, error: `Cannot update lines on purchase order with status ${po.status}` };
  }

  const line = await prisma.purchaseOrderLine.findFirst({
    where: { id: lineId, purchaseOrderId: poId },
  });

  if (!line) {
    return { success: false, error: 'Line not found' };
  }

  // Calculate new line total
  const quantityOrdered = input.quantityOrdered ?? line.quantityOrdered;
  const unitCost = input.unitCost ?? Number(line.unitCost);
  const lineTotal = roundTo2(quantityOrdered * unitCost);

  const updatedLine = await prisma.purchaseOrderLine.update({
    where: { id: lineId },
    data: {
      ...(input.quantityOrdered !== undefined && { quantityOrdered: input.quantityOrdered }),
      ...(input.unitCost !== undefined && { unitCost: input.unitCost }),
      lineTotal,
    },
  });

  // Recalculate totals
  await recalculatePOTotals(poId, userId);

  return {
    success: true,
    data: mapLineToData(updatedLine),
  };
}

/**
 * Remove a line from a purchase order
 */
export async function removePurchaseOrderLine(
  poId: string,
  lineId: string,
  userId: string
): Promise<ServiceResult<void>> {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
  });

  if (!po) {
    return { success: false, error: 'Purchase order not found' };
  }

  if (po.status !== 'DRAFT' && po.status !== 'PENDING_APPROVAL') {
    return { success: false, error: `Cannot remove lines from purchase order with status ${po.status}` };
  }

  const line = await prisma.purchaseOrderLine.findFirst({
    where: { id: lineId, purchaseOrderId: poId },
  });

  if (!line) {
    return { success: false, error: 'Line not found' };
  }

  await prisma.purchaseOrderLine.delete({
    where: { id: lineId },
  });

  // Recalculate totals
  await recalculatePOTotals(poId, userId);

  return { success: true };
}

// ============================================
// APPROVAL WORKFLOW
// ============================================

/**
 * Submit purchase order for approval (PURCHASER role)
 */
export async function submitForApproval(
  id: string,
  userId: string
): Promise<ServiceResult<void>> {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { lines: true },
  });

  if (!po) {
    return { success: false, error: 'Purchase order not found' };
  }

  if (po.status !== 'DRAFT') {
    return { success: false, error: `Cannot submit purchase order with status ${po.status}` };
  }

  if (po.lines.length === 0) {
    return { success: false, error: 'Cannot submit purchase order with no lines' };
  }

  await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: 'PENDING_APPROVAL',
      updatedBy: userId,
    },
  });

  return { success: true };
}

/**
 * Approve a purchase order (ADMIN/MANAGER role)
 */
export async function approvePurchaseOrder(
  id: string,
  userId: string
): Promise<ServiceResult<void>> {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
  });

  if (!po) {
    return { success: false, error: 'Purchase order not found' };
  }

  if (po.status !== 'PENDING_APPROVAL') {
    return { success: false, error: `Cannot approve purchase order with status ${po.status}` };
  }

  // Prevent self-approval (creator cannot approve their own PO)
  if (po.createdBy === userId) {
    return { success: false, error: 'Cannot approve your own purchase order' };
  }

  await prisma.purchaseOrder.update({
    where: { id },
    data: {
      approvedAt: new Date(),
      approvedBy: userId,
      updatedBy: userId,
    },
  });

  return { success: true };
}

/**
 * Reject a purchase order (ADMIN/MANAGER role)
 */
export async function rejectPurchaseOrder(
  id: string,
  reason: string,
  userId: string
): Promise<ServiceResult<void>> {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
  });

  if (!po) {
    return { success: false, error: 'Purchase order not found' };
  }

  if (po.status !== 'PENDING_APPROVAL') {
    return { success: false, error: `Cannot reject purchase order with status ${po.status}` };
  }

  await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      rejectedAt: new Date(),
      rejectedBy: userId,
      rejectionReason: reason,
      updatedBy: userId,
    },
  });

  return { success: true };
}

// ============================================
// SEND TO SUPPLIER
// ============================================

export interface SendToSupplierResult {
  emailSent: boolean;
  emailError?: string;
  recipientEmail: string;
}

/**
 * Send purchase order to supplier
 * - Validates the PO can be sent
 * - Generates PDF
 * - Sends email with PDF attachment
 * - Updates status to SENT
 */
export async function sendToSupplier(
  id: string,
  options: SendPurchaseOrderInput,
  userId: string
): Promise<ServiceResult<SendToSupplierResult>> {
  // Get PO with supplier and lines
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: {
        select: { id: true, code: true, name: true, currency: true, email: true },
      },
      lines: {
        orderBy: { lineNumber: 'asc' },
      },
    },
  });

  if (!po) {
    return { success: false, error: 'Purchase order not found' };
  }

  // Validate status - can only send from DRAFT (ADMIN/MANAGER) or approved PENDING_APPROVAL
  if (po.status === 'DRAFT') {
    if (po.lines.length === 0) {
      return { success: false, error: 'Cannot send purchase order with no lines' };
    }
  } else if (po.status === 'PENDING_APPROVAL') {
    if (!po.approvedAt) {
      return { success: false, error: 'Purchase order must be approved before sending' };
    }
  } else {
    return { success: false, error: `Cannot send purchase order with status ${po.status}` };
  }

  // Determine recipient email
  const recipientEmail = options.emailTo || po.supplier.email;
  if (!recipientEmail) {
    return { success: false, error: 'No email address available for supplier' };
  }

  // Prepare PO data for PDF generation
  const poData: PurchaseOrderData = mapPurchaseOrderToData(po);

  // Generate PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generatePurchaseOrderPDF(poData);
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: 'Failed to generate PDF' };
  }

  // Generate email content
  const emailContent = generatePurchaseOrderEmail({
    poNumber: po.poNumber,
    supplierName: po.supplier.name,
    expectedDate: po.expectedDate,
    totalAmount: Number(po.total),
    currency: po.currency,
    lineCount: po.lines.length,
    customMessage: options.message,
  });

  // Send email with PDF attachment
  const emailResult = await sendEmail({
    to: recipientEmail,
    cc: options.emailCc,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
    attachments: [
      {
        filename: `${po.poNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  // Update PO status and increment onOrder for each line — all in one transaction
  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrder.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentBy: userId,
        updatedBy: userId,
      },
    });

    // Increment onOrder for each PO line at the delivery location
    for (const line of po.lines) {
      await updateStockLevel(
        tx,
        line.productId,
        po.deliveryLocation,
        { onOrder: line.quantityOrdered },
        userId
      );
    }
  });

  return {
    success: true,
    data: {
      emailSent: emailResult.success,
      emailError: emailResult.error,
      recipientEmail,
    },
  };
}

/**
 * Generate PDF for a purchase order (without sending)
 */
export async function getPurchaseOrderPDF(id: string): Promise<ServiceResult<Buffer>> {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: {
        select: { id: true, code: true, name: true, currency: true, email: true },
      },
      lines: {
        orderBy: { lineNumber: 'asc' },
      },
    },
  });

  if (!po) {
    return { success: false, error: 'Purchase order not found' };
  }

  const poData: PurchaseOrderData = mapPurchaseOrderToData(po);

  try {
    const pdfBuffer = await generatePurchaseOrderPDF(poData);
    return { success: true, data: pdfBuffer };
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: 'Failed to generate PDF' };
  }
}

/**
 * Update status to ACKNOWLEDGED
 */
export async function acknowledgePurchaseOrder(
  id: string,
  userId: string
): Promise<ServiceResult<void>> {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
  });

  if (!po) {
    return { success: false, error: 'Purchase order not found' };
  }

  if (!isValidPOTransition(po.status, 'ACKNOWLEDGED')) {
    return { success: false, error: `Cannot acknowledge purchase order with status ${po.status}` };
  }

  await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: 'ACKNOWLEDGED',
      updatedBy: userId,
    },
  });

  return { success: true };
}

// ============================================
// HELPERS
// ============================================

/**
 * Recalculate purchase order totals from lines
 */
async function recalculatePOTotals(poId: string, userId: string): Promise<void> {
  const lines = await prisma.purchaseOrderLine.findMany({
    where: { purchaseOrderId: poId },
  });

  let subtotal = 0;
  for (const line of lines) {
    subtotal += Number(line.lineTotal);
  }

  // For purchase orders, total = subtotal (no VAT on supplier purchases in foreign currency)
  const total = roundTo2(subtotal);

  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: {
      subtotal: roundTo2(subtotal),
      total,
      updatedBy: userId,
    },
  });
}

/**
 * Map Prisma PurchaseOrder to PurchaseOrderData
 */
function mapPurchaseOrderToData(
  po: Prisma.PurchaseOrderGetPayload<{
    include: {
      supplier: { select: { id: true; code: true; name: true; currency: true; email: true } };
      lines: true;
    };
  }>
): PurchaseOrderData {
  return {
    id: po.id,
    poNumber: po.poNumber,
    supplier: po.supplier,
    status: po.status,
    deliveryLocation: po.deliveryLocation,
    expectedDate: po.expectedDate,
    currency: po.currency,
    subtotal: Number(po.subtotal),
    total: Number(po.total),
    sourceOrderId: po.sourceOrderId,
    internalNotes: po.internalNotes,
    supplierNotes: po.supplierNotes,
    approvedAt: po.approvedAt,
    approvedBy: po.approvedBy,
    rejectedAt: po.rejectedAt,
    rejectedBy: po.rejectedBy,
    rejectionReason: po.rejectionReason,
    sentAt: po.sentAt,
    sentBy: po.sentBy,
    lines: po.lines.map(mapLineToData),
    createdAt: po.createdAt,
    createdBy: po.createdBy,
    updatedAt: po.updatedAt,
  };
}

/**
 * Map Prisma PurchaseOrderLine to PurchaseOrderLineData
 */
function mapLineToData(line: {
  id: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: Decimal;
  lineTotal: Decimal;
  salesOrderLineId: string | null;
}): PurchaseOrderLineData {
  return {
    id: line.id,
    lineNumber: line.lineNumber,
    productId: line.productId,
    productSku: line.productSku,
    productDescription: line.productDescription,
    quantityOrdered: line.quantityOrdered,
    quantityReceived: line.quantityReceived,
    unitCost: Number(line.unitCost),
    lineTotal: Number(line.lineTotal),
    salesOrderLineId: line.salesOrderLineId,
  };
}

/**
 * Round to 2 decimal places
 */
function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}
