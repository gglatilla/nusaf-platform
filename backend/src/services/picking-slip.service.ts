import { Prisma, PickingSlipStatus, Warehouse } from '@prisma/client';
import { prisma } from '../config/database';
import { updateStockLevel, createStockMovement } from './inventory.service';
import { generatePickingSlipNumber } from '../utils/number-generation';
import { notifyPickingStarted, notifyOrderReadyToInvoice } from './notification.service';

/**
 * Valid status transitions for picking slips
 */
export const PICKING_SLIP_STATUS_TRANSITIONS: Record<PickingSlipStatus, PickingSlipStatus[]> = {
  PENDING: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETE', 'CANCELLED'],
  COMPLETE: [],
  CANCELLED: [],
};

/**
 * Generate the next picking slip number in format PS-YYYY-NNNNN
 */

/**
 * Line item data for creating a picking slip
 */
export interface CreatePickingSlipLineInput {
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityToPick: number;
}

/**
 * Create a picking slip for a confirmed order
 */
export async function createPickingSlip(
  orderId: string,
  location: Warehouse,
  lines: CreatePickingSlipLineInput[],
  userId: string,
  companyId: string
): Promise<{ success: boolean; pickingSlip?: { id: string; pickingSlipNumber: string }; error?: string }> {
  // Verify the order exists, is confirmed, and belongs to the company
  const order = await prisma.salesOrder.findFirst({
    where: {
      id: orderId,
      companyId,
      deletedAt: null,
    },
  });

  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.status !== 'CONFIRMED') {
    return { success: false, error: 'Picking slips can only be created for CONFIRMED orders' };
  }

  if (lines.length === 0) {
    return { success: false, error: 'At least one line item is required' };
  }

  // Generate picking slip number
  const pickingSlipNumber = await generatePickingSlipNumber();

  // Create picking slip with lines in a transaction
  const pickingSlip = await prisma.$transaction(async (tx) => {
    const newPickingSlip = await tx.pickingSlip.create({
      data: {
        pickingSlipNumber,
        companyId,
        orderId,
        orderNumber: order.orderNumber,
        location,
        status: 'PENDING',
        createdBy: userId,
      },
    });

    // Create picking slip lines
    const lineData = lines.map((line) => ({
      pickingSlipId: newPickingSlip.id,
      orderLineId: line.orderLineId,
      lineNumber: line.lineNumber,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      quantityToPick: line.quantityToPick,
    }));

    await tx.pickingSlipLine.createMany({
      data: lineData,
    });

    return newPickingSlip;
  });

  return {
    success: true,
    pickingSlip: {
      id: pickingSlip.id,
      pickingSlipNumber: pickingSlip.pickingSlipNumber,
    },
  };
}

/**
 * Get picking slips with filtering and pagination
 */
