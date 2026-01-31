'use client';

import type { StockMovement, StockMovementType } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StockMovementsTableProps {
  movements: StockMovement[];
  limit?: number;
}

const MOVEMENT_TYPE_CONFIG: Record<
  StockMovementType,
  { label: string; icon: string }
> = {
  RECEIPT: { label: 'Receipt', icon: '📥' },
  ISSUE: { label: 'Issue', icon: '📤' },
  TRANSFER_OUT: { label: 'Transfer Out', icon: '🔄' },
  TRANSFER_IN: { label: 'Transfer In', icon: '🔄' },
  MANUFACTURE_IN: { label: 'Manufacture In', icon: '🔧' },
  MANUFACTURE_OUT: { label: 'Manufacture Out', icon: '🔧' },
  ADJUSTMENT_IN: { label: 'Adjustment In', icon: '✏️' },
  ADJUSTMENT_OUT: { label: 'Adjustment Out', icon: '✏️' },
  SCRAP: { label: 'Scrap', icon: '🗑️' },
};

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

/**
 * Stock movements table showing recent inventory changes
 */
export function StockMovementsTable({
  movements,
  limit = 20,
}: StockMovementsTableProps) {
  const displayMovements = movements.slice(0, limit);

  if (displayMovements.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
        <p className="text-slate-500">No stock movements recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Recent Stock Movements</h2>
        <button
          type="button"
          className="text-sm text-primary-600 hover:text-primary-700"
          onClick={() => {
            // TODO: Link to full movements page (TASK-013D)
          }}
        >
          View All →
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-500 uppercase text-xs">
                Date
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-500 uppercase text-xs">
                Type
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-500 uppercase text-xs">
                Warehouse
              </th>
              <th className="text-right py-3 px-4 font-medium text-slate-500 uppercase text-xs">
                Qty
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-500 uppercase text-xs">
                Reference
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-500 uppercase text-xs">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {displayMovements.map((movement) => {
              const typeConfig = MOVEMENT_TYPE_CONFIG[movement.type] || {
                label: movement.type.replace(/_/g, ' '),
                icon: '•',
              };
              const isPositive = movement.quantity > 0;

              return (
                <tr
                  key={movement.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  {/* Date */}
                  <td className="py-3 px-4 text-slate-600">
                    {formatDate(movement.createdAt)}
                  </td>

                  {/* Type with icon */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5">
                      <span>{typeConfig.icon}</span>
                      <span className="text-slate-700">{typeConfig.label}</span>
                    </span>
                  </td>

                  {/* Warehouse */}
                  <td className="py-3 px-4 text-slate-600">
                    {movement.warehouseName}
                  </td>

                  {/* Quantity - colored */}
                  <td className="py-3 px-4 text-right">
                    <span
                      className={cn(
                        'font-medium',
                        isPositive ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {isPositive ? '+' : ''}
                      {movement.quantity}
                    </span>
                  </td>

                  {/* Reference */}
                  <td className="py-3 px-4 text-slate-600">
                    {movement.referenceType && movement.referenceId ? (
                      <span className="font-mono text-xs">
                        {movement.referenceType}-{movement.referenceId.substring(0, 8)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Notes */}
                  <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">
                    {movement.notes || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {movements.length > limit && (
        <p className="text-sm text-slate-500 mt-3 text-center">
          Showing {limit} of {movements.length} movements
        </p>
      )}
    </div>
  );
}
