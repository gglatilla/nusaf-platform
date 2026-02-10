'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Target,
  FileText,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { PageHeader } from '@/components/layout/PageHeader';
import { useSalesReport } from '@/hooks/useReports';
import type {
  SalesReportData,
  RevenueByTierEntry,
} from '@/lib/api';
import { formatCurrency } from '@/lib/formatting';

// ============================================
// DATE RANGE PRESETS
// ============================================

const DATE_RANGE_PRESETS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
  { label: 'This year', value: 'this_year' },
  { label: 'All time', value: 'all' },
];

function getDateRangeParams(range: string): { startDate?: string; endDate?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case '7d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      return { startDate: start.toISOString() };
    }
    case '30d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      return { startDate: start.toISOString() };
    }
    case '90d': {
      const start = new Date(today);
      start.setDate(start.getDate() - 90);
      return { startDate: start.toISOString() };
    }
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: start.toISOString() };
    }
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case 'this_year': {
      const start = new Date(today.getFullYear(), 0, 1);
      return { startDate: start.toISOString() };
    }
    default:
      return {};
  }
}

// ============================================
// FORMATTERS
// ============================================

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-ZA').format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatPeriodLabel(period: string): string {
  // period is YYYY-MM-DD (day/week) or YYYY-MM (month)
  const parts = period.split('-');
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  }
  if (parts.length === 2) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    return d.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' });
  }
  return period;
}

// ============================================
// CONSTANTS
// ============================================

const TIER_COLORS: Record<string, string> = {
  END_USER: '#3b82f6',
  OEM_RESELLER: '#f59e0b',
  DISTRIBUTOR: '#10b981',
};

const TIER_LABELS: Record<string, string> = {
  END_USER: 'End User',
  OEM_RESELLER: 'OEM / Reseller',
  DISTRIBUTOR: 'Distributor',
};

const TIER_BADGE_CLASSES: Record<string, string> = {
  END_USER: 'bg-blue-100 text-blue-700',
  OEM_RESELLER: 'bg-amber-100 text-amber-700',
  DISTRIBUTOR: 'bg-emerald-100 text-emerald-700',
};

// ============================================
// SUMMARY CARDS
// ============================================

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

