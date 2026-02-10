import { Prisma, Warehouse, PurchaseOrderStatus } from '@prisma/client';
import { prisma } from '../config/database';
import type { CreateGrvInput, GrvListQuery } from '../utils/validation/goods-receipts';

// ============================================
// TYPES
// ============================================

export interface GrvData {
  id: string;
  grvNumber: string;
  purchaseOrder: {
    id: string;
    poNumber: string;
    supplier: { id: string; code: string; name: string };
  };
  location: Warehouse;
  receivedAt: Date;
  receivedBy: string;
  receivedByName: string;
  notes: string | null;
  lines: GrvLineData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GrvLineData {
  id: string;
  lineNumber: number;
  poLineId: string;
  productId: string;
  productSku: string;
  quantityExpected: number;
  quantityReceived: number;
  quantityRejected: number;
  rejectionReason: string | null;
}

export interface GrvSummary {
  id: string;
  grvNumber: string;
  poNumber: string;
  supplierName: string;
  location: Warehouse;
  receivedAt: Date;
  receivedByName: string;
  lineCount: number;
  totalReceived: number;
  totalRejected: number;
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
// NUMBER GENERATION
// ============================================

/**
 * Generate the next GRV number in format GRV-YYYY-NNNNN
 */
export async function generateGRVNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();

