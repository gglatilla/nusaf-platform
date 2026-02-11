import { Warehouse, PickingSlipStatus, JobCardStatus, JobType, TransferRequestStatus, PurchaseOrderStatus, SalesOrderStatus, SupplierCurrency } from '@prisma/client';
import { prisma } from '../config/database';

// ============================================
// RESPONSE TYPES
// ============================================

export interface PickingSlipSummaryItem {
  id: string;
  pickingSlipNumber: string;
  orderNumber: string;
  orderId: string;
  location: Warehouse;
  status: PickingSlipStatus;
  assignedToName: string | null;
  lineCount: number;
  createdAt: Date;
}

export interface JobCardSummaryItem {
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
}

export interface TransferSummaryItem {
  id: string;
  transferNumber: string;
  orderNumber: string | null;
  orderId: string | null;
  fromLocation: Warehouse;
  toLocation: Warehouse;
  status: TransferRequestStatus;
  lineCount: number;
  createdAt: Date;
}

export interface PurchaseOrderSummaryItem {
  id: string;
  poNumber: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  currency: SupplierCurrency;
  lineCount: number;
  total: number;
  expectedDate: Date | null;
  createdAt: Date;
}

export interface OrderSummaryItem {
  id: string;
  orderNumber: string;
  status: SalesOrderStatus;
  customerName: string | null;
  lineCount: number;
  total: number;
  createdAt: Date;
}

export interface FulfillmentDashboardData {
  pickingQueue: {
    pendingCount: number;
    inProgressCount: number;
    recentItems: PickingSlipSummaryItem[];
  };
  jobCards: {
    pendingCount: number;
    inProgressCount: number;
    onHoldCount: number;
    recentItems: JobCardSummaryItem[];
  };
  transfers: {
    pendingCount: number;
    inTransitCount: number;
    recentItems: TransferSummaryItem[];
  };
  awaitingDelivery: {
    sentCount: number;
    acknowledgedCount: number;
    partiallyReceivedCount: number;
    overdueCount: number;
    recentItems: PurchaseOrderSummaryItem[];
  };
  readyToShip: {
    count: number;
    recentItems: OrderSummaryItem[];
  };
  exceptions: {
    overduePOs: number;
    stalledJobCards: number;
    onHoldOrders: number;
  };
}

// ============================================
// DASHBOARD SERVICE
// ============================================

