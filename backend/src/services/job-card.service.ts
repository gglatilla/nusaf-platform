import { Prisma, JobCardStatus, JobType } from '@prisma/client';
import { prisma } from '../config/database';
import { updateStockLevel, createStockMovement } from './inventory.service';
import { checkBomStock, explodeBom } from './bom.service';
import { generateJobCardNumber } from '../utils/number-generation';

/**
 * Valid status transitions for job cards
 */
export const JOB_CARD_STATUS_TRANSITIONS: Record<JobCardStatus, JobCardStatus[]> = {
  PENDING: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'COMPLETE', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETE: [],
  CANCELLED: [],
};

/**
 * Generate the next job card number in format JC-YYYY-NNNNN
 */

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

  // Create job card with BOM snapshot
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

  // Snapshot BOM at creation time
  try {
    const bomResult = await explodeBom(orderLine.productId, orderLine.quantityOrdered, { includeOptional: true });
    if (bomResult.success && bomResult.data && bomResult.data.length > 0) {
      await prisma.jobCardBomLine.createMany({
        data: bomResult.data.map((item, idx) => ({
          jobCardId: jobCard.id,
          componentProductId: item.productId,
          componentSku: item.nusafSku,
          componentName: item.description,
          quantityPerUnit: orderLine.quantityOrdered > 0 ? item.requiredQuantity / orderLine.quantityOrdered : 0,
          totalRequired: item.requiredQuantity,
          isOptional: item.isOptional,
          sortOrder: idx,
        })),
      });
    }
  } catch (err) {
    // BOM snapshot failure should not block job card creation
    console.error('Failed to snapshot BOM for job card (non-blocking):', err);
  }

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
 * Get job card by ID — includes BOM components with stock availability
 */
