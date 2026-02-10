import { Prisma, Warehouse, PackingListStatus, PackageType } from '@prisma/client';
import { prisma } from '../config/database';
import type {
  CreatePackingListInput,
  PackingListListQuery,
} from '../utils/validation/packing-lists';
import { generatePackingListNumber } from '../utils/number-generation';

// ============================================
// TYPES
// ============================================

export interface PackingListData {
  id: string;
  packingListNumber: string;
  companyId: string;
  orderId: string;
  orderNumber: string;
  deliveryNoteId: string | null;
  deliveryNoteNumber: string | null;
  customerName: string;
  location: Warehouse;
  status: PackingListStatus;
  finalizedAt: Date | null;
  finalizedBy: string | null;
  finalizedByName: string | null;
  handlingInstructions: string | null;
  notes: string | null;
  lines: PackingListLineData[];
  packages: PackingListPackageData[];
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
}

export interface PackingListLineData {
  id: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  unitOfMeasure: string;
  quantity: number;
  packageNumber: number;
}

export interface PackingListPackageData {
  id: string;
  packageNumber: number;
  packageType: PackageType;
  length: number | null;
  width: number | null;
  height: number | null;
  grossWeight: number | null;
  netWeight: number | null;
  notes: string | null;
}

export interface PackingListSummary {
  id: string;
  packingListNumber: string;
  orderNumber: string;
  orderId: string;
  customerName: string;
  location: Warehouse;
  status: PackingListStatus;
  packageCount: number;
  lineCount: number;
  createdAt: Date;
}

// ============================================
// NUMBER GENERATION
// ============================================

/**
 * Generate the next packing list number in format PL-YYYY-NNNNN
 */

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Create a packing list from a sales order.
 * Lines and packages are provided by the caller.
 */
export async function createPackingList(
  orderId: string,
  input: CreatePackingListInput,
  userId: string,
  companyId: string
): Promise<{ success: boolean; packingList?: { id: string; packingListNumber: string }; error?: string }> {
  // Validate the order exists and is in a valid state
  const order = await prisma.salesOrder.findFirst({
    where: {
      id: orderId,
      companyId,
      deletedAt: null,
    },
    include: {
      company: { select: { name: true } },
    },
  });

  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  const validStatuses = ['READY_TO_SHIP', 'PARTIALLY_SHIPPED', 'SHIPPED'];
  if (!validStatuses.includes(order.status)) {
    return {
      success: false,
      error: `Cannot create packing list for an order with status ${order.status}. Order must be Ready to Ship, Partially Shipped, or Shipped.`,
    };
  }

  // If deliveryNoteId provided, validate it belongs to the same order
  let deliveryNoteNumber: string | null = null;
  if (input.deliveryNoteId) {
    const dn = await prisma.deliveryNote.findFirst({
      where: { id: input.deliveryNoteId, orderId, companyId },
      select: { deliveryNoteNumber: true },
    });
    if (!dn) {
      return { success: false, error: 'Delivery note not found or does not belong to this order' };
    }
    deliveryNoteNumber = dn.deliveryNoteNumber;
  }

  const packingListNumber = await generatePackingListNumber();
  const location = input.location || order.warehouse;

  const packingList = await prisma.$transaction(async (tx) => {
    const pl = await tx.packingList.create({
      data: {
        packingListNumber,
        companyId,
        orderId,
        orderNumber: order.orderNumber,
        deliveryNoteId: input.deliveryNoteId || null,
        deliveryNoteNumber,
        customerName: order.company.name,
        location,
        status: 'DRAFT',
        handlingInstructions: input.handlingInstructions || null,
        notes: input.notes || null,
        createdBy: userId,
      },
    });

    const lineData = input.lines.map((line, index) => ({
      packingListId: pl.id,
      lineNumber: index + 1,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      unitOfMeasure: line.unitOfMeasure,
      quantity: line.quantity,
      packageNumber: line.packageNumber,
    }));

    await tx.packingListLine.createMany({ data: lineData });

    const packageData = input.packages.map((pkg) => ({
      packingListId: pl.id,
      packageNumber: pkg.packageNumber,
      packageType: pkg.packageType || 'BOX',
      length: pkg.length ?? null,
      width: pkg.width ?? null,
      height: pkg.height ?? null,
      grossWeight: pkg.grossWeight ?? null,
      netWeight: pkg.netWeight ?? null,
      notes: pkg.notes || null,
    }));

    await tx.packingListPackage.createMany({ data: packageData });

    return pl;
  });

  return {
    success: true,
    packingList: {
      id: packingList.id,
      packingListNumber: packingList.packingListNumber,
    },
  };
}

