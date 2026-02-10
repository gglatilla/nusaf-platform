import { Prisma, SalesOrderStatus, Warehouse } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import {
  createHardReservation,
  releaseReservationsByReference,
  releaseReservationsInTransaction,
} from './inventory.service';
import { generateOrderNumber } from '../utils/number-generation';
import { roundTo2 } from '../utils/math';

/**
 * VAT rate for South Africa (%)
 */
export const VAT_RATE = 15;

/**
 * Valid status transitions for sales orders
 */
export const STATUS_TRANSITIONS: Record<SalesOrderStatus, SalesOrderStatus[]> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'ON_HOLD', 'CANCELLED'],
  PROCESSING: ['READY_TO_SHIP', 'ON_HOLD', 'CANCELLED'],
  READY_TO_SHIP: ['SHIPPED', 'PARTIALLY_SHIPPED', 'ON_HOLD'],
  PARTIALLY_SHIPPED: ['SHIPPED', 'ON_HOLD'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['INVOICED'],
  INVOICED: ['CLOSED'],
  CLOSED: [],
  ON_HOLD: ['CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'PARTIALLY_SHIPPED', 'CANCELLED'],
  CANCELLED: [],
};

/**
 * Generate the next order number in format SO-YYYY-NNNNN
 */

/**
 * Calculate order totals from lines
 */
export function calculateOrderTotals(lines: Array<{ unitPrice: Decimal | number; quantityOrdered: number }>) {
  let subtotal = 0;

  for (const line of lines) {
    const unitPrice = typeof line.unitPrice === 'number' ? line.unitPrice : Number(line.unitPrice);
    subtotal += unitPrice * line.quantityOrdered;
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
 * Get orders for a company with pagination and filtering
 */
export async function getOrders(options: {
  companyId: string;
  status?: SalesOrderStatus;
  page?: number;
  pageSize?: number;
}): Promise<{
  orders: Array<{
    id: string;
    orderNumber: string;
    status: SalesOrderStatus;
    paymentTerms: string;
    paymentStatus: string;
    quoteNumber: string | null;
    customerPoNumber: string | null;
    lineCount: number;
    total: number;
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

  const where: Prisma.SalesOrderWhereInput = {
    companyId,
    deletedAt: null,
  };

  if (status) {
    where.status = status;
  }

  const [total, orders] = await Promise.all([
    prisma.salesOrder.count({ where }),
    prisma.salesOrder.findMany({
      where,
      include: {
        company: { select: { name: true } },
        _count: { select: { lines: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentTerms: o.paymentTerms,
      paymentStatus: o.paymentStatus,
      quoteNumber: o.quoteNumber,
      customerPoNumber: o.customerPoNumber,
      companyName: o.company.name,
      lineCount: o._count.lines,
      total: Number(o.total),
      createdAt: o.createdAt,
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
 * Get order details
 */
export async function getOrderById(orderId: string, companyId: string) {
  const order = await prisma.salesOrder.findFirst({
    where: {
      id: orderId,
      companyId, // Company isolation
      deletedAt: null,
    },
    include: {
      lines: {
        orderBy: { lineNumber: 'asc' },
      },
      company: {
        select: { id: true, name: true },
      },
    },
  });

  if (!order) {
    return null;
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    company: order.company,
    quoteId: order.quoteId,
    quoteNumber: order.quoteNumber,
    customerPoNumber: order.customerPoNumber,
    customerPoDate: order.customerPoDate,
    paymentTerms: order.paymentTerms,
    paymentStatus: order.paymentStatus,
    fulfillmentType: order.fulfillmentType,
    warehouse: order.warehouse,
    requiredDate: order.requiredDate,
    promisedDate: order.promisedDate,
    shippedDate: order.shippedDate,
    deliveredDate: order.deliveredDate,
    lines: order.lines.map((line) => ({
      id: line.id,
      lineNumber: line.lineNumber,
      status: line.status,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      quantityOrdered: line.quantityOrdered,
      quantityPicked: line.quantityPicked,
      quantityShipped: line.quantityShipped,
      unitPrice: Number(line.unitPrice),
      lineTotal: Number(line.lineTotal),
      notes: line.notes,
    })),
    subtotal: Number(order.subtotal),
    vatRate: Number(order.vatRate),
    vatAmount: Number(order.vatAmount),
    total: Number(order.total),
    internalNotes: order.internalNotes,
    customerNotes: order.customerNotes,
    holdReason: order.holdReason,
    cancelReason: order.cancelReason,
    confirmedAt: order.confirmedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

/**
 * Create order from an accepted quote
 * Converts soft reservations to hard reservations
 */
export async function createOrderFromQuote(
  quoteId: string,
  userId: string,
  companyId: string,
  options?: {
    customerPoNumber?: string;
    customerPoDate?: Date;
    requiredDate?: Date;
    customerNotes?: string;
    warehouse?: Warehouse;
  }
): Promise<{ success: boolean; order?: { id: string; orderNumber: string }; error?: string }> {
  // Get the quote with items
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      companyId,
      deletedAt: null,
    },
    include: {
      items: {
        orderBy: { lineNumber: 'asc' },
      },
    },
  });

  if (!quote) {
    return { success: false, error: 'Quote not found' };
  }

  if (quote.status !== 'ACCEPTED') {
    return { success: false, error: 'Only ACCEPTED quotes can be converted to orders' };
  }

  if (quote.items.length === 0) {
    return { success: false, error: 'Quote has no items' };
  }

  // Generate order number
  const orderNumber = await generateOrderNumber();

  // Resolve warehouse and payment terms from company
  let warehouse: Warehouse = options?.warehouse ?? 'JHB';
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { primaryWarehouse: true, paymentTerms: true },
  });
  if (!options?.warehouse && company?.primaryWarehouse) {
    warehouse = company.primaryWarehouse;
  }
  const companyPaymentTerms = company?.paymentTerms ?? 'NET_30';
  const initialPaymentStatus =
    companyPaymentTerms === 'PREPAY' || companyPaymentTerms === 'COD'
      ? 'UNPAID'
      : 'NOT_REQUIRED';

  // Create order with lines in a transaction
  const order = await prisma.$transaction(async (tx) => {
    // Create the order
    const newOrder = await tx.salesOrder.create({
      data: {
        orderNumber,
        companyId,
        userId,
        status: 'DRAFT',
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        customerPoNumber: options?.customerPoNumber,
        customerPoDate: options?.customerPoDate,
        requiredDate: options?.requiredDate,
        customerNotes: options?.customerNotes || quote.customerNotes,
        warehouse,
        paymentTerms: companyPaymentTerms,
        paymentStatus: initialPaymentStatus,
        subtotal: quote.subtotal,
        vatRate: quote.vatRate,
        vatAmount: quote.vatAmount,
        total: quote.total,
        createdBy: userId,
      },
    });

    // Create order lines from quote items
    const lineData = quote.items.map((item) => ({
      orderId: newOrder.id,
      lineNumber: item.lineNumber,
      productId: item.productId,
      productSku: item.productSku,
      productDescription: item.productDescription,
      quantityOrdered: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    }));

    await tx.salesOrderLine.createMany({
      data: lineData,
    });

    // Update quote status to CONVERTED
    await tx.quote.update({
      where: { id: quoteId },
      data: {
        status: 'CONVERTED',
        updatedBy: userId,
      },
    });

    return newOrder;
  });

  // Release soft reservations from quote (outside transaction for better error handling)
  await releaseReservationsByReference('Quote', quoteId, 'Converted to order', userId);

  // Create hard reservations for order items
  for (const item of quote.items) {
    await createHardReservation(
      {
        productId: item.productId,
        location: warehouse,
        quantity: item.quantity,
        referenceType: 'SalesOrder',
        referenceId: order.id,
        referenceNumber: order.orderNumber,
      },
      userId
    );
  }

  return {
    success: true,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
    },
  };
}

/**
 * Check if a status transition is valid
 */
function isValidTransition(currentStatus: SalesOrderStatus, newStatus: SalesOrderStatus): boolean {
  const validNextStatuses = STATUS_TRANSITIONS[currentStatus];
  return validNextStatuses.includes(newStatus);
}

/**
 * Confirm order - change status from DRAFT to CONFIRMED
 */
export async function confirmOrder(
  orderId: string,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
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

  if (!isValidTransition(order.status, 'CONFIRMED')) {
    return { success: false, error: `Cannot confirm order with status ${order.status}` };
  }

  await prisma.salesOrder.update({
    where: { id: orderId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      confirmedBy: userId,
      updatedBy: userId,
    },
  });

  return { success: true };
}

/**
 * Put order on hold
 */
export async function holdOrder(
  orderId: string,
  reason: string,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
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

  if (!isValidTransition(order.status, 'ON_HOLD')) {
    return { success: false, error: `Cannot put order on hold with status ${order.status}` };
  }

  await prisma.salesOrder.update({
    where: { id: orderId },
    data: {
      status: 'ON_HOLD',
      holdReason: reason,
      updatedBy: userId,
    },
  });

  return { success: true };
}

/**
 * Release order from hold
 * Returns to PROCESSING if any lines have been picked, otherwise CONFIRMED
 */
export async function releaseHold(
  orderId: string,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const order = await prisma.salesOrder.findFirst({
    where: {
      id: orderId,
      companyId,
      deletedAt: null,
    },
    include: {
      lines: {
        select: { quantityPicked: true },
      },
    },
  });

  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.status !== 'ON_HOLD') {
    return { success: false, error: 'Order is not on hold' };
  }

  // Determine the appropriate status to return to based on processing state
  // If any lines have been picked, return to PROCESSING
  // Otherwise, return to CONFIRMED
  const hasPickedLines = order.lines.some((line) => line.quantityPicked > 0);
  const returnStatus = hasPickedLines ? 'PROCESSING' : 'CONFIRMED';

  await prisma.salesOrder.update({
    where: { id: orderId },
    data: {
      status: returnStatus,
      holdReason: null,
      updatedBy: userId,
    },
  });

  return { success: true };
}

/**
 * Cancel order
 * Atomically cancels all related documents (picking slips, job cards, transfers)
 * and releases all reservations (SalesOrder, PickingSlip, JobCard reference types).
 * Only non-completed documents are cancelled; PENDING transfers only (not IN_TRANSIT).
 */
export async function cancelOrder(
  orderId: string,
  reason: string,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
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

  if (!isValidTransition(order.status, 'CANCELLED')) {
    return { success: false, error: `Cannot cancel order with status ${order.status}` };
  }

  const cancelReason = `Order cancelled: ${reason}`;

  await prisma.$transaction(async (tx) => {
    // 1. Cancel the order
    await tx.salesOrder.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
        updatedBy: userId,
      },
    });

    // 2. Cancel non-completed picking slips and release their reservations
    const pickingSlips = await tx.pickingSlip.findMany({
      where: {
        orderId,
        status: { notIn: ['COMPLETE', 'CANCELLED'] },
      },
    });

    for (const ps of pickingSlips) {
      await tx.pickingSlip.update({
        where: { id: ps.id },
        data: { status: 'CANCELLED' },
      });
      await releaseReservationsInTransaction(
        tx, 'PickingSlip', ps.id, cancelReason, userId
      );
    }

    // 3. Cancel non-completed job cards and release their reservations
    const jobCards = await tx.jobCard.findMany({
      where: {
        orderId,
        status: { notIn: ['COMPLETE', 'CANCELLED'] },
      },
    });

    for (const jc of jobCards) {
      await tx.jobCard.update({
        where: { id: jc.id },
        data: { status: 'CANCELLED' },
      });
      await releaseReservationsInTransaction(
        tx, 'JobCard', jc.id, cancelReason, userId
      );
    }

    // 4. Cancel PENDING transfers (don't cancel IN_TRANSIT — goods are already moving)
    await tx.transferRequest.updateMany({
      where: {
        orderId,
        status: 'PENDING',
      },
      data: { status: 'CANCELLED' },
    });

    // 5. Release order-level reservations (SalesOrder reference type)
    await releaseReservationsInTransaction(
      tx, 'SalesOrder', orderId, cancelReason, userId
    );
  });

  return { success: true };
}

/**
 * Close an order (INVOICED -> CLOSED)
 * Only ADMIN/MANAGER can close orders — this is a manual final step.
 */
export async function closeOrder(
  orderId: string,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
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

  if (!isValidTransition(order.status, 'CLOSED')) {
    return { success: false, error: `Cannot close order with status ${order.status}. Order must be INVOICED first.` };
  }

  await prisma.salesOrder.update({
    where: { id: orderId },
    data: {
      status: 'CLOSED',
      closedAt: new Date(),
      closedBy: userId,
      updatedBy: userId,
    },
  });

  return { success: true };
}

/**
 * Update order status (generic transition)
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: SalesOrderStatus,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
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

  if (!isValidTransition(order.status, newStatus)) {
    return {
      success: false,
      error: `Invalid status transition from ${order.status} to ${newStatus}`,
    };
  }

  const updateData: Prisma.SalesOrderUpdateInput = {
    status: newStatus,
    updatedBy: userId,
  };

  // Set additional timestamps based on status
  if (newStatus === 'CONFIRMED') {
    updateData.confirmedAt = new Date();
    updateData.confirmedBy = userId;
  } else if (newStatus === 'SHIPPED') {
    updateData.shippedDate = new Date();
  } else if (newStatus === 'DELIVERED') {
    updateData.deliveredDate = new Date();
  } else if (newStatus === 'CLOSED') {
    updateData.closedAt = new Date();
    updateData.closedBy = userId;
  }

  await prisma.salesOrder.update({
    where: { id: orderId },
    data: updateData,
  });

  return { success: true };
}

/**
 * Update order notes
 */
export async function updateOrderNotes(
  orderId: string,
  notes: { internalNotes?: string; customerNotes?: string },
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
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

  // Only allow notes update on non-closed/non-cancelled orders
  if (order.status === 'CLOSED' || order.status === 'CANCELLED') {
    return { success: false, error: 'Cannot update notes on closed or cancelled orders' };
  }

  await prisma.salesOrder.update({
    where: { id: orderId },
    data: {
      ...(notes.internalNotes !== undefined && { internalNotes: notes.internalNotes }),
      ...(notes.customerNotes !== undefined && { customerNotes: notes.customerNotes }),
      updatedBy: userId,
    },
  });

  return { success: true };
}

// Utility function for rounding
