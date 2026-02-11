import { Prisma, TransferRequestStatus, Warehouse } from '@prisma/client';
import { prisma } from '../config/database';
import { updateStockLevel, createStockMovement } from './inventory.service';
import { generateTransferRequestNumber } from '../utils/number-generation';
import { notifyTransferShipped, notifyTransferReceived, notifyOrderReadyToInvoice } from './notification.service';

/**
 * Valid status transitions for transfer requests
 */
export const TRANSFER_REQUEST_STATUS_TRANSITIONS: Record<TransferRequestStatus, TransferRequestStatus[]> = {
  PENDING: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['RECEIVED'],
  RECEIVED: [],
  CANCELLED: [],
};

/**
 * Generate the next transfer request number in format TR-YYYY-NNNNN
 */

/**
 * Line item data for creating a transfer request from order
 */
export interface CreateTransferRequestLineInput {
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
}

/**
 * Line item data for creating a standalone transfer request
 */
export interface CreateStandaloneTransferRequestLineInput {
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
}

/**
 * Create a transfer request from a confirmed order (CT customer fulfillment)
 */
export async function createTransferRequest(
  orderId: string,
  lines: CreateTransferRequestLineInput[],
  userId: string,
  companyId?: string
): Promise<{ success: boolean; transferRequest?: { id: string; transferNumber: string }; error?: string }> {
  // Verify the order exists, is confirmed/processing, and belongs to the company
  const orderWhere: Prisma.SalesOrderWhereInput = { id: orderId, deletedAt: null };
  if (companyId) orderWhere.companyId = companyId;
  const order = await prisma.salesOrder.findFirst({
    where: orderWhere,
  });

  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.status !== 'CONFIRMED' && order.status !== 'PROCESSING') {
    return { success: false, error: 'Transfer requests can only be created for CONFIRMED or PROCESSING orders' };
  }

  if (lines.length === 0) {
    return { success: false, error: 'At least one line item is required' };
  }

  // Generate transfer request number
  const transferNumber = await generateTransferRequestNumber();

  // Create transfer request with lines in a transaction
  const transferRequest = await prisma.$transaction(async (tx) => {
    const newTransferRequest = await tx.transferRequest.create({
      data: {
        transferNumber,
        companyId: companyId ?? order.companyId,
        orderId,
        orderNumber: order.orderNumber,
        fromLocation: 'JHB',
        toLocation: 'CT',
        status: 'PENDING',
        createdBy: userId,
      },
    });

    // Create transfer request lines
    const lineData = lines.map((line) => ({
      transferRequestId: newTransferRequest.id,
      orderLineId: line.orderLineId,
      lineNumber: line.lineNumber,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      quantity: line.quantity,
    }));

    await tx.transferRequestLine.createMany({
      data: lineData,
    });

    return newTransferRequest;
  });

  return {
    success: true,
    transferRequest: {
      id: transferRequest.id,
      transferNumber: transferRequest.transferNumber,
    },
  };
}

/**
 * Create a standalone transfer request (stock replenishment)
 */
export async function createStandaloneTransferRequest(
  lines: CreateStandaloneTransferRequestLineInput[],
  notes: string | null,
  userId: string,
  fromLocation: Warehouse = 'JHB',
  toLocation: Warehouse = 'CT',
  companyId?: string
): Promise<{ success: boolean; transferRequest?: { id: string; transferNumber: string }; error?: string }> {
  if (lines.length === 0) {
    return { success: false, error: 'At least one line item is required' };
  }

  if (fromLocation === toLocation) {
    return { success: false, error: 'Source and destination warehouses must be different' };
  }

  if (!companyId) {
    return { success: false, error: 'Company ID is required for standalone transfer requests' };
  }

  // Generate transfer request number
  const transferNumber = await generateTransferRequestNumber();

  // Create transfer request with lines in a transaction
  const transferRequest = await prisma.$transaction(async (tx) => {
    const newTransferRequest = await tx.transferRequest.create({
      data: {
        transferNumber,
        companyId,
        orderId: null,
        orderNumber: null,
        fromLocation,
        toLocation,
        status: 'PENDING',
        notes: notes || null,
        createdBy: userId,
      },
    });

    // Create transfer request lines
    const lineData = lines.map((line) => ({
      transferRequestId: newTransferRequest.id,
      orderLineId: null,
      lineNumber: line.lineNumber,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      quantity: line.quantity,
    }));

    await tx.transferRequestLine.createMany({
      data: lineData,
    });

    return newTransferRequest;
  });

  return {
    success: true,
    transferRequest: {
      id: transferRequest.id,
      transferNumber: transferRequest.transferNumber,
    },
  };
}

