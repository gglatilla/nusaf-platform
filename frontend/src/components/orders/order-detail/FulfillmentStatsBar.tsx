'use client';

import type { SalesOrderLine } from '@/lib/api/types/orders';

interface FulfillmentStatsBarProps {
  lines: SalesOrderLine[];
}

export function FulfillmentStatsBar({ lines }: FulfillmentStatsBarProps) {
  const totalLines = lines.length;
  const totalOrdered = lines.reduce((sum, l) => sum + l.quantityOrdered, 0);
  const totalPicked = lines.reduce((sum, l) => sum + l.quantityPicked, 0);
  const totalShipped = lines.reduce((sum, l) => sum + l.quantityShipped, 0);
  const totalBackorder = lines.reduce((sum, l) => sum + l.quantityBackorder, 0);
  const linesDelivered = lines.filter((l) => l.status === 'DELIVERED').length;

  const pickedPct = totalOrdered > 0 ? Math.round((totalPicked / totalOrdered) * 100) : 0;
  const shippedPct = totalOrdered > 0 ? Math.round((totalShipped / totalOrdered) * 100) : 0;
  const deliveredPct = totalLines > 0 ? Math.round((linesDelivered / totalLines) * 100) : 0;
  const backorderPct = totalOrdered > 0 ? Math.round((totalBackorder / totalOrdered) * 100) : 0;

  const hasBackorders = totalBackorder > 0;

  const stats = [
    {
      label: 'Lines',
      value: totalLines.toString(),
      sub: `${totalOrdered} units total`,
      color: 'text-slate-900',
      barColor: 'bg-slate-400',
      pct: 100,
    },
    {
      label: 'Picked',
      value: `${totalPicked}/${totalOrdered}`,
      sub: `${pickedPct}%`,
      color: totalPicked === totalOrdered && totalOrdered > 0 ? 'text-green-700' : 'text-blue-700',
      barColor: totalPicked === totalOrdered && totalOrdered > 0 ? 'bg-green-500' : 'bg-blue-500',
      pct: pickedPct,
    },
    {
      label: 'Shipped',
      value: `${totalShipped}/${totalOrdered}`,
      sub: `${shippedPct}%`,
      color: totalShipped === totalOrdered && totalOrdered > 0 ? 'text-green-700' : 'text-indigo-700',
      barColor: totalShipped === totalOrdered && totalOrdered > 0 ? 'bg-green-500' : 'bg-indigo-500',
      pct: shippedPct,
    },
    {
      label: 'Delivered',
      value: `${linesDelivered}/${totalLines}`,
      sub: `${deliveredPct}% of lines`,
      color: linesDelivered === totalLines && totalLines > 0 ? 'text-green-700' : 'text-purple-700',
      barColor: linesDelivered === totalLines && totalLines > 0 ? 'bg-green-500' : 'bg-purple-500',
      pct: deliveredPct,
    },
  ];

  if (hasBackorders) {
    stats.push({
      label: 'Backordered',
      value: `${totalBackorder}/${totalOrdered}`,
      sub: `${backorderPct}%`,
      color: 'text-amber-700',
      barColor: 'bg-amber-500',
      pct: backorderPct,
    });
  }

  return (
    <div className={`grid grid-cols-2 gap-4 ${hasBackorders ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-lg border border-slate-200 p-4 relative overflow-hidden"
        >
          <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
          <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
          {/* Progress bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
            <div
              className={`h-full ${stat.barColor} transition-all`}
              style={{ width: `${stat.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