function MetricCard({ label, value, icon: Icon, color }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 truncate">{label}</p>
          <p className="text-lg font-semibold text-slate-900 truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// QUOTE PIPELINE
// ============================================

function QuotePipelineSection({ data }: { data: SalesReportData['quotePipeline'] }) {
  const total = data.created + data.accepted + data.converted + data.rejected + data.expired;
  const conversionPct = total > 0 ? ((data.converted / total) * 100).toFixed(1) : '0.0';
  const acceptancePct = total > 0 ? (((data.accepted + data.converted) / total) * 100).toFixed(1) : '0.0';

  const steps = [
    { label: 'Created', count: data.created, color: 'bg-blue-500' },
    { label: 'Accepted', count: data.accepted, color: 'bg-amber-500' },
    { label: 'Converted', count: data.converted, color: 'bg-emerald-500' },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Quote Pipeline</h3>

      {/* Funnel steps */}
      <div className="flex items-center gap-2 mb-4">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2 flex-1">
            <div className="flex-1 text-center">
              <div className={`${step.color} text-white rounded-lg py-3 px-2`}>
                <p className="text-xl font-bold">{step.count}</p>
                <p className="text-xs opacity-90">{step.label}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-3">
        <div className="flex items-center gap-4">
          <span className="text-slate-500">
            Rejected: <span className="font-medium text-red-600">{data.rejected}</span>
          </span>
          <span className="text-slate-500">
            Expired: <span className="font-medium text-slate-600">{data.expired}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-500">
            Acceptance: <span className="font-medium text-slate-900">{acceptancePct}%</span>
          </span>
          <span className="text-slate-500">
            Conversion: <span className="font-semibold text-emerald-600">{conversionPct}%</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// REVENUE CHART
// ============================================

function RevenueChart({ data }: { data: SalesReportData['revenueOverTime'] }) {
  const chartData = useMemo(
    () => data.map((d) => ({ ...d, label: formatPeriodLabel(d.period) })),
    [data]
  );

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 lg:col-span-2">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Revenue Over Time</h3>
        <div className="h-64 flex items-center justify-center text-sm text-slate-400">
          No order data for this period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 lg:col-span-2">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Revenue Over Time</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `R${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'Revenue']}
              labelStyle={{ color: '#1e293b', fontWeight: 600 }}
              contentStyle={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)',
              }}
            />
            <Bar dataKey="revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================
// TIER PIE CHART
// ============================================

function TierPieChart({ data }: { data: RevenueByTierEntry[] }) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        name: TIER_LABELS[d.tier] || d.tier,
        fill: TIER_COLORS[d.tier] || '#94a3b8',
      })),
    [data]
  );

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Revenue by Tier</h3>
        <div className="h-64 flex items-center justify-center text-sm text-slate-400">
          No data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Revenue by Tier</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={80}
              dataKey="revenue"
              nameKey="name"
              strokeWidth={2}
              stroke="#fff"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
              contentStyle={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)',
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: string, entry: any) => {
                const pct = entry.payload?.percentage ?? 0;
                return (
                  <span className="text-xs text-slate-600">
                    {value} ({pct.toFixed(1)}%)
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================
// TOP CUSTOMERS TABLE
// ============================================

function TopCustomersTable({ data }: { data: SalesReportData['topCustomers'] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Top Customers by Revenue</h3>
        <p className="text-sm text-slate-400">No customer data for this period</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Top Customers by Revenue</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 pr-2 font-medium text-slate-500 w-8">#</th>
              <th className="text-left py-2 pr-4 font-medium text-slate-500">Company</th>
              <th className="text-left py-2 pr-4 font-medium text-slate-500">Tier</th>
              <th className="text-right py-2 pr-4 font-medium text-slate-500">Orders</th>
              <th className="text-right py-2 pr-4 font-medium text-slate-500">Revenue</th>
              <th className="text-right py-2 font-medium text-slate-500">Avg Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((customer, i) => (
              <tr key={customer.companyId} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-2 text-slate-400">{i + 1}</td>
                <td className="py-2 pr-4 font-medium text-slate-900 truncate max-w-[200px]">
                  {customer.companyName}
                </td>
                <td className="py-2 pr-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TIER_BADGE_CLASSES[customer.tier] || 'bg-slate-100 text-slate-700'}`}>
                    {TIER_LABELS[customer.tier] || customer.tier}
                  </span>
                </td>
                <td className="py-2 pr-4 text-right text-slate-700">{customer.orderCount}</td>
                <td className="py-2 pr-4 text-right font-medium text-slate-900">{formatCurrency(customer.revenue)}</td>
                <td className="py-2 text-right text-slate-600">{formatCurrency(customer.averageOrderValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// TOP PRODUCTS TABLE
// ============================================

function TopProductsTable({ data }: { data: SalesReportData['topProducts'] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Top Products by Revenue</h3>
        <p className="text-sm text-slate-400">No product data for this period</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Top Products by Revenue</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 pr-2 font-medium text-slate-500 w-8">#</th>
              <th className="text-left py-2 pr-4 font-medium text-slate-500">SKU</th>
              <th className="text-left py-2 pr-4 font-medium text-slate-500">Description</th>
              <th className="text-right py-2 pr-4 font-medium text-slate-500">Qty Sold</th>
              <th className="text-right py-2 font-medium text-slate-500">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((product, i) => (
              <tr key={product.productId} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-2 text-slate-400">{i + 1}</td>
                <td className="py-2 pr-4">
                  <Link
                    href={`/inventory/items/${product.sku}`}
                    className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
                  >
                    {product.sku}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-slate-700 truncate max-w-[250px]">{product.description}</td>
                <td className="py-2 pr-4 text-right text-slate-700">{formatNumber(product.quantitySold)}</td>
                <td className="py-2 text-right font-medium text-slate-900">{formatCurrency(product.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function SalesReportsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const params = useMemo(() => getDateRangeParams(dateRange), [dateRange]);
  const { data, isLoading, error } = useSalesReport(params.startDate, params.endDate);

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Sales Reports"
        description="Revenue, quotes, and customer analytics"
        actions={
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {DATE_RANGE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        }
      />

      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            <span className="ml-2 text-sm text-slate-500">Loading report data...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center justify-center py-20 text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="text-sm">Failed to load report data. Please try again.</span>
          </div>
        )}

        {/* Data loaded */}
        {data && (
          <>
            {/* Summary metric cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <MetricCard
                label="Total Orders"
                value={formatNumber(data.summary.totalOrders)}
                icon={ShoppingCart}
                color="bg-blue-100 text-blue-600"
              />
              <MetricCard
                label="Total Revenue"
                value={formatCurrency(data.summary.totalRevenue)}
                icon={DollarSign}
                color="bg-emerald-100 text-emerald-600"
              />
              <MetricCard
                label="Avg Order Value"
                value={formatCurrency(data.summary.averageOrderValue)}
                icon={TrendingUp}
                color="bg-indigo-100 text-indigo-600"
              />
              <MetricCard
                label="Conversion Rate"
                value={formatPercent(data.summary.quoteConversionRate)}
                icon={Target}
                color="bg-amber-100 text-amber-600"
              />
              <MetricCard
                label="Total Quotes"
                value={formatNumber(data.summary.totalQuotes)}
                icon={FileText}
                color="bg-purple-100 text-purple-600"
              />
              <MetricCard
                label="Pending Fulfillment"
                value={formatNumber(data.summary.pendingFulfillment)}
                icon={Clock}
                color="bg-orange-100 text-orange-600"
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RevenueChart data={data.revenueOverTime} />
              <TierPieChart data={data.revenueByTier} />
            </div>

            {/* Quote pipeline */}
            <QuotePipelineSection data={data.quotePipeline} />

            {/* Tables row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopCustomersTable data={data.topCustomers} />
              <TopProductsTable data={data.topProducts} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
