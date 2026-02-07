import { prisma } from '../config/database';
import { Warehouse } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface WarehouseStockSummary {
  location: Warehouse;
  totalSKUs: number;
  totalOnHand: number;
  totalAvailable: number;
  totalOnOrder: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface LowStockAlertItem {
  productId: string;
  nusafSku: string;
  description: string;
  location: Warehouse;
  onHand: number;
  available: number;
  reorderPoint: number;
  shortfall: number;
}

export interface PendingAdjustmentItem {
  id: string;
  adjustmentNumber: string;
  location: Warehouse;
  reason: string;
  lineCount: number;
  createdAt: Date;
  createdByName: string | null;
}

export interface ActiveCycleCountItem {
  id: string;
  sessionNumber: string;
  location: Warehouse;
  status: string;
  totalLines: number;
  countedLines: number;
  createdAt: Date;
}

export interface RecentMovementItem {
  id: string;
  productSku: string;
  productDescription: string;
  location: Warehouse;
  movementType: string;
  quantity: number;
  referenceNumber: string | null;
  referenceType: string | null;
  createdAt: Date;
}

export interface InventoryDashboardData {
  summary: {
    totalSKUs: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    pendingAdjustments: number;
    activeCycleCounts: number;
    movementsToday: number;
  };
  warehouseBreakdown: WarehouseStockSummary[];
  lowStockAlerts: {
    count: number;
    items: LowStockAlertItem[];
  };
  pendingAdjustments: {
    count: number;
    items: PendingAdjustmentItem[];
  };
  activeCycleCounts: {
    count: number;
    items: ActiveCycleCountItem[];
  };
  recentMovements: {
    todayCount: number;
    items: RecentMovementItem[];
  };
}

// ============================================
// SERVICE
// ============================================

const RECENT_ITEMS_LIMIT = 5;
const RECENT_MOVEMENTS_LIMIT = 10;
const LOW_STOCK_ALERTS_LIMIT = 10;

export async function getInventoryDashboard(): Promise<InventoryDashboardData> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Run all queries in parallel (split into two groups for TS inference)
  const [jhbStockLevels, ctStockLevels, pendingAdjCount, pendingAdjRecent] = await Promise.all([
    prisma.stockLevel.findMany({
      where: { location: 'JHB' },
      include: {
        product: {
          select: { id: true, nusafSku: true, description: true, costPrice: true },
        },
      },
    }),
    prisma.stockLevel.findMany({
      where: { location: 'CT' },
      include: {
        product: {
          select: { id: true, nusafSku: true, description: true, costPrice: true },
        },
      },
    }),
    prisma.stockAdjustment.count({
      where: { status: 'PENDING' },
    }),
    prisma.stockAdjustment.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ITEMS_LIMIT,
      include: {
        _count: { select: { lines: true } },
      },
    }),
  ]);

  const [activeCycleCount, activeCycleRecent, movementsTodayCount, recentMovements] = await Promise.all([
    prisma.cycleCountSession.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS', 'COMPLETED'] } },
    }),
    prisma.cycleCountSession.findMany({
      where: { status: { in: ['OPEN', 'IN_PROGRESS', 'COMPLETED'] } },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ITEMS_LIMIT,
      include: {
        lines: {
          select: { id: true, countedQuantity: true },
        },
      },
    }),
    prisma.stockMovement.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: RECENT_MOVEMENTS_LIMIT,
      include: {
        product: {
          select: { nusafSku: true, description: true },
        },
      },
    }),
  ]);

  // Process warehouse data
  const jhbSummary = computeWarehouseSummary('JHB', jhbStockLevels);
  const ctSummary = computeWarehouseSummary('CT', ctStockLevels);

  // Compute total stock value
  const totalStockValue = computeStockValue(jhbStockLevels) + computeStockValue(ctStockLevels);

  // Collect unique SKUs
  const uniqueProductIds = new Set<string>();
  for (const sl of jhbStockLevels) uniqueProductIds.add(sl.productId);
  for (const sl of ctStockLevels) uniqueProductIds.add(sl.productId);

  // Build low stock alerts (sorted by shortfall severity)
  const lowStockAlerts = buildLowStockAlerts([...jhbStockLevels, ...ctStockLevels]);

  // Resolve creator names for pending adjustments
  const creatorIds = pendingAdjRecent
    .map((a) => a.createdBy)
    .filter(Boolean);
  const creators = creatorIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, firstName: true, lastName: true },
      })
    : [];
  const creatorMap = new Map(creators.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

  return {
    summary: {
      totalSKUs: uniqueProductIds.size,
      totalStockValue,
      lowStockCount: jhbSummary.lowStockCount + ctSummary.lowStockCount,
      outOfStockCount: jhbSummary.outOfStockCount + ctSummary.outOfStockCount,
      pendingAdjustments: pendingAdjCount,
      activeCycleCounts: activeCycleCount,
      movementsToday: movementsTodayCount,
    },
    warehouseBreakdown: [jhbSummary, ctSummary],
    lowStockAlerts: {
      count: jhbSummary.lowStockCount + ctSummary.lowStockCount,
      items: lowStockAlerts,
    },
    pendingAdjustments: {
      count: pendingAdjCount,
      items: pendingAdjRecent.map((a) => ({
        id: a.id,
        adjustmentNumber: a.adjustmentNumber,
        location: a.location,
        reason: a.reason,
        lineCount: a._count.lines,
        createdAt: a.createdAt,
        createdByName: creatorMap.get(a.createdBy) ?? null,
      })),
    },
    activeCycleCounts: {
      count: activeCycleCount,
      items: activeCycleRecent.map((s) => ({
        id: s.id,
        sessionNumber: s.sessionNumber,
        location: s.location,
        status: s.status,
        totalLines: s.lines.length,
        countedLines: s.lines.filter((l) => l.countedQuantity !== null).length,
        createdAt: s.createdAt,
      })),
    },
    recentMovements: {
      todayCount: movementsTodayCount,
      items: recentMovements.map((m) => ({
        id: m.id,
        productSku: m.product.nusafSku,
        productDescription: m.product.description,
        location: m.location,
        movementType: m.movementType,
        quantity: m.quantity,
        referenceNumber: m.referenceNumber,
        referenceType: m.referenceType,
        createdAt: m.createdAt,
      })),
    },
  };
}

