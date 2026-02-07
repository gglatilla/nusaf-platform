'use client';

import Link from 'next/link';
import { AlertTriangle, Clock, Pause, Package } from 'lucide-react';
import type { FulfillmentDashboardData } from '@/lib/api';

interface ExceptionAlertsSectionProps {
  data: FulfillmentDashboardData['exceptions'];
}

interface AlertCardProps {
  icon: React.ElementType;
  label: string;
  count: number;
  href: string;
  color: string;
  bgColor: string;
}

function AlertCard({ icon: Icon, label, count, href, color, bgColor }: AlertCardProps) {
  if (count === 0) return null;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-3 rounded-lg ${bgColor} hover:opacity-80 transition-opacity`}
    >
      <Icon className={`h-5 w-5 ${color}`} />
      <div>
        <p className={`text-sm font-medium ${color}`}>{count} {label}</p>
      </div>
    </Link>
  );
}

export function ExceptionAlertsSection({ data }: ExceptionAlertsSectionProps) {
  const totalCount = data.overduePOs + data.stalledJobCards + data.onHoldOrders;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className={`h-5 w-5 ${totalCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
        <h2 className="text-lg font-semibold text-slate-900">Exceptions</h2>
        {totalCount > 0 && (
          <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {totalCount}
          </span>
        )}
      </div>

      {totalCount === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No exceptions - all clear</p>
      ) : (
        <div className="space-y-2">
          <AlertCard
            icon={Package}
            label="overdue purchase orders"
            count={data.overduePOs}
            href="/purchase-orders"
            color="text-red-700"
            bgColor="bg-red-50"
          />
          <AlertCard
            icon={Clock}
            label="stalled job cards (on hold 48h+)"
            count={data.stalledJobCards}
            href="/job-cards"
            color="text-amber-700"
            bgColor="bg-amber-50"
          />
          <AlertCard
            icon={Pause}
            label="orders on hold"
            count={data.onHoldOrders}
            href="/orders?status=ON_HOLD"
            color="text-orange-700"
            bgColor="bg-orange-50"
          />
        </div>
      )}
    </div>
  );
}