/**
 * Get packing list by ID with lines and packages
 */
export async function getPackingListById(
  id: string,
  companyId: string
): Promise<PackingListData | null> {
  const pl = await prisma.packingList.findFirst({
    where: { id, companyId },
    include: {
      lines: { orderBy: { lineNumber: 'asc' } },
      packages: { orderBy: { packageNumber: 'asc' } },
    },
  });

  if (!pl) return null;

  return {
    id: pl.id,
    packingListNumber: pl.packingListNumber,
    companyId: pl.companyId,
    orderId: pl.orderId,
    orderNumber: pl.orderNumber,
    deliveryNoteId: pl.deliveryNoteId,
    deliveryNoteNumber: pl.deliveryNoteNumber,
    customerName: pl.customerName,
    location: pl.location,
    status: pl.status,
    finalizedAt: pl.finalizedAt,
    finalizedBy: pl.finalizedBy,
    finalizedByName: pl.finalizedByName,
    handlingInstructions: pl.handlingInstructions,
    notes: pl.notes,
    lines: pl.lines.map((line) => ({
      id: line.id,
      lineNumber: line.lineNumber,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      unitOfMeasure: line.unitOfMeasure,
      quantity: line.quantity,
      packageNumber: line.packageNumber,
    })),
    packages: pl.packages.map((pkg) => ({
      id: pkg.id,
      packageNumber: pkg.packageNumber,
      packageType: pkg.packageType,
      length: pkg.length ? Number(pkg.length) : null,
      width: pkg.width ? Number(pkg.width) : null,
      height: pkg.height ? Number(pkg.height) : null,
      grossWeight: pkg.grossWeight ? Number(pkg.grossWeight) : null,
      netWeight: pkg.netWeight ? Number(pkg.netWeight) : null,
      notes: pkg.notes,
    })),
    createdAt: pl.createdAt,
    createdBy: pl.createdBy,
    updatedAt: pl.updatedAt,
  };
}

/**
 * Get packing lists with filtering and pagination
 */