// ============================================
// HELPERS
// ============================================

interface StockLevelWithProduct {
  productId: string;
  location: Warehouse;
  onHand: number;
  softReserved: number;
  hardReserved: number;
  onOrder: number;
  reorderPoint: number | null;
  product: {
    id: string;
    nusafSku: string;
    description: string;
    costPrice: unknown; // Prisma Decimal
  };
}

function computeWarehouseSummary(location: Warehouse, levels: StockLevelWithProduct[]): WarehouseStockSummary {
  let totalOnHand = 0;
  let totalAvailable = 0;
  let totalOnOrder = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const sl of levels) {
    const available = sl.onHand - sl.hardReserved;
    totalOnHand += sl.onHand;
    totalAvailable += Math.max(0, available);
    totalOnOrder += sl.onOrder;

    if (sl.onHand === 0) {
      outOfStockCount++;
    } else if (sl.reorderPoint !== null && sl.onHand <= sl.reorderPoint) {
      lowStockCount++;
    }
  }

  return {
    location,
    totalSKUs: levels.length,
    totalOnHand,
    totalAvailable,
    totalOnOrder,
    lowStockCount,
    outOfStockCount,
  };
}

function computeStockValue(levels: StockLevelWithProduct[]): number {
  let total = 0;
  for (const sl of levels) {
    const cost = sl.product.costPrice ? Number(sl.product.costPrice) : 0;
    total += sl.onHand * cost;
  }
  return Math.round(total * 100) / 100;
}

function buildLowStockAlerts(levels: StockLevelWithProduct[]): LowStockAlertItem[] {
  const alerts: LowStockAlertItem[] = [];

  for (const sl of levels) {
    if (sl.reorderPoint === null) continue;
    const available = Math.max(0, sl.onHand - sl.hardReserved);
    if (available <= sl.reorderPoint) {
      alerts.push({
        productId: sl.product.id,
        nusafSku: sl.product.nusafSku,
        description: sl.product.description,
        location: sl.location,
        onHand: sl.onHand,
        available,
        reorderPoint: sl.reorderPoint,
        shortfall: sl.reorderPoint - available,
      });
    }
  }

  // Sort by shortfall descending (most critical first)
  alerts.sort((a, b) => b.shortfall - a.shortfall);

  return alerts.slice(0, LOW_STOCK_ALERTS_LIMIT);
}
