'use client';

import Link from 'next/link';
import type { StockMovement } from '@/lib/api/types/products';

interface AuditLogTabProps {
  movements: StockMovement[];
}

const MOVEMENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  RECEIPT: { label: 'Receipt', color: 'bg-green-100 text-green-700' },
  ISSUE: { label: 'Issue', color: 'bg-red-100 text-red-700' },
  TRANSFER_OUT: { label: 'Transfer Out', color: 'bg-amber-100 text-amber-700' },
  TRANSFER_IN: { label: 'Transfer In', color: 'bg-blue-100 text-blue-700' },
  MANUFACTURE_IN: { label: 'Manufacture In', color: 'bg-emerald-100 text-emerald-700' },
  MANUFACTURE_OUT: { label: 'Manufacture Out', color: 'bg-orange-100 text-orange-700' },
  ADJUSTMENT_IN: { label: 'Adjustment In', color: 'bg-cyan-100 text-cyan-700' },
  ADJUSTMENT_OUT: { label: 'Adjustment Out', color: 'bg-pink-100 text-pink-700' },
  SCRAP: { label: 'Scrap', color: 'bg-slate-100 text-slate-700' },
};

const REFERENCE_TYPE_ROUTES: Record<string, string> = {
  GoodsReceivedVoucher: '/goods-receipts',
  PurchaseOrder: '/purchase-orders',
  SalesOrder: '/orders',
  PickingSlip: '/picking-slips',
  TransferRequest: '/transfer-requests',
  JobCard: '/job-cards',
  StockAdjustment: '/inventory',
};

const formatDateTime = (dateString: string) => {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

export function AuditLogTab({ movements }: AuditLogTabProps) {
  if (!movements.length) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-sm text-slate-500">No audit log entries found for this product.</p>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Audit Log</h2>
      <div className="space-y-0">
        {movements.map((movement, index) => {
          const config = MOVEMENT_TYPE_CONFIG[movement.type] || { label: movement.type, color: 'bg-slate-100 text-slate-700' };
          const route = movement.referenceType ? REFERENCE_TYPE_ROUTES[movement.referenceType] : null;
          const isPositive = ['RECEIPT', 'TRANSFER_IN', 'MANUFACTURE_IN', 'ADJUSTMENT_IN'].includes(movement.type);

          return (
            <div
              key={movement.id}
              className={`flex items-start gap-4 py-3 ${index < movements.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              {/* Timeline dot */}
              <div className="flex-shrink-0 mt-1">
                <div className={`w-2.5 h-2.5 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${config.color}`}>
                    {config.label}
                  </span>
                  <span className={`text-sm font-medium ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                    {isPositive ? '+' : '-'}{Math.abs(movement.quantity)}
                  </span>
                  <span className="text-xs text-slate-400">{movement.warehouseName}</span>
                </div>

                {/* Reference link */}
                {movement.referenceType && movement.referenceId && route && (
                  <div className="mt-1">
                    <Link
                      href={`${route}/${movement.referenceId}`}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      {movement.referenceType.replace(/([A-Z])/g, ' $1').trim()} →
                    </Link>
                  </div>
                )}

                {movement.notes && (
                  <p className="text-xs text-slate-500 mt-1">{movement.notes}</p>
                )}
              </div>

              {/* Timestamp */}
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-slate-400">{formatDateTime(movement.createdAt)}</p>
                {movement.createdBy && (
                  <p className="text-xs text-slate-400">{movement.createdBy}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
