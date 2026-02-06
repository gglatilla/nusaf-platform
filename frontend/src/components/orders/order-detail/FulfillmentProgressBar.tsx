'use client';

import type { SalesOrderLine, SalesOrderLineStatus } from '@/lib/api/types/orders';

interface FulfillmentProgressBarProps {
  lines: SalesOrderLine[];
}

const STATUS_CONFIG: Record<SalesOrderLineStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending', color: 'bg-slate-400', bgColor: 'bg-slate-100' },
  PICKING: { label: 'Picking', color: 'bg-amber-400', bgColor: 'bg-amber-50' },
  PICKED: { label: 'Picked', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
  SHIPPED: { label: 'Shipped', color: 'bg-indigo-500', bgColor: 'bg-indigo-50' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-500', bgColor: 'bg-green-50' },
};

export function FulfillmentProgressBar({ lines }: FulfillmentProgressBarProps) {
  const totalLines = lines.length;
  if (totalLines === 0) return null;

  const statusCounts: Record<SalesOrderLineStatus, number> = {
    PENDING: 0,
    PICKING: 0,
    PICKED: 0,
    SHIPPED: 0,
    DELIVERED: 0,
  };

  for (const line of lines) {
    if (line.status in statusCounts) {
      statusCounts[line.status]++;
    }
  }

  const segments = (Object.entries(statusCounts) as [SalesOrderLineStatus, number][])
    .filter(([, count]) => count > 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-500 mb-3">Line Status Breakdown</p>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
        {segments.map(([status, count]) => (
          <div
            key={status}
            className={`${STATUS_CONFIG[status].color} transition-all`}
            style={{ width: `${(count / totalLines) * 100}%` }}
            title={`${STATUS_CONFIG[status].label}: ${count} line${count !== 1 ? 's' : ''}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {segments.map(([status, count]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[status].color}`} />
            <span className="text-xs text-slate-600">
              {STATUS_CONFIG[status].label} ({count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
