import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { generateFulfillmentPlan, executeFulfillmentPlan } from './orchestration.service';

/**
 * Generate the next payment number in format PAY-YYYY-NNNNN
 */
async function generatePaymentNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();

  const counter = await prisma.$transaction(async (tx) => {
    let counter = await tx.paymentCounter.findUnique({
      where: { id: 'payment_counter' },
    });

    if (!counter) {
      counter = await tx.paymentCounter.create({
        data: {
          id: 'payment_counter',
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    if (counter.year !== currentYear) {
      counter = await tx.paymentCounter.update({
        where: { id: 'payment_counter' },
        data: {
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    counter = await tx.paymentCounter.update({
      where: { id: 'payment_counter' },
      data: {
        count: { increment: 1 },
      },
    });

    return counter;
  });

  const paddedCount = counter.count.toString().padStart(5, '0');
  return `PAY-${currentYear}-${paddedCount}`;
}

/**
 * Calculate payment status for an order based on confirmed payments vs total
 */
async function calculatePaymentStatus(
  orderId: string
): Promise<'UNPAID' | 'PARTIALLY_PAID' | 'PAID'> {
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
    select: { total: true },
  });

  if (!order) return 'UNPAID';

  const payments = await prisma.payment.aggregate({
    where: {
      orderId,
      status: 'CONFIRMED',
    },
    _sum: { amount: true },
  });

  const totalPaid = payments._sum.amount ?? new Decimal(0);
  const orderTotal = order.total;

  if (totalPaid.gte(orderTotal)) return 'PAID';
  if (totalPaid.gt(new Decimal(0))) return 'PARTIALLY_PAID';
  return 'UNPAID';
}

/**
 * Update the cached paymentStatus on the SalesOrder
 */
async function syncOrderPaymentStatus(orderId: string): Promise<void> {
  const status = await calculatePaymentStatus(orderId);
  await prisma.salesOrder.update({
    where: { id: orderId },
    data: { paymentStatus: status },
  });
}

/**
 * Record a payment against an order
 */
export async function recordPayment(
  orderId: string,
  data: {
    amount: number;
    paymentMethod: 'EFT' | 'CREDIT_CARD' | 'CASH' | 'CHEQUE' | 'OTHER';
    paymentReference: string;
    paymentDate: Date;
    notes?: string;
  },
  userId: string,
  userName: string
): Promise<{
  success: boolean;
  payment?: { id: string; paymentNumber: string };
  fulfillmentTriggered?: boolean;
  fulfillmentError?: string;
  error?: string;
}> {
  // Verify order exists
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
    select: { id: true, companyId: true, total: true, status: true },
  });

  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  // Don't allow payments on CANCELLED orders
  if (order.status === 'CANCELLED') {
    return { success: false, error: 'Cannot record payment on a cancelled order' };
  }

  // Validate amount > 0
  if (data.amount <= 0) {
    return { success: false, error: 'Payment amount must be positive' };
  }

  // Check balance remaining
  const existingPayments = await prisma.payment.aggregate({
    where: { orderId, status: 'CONFIRMED' },
    _sum: { amount: true },
  });
  const totalPaid = existingPayments._sum.amount ?? new Decimal(0);
  const balance = order.total.sub(totalPaid);

  if (new Decimal(data.amount).gt(balance)) {
    return {
      success: false,
      error: `Payment amount (R${data.amount.toFixed(2)}) exceeds balance remaining (R${balance.toFixed(2)})`,
    };
  }

  const paymentNumber = await generatePaymentNumber();

  const payment = await prisma.payment.create({
    data: {
      paymentNumber,
      orderId,
      companyId: order.companyId,
      amount: new Decimal(data.amount),
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference,
      paymentDate: data.paymentDate,
      receivedBy: userId,
      receivedByName: userName,
      notes: data.notes,
      status: 'CONFIRMED',
    },
  });

  // Sync the cached payment status on the order
  await syncOrderPaymentStatus(orderId);

  // Check if this payment tipped status to PAID for a prepay order → auto-trigger fulfillment
  let fulfillmentTriggered = false;
  let fulfillmentError: string | undefined;

  const updatedOrder = await prisma.salesOrder.findUnique({
    where: { id: orderId },
    select: { paymentTerms: true, paymentStatus: true, status: true, orderNumber: true, companyId: true },
  });

  if (
    updatedOrder &&
    updatedOrder.paymentStatus === 'PAID' &&
    ['PREPAY', 'COD'].includes(updatedOrder.paymentTerms ?? '') &&
    updatedOrder.status === 'CONFIRMED'
  ) {
    try {
      const planResult = await generateFulfillmentPlan({ orderId });

      if (planResult.success && planResult.data) {
        const execResult = await executeFulfillmentPlan({
          plan: planResult.data,
          userId,
          companyId: updatedOrder.companyId,
        });

        if (execResult.success) {
          fulfillmentTriggered = true;
          const docs = execResult.data?.createdDocuments;
          console.log(
            `Prepay order ${updatedOrder.orderNumber}: payment received, fulfillment triggered — ` +
            `${docs?.pickingSlips.length ?? 0} picking slips, ${docs?.jobCards.length ?? 0} job cards, ${docs?.transferRequests.length ?? 0} transfers`
          );
        } else {
          fulfillmentError = execResult.error || 'Fulfillment execution failed';
          console.error(`Prepay order ${updatedOrder.orderNumber}: fulfillment execution failed — ${execResult.error}`);
        }
      } else {
        fulfillmentError = planResult.error || 'Fulfillment plan generation failed';
        console.error(`Prepay order ${updatedOrder.orderNumber}: fulfillment plan failed — ${planResult.error}`);
      }
    } catch (error) {
      fulfillmentError = error instanceof Error ? error.message : 'Fulfillment error';
      console.error(`Prepay order ${updatedOrder.orderNumber}: fulfillment error:`, error);
    }
  }

  return {
    success: true,
    payment: { id: payment.id, paymentNumber: payment.paymentNumber },
    fulfillmentTriggered,
    fulfillmentError,
  };
}

/**
 * Get payments for an order
 */
export async function getPaymentsByOrder(orderId: string) {
  return prisma.payment.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get a single payment by ID
 */
export async function getPaymentById(id: string) {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      order: {
        select: { id: true, orderNumber: true, total: true },
      },
    },
  });
}

/**
 * Void a payment
 */
export async function voidPayment(
  id: string,
  reason: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const payment = await prisma.payment.findUnique({
    where: { id },
    select: { id: true, orderId: true, status: true },
  });

  if (!payment) {
    return { success: false, error: 'Payment not found' };
  }

  if (payment.status === 'VOIDED') {
    return { success: false, error: 'Payment is already voided' };
  }

  await prisma.payment.update({
    where: { id },
    data: {
      status: 'VOIDED',
      voidedAt: new Date(),
      voidedBy: userId,
      voidReason: reason,
    },
  });

  // Recalculate order payment status
  await syncOrderPaymentStatus(payment.orderId);

  return { success: true };
}