const RECENT_ITEMS_LIMIT = 5;
const STALLED_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Get aggregated fulfillment dashboard data.
 * When companyId is provided, scopes to that company (customer view).
 * When undefined, returns all data (staff view — route already restricts to staff roles).
 *
 * Note: PurchaseOrders are not company-scoped in the schema (they're global),
 * so PO queries never filter by companyId.
 */
export async function getFulfillmentDashboard(companyId?: string): Promise<FulfillmentDashboardData> {
  const now = new Date();
  const stalledThreshold = new Date(now.getTime() - STALLED_THRESHOLD_MS);
  const companyFilter = companyId ? { companyId } : {};

  const [
    // Picking slips (use snapshot fields — no relations needed)
    pickingPendingCount,
    pickingInProgressCount,
    recentPickingSlips,
    // Job cards (use snapshot fields)
    jobsPendingCount,
    jobsInProgressCount,
    jobsOnHoldCount,
    recentJobCards,
    // Transfers (use snapshot fields)
    transfersPendingCount,
    transfersInTransitCount,
    recentTransfers,
    // Purchase orders (no companyId — global)
    poSentCount,
    poAcknowledgedCount,
    poPartiallyReceivedCount,
    poOverdueCount,
    recentPOs,
    // Orders ready to ship
    readyToShipCount,
    recentReadyToShip,
    // Exceptions
    stalledJobCardsCount,
    onHoldOrdersCount,
  ] = await Promise.all([
    // --- Picking slips ---
    prisma.pickingSlip.count({ where: { ...companyFilter, status: 'PENDING' } }),
    prisma.pickingSlip.count({ where: { ...companyFilter, status: 'IN_PROGRESS' } }),
    prisma.pickingSlip.findMany({
      where: { ...companyFilter, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      include: { _count: { select: { lines: true } } },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ITEMS_LIMIT,
    }),

    // --- Job cards ---
    prisma.jobCard.count({ where: { ...companyFilter, status: 'PENDING' } }),
    prisma.jobCard.count({ where: { ...companyFilter, status: 'IN_PROGRESS' } }),
    prisma.jobCard.count({ where: { ...companyFilter, status: 'ON_HOLD' } }),
    prisma.jobCard.findMany({
      where: { ...companyFilter, status: { in: ['PENDING', 'IN_PROGRESS', 'ON_HOLD'] } },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ITEMS_LIMIT,
    }),

    // --- Transfer requests ---
    prisma.transferRequest.count({ where: { ...companyFilter, status: 'PENDING' } }),
    prisma.transferRequest.count({ where: { ...companyFilter, status: 'IN_TRANSIT' } }),
    prisma.transferRequest.findMany({
      where: { ...companyFilter, status: { in: ['PENDING', 'IN_TRANSIT'] } },
      include: { _count: { select: { lines: true } } },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ITEMS_LIMIT,
    }),

    // --- Purchase orders (no companyId filter) ---
    prisma.purchaseOrder.count({ where: { status: 'SENT' } }),
    prisma.purchaseOrder.count({ where: { status: 'ACKNOWLEDGED' } }),
    prisma.purchaseOrder.count({ where: { status: 'PARTIALLY_RECEIVED' } }),
    prisma.purchaseOrder.count({
      where: {
        status: { in: ['SENT', 'ACKNOWLEDGED'] },
        expectedDate: { lt: now },
      },
    }),
    prisma.purchaseOrder.findMany({
      where: { status: { in: ['SENT', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED'] } },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        _count: { select: { lines: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ITEMS_LIMIT,
    }),

    // --- Orders ready to ship ---
    prisma.salesOrder.count({ where: { ...companyFilter, status: 'READY_TO_SHIP', deletedAt: null } }),
    prisma.salesOrder.findMany({
      where: { ...companyFilter, status: 'READY_TO_SHIP', deletedAt: null },
      include: {
        company: { select: { tradingName: true, name: true } },
        _count: { select: { lines: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ITEMS_LIMIT,
    }),

    // --- Exceptions ---
    prisma.jobCard.count({
      where: { ...companyFilter, status: 'ON_HOLD', updatedAt: { lt: stalledThreshold } },
    }),
    prisma.salesOrder.count({
      where: { ...companyFilter, status: 'ON_HOLD', deletedAt: null },
    }),
  ]);

  return {
    pickingQueue: {
      pendingCount: pickingPendingCount,
      inProgressCount: pickingInProgressCount,
      recentItems: recentPickingSlips.map((ps) => ({
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
    },
    jobCards: {
      pendingCount: jobsPendingCount,
      inProgressCount: jobsInProgressCount,
      onHoldCount: jobsOnHoldCount,
      recentItems: recentJobCards.map((jc) => ({
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
    },
    transfers: {
      pendingCount: transfersPendingCount,
      inTransitCount: transfersInTransitCount,
      recentItems: recentTransfers.map((tr) => ({
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
    },
    awaitingDelivery: {
      sentCount: poSentCount,
      acknowledgedCount: poAcknowledgedCount,
      partiallyReceivedCount: poPartiallyReceivedCount,
      overdueCount: poOverdueCount,
      recentItems: recentPOs.map((po) => ({
        id: po.id,
        poNumber: po.poNumber,
        supplierName: po.supplier.name,
        status: po.status,
        currency: po.currency,
        lineCount: po._count.lines,
        total: Number(po.total),
        expectedDate: po.expectedDate,
        createdAt: po.createdAt,
      })),
    },
    readyToShip: {
      count: readyToShipCount,
      recentItems: recentReadyToShip.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        customerName: o.company?.tradingName ?? o.company?.name ?? null,
        lineCount: o._count.lines,
        total: Number(o.total),
        createdAt: o.createdAt,
      })),
    },
    exceptions: {
      overduePOs: poOverdueCount,
      stalledJobCards: stalledJobCardsCount,
      onHoldOrders: onHoldOrdersCount,
    },
  };
}
