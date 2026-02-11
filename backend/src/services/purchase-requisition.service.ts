import { Prisma, PurchaseRequisitionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { createPurchaseOrder, addPurchaseOrderLine } from './purchase-order.service';
import type {
  CreatePurchaseRequisitionInput,
  PurchaseRequisitionListQuery,
} from '../utils/validation/purchase-requisitions';
import { generateRequisitionNumber } from '../utils/number-generation';

// ============================================
// TYPES
// ============================================

export interface PurchaseRequisitionLineData {
  id: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  supplierId: string | null;
  supplierName: string | null;
  quantity: number;
  estimatedUnitCost: number | null;
  estimatedLineTotal: number | null;
  deliveryLocation: string;
  lineNotes: string | null;
}

export interface PurchaseRequisitionData {
  id: string;
  requisitionNumber: string;
  companyId?: string;
  status: PurchaseRequisitionStatus;
  requestedBy: string;
  requestedByName: string;
  department: string | null;
  urgency: string;
  requiredByDate: Date | null;
  reason: string;
  notes: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  approvedByName: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  cancelledAt: Date | null;
  generatedPOIds: string[];
  lines: PurchaseRequisitionLineData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseRequisitionListItem {
  id: string;
  requisitionNumber: string;
  status: PurchaseRequisitionStatus;
  requestedByName: string;
  department: string | null;
  urgency: string;
  requiredByDate: Date | null;
  reason: string;
  lineCount: number;
  estimatedTotal: number | null;
  generatedPOIds: string[];
  createdAt: Date;
}

interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// NUMBER GENERATION
// ============================================

// ============================================
// MAPPING HELPERS
// ============================================

function mapLineToData(line: {
  id: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  supplierId: string | null;
  supplierName: string | null;
  quantity: number;
  estimatedUnitCost: Decimal | null;
  estimatedLineTotal: Decimal | null;
  deliveryLocation: string;
  lineNotes: string | null;
}): PurchaseRequisitionLineData {
  return {
    id: line.id,
    lineNumber: line.lineNumber,
    productId: line.productId,
    productSku: line.productSku,
    productDescription: line.productDescription,
    supplierId: line.supplierId,
    supplierName: line.supplierName,
    quantity: line.quantity,
    estimatedUnitCost: line.estimatedUnitCost ? Number(line.estimatedUnitCost) : null,
    estimatedLineTotal: line.estimatedLineTotal ? Number(line.estimatedLineTotal) : null,
    deliveryLocation: line.deliveryLocation,
    lineNotes: line.lineNotes,
  };
}

function mapToData(pr: {
  id: string;
  requisitionNumber: string;
  companyId?: string;
  status: PurchaseRequisitionStatus;
  requestedBy: string;
  requestedByName: string;
  department: string | null;
  urgency: string;
  requiredByDate: Date | null;
  reason: string;
  notes: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  approvedByName: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  cancelledAt: Date | null;
  generatedPOIds: string[];
  lines: Array<{
    id: string;
    lineNumber: number;
    productId: string;
    productSku: string;
    productDescription: string;
    supplierId: string | null;
    supplierName: string | null;
    quantity: number;
    estimatedUnitCost: Decimal | null;
    estimatedLineTotal: Decimal | null;
    deliveryLocation: string;
    lineNotes: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}): PurchaseRequisitionData {
  return {
    id: pr.id,
    requisitionNumber: pr.requisitionNumber,
    companyId: pr.companyId,
    status: pr.status,
    requestedBy: pr.requestedBy,
    requestedByName: pr.requestedByName,
    department: pr.department,
    urgency: pr.urgency,
    requiredByDate: pr.requiredByDate,
    reason: pr.reason,
    notes: pr.notes,
    approvedAt: pr.approvedAt,
    approvedBy: pr.approvedBy,
    approvedByName: pr.approvedByName,
    rejectedAt: pr.rejectedAt,
    rejectedBy: pr.rejectedBy,
    rejectionReason: pr.rejectionReason,
    cancelledAt: pr.cancelledAt,
    generatedPOIds: pr.generatedPOIds,
    lines: pr.lines.map(mapLineToData),
    createdAt: pr.createdAt,
    updatedAt: pr.updatedAt,
  };
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Create a new purchase requisition
 */
export async function createPurchaseRequisition(
  input: CreatePurchaseRequisitionInput,
  userId: string,
  userName: string,
  companyId: string
): Promise<ServiceResult<PurchaseRequisitionData>> {
  const requisitionNumber = await generateRequisitionNumber();

  const pr = await prisma.purchaseRequisition.create({
    data: {
      requisitionNumber,
      companyId,
      requestedBy: userId,
      requestedByName: userName,
      department: input.department,
      urgency: input.urgency,
      requiredByDate: input.requiredByDate,
      reason: input.reason,
      notes: input.notes,
      lines: {
        create: input.lines.map((line, index) => {
          const estimatedLineTotal = line.estimatedUnitCost
            ? Math.round(line.estimatedUnitCost * line.quantity * 100) / 100
            : null;
          return {
            lineNumber: index + 1,
            productId: line.productId,
            productSku: line.productSku,
            productDescription: line.productDescription,
            supplierId: line.supplierId,
            supplierName: line.supplierName,
            quantity: line.quantity,
            estimatedUnitCost: line.estimatedUnitCost,
            estimatedLineTotal: estimatedLineTotal,
            deliveryLocation: line.deliveryLocation,
            lineNotes: line.lineNotes,
          };
        }),
      },
    },
    include: {
      lines: {
        orderBy: { lineNumber: 'asc' },
      },
    },
  });

  return {
    success: true,
    data: mapToData(pr),
  };
}

/**
 * Get paginated list of purchase requisitions for a company
 */
export async function getPurchaseRequisitions(
  query: PurchaseRequisitionListQuery,
  companyId?: string
): Promise<PaginatedResult<PurchaseRequisitionListItem>> {
  const { status, urgency, search, page = 1, pageSize = 20 } = query;

  const where: Prisma.PurchaseRequisitionWhereInput = {};
  if (companyId) where.companyId = companyId;

  if (status) {
    where.status = status;
  }

  if (urgency) {
    where.urgency = urgency;
  }

  if (search) {
    where.OR = [
      { requisitionNumber: { contains: search, mode: 'insensitive' } },
      { requestedByName: { contains: search, mode: 'insensitive' } },
      { reason: { contains: search, mode: 'insensitive' } },
      { department: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.purchaseRequisition.findMany({
      where,
      include: {
        lines: {
          select: {
            estimatedLineTotal: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.purchaseRequisition.count({ where }),
  ]);

  return {
    items: items.map((pr) => ({
      id: pr.id,
      requisitionNumber: pr.requisitionNumber,
      status: pr.status,
      requestedByName: pr.requestedByName,
      department: pr.department,
      urgency: pr.urgency,
      requiredByDate: pr.requiredByDate,
      reason: pr.reason,
      lineCount: pr.lines.length,
      estimatedTotal: pr.lines.reduce((sum, l) => {
        return sum + (l.estimatedLineTotal ? Number(l.estimatedLineTotal) : 0);
      }, 0) || null,
      generatedPOIds: pr.generatedPOIds,
      createdAt: pr.createdAt,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get a single purchase requisition by ID
 */
export async function getPurchaseRequisitionById(
  id: string,
  companyId?: string
): Promise<PurchaseRequisitionData | null> {
  const where: Prisma.PurchaseRequisitionWhereInput = { id };
  if (companyId) where.companyId = companyId;

  const pr = await prisma.purchaseRequisition.findFirst({
    where,
    include: {
      lines: {
        orderBy: { lineNumber: 'asc' },
      },
    },
  });

  if (!pr) return null;

  return mapToData(pr);
}

// ============================================
// STATUS TRANSITIONS
// ============================================

/**
 * Approve a purchase requisition and auto-create draft PO(s) grouped by supplier.
 * Sets status to CONVERTED_TO_PO.
 */
export async function approvePurchaseRequisition(
  id: string,
  userId: string,
  userName: string,
  companyId?: string
): Promise<ServiceResult<{ generatedPOIds: string[] }>> {
  const approveWhere: Prisma.PurchaseRequisitionWhereInput = { id };
  if (companyId) approveWhere.companyId = companyId;

  const pr = await prisma.purchaseRequisition.findFirst({
    where: approveWhere,
    include: {
      lines: {
        orderBy: { lineNumber: 'asc' },
      },
    },
  });

  if (!pr) {
    return { success: false, error: 'Purchase requisition not found' };
  }

  if (pr.status !== 'PENDING') {
    return { success: false, error: `Cannot approve requisition with status ${pr.status}` };
  }

  // Prevent self-approval
  if (pr.requestedBy === userId) {
    return { success: false, error: 'You cannot approve your own purchase requisition' };
  }

  // Group lines by supplier
  const linesBySupplier = new Map<string, typeof pr.lines>();
  const noSupplierLines: typeof pr.lines = [];

  for (const line of pr.lines) {
    if (line.supplierId) {
      const existing = linesBySupplier.get(line.supplierId) || [];
      existing.push(line);
      linesBySupplier.set(line.supplierId, existing);
    } else {
      noSupplierLines.push(line);
    }
  }

  // If there are lines without a supplier, we can't auto-create POs for them
  if (noSupplierLines.length > 0 && linesBySupplier.size === 0) {
    // All lines have no supplier — just approve without PO generation
    await prisma.purchaseRequisition.update({
      where: { id },
      data: {
        status: 'CONVERTED_TO_PO',
        approvedAt: new Date(),
        approvedBy: userId,
        approvedByName: userName,
      },
    });

    return {
      success: true,
      data: { generatedPOIds: [] },
    };
  }

  // Create a draft PO per supplier
  const generatedPOIds: string[] = [];
  const errors: string[] = [];

  for (const [supplierId, lines] of linesBySupplier) {
    // Determine delivery location from first line (all lines for same supplier likely same location)
    const deliveryLocation = (lines[0].deliveryLocation as 'JHB' | 'CT') || 'JHB';

    const poResult = await createPurchaseOrder(
      {
        supplierId,
        deliveryLocation,
        expectedDate: pr.requiredByDate || undefined,
        internalNotes: `Generated from Purchase Requisition ${pr.requisitionNumber} — ${lines.length} item(s). Reason: ${pr.reason}`,
      },
      userId
    );

    if (!poResult.success || !poResult.data) {
      errors.push(`Failed to create PO for supplier ${lines[0].supplierName || supplierId}: ${poResult.error}`);
      continue;
    }

    const poId = poResult.data.id;
    generatedPOIds.push(poId);

    // Add lines to the PO
    for (const line of lines) {
      const unitCost = line.estimatedUnitCost ? Number(line.estimatedUnitCost) : 0;
      await addPurchaseOrderLine(
        poId,
        {
          productId: line.productId,
          quantityOrdered: line.quantity,
          unitCost: unitCost > 0 ? unitCost : 0.01, // PO line requires positive cost
        },
        userId
      );
    }
  }

  if (errors.length > 0 && generatedPOIds.length === 0) {
    return { success: false, error: errors.join('; ') };
  }

  // Update PR status to CONVERTED_TO_PO
  await prisma.purchaseRequisition.update({
    where: { id },
    data: {
      status: 'CONVERTED_TO_PO',
      approvedAt: new Date(),
      approvedBy: userId,
      approvedByName: userName,
      generatedPOIds,
    },
  });

  return {
    success: true,
    data: { generatedPOIds },
  };
}

/**
 * Reject a purchase requisition
 */
export async function rejectPurchaseRequisition(
  id: string,
  reason: string,
  userId: string,
  companyId?: string
): Promise<ServiceResult> {
  const rejectWhere: Prisma.PurchaseRequisitionWhereInput = { id };
  if (companyId) rejectWhere.companyId = companyId;

  const pr = await prisma.purchaseRequisition.findFirst({
    where: rejectWhere,
  });

  if (!pr) {
    return { success: false, error: 'Purchase requisition not found' };
  }

  if (pr.status !== 'PENDING') {
    return { success: false, error: `Cannot reject requisition with status ${pr.status}` };
  }

  await prisma.purchaseRequisition.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedBy: userId,
      rejectionReason: reason,
    },
  });

  return { success: true };
}

/**
 * Cancel a purchase requisition (only by the creator)
 */
export async function cancelPurchaseRequisition(
  id: string,
  userId: string,
  companyId?: string
): Promise<ServiceResult> {
  const cancelWhere: Prisma.PurchaseRequisitionWhereInput = { id };
  if (companyId) cancelWhere.companyId = companyId;

  const pr = await prisma.purchaseRequisition.findFirst({
    where: cancelWhere,
  });

  if (!pr) {
    return { success: false, error: 'Purchase requisition not found' };
  }

  if (pr.status !== 'PENDING') {
    return { success: false, error: `Cannot cancel requisition with status ${pr.status}` };
  }

  if (pr.requestedBy !== userId) {
    return { success: false, error: 'Only the requester can cancel a purchase requisition' };
  }

  await prisma.purchaseRequisition.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });

  return { success: true };
}