export async function getJobCardById(id: string, companyId: string) {
  const jobCard = await prisma.jobCard.findFirst({
    where: {
      id,
      companyId,
    },
    include: {
      bomLines: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!jobCard) {
    return null;
  }

  // Fetch BOM components with stock levels at JHB (only manufacturing location)
  let bomComponents: Array<{
    productId: string;
    sku: string;
    name: string;
    quantityPerUnit: number;
    requiredQuantity: number;
    availableStock: number;
    shortfall: number;
    isOptional: boolean;
    canFulfill: boolean;
  }> = [];
  let bomStatus: 'READY' | 'PARTIAL' | 'SHORTAGE' = 'READY';

  if (jobCard.bomLines.length > 0) {
    // Use BOM snapshot — get current stock levels for the snapshotted components
    const productIds = jobCard.bomLines.map((bl) => bl.componentProductId);
    const stockLevels = await prisma.stockLevel.findMany({
      where: {
        productId: { in: productIds },
        location: 'JHB',
      },
      select: { productId: true, onHand: true, hardReserved: true },
    });
    const stockMap = new Map(stockLevels.map((sl) => [sl.productId, sl.onHand - sl.hardReserved]));

    bomComponents = jobCard.bomLines.map((bl) => {
      const available = stockMap.get(bl.componentProductId) ?? 0;
      const required = bl.totalRequired.toNumber();
      const shortfall = Math.max(0, required - available);
      return {
        productId: bl.componentProductId,
        sku: bl.componentSku,
        name: bl.componentName,
        quantityPerUnit: bl.quantityPerUnit.toNumber(),
        requiredQuantity: required,
        availableStock: available,
        shortfall,
        isOptional: bl.isOptional,
        canFulfill: shortfall === 0,
      };
    });

    // Determine bomStatus from required components only
    const requiredComponents = bomComponents.filter((c) => !c.isOptional);
    const requiredWithShortfall = requiredComponents.filter((c) => c.shortfall > 0);
    if (requiredComponents.length === 0 || requiredWithShortfall.length === 0) {
      bomStatus = 'READY';
    } else if (requiredWithShortfall.length === requiredComponents.length) {
      bomStatus = 'SHORTAGE';
    } else {
      bomStatus = 'PARTIAL';
    }
  } else {
    // Fallback: no snapshot exists (old job cards) — use live BOM
    const bomResult = await checkBomStock(jobCard.productId, jobCard.quantity, 'JHB');

    if (bomResult.success && bomResult.data) {
      const { components, optionalComponents } = bomResult.data;

      bomComponents = components.map((c) => ({
        productId: c.productId,
        sku: c.nusafSku,
        name: c.description,
        quantityPerUnit: jobCard.quantity > 0 ? c.requiredQuantity / jobCard.quantity : 0,
        requiredQuantity: c.requiredQuantity,
        availableStock: c.availableQuantity,
        shortfall: c.shortfall,
        isOptional: false,
        canFulfill: c.shortfall === 0,
      }));

      for (const oc of optionalComponents) {
        const shortfall = Math.max(0, oc.requiredQuantity - oc.availableQuantity);
        bomComponents.push({
          productId: oc.productId,
          sku: oc.nusafSku,
          name: oc.description,
          quantityPerUnit: jobCard.quantity > 0 ? oc.requiredQuantity / jobCard.quantity : 0,
          requiredQuantity: oc.requiredQuantity,
          availableStock: oc.availableQuantity,
          shortfall,
          isOptional: true,
          canFulfill: shortfall === 0,
        });
      }

      const requiredWithShortfall = components.filter((c) => c.shortfall > 0);
      if (requiredWithShortfall.length === 0) {
        bomStatus = 'READY';
      } else if (requiredWithShortfall.length === components.length) {
        bomStatus = 'SHORTAGE';
      } else {
        bomStatus = 'PARTIAL';
      }
    }
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
    bomComponents,
    bomStatus,
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

export interface MaterialWarning {
  componentSku: string;
  required: number;
  available: number;
  shortfall: number;
}

/**
 * Start job - change status from PENDING to IN_PROGRESS
 * Performs a soft material availability check before starting
 */
export async function startJobCard(
  id: string,
  _userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string; warnings?: MaterialWarning[] }> {
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

  // Perform material availability check (soft warning — does not block)
  let warnings: MaterialWarning[] = [];
  let materialCheckResult: Record<string, unknown> | null = null;

  try {
    const bomCheck = await checkBomStock(jobCard.productId, jobCard.quantity, 'JHB');
    if (bomCheck.success && bomCheck.data) {
      materialCheckResult = {
        canFulfill: bomCheck.data.canFulfill,
        checkedAt: new Date().toISOString(),
        components: bomCheck.data.components.map((c) => ({
          sku: c.nusafSku,
          required: c.requiredQuantity,
          available: c.availableQuantity,
          shortfall: c.shortfall,
        })),
      };

      // Build warnings for required components with shortfall (not optional)
      warnings = bomCheck.data.components
        .filter((c) => c.shortfall > 0 && !c.isOptional)
        .map((c) => ({
          componentSku: c.nusafSku,
          required: c.requiredQuantity,
          available: c.availableQuantity,
          shortfall: c.shortfall,
        }));
    }
  } catch (err) {
    // BOM check failure should not block job start
    console.error('Material check failed (non-blocking):', err);
  }

  await prisma.jobCard.update({
    where: { id },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      materialCheckPerformed: true,
      materialCheckResult: materialCheckResult ? (materialCheckResult as Prisma.InputJsonValue) : undefined,
    },
  });

  return { success: true, warnings: warnings.length > 0 ? warnings : undefined };
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
      // Use snapshot (JobCardBomLine) if available, fall back to live BOM for old job cards
      const snapshotLines = await tx.jobCardBomLine.findMany({
        where: { jobCardId: jobCard.id, isOptional: false },
        orderBy: { sortOrder: 'asc' },
      });

      if (snapshotLines.length > 0) {
        // Use BOM snapshot for consumption
        for (const line of snapshotLines) {
          const consumedQty = Math.ceil(line.totalRequired.toNumber());
          if (consumedQty <= 0) continue;

          const componentLevel = await updateStockLevel(
            tx,
            line.componentProductId,
            manufacturingLocation,
            { onHand: -consumedQty },
            userId
          );

          await createStockMovement(tx, {
            productId: line.componentProductId,
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
      } else {
        // Fallback: no snapshot (old job cards) — use live BOM
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
      }

      // 4. Release hard reservations for this job card's components
      const jobCardReservations = await tx.stockReservation.findMany({
        where: {
          referenceType: 'JobCard',
          referenceId: jobCard.id,
          reservationType: 'HARD',
          releasedAt: null,
        },
      });

      for (const reservation of jobCardReservations) {
        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: {
            releasedAt: new Date(),
            releasedBy: userId,
            releaseReason: `Job card ${jobCard.jobCardNumber} completed`,
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

      // 5. Propagate status to SalesOrder
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

      const allJobsComplete = allJobCards.every((jc) => jc.status === 'COMPLETE' || jc.status === 'CANCELLED');
      const allPickingComplete = allPickingSlips.length === 0 || allPickingSlips.every((ps) => ps.status === 'COMPLETE' || ps.status === 'CANCELLED');
      const allTransfersComplete = allTransfers.length === 0 || allTransfers.every((tr) => tr.status === 'RECEIVED' || tr.status === 'CANCELLED');

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
