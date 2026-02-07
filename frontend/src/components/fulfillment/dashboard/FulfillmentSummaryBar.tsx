'use client';

import {
  ClipboardList,
  Wrench,
  Truck,
  Package,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react';
import type { FulfillmentDashboardData } from '@/lib/api';

interface FulfillmentSummaryBarProps {
  data: FulfillmentDashboardData;
}

interface SummaryCardProps {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function SummaryCard({ label, count, icon: Icon, color, bgColor }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900">{count}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function FulfillmentSummaryBar({ data }: FulfillmentSummaryBarProps) {
  const totalPicking = data.pickingQueue.pendingCount + data.pickingQueue.inProgressCount;
  const totalJobs = data.jobCards.pendingCount + data.jobCards.inProgressCount + data.jobCards.onHoldCount;
  const totalTransfers = data.transfers.pendingCount + data.transfers.inTransitCount;
  const totalPOs = data.awaitingDelivery.sentCount + data.awaitingDelivery.acknowledgedCount + data.awaitingDelivery.partiallyReceivedCount;
  const totalExceptions = data.exceptions.overduePOs + data.exceptions.stalledJobCards + data.exceptions.onHoldOrders;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <SummaryCard
        label="Picking Queue"
        count={totalPicking}
        icon={ClipboardList}
        color="text-blue-600"
        bgColor="bg-blue-50"
      />
      <SummaryCard
        label="Active Jobs"
        count={totalJobs}
        icon={Wrench}
        color="text-purple-600"
        bgColor="bg-purple-50"
      />
      <SummaryCard
        label="Transfers"
        count={totalTransfers}
        icon={Truck}
        color="text-indigo-600"
        bgColor="bg-indigo-50"
      />
      <SummaryCard
        label="Awaiting Delivery"
        count={totalPOs}
        icon={Package}
        color="text-amber-600"
        bgColor="bg-amber-50"
      />
      <SummaryCard
        label="Ready to Ship"
        count={data.readyToShip.count}
        icon={ShoppingCart}
        color="text-green-600"
        bgColor="bg-green-50"
      />
      <SummaryCard
        label="Exceptions"
        count={totalExceptions}
        icon={AlertTriangle}
        color={totalExceptions > 0 ? 'text-red-600' : 'text-slate-400'}
        bgColor={totalExceptions > 0 ? 'bg-red-50' : 'bg-slate-50'}
      />
    </div>
  );
}