/**
 * Get transfer requests with filtering and pagination
 */
export async function getTransferRequests(options: {
  companyId?: string;
  orderId?: string;
  status?: TransferRequestStatus;
  page?: number;
  pageSize?: number;
}): Promise<{
  transferRequests: Array<{
    id: string;
    transferNumber: string;
    orderNumber: string | null;
    orderId: string | null;
    fromLocation: Warehouse;
    toLocation: Warehouse;
    status: TransferRequestStatus;
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
  const { companyId, orderId, status, page = 1, pageSize = 20 } = options;

  const where: Prisma.TransferRequestWhereInput = {};
  if (companyId) where.companyId = companyId;

  if (orderId) {
    where.orderId = orderId;
  }

  if (status) {
    where.status = status;
  }

  const [total, transferRequests] = await Promise.all([
    prisma.transferRequest.count({ where }),
    prisma.transferRequest.findMany({
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
    transferRequests: transferRequests.map((tr) => ({
      id: tr.id,
      transferNumber: tr.transferNumber,
      orderNumber: tr.orderNumber,
      orderId: tr.orderId,
      fromLocation: tr.fromLocation,
      toLocation: tr.toLocation,
      status: tr.status,
      lineCount: tr._count.lines,
      createdAt: tr.createdAt,
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
 * Get transfer request by ID with lines
 */
export async function getTransferRequestById(id: string, companyId?: string) {
  const trWhere: Prisma.TransferRequestWhereInput = { id };
  if (companyId) trWhere.companyId = companyId;
  const transferRequest = await prisma.transferRequest.findFirst({
    where: trWhere,
    include: {
      lines: {
        orderBy: { lineNumber: 'asc' },
      },
    },
  });

  if (!transferRequest) {
    return null;
  }

  return {
    id: transferRequest.id,
    transferNumber: transferRequest.transferNumber,
    companyId: transferRequest.companyId,
    orderId: transferRequest.orderId,
    orderNumber: transferRequest.orderNumber,
    fromLocation: transferRequest.fromLocation,
    toLocation: transferRequest.toLocation,
    status: transferRequest.status,
    notes: transferRequest.notes,
    shippedAt: transferRequest.shippedAt,
    shippedBy: transferRequest.shippedBy,
    shippedByName: transferRequest.shippedByName,
    receivedAt: transferRequest.receivedAt,
    receivedBy: transferRequest.receivedBy,
    receivedByName: transferRequest.receivedByName,
    lines: transferRequest.lines.map((line) => ({
      id: line.id,
      orderLineId: line.orderLineId,
      lineNumber: line.lineNumber,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      quantity: line.quantity,
      receivedQuantity: line.receivedQuantity,
    })),
    createdAt: transferRequest.createdAt,
    createdBy: transferRequest.createdBy,
    updatedAt: transferRequest.updatedAt,
  };
}

/**
 * Get transfer requests for an order (summary)
 */
export async function getTransferRequestsForOrder(
  orderId: string,
  companyId?: string
): Promise<Array<{
  id: string;
  transferNumber: string;
  status: TransferRequestStatus;
  lineCount: number;
  fromLocation: Warehouse;
  toLocation: Warehouse;
  createdAt: Date;
  shippedAt: Date | null;
  receivedAt: Date | null;
}>> {
  const trOrderWhere: Prisma.TransferRequestWhereInput = { orderId };
  if (companyId) trOrderWhere.companyId = companyId;
  const transferRequests = await prisma.transferRequest.findMany({
    where: trOrderWhere,
    include: {
      _count: { select: { lines: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return transferRequests.map((tr) => ({
    id: tr.id,
    transferNumber: tr.transferNumber,
    status: tr.status,
    lineCount: tr._count.lines,
    fromLocation: tr.fromLocation,
    toLocation: tr.toLocation,
    createdAt: tr.createdAt,
    shippedAt: tr.shippedAt,
    receivedAt: tr.receivedAt,
  }));
}

/**
 * Ship transfer - change status from PENDING to IN_TRANSIT
 * Within a single transaction:
 * - Creates TRANSFER_OUT movements for each line at the source warehouse
 * - Decreases onHand at the source warehouse
 */
export async function shipTransfer(
  id: string,
  userId: string,
  userName: string,
  companyId?: string
): Promise<{ success: boolean; error?: string }> {
  const shipWhere: Prisma.TransferRequestWhereInput = { id };
  if (companyId) shipWhere.companyId = companyId;
  const transferRequest = await prisma.transferRequest.findFirst({
    where: shipWhere,
    include: {
      lines: true,
    },
  });

  if (!transferRequest) {
    return { success: false, error: 'Transfer request not found' };
  }

  if (transferRequest.status !== 'PENDING') {
    return { success: false, error: `Cannot ship a transfer request with status ${transferRequest.status}` };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Mark transfer as IN_TRANSIT
      await tx.transferRequest.update({
        where: { id },
        data: {
          status: 'IN_TRANSIT',
          shippedAt: new Date(),
          shippedBy: userId,
          shippedByName: userName,
        },
      });

      // 2. For each line: decrease onHand at source + create TRANSFER_OUT movement
      for (const line of transferRequest.lines) {
        if (line.quantity <= 0) continue;

        const newLevel = await updateStockLevel(
          tx,
          line.productId,
          transferRequest.fromLocation,
          { onHand: -line.quantity },
          userId
        );

        await createStockMovement(tx, {
          productId: line.productId,
          location: transferRequest.fromLocation,
          movementType: 'TRANSFER_OUT',
          quantity: line.quantity,
          balanceAfter: newLevel.onHand,
          referenceType: 'TransferRequest',
          referenceId: transferRequest.id,
          referenceNumber: transferRequest.transferNumber,
          notes: `Transfer to ${transferRequest.toLocation}${transferRequest.orderNumber ? ` for order ${transferRequest.orderNumber}` : ''}`,
          createdBy: userId,
        });
      }
    });

    // Fire-and-forget notification
    if (transferRequest.orderId) {
      notifyTransferShipped(transferRequest.orderId, transferRequest.orderNumber ?? '', transferRequest.companyId)
        .catch(() => {/* notification failure is non-blocking */});
    }

    return { success: true };
  } catch (error) {
    console.error('Ship transfer error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ship transfer',
    };
  }
}

/**
 * Update the received quantity for a line
 */
export async function updateLineReceived(
  transferRequestId: string,
  lineId: string,
  receivedQuantity: number,
  _userId: string,
  companyId?: string
): Promise<{ success: boolean; error?: string }> {
  const lineRecWhere: Prisma.TransferRequestWhereInput = { id: transferRequestId };
  if (companyId) lineRecWhere.companyId = companyId;
  const transferRequest = await prisma.transferRequest.findFirst({
    where: lineRecWhere,
    include: {
      lines: {
        where: { id: lineId },
      },
    },
  });

  if (!transferRequest) {
    return { success: false, error: 'Transfer request not found' };
  }

  if (transferRequest.lines.length === 0) {
    return { success: false, error: 'Line not found' };
  }

  const line = transferRequest.lines[0];

  if (transferRequest.status !== 'IN_TRANSIT') {
    return { success: false, error: 'Can only update received quantities for IN_TRANSIT transfers' };
  }

  if (receivedQuantity < 0) {
    return { success: false, error: 'Received quantity cannot be negative' };
  }

  if (receivedQuantity > line.quantity) {
    return { success: false, error: 'Received quantity cannot exceed transfer quantity' };
  }

  await prisma.transferRequestLine.update({
    where: { id: lineId },
    data: {
      receivedQuantity,
    },
  });

  return { success: true };
}

/**
 * Receive transfer - change status from IN_TRANSIT to RECEIVED
 * Within a single transaction:
 * - Creates TRANSFER_IN movements for each line at the destination warehouse
 * - Increases onHand at the destination warehouse (using receivedQuantity)
 */
export async function receiveTransfer(
  id: string,
  userId: string,
  userName: string,
  companyId?: string
): Promise<{ success: boolean; error?: string }> {
  const recWhere: Prisma.TransferRequestWhereInput = { id };
  if (companyId) recWhere.companyId = companyId;
  const transferRequest = await prisma.transferRequest.findFirst({
    where: recWhere,
    include: {
      lines: true,
    },
  });

  if (!transferRequest) {
    return { success: false, error: 'Transfer request not found' };
  }

  if (transferRequest.status !== 'IN_TRANSIT') {
    return { success: false, error: `Cannot receive a transfer request with status ${transferRequest.status}` };
  }

  // Check if all lines have been received (require some input for each line)
  const unreceived = transferRequest.lines.find((line) => line.receivedQuantity === 0);
  if (unreceived) {
    return {
      success: false,
      error: `Line ${unreceived.lineNumber} (${unreceived.productSku}) has not been received. Please enter received quantities for all lines.`,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Mark transfer as RECEIVED
      await tx.transferRequest.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          receivedAt: new Date(),
          receivedBy: userId,
          receivedByName: userName,
        },
      });

      // 2. For each line: increase onHand at destination + create TRANSFER_IN movement
      for (const line of transferRequest.lines) {
        if (line.receivedQuantity <= 0) continue;

        const newLevel = await updateStockLevel(
          tx,
          line.productId,
          transferRequest.toLocation,
          { onHand: line.receivedQuantity },
          userId
        );

        await createStockMovement(tx, {
          productId: line.productId,
          location: transferRequest.toLocation,
          movementType: 'TRANSFER_IN',
          quantity: line.receivedQuantity,
          balanceAfter: newLevel.onHand,
          referenceType: 'TransferRequest',
          referenceId: transferRequest.id,
          referenceNumber: transferRequest.transferNumber,
          notes: `Received from ${transferRequest.fromLocation}${transferRequest.orderNumber ? ` for order ${transferRequest.orderNumber}` : ''}`,
          createdBy: userId,
        });
      }

      // 3. Propagate status to SalesOrder if this transfer is linked to an order
      if (transferRequest.orderId) {
        const allTransfers = await tx.transferRequest.findMany({
          where: { orderId: transferRequest.orderId },
          select: { status: true },
        });

        const allPickingSlips = await tx.pickingSlip.findMany({
          where: { orderId: transferRequest.orderId },
          select: { status: true },
        });

        const allJobCards = await tx.jobCard.findMany({
          where: { orderId: transferRequest.orderId },
          select: { status: true },
        });

        const allTransfersComplete = allTransfers.every((tr) => tr.status === 'RECEIVED' || tr.status === 'CANCELLED');
        const allPickingComplete = allPickingSlips.length === 0 || allPickingSlips.every((ps) => ps.status === 'COMPLETE' || ps.status === 'CANCELLED');
        const allJobsComplete = allJobCards.length === 0 || allJobCards.every((jc) => jc.status === 'COMPLETE' || jc.status === 'CANCELLED');

        const order = await tx.salesOrder.findUnique({
          where: { id: transferRequest.orderId },
          select: { status: true },
        });

        if (order) {
          if (allTransfersComplete && allPickingComplete && allJobsComplete) {
            if (order.status === 'CONFIRMED' || order.status === 'PROCESSING') {
              await tx.salesOrder.update({
                where: { id: transferRequest.orderId },
                data: { status: 'READY_TO_SHIP' },
              });
            }
          } else if (order.status === 'CONFIRMED') {
            await tx.salesOrder.update({
              where: { id: transferRequest.orderId },
              data: { status: 'PROCESSING' },
            });
          }
        }
      }
    });

    // Fire-and-forget notifications (non-blocking)
    try {
      if (transferRequest.orderId) {
        notifyTransferReceived(transferRequest.orderId, transferRequest.orderNumber ?? '', transferRequest.companyId)
          .catch(() => {});

        const updatedOrder = await prisma.salesOrder.findUnique({
          where: { id: transferRequest.orderId },
          select: { status: true },
        });
        if (updatedOrder?.status === 'READY_TO_SHIP') {
          notifyOrderReadyToInvoice(transferRequest.orderId, transferRequest.orderNumber ?? '', transferRequest.companyId)
            .catch(() => {});
        }
      }
    } catch {
      // Notification failure is non-blocking
    }

    return { success: true };
  } catch (error) {
    console.error('Receive transfer error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to receive transfer',
    };
  }
}

/**
 * Update notes on a transfer request
 */
export async function updateNotes(
  id: string,
  notes: string,
  _userId: string,
  companyId?: string
): Promise<{ success: boolean; error?: string }> {
  const notesWhere: Prisma.TransferRequestWhereInput = { id };
  if (companyId) notesWhere.companyId = companyId;
  const transferRequest = await prisma.transferRequest.findFirst({
    where: notesWhere,
  });

  if (!transferRequest) {
    return { success: false, error: 'Transfer request not found' };
  }

  await prisma.transferRequest.update({
    where: { id },
    data: {
      notes: notes || null,
    },
  });

  return { success: true };
}

/**
 * Check if transfer requests exist for an order
 */
export async function hasTransferRequests(orderId: string, companyId?: string): Promise<boolean> {
  const hasWhere: Prisma.TransferRequestWhereInput = { orderId };
  if (companyId) hasWhere.companyId = companyId;
  const count = await prisma.transferRequest.count({
    where: hasWhere,
  });
  return count > 0;
}
