import { QuoteStatus, SalesOrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

// ============================================
// RESPONSE TYPES
// ============================================

export interface SalesReportSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  quoteConversionRate: number;
  totalQuotes: number;
  pendingFulfillment: number;
}

export interface RevenueOverTimeEntry {
  period: string;
  revenue: number;
  orderCount: number;
}

export interface QuotePipeline {
  created: number;
  accepted: number;
  converted: number;
  rejected: number;
  expired: number;
}

export interface TopCustomerEntry {
  companyId: string;
  companyName: string;
  tier: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

export interface TopProductEntry {
  productId: string;
  sku: string;
  description: string;
  quantitySold: number;
  revenue: number;
}

export interface RevenueByTierEntry {
  tier: string;
  revenue: number;
  orderCount: number;
  percentage: number;
}

export interface SalesReportData {
  summary: SalesReportSummary;
  revenueOverTime: RevenueOverTimeEntry[];
  quotePipeline: QuotePipeline;
  topCustomers: TopCustomerEntry[];
  topProducts: TopProductEntry[];
  revenueByTier: RevenueByTierEntry[];
}

// ============================================
// HELPERS
// ============================================

const EXCLUDED_ORDER_STATUSES: SalesOrderStatus[] = ['DRAFT', 'CANCELLED'];
const PENDING_FULFILLMENT_STATUSES: SalesOrderStatus[] = ['CONFIRMED', 'PROCESSING', 'READY_TO_SHIP'];
const TOP_LIMIT = 10;

/** Build the base WHERE for orders within the date range */
function buildOrderWhere(startDate?: Date, endDate?: Date): Prisma.SalesOrderWhereInput {
  const where: Prisma.SalesOrderWhereInput = {
    status: { notIn: EXCLUDED_ORDER_STATUSES },
    deletedAt: null,
  };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Prisma.DateTimeFilter).gte = startDate;
    if (endDate) (where.createdAt as Prisma.DateTimeFilter).lte = endDate;
  }
  return where;
}

/** Build the base WHERE for quotes within the date range */
function buildQuoteWhere(status: QuoteStatus, startDate?: Date, endDate?: Date): Prisma.QuoteWhereInput {
  const where: Prisma.QuoteWhereInput = {
    status,
    deletedAt: null,
  };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Prisma.DateTimeFilter).gte = startDate;
    if (endDate) (where.createdAt as Prisma.DateTimeFilter).lte = endDate;
  }
  return where;
}

/** Determine grouping interval based on date range span */
function getGroupingInterval(startDate?: Date, endDate?: Date): 'day' | 'week' | 'month' {
  if (!startDate) return 'month';
  const end = endDate || new Date();
  const diffDays = Math.ceil((end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 31) return 'day';
  if (diffDays <= 120) return 'week';
  return 'month';
}

/** Get the period key for a date based on the grouping interval */
function getPeriodKey(date: Date, interval: 'day' | 'week' | 'month'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (interval) {
    case 'day':
      return `${year}-${month}-${day}`;
    case 'week': {
      // Use Monday of the week as the period key
      const d = new Date(date);
      const dayOfWeek = d.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1
      d.setDate(d.getDate() + diff);
      const wYear = d.getFullYear();
      const wMonth = String(d.getMonth() + 1).padStart(2, '0');
      const wDay = String(d.getDate()).padStart(2, '0');
      return `${wYear}-${wMonth}-${wDay}`;
    }
    case 'month':
      return `${year}-${month}`;
  }
}

/** Group raw order data into time periods */
function groupRevenueByPeriod(
  orders: Array<{ createdAt: Date; total: Prisma.Decimal }>,
  interval: 'day' | 'week' | 'month'
): RevenueOverTimeEntry[] {
  const map = new Map<string, { revenue: number; orderCount: number }>();

  for (const order of orders) {
    const key = getPeriodKey(order.createdAt, interval);
    const existing = map.get(key) || { revenue: 0, orderCount: 0 };
    existing.revenue += Number(order.total);
    existing.orderCount += 1;
    map.set(key, existing);
  }

  // Sort by period key (chronological)
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => ({
      period,
      revenue: Math.round(data.revenue * 100) / 100,
      orderCount: data.orderCount,
    }));
}

// ============================================
// MAIN SERVICE
// ============================================

/**
 * Get comprehensive sales report data for a date range.
 * Runs all queries in parallel for performance.
 */
