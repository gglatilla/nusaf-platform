import { Prisma, Warehouse, CycleCountStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { createStockAdjustment } from './inventory.service';

// ============================================
// NUMBER GENERATION
// ============================================

async function generateCycleCountNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();

  const counter = await prisma.$transaction(async (tx) => {
    let counter = await tx.cycleCountCounter.findUnique({
      where: { id: 'cycle_count_counter' },
    });

    if (!counter) {
      counter = await tx.cycleCountCounter.create({
        data: {
          id: 'cycle_count_counter',
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    if (counter.year !== currentYear) {
      counter = await tx.cycleCountCounter.update({
        where: { id: 'cycle_count_counter' },
        data: {
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    counter = await tx.cycleCountCounter.update({
      where: { id: 'cycle_count_counter' },
      data: {
        count: { increment: 1 },
      },
    });

    return counter;
  });

  const paddedCount = counter.count.toString().padStart(5, '0');
  return `CC-${currentYear}-${paddedCount}`;
}

// ============================================
// CREATE SESSION
// ============================================

export async function createCycleCountSession(
  location: Warehouse,
  productIds: string[],
  notes: string | undefined,
  userId: string
): Promise<{ success: boolean; session?: { id: string; sessionNumber: string }; error?: string }> {
  try {
    // Validate all products exist
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        deletedAt: null,
      },
      select: {
        id: true,
        nusafSku: true,
        description: true,
        stockLevels: {
          where: { location },
          select: { onHand: true },
        },
      },
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      return { success: false, error: `Products not found: ${missingIds.join(', ')}` };
    }

    const sessionNumber = await generateCycleCountNumber();

    const session = await prisma.cycleCountSession.create({
      data: {
        sessionNumber,
        location,
        status: 'OPEN',
        notes,
        createdBy: userId,
        lines: {
          create: products.map((product) => ({
            productId: product.id,
            productSku: product.nusafSku,
            productDescription: product.description,
            systemQuantity: product.stockLevels[0]?.onHand ?? 0,
          })),
        },
      },
    });

    return {
      success: true,
      session: { id: session.id, sessionNumber: session.sessionNumber },
    };
  } catch (error) {
    console.error('Create cycle count session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create cycle count session',
    };
  }
}

// ============================================
// GET SESSION BY ID
// ============================================

export async function getCycleCountSession(sessionId: string) {
  const session = await prisma.cycleCountSession.findUnique({
    where: { id: sessionId },
    include: {
      lines: {
        orderBy: { productSku: 'asc' },
      },
    },
  });

  if (!session) {
    return null;
  }

  const countedLineCount = session.lines.filter((l) => l.countedQuantity !== null).length;

  return {
    id: session.id,
    sessionNumber: session.sessionNumber,
    location: session.location,
    status: session.status,
    notes: session.notes,
    adjustmentId: session.adjustmentId,
    adjustmentNumber: session.adjustmentNumber,
    lines: session.lines.map((line) => ({
      id: line.id,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      systemQuantity: line.systemQuantity,
      countedQuantity: line.countedQuantity,
      variance: line.variance,
      countedAt: line.countedAt,
      countedBy: line.countedBy,
      notes: line.notes,
    })),
    lineCount: session.lines.length,
    countedLineCount,
    createdAt: session.createdAt,
    createdBy: session.createdBy,
    completedAt: session.completedAt,
    completedBy: session.completedBy,
    cancelledAt: session.cancelledAt,
    cancelledBy: session.cancelledBy,
  };
}

// ============================================
// LIST SESSIONS
// ============================================

export interface CycleCountListQuery {
  location?: Warehouse;
  status?: CycleCountStatus;
  page: number;
  pageSize: number;
}

export async function getCycleCountSessions(options: CycleCountListQuery) {
  const { location, status, page, pageSize } = options;

  const where: Prisma.CycleCountSessionWhereInput = {};

  if (location) {
    where.location = location;
  }

  if (status) {
    where.status = status;
  }

  const [total, sessions] = await Promise.all([
    prisma.cycleCountSession.count({ where }),
    prisma.cycleCountSession.findMany({
      where,
      include: {
        _count: { select: { lines: true } },
        lines: {
          select: { countedQuantity: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    sessions: sessions.map((s) => ({
      id: s.id,
      sessionNumber: s.sessionNumber,
      location: s.location,
      status: s.status,
      lineCount: s._count.lines,
      countedLineCount: s.lines.filter((l) => l.countedQuantity !== null).length,
      adjustmentNumber: s.adjustmentNumber,
      createdAt: s.createdAt,
      createdBy: s.createdBy,
      completedAt: s.completedAt,
    })),
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ============================================
// SUBMIT COUNTED QUANTITIES
// ============================================

export async function submitCycleCountLines(
  sessionId: string,
  lines: Array<{ lineId: string; countedQuantity: number; notes?: string }>,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await prisma.cycleCountSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true },
    });

    if (!session) {
      return { success: false, error: 'Cycle count session not found' };
    }

    if (session.status !== 'OPEN' && session.status !== 'IN_PROGRESS') {
      return { success: false, error: `Cannot submit counts for session in ${session.status} status` };
    }

    // Validate all lineIds belong to this session
    const existingLines = await prisma.cycleCountLine.findMany({
      where: {
        sessionId,
        id: { in: lines.map((l) => l.lineId) },
      },
      select: { id: true, systemQuantity: true },
    });

    if (existingLines.length !== lines.length) {
      const foundIds = new Set(existingLines.map((l) => l.id));
      const invalidIds = lines.filter((l) => !foundIds.has(l.lineId)).map((l) => l.lineId);
      return { success: false, error: `Lines not found in this session: ${invalidIds.join(', ')}` };
    }

    const existingLineMap = new Map(existingLines.map((l) => [l.id, l]));
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // Update each line
      for (const line of lines) {
        const existing = existingLineMap.get(line.lineId)!;
        const variance = line.countedQuantity - existing.systemQuantity;

        await tx.cycleCountLine.update({
          where: { id: line.lineId },
          data: {
            countedQuantity: line.countedQuantity,
            variance,
            countedAt: now,
            countedBy: userId,
            notes: line.notes,
          },
        });
      }

      // Auto-transition OPEN → IN_PROGRESS
      if (session.status === 'OPEN') {
        await tx.cycleCountSession.update({
          where: { id: sessionId },
          data: { status: 'IN_PROGRESS' },
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Submit cycle count lines error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit counts',
    };
  }
}

// ============================================
// COMPLETE SESSION
// ============================================

export async function completeCycleCountSession(
  sessionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await prisma.cycleCountSession.findUnique({
      where: { id: sessionId },
      include: {
        lines: {
          select: { id: true, productSku: true, countedQuantity: true },
        },
      },
    });

    if (!session) {
      return { success: false, error: 'Cycle count session not found' };
    }

    if (session.status !== 'IN_PROGRESS') {
      return { success: false, error: `Cannot complete session in ${session.status} status` };
    }

    // Check all lines have been counted
    const uncountedLines = session.lines.filter((l) => l.countedQuantity === null);
    if (uncountedLines.length > 0) {
      const skus = uncountedLines.map((l) => l.productSku).join(', ');
      return {
        success: false,
        error: `${uncountedLines.length} line(s) not yet counted: ${skus}`,
      };
    }

    await prisma.cycleCountSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedBy: userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Complete cycle count session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete session',
    };
  }
}

// ============================================
// RECONCILE SESSION
// ============================================

export async function reconcileCycleCountSession(
  sessionId: string,
  userId: string
): Promise<{
  success: boolean;
  adjustmentId?: string;
  adjustmentNumber?: string;
  error?: string;
}> {
  try {
    const session = await prisma.cycleCountSession.findUnique({
      where: { id: sessionId },
      include: {
        lines: true,
      },
    });

    if (!session) {
      return { success: false, error: 'Cycle count session not found' };
    }

    if (session.status !== 'COMPLETED') {
      return { success: false, error: `Cannot reconcile session in ${session.status} status` };
    }

    // Filter lines with non-zero variance
    const varianceLines = session.lines.filter((l) => l.variance !== null && l.variance !== 0);

    if (varianceLines.length === 0) {
      // No variances — mark reconciled without creating an adjustment
      await prisma.cycleCountSession.update({
        where: { id: sessionId },
        data: { status: 'RECONCILED' },
      });
      return { success: true };
    }

    // Create stock adjustment from variances
    const adjustmentResult = await createStockAdjustment(
      {
        location: session.location,
        reason: 'CYCLE_COUNT',
        notes: `Generated from cycle count ${session.sessionNumber}`,
        lines: varianceLines.map((line) => ({
          productId: line.productId,
          adjustedQuantity: line.countedQuantity!,
          notes: line.notes ?? undefined,
        })),
      },
      userId
    );

    if (!adjustmentResult.success || !adjustmentResult.adjustment) {
      return { success: false, error: adjustmentResult.error || 'Failed to create adjustment' };
    }

    // Link adjustment to session
    await prisma.cycleCountSession.update({
      where: { id: sessionId },
      data: {
        status: 'RECONCILED',
        adjustmentId: adjustmentResult.adjustment.id,
        adjustmentNumber: adjustmentResult.adjustment.adjustmentNumber,
      },
    });

    return {
      success: true,
      adjustmentId: adjustmentResult.adjustment.id,
      adjustmentNumber: adjustmentResult.adjustment.adjustmentNumber,
    };
  } catch (error) {
    console.error('Reconcile cycle count session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reconcile session',
    };
  }
}

// ============================================
// CANCEL SESSION
// ============================================

export async function cancelCycleCountSession(
  sessionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await prisma.cycleCountSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true },
    });

    if (!session) {
      return { success: false, error: 'Cycle count session not found' };
    }

    if (session.status === 'RECONCILED') {
      return { success: false, error: 'Cannot cancel a reconciled session' };
    }

    if (session.status === 'CANCELLED') {
      return { success: false, error: 'Session is already cancelled' };
    }

    await prisma.cycleCountSession.update({
      where: { id: sessionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Cancel cycle count session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel session',
    };
  }
}