export async function getPickingSlips(options: {
  companyId: string;
  orderId?: string;
  location?: Warehouse;
  status?: PickingSlipStatus;
  page?: number;
  pageSize?: number;
}): Promise<{
  pickingSlips: Array<{
    id: string;
    pickingSlipNumber: string;
    orderNumber: string;
    orderId: string;
    location: Warehouse;
    status: PickingSlipStatus;
    assignedToName: string | null;
    lineCount: number;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const { companyId, orderId, location, status, page = 1, pageSize = 20 } = options;

  const where: Prisma.PickingSlipWhereInput = {
    companyId,
  };

  if (orderId) {
    where.orderId = orderId;
  }

  if (location) {
    where.location = location;
  }

  if (status) {
    where.status = status;
  }

  const [total, pickingSlips] = await Promise.all([
    prisma.pickingSlip.count({ where }),
    prisma.pickingSlip.findMany({
      where,
      include: {
        _count: { select: { lines: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    pickingSlips: pickingSlips.map((ps) => ({
      id: ps.id,
      pickingSlipNumber: ps.pickingSlipNumber,
      orderNumber: ps.orderNumber,
      orderId: ps.orderId,
      location: ps.location,
      status: ps.status,
      assignedToName: ps.assignedToName,
      lineCount: ps._count.lines,
      createdAt: ps.createdAt,
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
 * Get picking slip by ID with lines
 */
export async function getPickingSlipById(id: string, companyId: string) {
  const pickingSlip = await prisma.pickingSlip.findFirst({
    where: {
      id,
      companyId,
    },
    include: {
      lines: {
        orderBy: { lineNumber: 'asc' },
      },
    },
  });

  if (!pickingSlip) {
    return null;
  }

  return {
    id: pickingSlip.id,
    pickingSlipNumber: pickingSlip.pickingSlipNumber,
    companyId: pickingSlip.companyId,
    orderId: pickingSlip.orderId,
    orderNumber: pickingSlip.orderNumber,
    location: pickingSlip.location,
    status: pickingSlip.status,
    assignedTo: pickingSlip.assignedTo,
    assignedToName: pickingSlip.assignedToName,
    startedAt: pickingSlip.startedAt,
    completedAt: pickingSlip.completedAt,
    lines: pickingSlip.lines.map((line) => ({
      id: line.id,
      orderLineId: line.orderLineId,
      lineNumber: line.lineNumber,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      quantityToPick: line.quantityToPick,
      quantityPicked: line.quantityPicked,
      pickedAt: line.pickedAt,
      pickedBy: line.pickedBy,
      binLocation: line.binLocation,
    })),
    createdAt: pickingSlip.createdAt,
    createdBy: pickingSlip.createdBy,
    updatedAt: pickingSlip.updatedAt,
  };
}

/**
 * Assign a picking slip to a user
 */
export async function assignPickingSlip(
  id: string,
  assignedTo: string,
  assignedToName: string,
  _userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const pickingSlip = await prisma.pickingSlip.findFirst({
    where: {
      id,
      companyId,
    },
  });

  if (!pickingSlip) {
    return { success: false, error: 'Picking slip not found' };
  }

  if (pickingSlip.status === 'COMPLETE') {
    return { success: false, error: 'Cannot assign a completed picking slip' };
  }

  await prisma.pickingSlip.update({
    where: { id },
    data: {
      assignedTo,
      assignedToName,
    },
  });

  return { success: true };
}

/**
 * Start picking - change status from PENDING to IN_PROGRESS
 */
export async function startPicking(
  id: string,
  _userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const pickingSlip = await prisma.pickingSlip.findFirst({
    where: {
      id,
      companyId,
    },
  });

  if (!pickingSlip) {
    return { success: false, error: 'Picking slip not found' };
  }

  if (pickingSlip.status !== 'PENDING') {
    return { success: false, error: `Cannot start picking for a slip with status ${pickingSlip.status}` };
  }

  await prisma.pickingSlip.update({
    where: { id },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  });

  // Fire-and-forget notification
  notifyPickingStarted(pickingSlip.orderId, pickingSlip.orderNumber, pickingSlip.companyId)
    .catch(() => {/* notification failure is non-blocking */});

  return { success: true };
}

/**
 * Update the picked quantity for a line
 */
export async function updateLinePicked(
  pickingSlipId: string,
  lineId: string,
  quantityPicked: number,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const pickingSlip = await prisma.pickingSlip.findFirst({
    where: {
      id: pickingSlipId,
      companyId,
    },
    include: {
      lines: {
        where: { id: lineId },
      },
    },
  });

  if (!pickingSlip) {
    return { success: false, error: 'Picking slip not found' };
  }

  if (pickingSlip.lines.length === 0) {
    return { success: false, error: 'Line not found' };
  }

  const line = pickingSlip.lines[0];

  if (pickingSlip.status === 'COMPLETE') {
    return { success: false, error: 'Cannot update a completed picking slip' };
  }

  if (quantityPicked < 0) {
    return { success: false, error: 'Quantity picked cannot be negative' };
  }

  if (quantityPicked > line.quantityToPick) {
    return { success: false, error: 'Quantity picked cannot exceed quantity to pick' };
  }

  await prisma.pickingSlipLine.update({
    where: { id: lineId },
    data: {
      quantityPicked,
      pickedAt: quantityPicked > 0 ? new Date() : null,
      pickedBy: quantityPicked > 0 ? userId : null,
    },
  });

  return { success: true };
}

/**
 * Complete picking - change status from IN_PROGRESS to COMPLETE
 * Validates that all lines have been picked, then within a single transaction:
 * - Creates ISSUE stock movements for each picked line
 * - Decreases onHand at the picking location
 * - Releases hard reservations for the parent SalesOrder
 * - Propagates status to the parent SalesOrder
 */
export async function completePicking(
  id: string,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const pickingSlip = await prisma.pickingSlip.findFirst({
    where: {
      id,
      companyId,
    },
    include: {
      lines: true,
    },
  });

  if (!pickingSlip) {
    return { success: false, error: 'Picking slip not found' };
  }

  if (pickingSlip.status !== 'IN_PROGRESS') {
    return { success: false, error: `Cannot complete picking for a slip with status ${pickingSlip.status}` };
  }

  // Check if all lines have been fully picked
  const incompleteLine = pickingSlip.lines.find((line) => line.quantityPicked < line.quantityToPick);
  if (incompleteLine) {
    return {
      success: false,
      error: `Line ${incompleteLine.lineNumber} (${incompleteLine.productSku}) not fully picked: ${incompleteLine.quantityPicked}/${incompleteLine.quantityToPick}`,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Mark picking slip as COMPLETE
      await tx.pickingSlip.update({
        where: { id },
        data: {
          status: 'COMPLETE',
          completedAt: new Date(),
        },
      });

      // 2. For each line: decrease onHand + create ISSUE movement
      for (const line of pickingSlip.lines) {
        if (line.quantityPicked <= 0) continue;

        const newLevel = await updateStockLevel(
          tx,
          line.productId,
          pickingSlip.location,
          { onHand: -line.quantityPicked },
          userId
        );

        await createStockMovement(tx, {
          productId: line.productId,
          location: pickingSlip.location,
          movementType: 'ISSUE',
          quantity: line.quantityPicked,
          balanceAfter: newLevel.onHand,
          referenceType: 'PickingSlip',
          referenceId: pickingSlip.id,
          referenceNumber: pickingSlip.pickingSlipNumber,
          notes: `Picked for order ${pickingSlip.orderNumber}`,
          createdBy: userId,
        });
      }

      // 3. Release hard reservations for the picked products on this order
      for (const line of pickingSlip.lines) {
        if (line.quantityPicked <= 0) continue;

        const reservations = await tx.stockReservation.findMany({
          where: {
            referenceType: 'SalesOrder',
            referenceId: pickingSlip.orderId,
            productId: line.productId,
            location: pickingSlip.location,
            reservationType: 'HARD',
            releasedAt: null,
          },
        });

        for (const reservation of reservations) {
          await tx.stockReservation.update({
            where: { id: reservation.id },
            data: {
              releasedAt: new Date(),
              releasedBy: userId,
              releaseReason: `Fulfilled by picking slip ${pickingSlip.pickingSlipNumber}`,
            },
          });

          await updateStockLevel(
            tx,
            reservation.productId,
            reservation.location,
            { hardReserved: -reservation.quantity },
            userId
          );
        }
      }

      // 4. Propagate status to SalesOrder
      const allPickingSlips = await tx.pickingSlip.findMany({
        where: { orderId: pickingSlip.orderId },
        select: { status: true },
      });

      const allJobCards = await tx.jobCard.findMany({
        where: { orderId: pickingSlip.orderId },
        select: { status: true },
      });

      const allTransfers = await tx.transferRequest.findMany({
        where: { orderId: pickingSlip.orderId },
        select: { status: true },
      });

      const allPickingComplete = allPickingSlips.every((ps) => ps.status === 'COMPLETE' || ps.status === 'CANCELLED');
      const allJobsComplete = allJobCards.length === 0 || allJobCards.every((jc) => jc.status === 'COMPLETE' || jc.status === 'CANCELLED');
      const allTransfersComplete = allTransfers.length === 0 || allTransfers.every((tr) => tr.status === 'RECEIVED' || tr.status === 'CANCELLED');

      const order = await tx.salesOrder.findUnique({
        where: { id: pickingSlip.orderId },
        select: { status: true },
      });

      if (order) {
        if (allPickingComplete && allJobsComplete && allTransfersComplete) {
          if (order.status === 'CONFIRMED' || order.status === 'PROCESSING') {
            await tx.salesOrder.update({
              where: { id: pickingSlip.orderId },
              data: { status: 'READY_TO_SHIP' },
            });
          }
        } else if (order.status === 'CONFIRMED') {
          await tx.salesOrder.update({
            where: { id: pickingSlip.orderId },
            data: { status: 'PROCESSING' },
          });
        }
      }
    });

    // Fire-and-forget notifications (non-blocking)
    try {
      const updatedOrder = await prisma.salesOrder.findUnique({
        where: { id: pickingSlip.orderId },
        select: { status: true },
      });
      if (updatedOrder?.status === 'READY_TO_SHIP') {
        notifyOrderReadyToInvoice(pickingSlip.orderId, pickingSlip.orderNumber, pickingSlip.companyId)
          .catch(() => {});
      }
    } catch {
      // Notification failure is non-blocking
    }

    return { success: true };
  } catch (error) {
    console.error('Complete picking error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete picking',
    };
  }
}

/**
 * Get picking slips for an order
 */
export async function getPickingSlipsForOrder(
  orderId: string,
  companyId: string
): Promise<Array<{
  id: string;
  pickingSlipNumber: string;
  location: Warehouse;
  status: PickingSlipStatus;
  lineCount: number;
  assignedToName: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}>> {
  const pickingSlips = await prisma.pickingSlip.findMany({
    where: {
      orderId,
      companyId,
    },
    include: {
      _count: { select: { lines: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return pickingSlips.map((ps) => ({
    id: ps.id,
    pickingSlipNumber: ps.pickingSlipNumber,
    location: ps.location,
    status: ps.status,
    lineCount: ps._count.lines,
    assignedToName: ps.assignedToName,
    createdAt: ps.createdAt,
    startedAt: ps.startedAt,
    completedAt: ps.completedAt,
  }));
}

/**
 * Check if picking slips exist for an order
 */
export async function hasPickingSlips(orderId: string, companyId: string): Promise<boolean> {
  const count = await prisma.pickingSlip.count({
    where: {
      orderId,
      companyId,
    },
  });
  return count > 0;
}