export async function getSalesReport(startDate?: Date, endDate?: Date): Promise<SalesReportData> {
  const orderWhere = buildOrderWhere(startDate, endDate);
  const interval = getGroupingInterval(startDate, endDate);

  const [
    // 1. Order aggregate (count + revenue sum)
    orderAggregate,
    // 2. Quote pipeline counts
    quotesCreated,
    quotesAccepted,
    quotesConverted,
    quotesRejected,
    quotesExpired,
    // 3. Pending fulfillment count
    pendingFulfillment,
    // 4. Raw orders for revenue-over-time grouping
    ordersForTimeSeries,
    // 5. Top customers via groupBy
    customerGroups,
    // 6. Top products via groupBy
    productGroups,
    // 7. Orders with company tier for tier breakdown
    ordersWithTier,
  ] = await Promise.all([
    // 1. Order aggregate
    prisma.salesOrder.aggregate({
      where: orderWhere,
      _count: true,
      _sum: { total: true },
    }),

    // 2. Quote pipeline
    prisma.quote.count({ where: buildQuoteWhere('CREATED', startDate, endDate) }),
    prisma.quote.count({ where: buildQuoteWhere('ACCEPTED', startDate, endDate) }),
    prisma.quote.count({ where: buildQuoteWhere('CONVERTED', startDate, endDate) }),
    prisma.quote.count({ where: buildQuoteWhere('REJECTED', startDate, endDate) }),
    prisma.quote.count({ where: buildQuoteWhere('EXPIRED', startDate, endDate) }),

    // 3. Pending fulfillment (current, not date-filtered)
    prisma.salesOrder.count({
      where: {
        status: { in: PENDING_FULFILLMENT_STATUSES },
        deletedAt: null,
      },
    }),

    // 4. Raw orders for time series
    prisma.salesOrder.findMany({
      where: orderWhere,
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    }),

    // 5. Top customers
    prisma.salesOrder.groupBy({
      by: ['companyId'],
      where: orderWhere,
      _count: true,
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: TOP_LIMIT,
    }),

    // 6. Top products
    prisma.salesOrderLine.groupBy({
      by: ['productId', 'productSku', 'productDescription'],
      where: {
        order: orderWhere,
      },
      _sum: { lineTotal: true, quantityOrdered: true },
      orderBy: { _sum: { lineTotal: 'desc' } },
      take: TOP_LIMIT,
    }),

    // 7. Orders with tier
    prisma.salesOrder.findMany({
      where: orderWhere,
      select: {
        total: true,
        company: { select: { tier: true } },
      },
    }),
  ]);

  // --- Resolve company names for top customers ---
  const companyIds = customerGroups.map((g) => g.companyId);
  const companies = companyIds.length > 0
    ? await prisma.company.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, name: true, tradingName: true, tier: true },
      })
    : [];
  const companyMap = new Map(companies.map((c) => [c.id, c]));

  // --- Build summary ---
  const totalOrders = orderAggregate._count;
  const totalRevenue = Number(orderAggregate._sum.total || 0);
  const averageOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

  // Conversion rate: CONVERTED / (CREATED + ACCEPTED + CONVERTED + REJECTED + EXPIRED) * 100
  const totalFinalized = quotesCreated + quotesAccepted + quotesConverted + quotesRejected + quotesExpired;
  const quoteConversionRate = totalFinalized > 0
    ? Math.round((quotesConverted / totalFinalized) * 1000) / 10
    : 0;
  const totalQuotes = totalFinalized;

  // --- Build revenue over time ---
  const revenueOverTime = groupRevenueByPeriod(ordersForTimeSeries, interval);

  // --- Build quote pipeline ---
  const quotePipeline: QuotePipeline = {
    created: quotesCreated,
    accepted: quotesAccepted,
    converted: quotesConverted,
    rejected: quotesRejected,
    expired: quotesExpired,
  };

  // --- Build top customers ---
  const topCustomers: TopCustomerEntry[] = customerGroups.map((g) => {
    const company = companyMap.get(g.companyId);
    const revenue = Number(g._sum.total || 0);
    const count = g._count;
    return {
      companyId: g.companyId,
      companyName: company?.tradingName || company?.name || 'Unknown',
      tier: company?.tier || 'END_USER',
      orderCount: count,
      revenue: Math.round(revenue * 100) / 100,
      averageOrderValue: count > 0 ? Math.round((revenue / count) * 100) / 100 : 0,
    };
  });

  // --- Build top products ---
  const topProducts: TopProductEntry[] = productGroups.map((g) => ({
    productId: g.productId,
    sku: g.productSku,
    description: g.productDescription,
    quantitySold: Number(g._sum.quantityOrdered || 0),
    revenue: Math.round(Number(g._sum.lineTotal || 0) * 100) / 100,
  }));

  // --- Build revenue by tier ---
  const tierMap = new Map<string, { revenue: number; orderCount: number }>();
  for (const order of ordersWithTier) {
    const tier = order.company?.tier || 'END_USER';
    const existing = tierMap.get(tier) || { revenue: 0, orderCount: 0 };
    existing.revenue += Number(order.total);
    existing.orderCount += 1;
    tierMap.set(tier, existing);
  }
  const tierTotalRevenue = Array.from(tierMap.values()).reduce((sum, t) => sum + t.revenue, 0);
  const revenueByTier: RevenueByTierEntry[] = Array.from(tierMap.entries()).map(([tier, data]) => ({
    tier,
    revenue: Math.round(data.revenue * 100) / 100,
    orderCount: data.orderCount,
    percentage: tierTotalRevenue > 0 ? Math.round((data.revenue / tierTotalRevenue) * 1000) / 10 : 0,
  }));

  return {
    summary: {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue,
      quoteConversionRate,
      totalQuotes,
      pendingFulfillment,
    },
    revenueOverTime,
    quotePipeline,
    topCustomers,
    topProducts,
    revenueByTier,
  };
}
