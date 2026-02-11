import { Prisma, Warehouse, DeliveryNoteStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { createTaxInvoice } from './tax-invoice.service';
import { notifyOrderDispatched } from './notification.service';
import type {
  CreateDeliveryNoteInput,
  ConfirmDeliveryInput,
  DeliveryNoteListQuery,
} from '../utils/validation/delivery-notes';
import { generateDeliveryNoteNumber } from '../utils/number-generation';
import { resolveCustomerName } from '../utils/cash-customer';

// ============================================
// TYPES
// ============================================

export interface DeliveryNoteData {
  id: string;
  deliveryNoteNumber: string;
  companyId?: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  deliveryAddress: string | null;
  location: Warehouse;
  status: DeliveryNoteStatus;
  dispatchedAt: Date | null;
  dispatchedBy: string | null;
  dispatchedByName: string | null;
  deliveredAt: Date | null;
  deliveredByName: string | null;
  signatureNotes: string | null;
  notes: string | null;
  lines: DeliveryNoteLineData[];
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
}

export interface DeliveryNoteLineData {
  id: string;
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  quantityOrdered: number;
  quantityDispatched: number;
  quantityReceived: number;
  quantityDamaged: number;
  damageNotes: string | null;
}

export interface DeliveryNoteSummary {
  id: string;
  deliveryNoteNumber: string;
  orderNumber: string;
  orderId: string;
  customerName: string;
  location: Warehouse;
  status: DeliveryNoteStatus;
  lineCount: number;
  dispatchedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
}

// ============================================
// NUMBER GENERATION
// ============================================

/**
 * Generate the next delivery note number in format DN-YYYY-NNNNN
 */

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Create a delivery note from a sales order.
 * Lines are provided by the caller (populated from picking slip data on the frontend).
 */
export async function createDeliveryNote(
  orderId: string,
  input: CreateDeliveryNoteInput,
  userId: string,
  companyId?: string
): Promise<{ success: boolean; deliveryNote?: { id: string; deliveryNoteNumber: string }; error?: string }> {
  // Validate the order exists and is in a valid state
  const orderWhere: Prisma.SalesOrderWhereInput = { id: orderId, deletedAt: null };
  if (companyId) orderWhere.companyId = companyId;
  const order = await prisma.salesOrder.findFirst({
    where: orderWhere,
    include: {
      company: { select: { name: true } },
    },
  });

  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  // Allow DN creation from READY_TO_SHIP, PARTIALLY_SHIPPED, or SHIPPED statuses
  const validStatuses = ['READY_TO_SHIP', 'PARTIALLY_SHIPPED', 'SHIPPED'];
  if (!validStatuses.includes(order.status)) {
    return {
      success: false,
      error: `Cannot create delivery note for an order with status ${order.status}. Order must be Ready to Ship, Partially Shipped, or Shipped.`,
    };
  }

  const deliveryNoteNumber = await generateDeliveryNoteNumber();
  const location = input.location || order.warehouse;

  const deliveryNote = await prisma.$transaction(async (tx) => {
    const dn = await tx.deliveryNote.create({
      data: {
        deliveryNoteNumber,
        companyId: companyId ?? order.companyId,
        orderId,
        orderNumber: order.orderNumber,
        customerName: resolveCustomerName(order),
        deliveryAddress: input.deliveryAddress || null,
        location,
        status: 'DRAFT',
        notes: input.notes || null,
        createdBy: userId,
      },
    });

    const lineData = input.lines.map((line, index) => ({
      deliveryNoteId: dn.id,
      orderLineId: line.orderLineId,
      lineNumber: index + 1,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      unitOfMeasure: line.unitOfMeasure,
      quantityOrdered: line.quantityOrdered,
      quantityDispatched: line.quantityDispatched,
    }));

    await tx.deliveryNoteLine.createMany({ data: lineData });

    return dn;
  });

  return {
    success: true,
    deliveryNote: {
      id: deliveryNote.id,
      deliveryNoteNumber: deliveryNote.deliveryNoteNumber,
    },
  };
}

/**
 * Get delivery note by ID with lines
 */
export async function getDeliveryNoteById(
  id: string,
  companyId?: string
): Promise<DeliveryNoteData | null> {
  const dnWhere: Prisma.DeliveryNoteWhereInput = { id };
  if (companyId) dnWhere.companyId = companyId;
  const dn = await prisma.deliveryNote.findFirst({
    where: dnWhere,
    include: {
      lines: { orderBy: { lineNumber: 'asc' } },
    },
  });

  if (!dn) return null;

  return {
    id: dn.id,
    deliveryNoteNumber: dn.deliveryNoteNumber,
    companyId: dn.companyId,
    orderId: dn.orderId,
    orderNumber: dn.orderNumber,
    customerName: dn.customerName,
    deliveryAddress: dn.deliveryAddress,
    location: dn.location,
    status: dn.status,
    dispatchedAt: dn.dispatchedAt,
    dispatchedBy: dn.dispatchedBy,
    dispatchedByName: dn.dispatchedByName,
    deliveredAt: dn.deliveredAt,
    deliveredByName: dn.deliveredByName,
    signatureNotes: dn.signatureNotes,
    notes: dn.notes,
    lines: dn.lines.map((line) => ({
      id: line.id,
      orderLineId: line.orderLineId,
      lineNumber: line.lineNumber,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      unitOfMeasure: line.unitOfMeasure,
      quantityOrdered: line.quantityOrdered,
      quantityDispatched: line.quantityDispatched,
      quantityReceived: line.quantityReceived,
      quantityDamaged: line.quantityDamaged,
      damageNotes: line.damageNotes,
    })),
    createdAt: dn.createdAt,
    createdBy: dn.createdBy,
    updatedAt: dn.updatedAt,
  };
}

/**
 * Get delivery notes with filtering and pagination
 */
export async function getDeliveryNotes(
  query: DeliveryNoteListQuery,
  companyId?: string
): Promise<{
  deliveryNotes: DeliveryNoteSummary[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}> {
  const { orderId, status, location, search, page = 1, pageSize = 20 } = query;

  const where: Prisma.DeliveryNoteWhereInput = {};
  if (companyId) where.companyId = companyId;

  if (orderId) where.orderId = orderId;
  if (status) where.status = status;
  if (location) where.location = location;
  if (search) {
    where.OR = [
      { deliveryNoteNumber: { contains: search, mode: 'insensitive' } },
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, deliveryNotes] = await Promise.all([
    prisma.deliveryNote.count({ where }),
    prisma.deliveryNote.findMany({
      where,
      include: { _count: { select: { lines: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    deliveryNotes: deliveryNotes.map((dn) => ({
      id: dn.id,
      deliveryNoteNumber: dn.deliveryNoteNumber,
      orderNumber: dn.orderNumber,
      orderId: dn.orderId,
      customerName: dn.customerName,
      location: dn.location,
      status: dn.status,
      lineCount: dn._count.lines,
      dispatchedAt: dn.dispatchedAt,
      deliveredAt: dn.deliveredAt,
      createdAt: dn.createdAt,
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
 * Get delivery notes for a specific order (summary for order detail page)
 */
export async function getDeliveryNotesForOrder(
  orderId: string,
  companyId?: string
): Promise<Array<{
  id: string;
  deliveryNoteNumber: string;
  location: Warehouse;
  status: DeliveryNoteStatus;
  lineCount: number;
  dispatchedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
}>> {
  const dnListWhere: Prisma.DeliveryNoteWhereInput = { orderId };
  if (companyId) dnListWhere.companyId = companyId;
  const deliveryNotes = await prisma.deliveryNote.findMany({
    where: dnListWhere,
    include: { _count: { select: { lines: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return deliveryNotes.map((dn) => ({
    id: dn.id,
    deliveryNoteNumber: dn.deliveryNoteNumber,
    location: dn.location,
    status: dn.status,
    lineCount: dn._count.lines,
    dispatchedAt: dn.dispatchedAt,
    deliveredAt: dn.deliveredAt,
    createdAt: dn.createdAt,
  }));
}

/**
 * Dispatch a delivery note (DRAFT → DISPATCHED).
 * Propagates order status to SHIPPED or PARTIALLY_SHIPPED.
 */
export async function dispatchDeliveryNote(
  id: string,
  userId: string,
  userName: string,
  companyId?: string
): Promise<{ success: boolean; error?: string }> {
  const dispatchWhere: Prisma.DeliveryNoteWhereInput = { id };
  if (companyId) dispatchWhere.companyId = companyId;
  const dn = await prisma.deliveryNote.findFirst({
    where: dispatchWhere,
  });

  if (!dn) {
    return { success: false, error: 'Delivery note not found' };
  }

  if (dn.status !== 'DRAFT') {
    return { success: false, error: `Cannot dispatch a delivery note with status ${dn.status}` };
  }

  await prisma.$transaction(async (tx) => {
    // Update delivery note status
    await tx.deliveryNote.update({
      where: { id },
      data: {
        status: 'DISPATCHED',
        dispatchedAt: new Date(),
        dispatchedBy: userId,
        dispatchedByName: userName,
      },
    });

    // Propagate to order: check if all DNs for this order are dispatched/delivered
    const allDNs = await tx.deliveryNote.findMany({
      where: { orderId: dn.orderId, status: { not: 'CANCELLED' } },
      select: { status: true },
    });

    const allDispatched = allDNs.every(
      (d) => d.status === 'DISPATCHED' || d.status === 'DELIVERED'
    );

    const order = await tx.salesOrder.findUnique({
      where: { id: dn.orderId },
      select: { status: true },
    });

    if (order) {
      if (allDispatched && (order.status === 'READY_TO_SHIP' || order.status === 'PARTIALLY_SHIPPED')) {
        await tx.salesOrder.update({
          where: { id: dn.orderId },
          data: { status: 'SHIPPED', shippedDate: new Date() },
        });
      } else if (order.status === 'READY_TO_SHIP') {
        await tx.salesOrder.update({
          where: { id: dn.orderId },
          data: { status: 'PARTIALLY_SHIPPED' },
        });
      }
    }
  });

  // Fire-and-forget notification
  notifyOrderDispatched(dn.orderId, dn.orderNumber, dn.companyId)
    .catch(() => {/* notification failure is non-blocking */});

  return { success: true };
}

/**
 * Confirm delivery (DISPATCHED → DELIVERED).
 * Records received/damaged quantities per line.
 * Propagates order status to DELIVERED.
 */
export async function confirmDelivery(
  id: string,
  input: ConfirmDeliveryInput,
  _userId: string,
  companyId?: string
): Promise<{ success: boolean; error?: string }> {
  const confirmWhere: Prisma.DeliveryNoteWhereInput = { id };
  if (companyId) confirmWhere.companyId = companyId;
  const dn = await prisma.deliveryNote.findFirst({
    where: confirmWhere,
    include: { lines: true },
  });

  if (!dn) {
    return { success: false, error: 'Delivery note not found' };
  }

  if (dn.status !== 'DISPATCHED') {
    return { success: false, error: `Cannot confirm delivery for a note with status ${dn.status}` };
  }

  // Validate all lines are accounted for
  const lineMap = new Map(dn.lines.map((l) => [l.id, l]));
  for (const inputLine of input.lines) {
    if (!lineMap.has(inputLine.lineId)) {
      return { success: false, error: `Line ${inputLine.lineId} not found on this delivery note` };
    }
  }

  const orderTransitionedToDelivered = await prisma.$transaction(async (tx) => {
    // Update each line with received/damaged quantities
    for (const inputLine of input.lines) {
      await tx.deliveryNoteLine.update({
        where: { id: inputLine.lineId },
        data: {
          quantityReceived: inputLine.quantityReceived,
          quantityDamaged: inputLine.quantityDamaged,
          damageNotes: inputLine.damageNotes || null,
        },
      });
    }

    // Update delivery note status
    await tx.deliveryNote.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        deliveredByName: input.deliveredByName,
        signatureNotes: input.signatureNotes || null,
      },
    });

    // Propagate to order: check if all non-cancelled DNs are delivered
    const allDNs = await tx.deliveryNote.findMany({
      where: { orderId: dn.orderId, status: { not: 'CANCELLED' } },
      select: { status: true },
    });

    const allDelivered = allDNs.every((d) => d.status === 'DELIVERED');

    if (allDelivered) {
      const order = await tx.salesOrder.findUnique({
        where: { id: dn.orderId },
        select: { status: true },
      });

      if (order && (order.status === 'SHIPPED' || order.status === 'PARTIALLY_SHIPPED')) {
        await tx.salesOrder.update({
          where: { id: dn.orderId },
          data: { status: 'DELIVERED', deliveredDate: new Date() },
        });
        return true;
      }
    }

    return false;
  });

  // Auto-generate tax invoice when order transitions to DELIVERED
  // Done outside the transaction to not block delivery confirmation if invoice generation fails
  if (orderTransitionedToDelivered) {
    try {
      await createTaxInvoice(dn.orderId, _userId, companyId ?? dn.companyId);
      logger.info(`Auto-generated tax invoice for order ${dn.orderId} after delivery confirmation`);
    } catch (error) {
      // Log but don't fail — staff can manually generate the tax invoice later
      logger.error(`Failed to auto-generate tax invoice for order ${dn.orderId}:`, error);
    }
  }

  return { success: true };
}

/**
 * Cancel a delivery note (DRAFT or DISPATCHED → CANCELLED).
 * If it was dispatched, may need to revert the order status.
 */
export async function cancelDeliveryNote(
  id: string,
  _userId: string,
  companyId?: string
): Promise<{ success: boolean; error?: string }> {
  const cancelWhere: Prisma.DeliveryNoteWhereInput = { id };
  if (companyId) cancelWhere.companyId = companyId;
  const dn = await prisma.deliveryNote.findFirst({
    where: cancelWhere,
  });

  if (!dn) {
    return { success: false, error: 'Delivery note not found' };
  }

  if (dn.status !== 'DRAFT' && dn.status !== 'DISPATCHED') {
    return { success: false, error: `Cannot cancel a delivery note with status ${dn.status}` };
  }

  const wasDispatched = dn.status === 'DISPATCHED';

  await prisma.$transaction(async (tx) => {
    await tx.deliveryNote.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // If it was dispatched, re-evaluate the order status
    if (wasDispatched) {
      const remainingDNs = await tx.deliveryNote.findMany({
        where: { orderId: dn.orderId, status: { not: 'CANCELLED' } },
        select: { status: true },
      });

      const order = await tx.salesOrder.findUnique({
        where: { id: dn.orderId },
        select: { status: true },
      });

      if (order) {
        if (remainingDNs.length === 0) {
          // No active DNs — revert to READY_TO_SHIP if currently SHIPPED/PARTIALLY_SHIPPED
          if (order.status === 'SHIPPED' || order.status === 'PARTIALLY_SHIPPED') {
            await tx.salesOrder.update({
              where: { id: dn.orderId },
              data: { status: 'READY_TO_SHIP', shippedDate: null },
            });
          }
        } else {
          const anyDispatched = remainingDNs.some(
            (d) => d.status === 'DISPATCHED' || d.status === 'DELIVERED'
          );
          if (!anyDispatched && order.status === 'PARTIALLY_SHIPPED') {
            await tx.salesOrder.update({
              where: { id: dn.orderId },
              data: { status: 'READY_TO_SHIP', shippedDate: null },
            });
          }
        }
      }
    }
  });

  return { success: true };
}