  const counter = await prisma.$transaction(async (tx) => {
    let counter = await tx.grvCounter.findUnique({
      where: { id: 'grv_counter' },
    });

    if (!counter) {
      counter = await tx.grvCounter.create({
        data: {
          id: 'grv_counter',
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    if (counter.year !== currentYear) {
      counter = await tx.grvCounter.update({
        where: { id: 'grv_counter' },
        data: {
          year: currentYear,
          count: 1,
        },
      });
      return counter;
    }

    counter = await tx.grvCounter.update({
      where: { id: 'grv_counter' },
      data: {
        count: { increment: 1 },
      },
    });

    return counter;
  });

  const paddedCount = counter.count.toString().padStart(5, '0');
  return `GRV-${currentYear}-${paddedCount}`;
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Create a goods received voucher
 * Single-step: creates GRV, updates PO lines, updates stock levels
 */
export async function createGoodsReceipt(
  input: CreateGrvInput,
  userId: string,
  userName: string
): Promise<ServiceResult<GrvData>> {
  // Fetch PO with lines and supplier
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id: input.purchaseOrderId },
    include: {
      supplier: { select: { id: true, code: true, name: true } },
      lines: true,
    },
  });

  if (!purchaseOrder) {
    return { success: false, error: 'Purchase order not found' };
  }

  // Validate PO status - can only receive if SENT, ACKNOWLEDGED, or PARTIALLY_RECEIVED
  const validStatuses: PurchaseOrderStatus[] = ['SENT', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED'];
  if (!validStatuses.includes(purchaseOrder.status)) {
    return { success: false, error: `Cannot receive goods for PO with status ${purchaseOrder.status}` };
  }

  // Validate all PO line IDs exist and belong to this PO
  const poLineMap = new Map(purchaseOrder.lines.map((l) => [l.id, l]));
  for (const line of input.lines) {
    if (!poLineMap.has(line.poLineId)) {
      return { success: false, error: `PO line ${line.poLineId} not found in this purchase order` };
    }
  }

  // Validate quantities don't exceed remaining expected
  for (const line of input.lines) {
    const poLine = poLineMap.get(line.poLineId)!;
    const remaining = poLine.quantityOrdered - poLine.quantityReceived;
    const totalIncoming = line.quantityReceived + line.quantityRejected;

    if (totalIncoming > remaining) {
      return {
        success: false,
        error: `Line ${poLine.productSku}: Total incoming (${totalIncoming}) exceeds remaining expected (${remaining})`,
      };
    }
  }

  // Determine location (default to PO's delivery location)
  const location = input.location ?? purchaseOrder.deliveryLocation;

  try {
    const grv = await prisma.$transaction(async (tx) => {
      // Generate GRV number
      const grvNumber = await generateGRVNumber();

      // Create GRV header
      const grv = await tx.goodsReceivedVoucher.create({
        data: {
          grvNumber,
          purchaseOrderId: purchaseOrder.id,
          location,
          receivedBy: userId,
          receivedByName: userName,
          notes: input.notes,
          lines: {
            create: input.lines.map((line, index) => {
              const poLine = poLineMap.get(line.poLineId)!;
              const remaining = poLine.quantityOrdered - poLine.quantityReceived;
              return {
                lineNumber: index + 1,
                poLineId: line.poLineId,
                productId: poLine.productId,
                productSku: poLine.productSku,
                quantityExpected: remaining,
                quantityReceived: line.quantityReceived,
                quantityRejected: line.quantityRejected,
                rejectionReason: line.rejectionReason,
              };
            }),
          },
        },
        include: {
          lines: { orderBy: { lineNumber: 'asc' } },
        },
      });

      // Update PO lines and stock for each received item
      for (const line of input.lines) {
        const poLine = poLineMap.get(line.poLineId)!;

        // Update PO line quantityReceived
        await tx.purchaseOrderLine.update({
          where: { id: line.poLineId },
          data: {
            quantityReceived: { increment: line.quantityReceived },
          },
        });

        // Update stock level: onHand increases, onOrder decreases
        if (line.quantityReceived > 0) {
          // Get or create stock level
          let stockLevel = await tx.stockLevel.findUnique({
            where: { productId_location: { productId: poLine.productId, location } },
          });

          if (!stockLevel) {
            stockLevel = await tx.stockLevel.create({
              data: {
                productId: poLine.productId,
                location,
                onHand: 0,
                softReserved: 0,
                hardReserved: 0,
                onOrder: 0,
                createdBy: userId,
                updatedBy: userId,
              },
            });
          }

          const newOnHand = stockLevel.onHand + line.quantityReceived;
          const newOnOrder = Math.max(0, stockLevel.onOrder - line.quantityReceived);

          await tx.stockLevel.update({
            where: { id: stockLevel.id },
            data: {
              onHand: newOnHand,
              onOrder: newOnOrder,
              updatedBy: userId,
            },
          });

          // Create stock movement record
          await tx.stockMovement.create({
            data: {
              productId: poLine.productId,
              location,
              movementType: 'RECEIPT',
              quantity: line.quantityReceived,
              balanceAfter: newOnHand,
              referenceType: 'GoodsReceivedVoucher',
              referenceId: grv.id,
              referenceNumber: grvNumber,
              notes: `Received from PO ${purchaseOrder.poNumber}`,
              createdBy: userId,
            },
          });
        }
      }

      // Update PO status based on all lines
      const updatedPOLines = await tx.purchaseOrderLine.findMany({
        where: { purchaseOrderId: purchaseOrder.id },
      });

      const allFullyReceived = updatedPOLines.every(
        (l) => l.quantityReceived >= l.quantityOrdered
      );
      const someReceived = updatedPOLines.some((l) => l.quantityReceived > 0);

      let newStatus: PurchaseOrderStatus;
      if (allFullyReceived) {
        newStatus = 'RECEIVED';
      } else if (someReceived) {
        newStatus = 'PARTIALLY_RECEIVED';
      } else {
        newStatus = purchaseOrder.status; // No change
      }

      if (newStatus !== purchaseOrder.status) {
        await tx.purchaseOrder.update({
          where: { id: purchaseOrder.id },
          data: { status: newStatus, version: { increment: 1 }, updatedBy: userId },
        });
      }

      return grv;
    });

    // Return the created GRV with full data
    return {
      success: true,
      data: {
        id: grv.id,
        grvNumber: grv.grvNumber,
        purchaseOrder: {
          id: purchaseOrder.id,
          poNumber: purchaseOrder.poNumber,
          supplier: purchaseOrder.supplier,
        },
        location: grv.location,
        receivedAt: grv.receivedAt,
        receivedBy: grv.receivedBy,
        receivedByName: grv.receivedByName,
        notes: grv.notes,
        lines: grv.lines.map((l) => ({
          id: l.id,
          lineNumber: l.lineNumber,
          poLineId: l.poLineId,
          productId: l.productId,
          productSku: l.productSku,
          quantityExpected: l.quantityExpected,
          quantityReceived: l.quantityReceived,
          quantityRejected: l.quantityRejected,
          rejectionReason: l.rejectionReason,
        })),
        createdAt: grv.createdAt,
        updatedAt: grv.updatedAt,
      },
    };
  } catch (error) {
    console.error('Create goods receipt error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create goods receipt',
    };
  }
}

/**
 * Get goods receipt by ID
 */
export async function getGoodsReceiptById(grvId: string): Promise<GrvData | null> {
  const grv = await prisma.goodsReceivedVoucher.findUnique({
    where: { id: grvId },
    include: {
      purchaseOrder: {
        select: {
          id: true,
          poNumber: true,
          supplier: { select: { id: true, code: true, name: true } },
        },
      },
      lines: { orderBy: { lineNumber: 'asc' } },
    },
  });

  if (!grv) {
    return null;
  }

  return {
    id: grv.id,
    grvNumber: grv.grvNumber,
    purchaseOrder: grv.purchaseOrder,
    location: grv.location,
    receivedAt: grv.receivedAt,
    receivedBy: grv.receivedBy,
    receivedByName: grv.receivedByName,
    notes: grv.notes,
    lines: grv.lines.map((l) => ({
      id: l.id,
      lineNumber: l.lineNumber,
      poLineId: l.poLineId,
      productId: l.productId,
      productSku: l.productSku,
      quantityExpected: l.quantityExpected,
      quantityReceived: l.quantityReceived,
      quantityRejected: l.quantityRejected,
      rejectionReason: l.rejectionReason,
    })),
    createdAt: grv.createdAt,
    updatedAt: grv.updatedAt,
  };
}

/**
 * Get paginated list of goods receipts with filtering
 */
export async function getGoodsReceipts(
  options: GrvListQuery
): Promise<PaginatedResult<GrvSummary>> {
  const { purchaseOrderId, location, startDate, endDate, search, page, pageSize } = options;

  const where: Prisma.GoodsReceivedVoucherWhereInput = {};

  if (purchaseOrderId) {
    where.purchaseOrderId = purchaseOrderId;
  }

  if (location) {
    where.location = location;
  }

  if (startDate || endDate) {
    where.receivedAt = {};
    if (startDate) {
      where.receivedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.receivedAt.lte = new Date(endDate);
    }
  }

  if (search) {
    where.grvNumber = { contains: search, mode: 'insensitive' };
  }

  const [total, grvs] = await Promise.all([
    prisma.goodsReceivedVoucher.count({ where }),
    prisma.goodsReceivedVoucher.findMany({
      where,
      include: {
        purchaseOrder: {
          select: {
            poNumber: true,
            supplier: { select: { name: true } },
          },
        },
        lines: { select: { quantityReceived: true, quantityRejected: true } },
      },
      orderBy: { receivedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: grvs.map((grv) => ({
      id: grv.id,
      grvNumber: grv.grvNumber,
      poNumber: grv.purchaseOrder.poNumber,
      supplierName: grv.purchaseOrder.supplier.name,
      location: grv.location,
      receivedAt: grv.receivedAt,
      receivedByName: grv.receivedByName,
      lineCount: grv.lines.length,
      totalReceived: grv.lines.reduce((sum, l) => sum + l.quantityReceived, 0),
      totalRejected: grv.lines.reduce((sum, l) => sum + l.quantityRejected, 0),
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
 * Get all goods receipts for a specific purchase order
 */
export async function getGoodsReceiptsForPO(purchaseOrderId: string): Promise<GrvSummary[]> {
  const grvs = await prisma.goodsReceivedVoucher.findMany({
    where: { purchaseOrderId },
    include: {
      purchaseOrder: {
        select: {
          poNumber: true,
          supplier: { select: { name: true } },
        },
      },
      lines: { select: { quantityReceived: true, quantityRejected: true } },
    },
    orderBy: { receivedAt: 'desc' },
  });

  return grvs.map((grv) => ({
    id: grv.id,
    grvNumber: grv.grvNumber,
    poNumber: grv.purchaseOrder.poNumber,
    supplierName: grv.purchaseOrder.supplier.name,
    location: grv.location,
    receivedAt: grv.receivedAt,
    receivedByName: grv.receivedByName,
    lineCount: grv.lines.length,
    totalReceived: grv.lines.reduce((sum, l) => sum + l.quantityReceived, 0),
    totalRejected: grv.lines.reduce((sum, l) => sum + l.quantityRejected, 0),
  }));
}

/**
 * Get receiving summary for a PO (what's been received vs what's outstanding)
 */
export async function getPOReceivingSummary(purchaseOrderId: string): Promise<{
  poNumber: string;
  status: PurchaseOrderStatus;
  lines: Array<{
    poLineId: string;
    productSku: string;
    productDescription: string;
    quantityOrdered: number;
    quantityReceived: number;
    quantityOutstanding: number;
  }>;
} | null> {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    select: {
      poNumber: true,
      status: true,
      lines: {
        select: {
          id: true,
          productSku: true,
          productDescription: true,
          quantityOrdered: true,
          quantityReceived: true,
        },
        orderBy: { lineNumber: 'asc' },
      },
    },
  });

  if (!po) {
    return null;
  }

  return {
    poNumber: po.poNumber,
    status: po.status,
    lines: po.lines.map((l) => ({
      poLineId: l.id,
      productSku: l.productSku,
      productDescription: l.productDescription,
      quantityOrdered: l.quantityOrdered,
      quantityReceived: l.quantityReceived,
      quantityOutstanding: l.quantityOrdered - l.quantityReceived,
    })),
  };
}
