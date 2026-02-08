import { Prisma, JobCardStatus, JobType } from '@prisma/client';
import { prisma } from '../config/database';
import { updateStockLevel, createStockMovement } from './inventory.service';

/**
 * Valid status transitions for job cards
 */
export const JOB_CARD_STATUS_TRANSITIONS: Record<JobCardStatus, JobCardStatus[]> = {
  PENDING: ['IN_PROGRESS'],
  IN_PROGRESS: ['ON_HOLD', 'COMPLETE'],
  ON_HOLD: ['IN_PROGRESS'],
  COMPLETE: [],
};

/**
 * Generate the next job card number in format JC-YYYY-NNNNN
 */
export async function generateJobCardNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();

  const counter = await prisma.$transaction(async (tx) => {
    let counter = await tx.jobCardCounter.findUnique({
      where: { id: 'job_card_counter' },
    });

    if (!counter) {
      counter = await tx.jobCardCounter.create({
        data: {
          id: 'job_card_counter',
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    if (counter.year !== currentYear) {
      counter = await tx.jobCardCounter.update({
        where: { id: 'job_card_counter' },
        data: {
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    counter = await tx.jobCardCounter.update({
      where: { id: 'job_card_counter' },
      data: {
        count: { increment: 1 },
      },
    });

    return counter;
  });

  const paddedCount = counter.count.toString().padStart(5, '0');
  return `JC-${currentYear}-${paddedCount}`;
}

/**
 * Input for creating a job card
 */
export interface CreateJobCardInput {
  orderId: string;
  orderLineId: string;
  jobType: JobType;
  notes?: string;
}

/**
 * Create a job card for an order line
 */
export async function createJobCard(
  input: CreateJobCardInput,
  userId: string,
  companyId: string
): Promise<{ success: boolean; jobCard?: { id: string; jobCardNumber: string }; error?: string }> {
  // Verify the order exists and belongs to the company
  const order = await prisma.salesOrder.findFirst({
    where: {
      id: input.orderId,
      companyId,
      deletedAt: null,
    },
    include: {
      lines: {
        where: { id: input.orderLineId },
      },
    },
  });

  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.status !== 'CONFIRMED' && order.status !== 'PROCESSING') {
    return { success: false, error: 'Job cards can only be created for CONFIRMED or PROCESSING orders' };
  }

  if (order.lines.length === 0) {
    return { success: false, error: 'Order line not found' };
  }

  const orderLine = order.lines[0];

  // Generate job card number
  const jobCardNumber = await generateJobCardNumber();

  // Create job card
  const jobCard = await prisma.jobCard.create({
    data: {
      jobCardNumber,
      companyId,
      orderId: input.orderId,
      orderNumber: order.orderNumber,
      orderLineId: input.orderLineId,
      productId: orderLine.productId,
      productSku: orderLine.productSku,
      productDescription: orderLine.productDescription,
      quantity: orderLine.quantityOrdered,
      jobType: input.jobType,
      status: 'PENDING',
      notes: input.notes || null,
      createdBy: userId,
    },
  });

  return {
    success: true,
    jobCard: {
      id: jobCard.id,
      jobCardNumber: jobCard.jobCardNumber,
    },
  };
}

/**
 * Get job cards with filtering and pagination
 */
export async function getJobCards(options: {
  companyId: string;
  orderId?: string;
  status?: JobCardStatus;
  jobType?: JobType;
  page?: number;
  pageSize?: number;
}): Promise<{
  jobCards: Array<{
    id: string;
    jobCardNumber: string;
    orderNumber: string;
    orderId: string;
    productSku: string;
    productDescription: string;
    quantity: number;
    jobType: JobType;
    status: JobCardStatus;
    assignedToName: string | null;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const { companyId, orderId, status, jobType, page = 1, pageSize = 20 } = options;

  const where: Prisma.JobCardWhereInput = {
    companyId,
  };

  if (orderId) {
    where.orderId = orderId;
  }

  if (status) {
    where.status = status;
  }

  if (jobType) {
    where.jobType = jobType;
  }

  const [total, jobCards] = await Promise.all([
    prisma.jobCard.count({ where }),
    prisma.jobCard.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    jobCards: jobCards.map((jc) => ({
      id: jc.id,
      jobCardNumber: jc.jobCardNumber,
      orderNumber: jc.orderNumber,
      orderId: jc.orderId,
      productSku: jc.productSku,
      productDescription: jc.productDescription,
      quantity: jc.quantity,
      jobType: jc.jobType,
      status: jc.status,
      assignedToName: jc.assignedToName,
      createdAt: jc.createdAt,
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
 * Get job card by ID
 */
export async function getJobCardById(id: string, companyId: string) {
  const jobCard = await prisma.jobCard.findFirst({
    where: {
      id,
      companyId,
    },
  });

  if (!jobCard) {
    return null;
  }

  return {
    id: jobCard.id,
    jobCardNumber: jobCard.jobCardNumber,
    companyId: jobCard.companyId,
    orderId: jobCard.orderId,
    orderNumber: jobCard.orderNumber,
    orderLineId: jobCard.orderLineId,
    productId: jobCard.productId,
    productSku: jobCard.productSku,
    productDescription: jobCard.productDescription,
    quantity: jobCard.quantity,
    jobType: jobCard.jobType,
    status: jobCard.status,
    holdReason: jobCard.holdReason,
    notes: jobCard.notes,
    assignedTo: jobCard.assignedTo,
    assignedToName: jobCard.assignedToName,
    startedAt: jobCard.startedAt,
    completedAt: jobCard.completedAt,
    createdAt: jobCard.createdAt,
    createdBy: jobCard.createdBy,
    updatedAt: jobCard.updatedAt,
  };
}

/**
 * Get job cards for an order
 */
export async function getJobCardsForOrder(
  orderId: string,
  companyId: string
): Promise<Array<{
  id: string;
  jobCardNumber: string;
  productSku: string;
  productDescription: string;
  quantity: number;
  jobType: JobType;
  status: JobCardStatus;
  assignedToName: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}>> {
  const jobCards = await prisma.jobCard.findMany({
    where: {
      orderId,
      companyId,
    },
    orderBy: { createdAt: 'asc' },
  });

  return jobCards.map((jc) => ({
    id: jc.id,
    jobCardNumber: jc.jobCardNumber,
    productSku: jc.productSku,
    productDescription: jc.productDescription,
    quantity: jc.quantity,
    jobType: jc.jobType,
    status: jc.status,
    assignedToName: jc.assignedToName,
    createdAt: jc.createdAt,
    startedAt: jc.startedAt,
    completedAt: jc.completedAt,
  }));
}

/**
 * Check if job cards exist for an order
 */
export async function hasJobCards(orderId: string, companyId: string): Promise<boolean> {
  const count = await prisma.jobCard.count({
    where: {
      orderId,
      companyId,
    },
  });
  return count > 0;
}

/**
 * Assign a job card to a user
 */
export async function assignJobCard(
  id: string,
  assignedTo: string,
  assignedToName: string,
  _userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const jobCard = await prisma.jobCard.findFirst({
    where: {
      id,
      companyId,
    },
  });

  if (!jobCard) {
    return { success: false, error: 'Job card not found' };
  }

  if (jobCard.status === 'COMPLETE') {
    return { success: false, error: 'Cannot assign a completed job card' };
  }

  await prisma.jobCard.update({
    where: { id },
    data: {
      assignedTo,
      assignedToName,
    },
  });

  return { success: true };
}

/**
 * Start job - change status from PENDING to IN_PROGRESS
 */
export async function startJobCard(
  id: string,
  _userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const jobCard = await prisma.jobCard.findFirst({
    where: {
      id,
      companyId,
    },
  });

  if (!jobCard) {
    return { success: false, error: 'Job card not found' };
  }

  if (jobCard.status !== 'PENDING') {
    return { success: false, error: `Cannot start a job card with status ${jobCard.status}` };
  }

  await prisma.jobCard.update({
    where: { id },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  });

  return { success: true };
}

/**
 * Put job on hold - change status to ON_HOLD
 */
export async function putOnHold(
  id: string,
  holdReason: string,
  _userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const jobCard = await prisma.jobCard.findFirst({
    where: {
      id,
      companyId,
    },
  });

  if (!jobCard) {
    return { success: false, error: 'Job card not found' };
  }

  if (jobCard.status !== 'IN_PROGRESS') {
    return { success: false, error: `Cannot put on hold a job card with status ${jobCard.status}` };
  }

  if (!holdReason.trim()) {
    return { success: false, error: 'Hold reason is required' };
  }

  await prisma.jobCard.update({
    where: { id },
    data: {
      status: 'ON_HOLD',
      holdReason,
    },
  });

  return { success: true };
}

/**
 * Resume job - change status from ON_HOLD to IN_PROGRESS
 */
export async function resumeJobCard(
  id: string,
  _userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const jobCard = await prisma.jobCard.findFirst({
    where: {
      id,
      companyId,
    },
  });

  if (!jobCard) {
    return { success: false, error: 'Job card not found' };
  }

  if (jobCard.status !== 'ON_HOLD') {
    return { success: false, error: `Cannot resume a job card with status ${jobCard.status}` };
  }

  await prisma.jobCard.update({
    where: { id },
    data: {
      status: 'IN_PROGRESS',
      holdReason: null,
    },
  });

  return { success: true };
}

/**
 * Complete job - change status from IN_PROGRESS to COMPLETE
 * Within a single transaction:
 * - Creates MANUFACTURE_IN movement for the finished product (+onHand)
 * - Creates MANUFACTURE_OUT movements for each BOM component (-onHand)
 * - Propagates status to the parent SalesOrder
 * Manufacturing always happens at JHB (only manufacturing location).
 */
export async function completeJobCard(
  id: string,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const jobCard = await prisma.jobCard.findFirst({
    where: {
      id,
      companyId,
    },
  });

  if (!jobCard) {
    return { success: false, error: 'Job card not found' };
  }

  if (jobCard.status !== 'IN_PROGRESS') {
    return { success: false, error: `Cannot complete a job card with status ${jobCard.status}` };
  }

  // Manufacturing always happens at JHB
  const manufacturingLocation = 'JHB' as const;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Mark job card as COMPLETE
      await tx.jobCard.update({
        where: { id },
        data: {
          status: 'COMPLETE',
          completedAt: new Date(),
        },
      });

      // 2. Finished product: increase onHand + create MANUFACTURE_IN movement
      const finishedLevel = await updateStockLevel(
        tx,
        jobCard.productId,
        manufacturingLocation,
        { onHand: jobCard.quantity },
        userId
      );

      await createStockMovement(tx, {
        productId: jobCard.productId,
        location: manufacturingLocation,
        movementType: 'MANUFACTURE_IN',
        quantity: jobCard.quantity,
        balanceAfter: finishedLevel.onHand,
        referenceType: 'JobCard',
        referenceId: jobCard.id,
        referenceNumber: jobCard.jobCardNumber,
        notes: `Manufactured for order ${jobCard.orderNumber}`,
        createdBy: userId,
      });

      // 3. BOM components: decrease onHand + create MANUFACTURE_OUT movements
      const bomItems = await tx.bomItem.findMany({
        where: {
          parentProductId: jobCard.productId,
          isOptional: false,
        },
      });

      for (const bom of bomItems) {
        const consumedQty = Math.ceil(bom.quantity.toNumber() * jobCard.quantity);
        if (consumedQty <= 0) continue;

        const componentLevel = await updateStockLevel(
          tx,
          bom.componentProductId,
          manufacturingLocation,
          { onHand: -consumedQty },
          userId
        );

        await createStockMovement(tx, {
          productId: bom.componentProductId,
          location: manufacturingLocation,
          movementType: 'MANUFACTURE_OUT',
          quantity: consumedQty,
          balanceAfter: componentLevel.onHand,
          referenceType: 'JobCard',
          referenceId: jobCard.id,
          referenceNumber: jobCard.jobCardNumber,
          notes: `Component consumed for ${jobCard.productSku} (order ${jobCard.orderNumber})`,
          createdBy: userId,
        });
      }

      // 4. Propagate status to SalesOrder
      const allJobCards = await tx.jobCard.findMany({
        where: { orderId: jobCard.orderId },
        select: { status: true },
      });

      const allPickingSlips = await tx.pickingSlip.findMany({
        where: { orderId: jobCard.orderId },
        select: { status: true },
      });

      const allTransfers = await tx.transferRequest.findMany({
        where: { orderId: jobCard.orderId },
        select: { status: true },
      });

      const allJobsComplete = allJobCards.every((jc) => jc.status === 'COMPLETE');
      const allPickingComplete = allPickingSlips.length === 0 || allPickingSlips.every((ps) => ps.status === 'COMPLETE');
      const allTransfersComplete = allTransfers.length === 0 || allTransfers.every((tr) => tr.status === 'RECEIVED');

      const order = await tx.salesOrder.findUnique({
        where: { id: jobCard.orderId },
        select: { status: true },
      });

      if (order) {
        if (allJobsComplete && allPickingComplete && allTransfersComplete) {
          if (order.status === 'CONFIRMED' || order.status === 'PROCESSING') {
            await tx.salesOrder.update({
              where: { id: jobCard.orderId },
              data: { status: 'READY_TO_SHIP' },
            });
          }
        } else if (order.status === 'CONFIRMED') {
          await tx.salesOrder.update({
            where: { id: jobCard.orderId },
            data: { status: 'PROCESSING' },
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Complete job card error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete job card',
    };
  }
}

/**
 * Update notes on a job card
 */
export async function updateNotes(
  id: string,
  notes: string,
  _userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const jobCard = await prisma.jobCard.findFirst({
    where: {
      id,
      companyId,
    },
  });

  if (!jobCard) {
    return { success: false, error: 'Job card not found' };
  }

  await prisma.jobCard.update({
    where: { id },
    data: {
      notes: notes || null,
    },
  });

  return { success: true };
}
