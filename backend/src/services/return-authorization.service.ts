import { Prisma, Warehouse, ReturnAuthorizationStatus, ReturnReason } from '@prisma/client';
import { prisma } from '../config/database';
import { updateStockLevel, createStockMovement } from './inventory.service';
import { createCreditNote } from './credit-note.service';
import { logger } from '../utils/logger';
import type {
  CreateReturnAuthorizationInput,
  RejectReturnAuthorizationInput,
  ReceiveItemsInput,
  CompleteReturnAuthorizationInput,
  ReturnAuthorizationListQuery,
} from '../utils/validation/return-authorizations';

// ============================================
// TYPES
// ============================================

export interface ReturnAuthorizationLineData {
  id: string;
  lineNumber: number;
  orderLineId: string | null;
  deliveryNoteLineId: string | null;
  productId: string;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  quantityReturned: number;
  quantityReceived: number;
  returnReason: string;
  reasonNotes: string | null;
  resolution: string | null;
}

export interface ReturnAuthorizationData {
  id: string;
  raNumber: string;
  companyId: string;
  status: ReturnAuthorizationStatus;
  orderId: string | null;
  orderNumber: string | null;
  deliveryNoteId: string | null;
  deliveryNoteNumber: string | null;
  customerName: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
  warehouse: Warehouse;
  approvedAt: Date | null;
  approvedBy: string | null;
  approvedByName: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  itemsReceivedAt: Date | null;
  itemsReceivedBy: string | null;
  itemsReceivedByName: string | null;
  completedAt: Date | null;
  completedBy: string | null;
  completedByName: string | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  notes: string | null;
  lines: ReturnAuthorizationLineData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnAuthorizationSummary {
  id: string;
  raNumber: string;
  orderNumber: string | null;
  orderId: string | null;
  deliveryNoteNumber: string | null;
  deliveryNoteId: string | null;
  customerName: string;
  status: ReturnAuthorizationStatus;
  requestedByName: string;
  requestedByRole: string;
  lineCount: number;
  totalQuantityReturned: number;
  warehouse: Warehouse;
  createdAt: Date;
}

// ============================================
// NUMBER GENERATION
// ============================================

/**
 * Generate the next RA number in format RA-YYYY-NNNNN
 */
export async function generateRANumber(): Promise<string> {
  const currentYear = new Date().getFullYear();

  const counter = await prisma.$transaction(async (tx) => {
    let counter = await tx.returnAuthorizationCounter.findUnique({
      where: { id: 'ra_counter' },
    });

    if (!counter) {
      counter = await tx.returnAuthorizationCounter.create({
        data: {
          id: 'ra_counter',
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    if (counter.year !== currentYear) {
      counter = await tx.returnAuthorizationCounter.update({
        where: { id: 'ra_counter' },
        data: {
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    counter = await tx.returnAuthorizationCounter.update({
      where: { id: 'ra_counter' },
      data: {
        count: { increment: 1 },
      },
    });

    return counter;
  });

  const paddedCount = counter.count.toString().padStart(5, '0');
  return `RA-${currentYear}-${paddedCount}`;
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Create a return authorization.
 * Customer-created RAs start as REQUESTED (need approval).
 * Staff-created RAs are auto-approved.
 */
export async function createReturnAuthorization(
  input: CreateReturnAuthorizationInput,
  userId: string,
  userName: string,
  userRole: string,
  companyId: string
): Promise<{ success: boolean; returnAuthorization?: { id: string; raNumber: string }; error?: string }> {
  // Validate parent document exists
  let customerName = input.customerName || '';
  let orderNumber = input.orderNumber || null;
  let deliveryNoteNumber = input.deliveryNoteNumber || null;

  if (input.orderId) {
    const order = await prisma.salesOrder.findFirst({
      where: { id: input.orderId, companyId, deletedAt: null },
      include: { company: { select: { name: true } } },
    });
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    orderNumber = order.orderNumber;
    if (!customerName) customerName = order.company.name;
  }

  if (input.deliveryNoteId) {
    const dn = await prisma.deliveryNote.findFirst({
      where: { id: input.deliveryNoteId, companyId },
    });
    if (!dn) {
      return { success: false, error: 'Delivery note not found' };
    }
    deliveryNoteNumber = dn.deliveryNoteNumber;
    if (!customerName) customerName = dn.customerName;
  }

  if (!customerName) {
    return { success: false, error: 'Customer name could not be determined' };
  }

  const raNumber = await generateRANumber();
  const isStaffCreated = userRole !== 'CUSTOMER';
  const now = new Date();

  const ra = await prisma.$transaction(async (tx) => {
    const ra = await tx.returnAuthorization.create({
      data: {
        raNumber,
        companyId,
        status: isStaffCreated ? 'APPROVED' : 'REQUESTED',
        orderId: input.orderId || null,
        orderNumber,
        deliveryNoteId: input.deliveryNoteId || null,
        deliveryNoteNumber,
        customerName,
        requestedBy: userId,
        requestedByName: userName,
        requestedByRole: userRole,
        warehouse: input.warehouse as Warehouse || 'JHB',
        // Auto-approve for staff
        ...(isStaffCreated ? {
          approvedAt: now,
          approvedBy: userId,
          approvedByName: userName,
        } : {}),
        notes: input.notes || null,
      },
    });

    const lineData = input.lines.map((line, index) => ({
      returnAuthorizationId: ra.id,
      lineNumber: index + 1,
      orderLineId: line.orderLineId || null,
      deliveryNoteLineId: line.deliveryNoteLineId || null,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      unitOfMeasure: line.unitOfMeasure,
      quantityReturned: line.quantityReturned,
      returnReason: line.returnReason as ReturnReason,
      reasonNotes: line.reasonNotes || null,
    }));

    await tx.returnAuthorizationLine.createMany({ data: lineData });

    return ra;
  });

  return {
    success: true,
    returnAuthorization: {
      id: ra.id,
      raNumber: ra.raNumber,
    },
  };
}

/**
 * Get return authorization by ID with lines
 */
export async function getReturnAuthorizationById(
  id: string,
  companyId: string
): Promise<ReturnAuthorizationData | null> {
  const ra = await prisma.returnAuthorization.findFirst({
    where: { id, companyId },
    include: {
      lines: { orderBy: { lineNumber: 'asc' } },
    },
  });

  if (!ra) return null;

  return {
    id: ra.id,
    raNumber: ra.raNumber,
    companyId: ra.companyId,
    status: ra.status,
    orderId: ra.orderId,
    orderNumber: ra.orderNumber,
    deliveryNoteId: ra.deliveryNoteId,
    deliveryNoteNumber: ra.deliveryNoteNumber,
    customerName: ra.customerName,
    requestedBy: ra.requestedBy,
    requestedByName: ra.requestedByName,
    requestedByRole: ra.requestedByRole,
    warehouse: ra.warehouse,
    approvedAt: ra.approvedAt,
    approvedBy: ra.approvedBy,
    approvedByName: ra.approvedByName,
    rejectedAt: ra.rejectedAt,
    rejectedBy: ra.rejectedBy,
    rejectionReason: ra.rejectionReason,
    itemsReceivedAt: ra.itemsReceivedAt,
    itemsReceivedBy: ra.itemsReceivedBy,
    itemsReceivedByName: ra.itemsReceivedByName,
    completedAt: ra.completedAt,
    completedBy: ra.completedBy,
    completedByName: ra.completedByName,
    cancelledAt: ra.cancelledAt,
    cancelReason: ra.cancelReason,
    notes: ra.notes,
    lines: ra.lines.map((line) => ({
      id: line.id,
      lineNumber: line.lineNumber,
      orderLineId: line.orderLineId,
      deliveryNoteLineId: line.deliveryNoteLineId,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      unitOfMeasure: line.unitOfMeasure,
      quantityReturned: line.quantityReturned,
      quantityReceived: line.quantityReceived,
      returnReason: line.returnReason,
      reasonNotes: line.reasonNotes,
      resolution: line.resolution,
    })),
    createdAt: ra.createdAt,
    updatedAt: ra.updatedAt,
  };
}

/**
 * Get return authorizations with filtering and pagination
 */
export async function getReturnAuthorizations(
  companyId: string,
  query: ReturnAuthorizationListQuery
): Promise<{
  returnAuthorizations: ReturnAuthorizationSummary[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}> {
  const { orderId, deliveryNoteId, status, search, page = 1, pageSize = 20 } = query;

  const where: Prisma.ReturnAuthorizationWhereInput = { companyId };

  if (orderId) where.orderId = orderId;
  if (deliveryNoteId) where.deliveryNoteId = deliveryNoteId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { raNumber: { contains: search, mode: 'insensitive' } },
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { deliveryNoteNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, returnAuthorizations] = await Promise.all([
    prisma.returnAuthorization.count({ where }),
    prisma.returnAuthorization.findMany({
      where,
      include: {
        lines: { select: { quantityReturned: true } },
        _count: { select: { lines: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    returnAuthorizations: returnAuthorizations.map((ra) => ({
      id: ra.id,
      raNumber: ra.raNumber,
      orderNumber: ra.orderNumber,
      orderId: ra.orderId,
      deliveryNoteNumber: ra.deliveryNoteNumber,
      deliveryNoteId: ra.deliveryNoteId,
      customerName: ra.customerName,
      status: ra.status,
      requestedByName: ra.requestedByName,
      requestedByRole: ra.requestedByRole,
      lineCount: ra._count.lines,
      totalQuantityReturned: ra.lines.reduce((sum, l) => sum + l.quantityReturned, 0),
      warehouse: ra.warehouse,
      createdAt: ra.createdAt,
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
 * Get return authorizations for a specific order (summary for order detail page)
 */
export async function getReturnAuthorizationsForOrder(
  orderId: string,
  companyId: string
): Promise<Array<{
  id: string;
  raNumber: string;
  status: ReturnAuthorizationStatus;
  lineCount: number;
  totalQuantityReturned: number;
  createdAt: Date;
}>> {
  const ras = await prisma.returnAuthorization.findMany({
    where: { orderId, companyId },
    include: {
      lines: { select: { quantityReturned: true } },
      _count: { select: { lines: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return ras.map((ra) => ({
    id: ra.id,
    raNumber: ra.raNumber,
    status: ra.status,
    lineCount: ra._count.lines,
    totalQuantityReturned: ra.lines.reduce((sum, l) => sum + l.quantityReturned, 0),
    createdAt: ra.createdAt,
  }));
}

// ============================================
// STATUS TRANSITIONS
// ============================================

/**
 * Approve a return authorization (REQUESTED → APPROVED)
 */
export async function approveReturnAuthorization(
  id: string,
  userId: string,
  userName: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const ra = await prisma.returnAuthorization.findFirst({
    where: { id, companyId },
  });

  if (!ra) {
    return { success: false, error: 'Return authorization not found' };
  }

  if (ra.status !== 'REQUESTED') {
    return { success: false, error: `Cannot approve a return authorization with status ${ra.status}` };
  }

  await prisma.returnAuthorization.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: userId,
      approvedByName: userName,
    },
  });

  return { success: true };
}

/**
 * Reject a return authorization (REQUESTED → REJECTED)
 */
export async function rejectReturnAuthorization(
  id: string,
  input: RejectReturnAuthorizationInput,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const ra = await prisma.returnAuthorization.findFirst({
    where: { id, companyId },
  });

  if (!ra) {
    return { success: false, error: 'Return authorization not found' };
  }

  if (ra.status !== 'REQUESTED') {
    return { success: false, error: `Cannot reject a return authorization with status ${ra.status}` };
  }

  await prisma.returnAuthorization.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedBy: userId,
      rejectionReason: input.reason,
    },
  });

  return { success: true };
}

/**
 * Record received items (APPROVED → ITEMS_RECEIVED).
 * Warehouse confirms what they physically received back.
 */
export async function receiveItems(
  id: string,
  input: ReceiveItemsInput,
  userId: string,
  userName: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const ra = await prisma.returnAuthorization.findFirst({
    where: { id, companyId },
    include: { lines: true },
  });

  if (!ra) {
    return { success: false, error: 'Return authorization not found' };
  }

  if (ra.status !== 'APPROVED') {
    return { success: false, error: `Cannot receive items for a return authorization with status ${ra.status}` };
  }

  // Validate all lines are accounted for
  const lineMap = new Map(ra.lines.map((l) => [l.id, l]));
  for (const inputLine of input.lines) {
    const existing = lineMap.get(inputLine.lineId);
    if (!existing) {
      return { success: false, error: `Line ${inputLine.lineId} not found on this return authorization` };
    }
    if (inputLine.quantityReceived > existing.quantityReturned) {
      return {
        success: false,
        error: `Quantity received (${inputLine.quantityReceived}) cannot exceed quantity returned (${existing.quantityReturned}) for ${existing.productSku}`,
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    // Update each line with received quantity
    for (const inputLine of input.lines) {
      await tx.returnAuthorizationLine.update({
        where: { id: inputLine.lineId },
        data: { quantityReceived: inputLine.quantityReceived },
      });
    }

    // Update RA status
    await tx.returnAuthorization.update({
      where: { id },
      data: {
        status: 'ITEMS_RECEIVED',
        itemsReceivedAt: new Date(),
        itemsReceivedBy: userId,
        itemsReceivedByName: userName,
      },
    });
  });

  return { success: true };
}

/**
 * Complete a return authorization (ITEMS_RECEIVED → COMPLETED).
 * Applies resolution per line and updates stock accordingly.
 *
 * RESTOCK: Creates RETURN StockMovement, increases onHand
 * SCRAP: Creates SCRAP StockMovement (audit trail only, no onHand change)
 * REPLACE: No stock movement (staff creates new delivery note separately)
 */
export async function completeReturnAuthorization(
  id: string,
  input: CompleteReturnAuthorizationInput,
  userId: string,
  userName: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const ra = await prisma.returnAuthorization.findFirst({
    where: { id, companyId },
    include: { lines: true },
  });

  if (!ra) {
    return { success: false, error: 'Return authorization not found' };
  }

  if (ra.status !== 'ITEMS_RECEIVED') {
    return { success: false, error: `Cannot complete a return authorization with status ${ra.status}` };
  }

  // Validate all lines have a resolution
  const lineMap = new Map(ra.lines.map((l) => [l.id, l]));
  const resolutionMap = new Map(input.lines.map((l) => [l.lineId, l.resolution]));

  for (const line of ra.lines) {
    if (!resolutionMap.has(line.id)) {
      return { success: false, error: `Resolution required for line ${line.productSku}` };
    }
  }

  await prisma.$transaction(async (tx) => {
    // Process each line
    for (const inputLine of input.lines) {
      const line = lineMap.get(inputLine.lineId);
      if (!line) continue;

      // Set the resolution on the line
      await tx.returnAuthorizationLine.update({
        where: { id: inputLine.lineId },
        data: { resolution: inputLine.resolution },
      });

      if (inputLine.resolution === 'RESTOCK' && line.quantityReceived > 0) {
        // RESTOCK: increase onHand + create RETURN movement
        const result = await updateStockLevel(
          tx,
          line.productId,
          ra.warehouse,
          { onHand: line.quantityReceived },
          userId
        );

        await createStockMovement(tx, {
          productId: line.productId,
          location: ra.warehouse,
          movementType: 'RETURN',
          quantity: line.quantityReceived,
          balanceAfter: result.onHand,
          referenceType: 'ReturnAuthorization',
          referenceId: ra.id,
          referenceNumber: ra.raNumber,
          notes: `Restocked from return ${ra.raNumber} — ${line.returnReason}`,
          createdBy: userId,
        });
      } else if (inputLine.resolution === 'SCRAP' && line.quantityReceived > 0) {
        // SCRAP: create SCRAP movement for audit trail (no onHand change)
        // Get current balance for the balanceAfter field
        const stockLevel = await tx.stockLevel.findUnique({
          where: { productId_location: { productId: line.productId, location: ra.warehouse } },
        });
        const currentOnHand = stockLevel?.onHand ?? 0;

        await createStockMovement(tx, {
          productId: line.productId,
          location: ra.warehouse,
          movementType: 'SCRAP',
          quantity: line.quantityReceived,
          balanceAfter: currentOnHand,
          referenceType: 'ReturnAuthorization',
          referenceId: ra.id,
          referenceNumber: ra.raNumber,
          notes: `Scrapped from return ${ra.raNumber} — ${line.returnReason}`,
          createdBy: userId,
        });
      }
      // REPLACE: No stock movement — staff creates a new DN separately
    }

    // Update RA status
    await tx.returnAuthorization.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedBy: userId,
        completedByName: userName,
      },
    });
  });

  // Auto-generate credit note — try/catch so RA completion succeeds even if credit note fails
  try {
    const cnResult = await createCreditNote(id, userId);
    if (cnResult.success && cnResult.creditNote) {
      logger.info(`Auto-generated credit note ${cnResult.creditNote.creditNoteNumber} for RA ${id}`);
    } else if (!cnResult.success) {
      logger.warn(`Failed to auto-generate credit note for RA ${id}: ${cnResult.error}`);
    }
  } catch (cnError) {
    logger.error(`Error auto-generating credit note for RA ${id}:`, cnError);
  }

  return { success: true };
}

/**
 * Cancel a return authorization (REQUESTED or APPROVED → CANCELLED)
 */
export async function cancelReturnAuthorization(
  id: string,
  _userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const ra = await prisma.returnAuthorization.findFirst({
    where: { id, companyId },
  });

  if (!ra) {
    return { success: false, error: 'Return authorization not found' };
  }

  if (ra.status !== 'REQUESTED' && ra.status !== 'APPROVED') {
    return { success: false, error: `Cannot cancel a return authorization with status ${ra.status}` };
  }

  // Customers can only cancel their own requests
  // (Role check is done at the API layer — this service trusts caller)

  await prisma.returnAuthorization.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });

  return { success: true };
}