export async function getPackingLists(
  companyId: string,
  query: PackingListListQuery
): Promise<{
  packingLists: PackingListSummary[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}> {
  const { orderId, deliveryNoteId, status, location, search, page = 1, pageSize = 20 } = query;

  const where: Prisma.PackingListWhereInput = { companyId };

  if (orderId) where.orderId = orderId;
  if (deliveryNoteId) where.deliveryNoteId = deliveryNoteId;
  if (status) where.status = status;
  if (location) where.location = location;
  if (search) {
    where.OR = [
      { packingListNumber: { contains: search, mode: 'insensitive' } },
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, packingLists] = await Promise.all([
    prisma.packingList.count({ where }),
    prisma.packingList.findMany({
      where,
      include: {
        _count: { select: { lines: true, packages: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    packingLists: packingLists.map((pl) => ({
      id: pl.id,
      packingListNumber: pl.packingListNumber,
      orderNumber: pl.orderNumber,
      orderId: pl.orderId,
      customerName: pl.customerName,
      location: pl.location,
      status: pl.status,
      packageCount: pl._count.packages,
      lineCount: pl._count.lines,
      createdAt: pl.createdAt,
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
 * Get packing lists for a specific order (summary for order detail page)
 */
export async function getPackingListsForOrder(
  orderId: string,
  companyId: string
): Promise<Array<{
  id: string;
  packingListNumber: string;
  status: PackingListStatus;
  packageCount: number;
  lineCount: number;
  location: Warehouse;
  createdAt: Date;
}>> {
  const packingLists = await prisma.packingList.findMany({
    where: { orderId, companyId },
    include: { _count: { select: { lines: true, packages: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return packingLists.map((pl) => ({
    id: pl.id,
    packingListNumber: pl.packingListNumber,
    status: pl.status,
    packageCount: pl._count.packages,
    lineCount: pl._count.lines,
    location: pl.location,
    createdAt: pl.createdAt,
  }));
}

/**
 * Update a packing list (DRAFT only).
 * Replaces all lines and packages with new data.
 */
export async function updatePackingList(
  id: string,
  input: CreatePackingListInput,
  _userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const pl = await prisma.packingList.findFirst({
    where: { id, companyId },
  });

  if (!pl) {
    return { success: false, error: 'Packing list not found' };
  }

  if (pl.status !== 'DRAFT') {
    return { success: false, error: 'Only draft packing lists can be edited' };
  }

  // If deliveryNoteId provided, validate it
  let deliveryNoteNumber: string | null = pl.deliveryNoteNumber;
  if (input.deliveryNoteId && input.deliveryNoteId !== pl.deliveryNoteId) {
    const dn = await prisma.deliveryNote.findFirst({
      where: { id: input.deliveryNoteId, orderId: pl.orderId, companyId },
      select: { deliveryNoteNumber: true },
    });
    if (!dn) {
      return { success: false, error: 'Delivery note not found or does not belong to this order' };
    }
    deliveryNoteNumber = dn.deliveryNoteNumber;
  } else if (!input.deliveryNoteId) {
    deliveryNoteNumber = null;
  }

  await prisma.$transaction(async (tx) => {
    // Update packing list fields
    await tx.packingList.update({
      where: { id },
      data: {
        deliveryNoteId: input.deliveryNoteId || null,
        deliveryNoteNumber,
        location: input.location || pl.location,
        handlingInstructions: input.handlingInstructions || null,
        notes: input.notes || null,
      },
    });

    // Replace lines
    await tx.packingListLine.deleteMany({ where: { packingListId: id } });
    const lineData = input.lines.map((line, index) => ({
      packingListId: id,
      lineNumber: index + 1,
      productId: line.productId,
      productSku: line.productSku,
      productDescription: line.productDescription,
      unitOfMeasure: line.unitOfMeasure,
      quantity: line.quantity,
      packageNumber: line.packageNumber,
    }));
    await tx.packingListLine.createMany({ data: lineData });

    // Replace packages
    await tx.packingListPackage.deleteMany({ where: { packingListId: id } });
    const packageData = input.packages.map((pkg) => ({
      packingListId: id,
      packageNumber: pkg.packageNumber,
      packageType: pkg.packageType || 'BOX',
      length: pkg.length ?? null,
      width: pkg.width ?? null,
      height: pkg.height ?? null,
      grossWeight: pkg.grossWeight ?? null,
      netWeight: pkg.netWeight ?? null,
      notes: pkg.notes || null,
    }));
    await tx.packingListPackage.createMany({ data: packageData });
  });

  return { success: true };
}

/**
 * Finalize a packing list (DRAFT → FINALIZED).
 * Locks the packing list for PDF generation and dispatch.
 */
export async function finalizePackingList(
  id: string,
  userId: string,
  userName: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const pl = await prisma.packingList.findFirst({
    where: { id, companyId },
  });

  if (!pl) {
    return { success: false, error: 'Packing list not found' };
  }

  if (pl.status !== 'DRAFT') {
    return { success: false, error: `Cannot finalize a packing list with status ${pl.status}` };
  }

  await prisma.packingList.update({
    where: { id },
    data: {
      status: 'FINALIZED',
      finalizedAt: new Date(),
      finalizedBy: userId,
      finalizedByName: userName,
    },
  });

  return { success: true };
}

/**
 * Cancel a packing list (DRAFT or FINALIZED → CANCELLED).
 */
export async function cancelPackingList(
  id: string,
  _userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const pl = await prisma.packingList.findFirst({
    where: { id, companyId },
  });

  if (!pl) {
    return { success: false, error: 'Packing list not found' };
  }

  if (pl.status === 'CANCELLED') {
    return { success: false, error: 'Packing list is already cancelled' };
  }

  await prisma.packingList.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  return { success: true };
}
