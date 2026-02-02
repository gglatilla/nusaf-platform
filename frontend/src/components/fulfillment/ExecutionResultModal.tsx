'use client';

import Link from 'next/link';
import { CheckCircle, AlertCircle, ClipboardList, Wrench, Truck, ShoppingCart, ExternalLink } from 'lucide-react';
import type { ExecutionResult } from '@/lib/api';

interface ExecutionResultModalProps {
  result: ExecutionResult;
  onClose: () => void;
}

function getWarehouseLabel(warehouse: string): string {
  return warehouse === 'JHB' ? 'JHB' : 'CT';
}

export function ExecutionResultModal({ result, onClose }: ExecutionResultModalProps) {
  const isSuccess = result.success;
  const { pickingSlips, jobCards, transferRequests, purchaseOrders } = result.createdDocuments;

  const totalDocuments =
    pickingSlips.length +
    jobCards.length +
    transferRequests.length +
    purchaseOrders.length;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
          {/* Header */}
          <div className={`px-6 py-4 ${isSuccess ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-3">
              {isSuccess ? (
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-500" />
              )}
              <div>
                <h2 className={`text-lg font-semibold ${isSuccess ? 'text-emerald-900' : 'text-red-900'}`}>
                  {isSuccess ? 'Plan Executed Successfully' : 'Execution Failed'}
                </h2>
                {isSuccess && (
                  <p className="text-sm text-emerald-700">
                    Created {totalDocuments} document{totalDocuments !== 1 ? 's' : ''} and {result.reservationsCreated} reservation{result.reservationsCreated !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {isSuccess ? (
              <div className="space-y-4">
                {/* Picking Slips */}
                {pickingSlips.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <ClipboardList className="h-4 w-4 text-indigo-500" />
                      Picking Slips
                    </h3>
                    <div className="space-y-1">
                      {pickingSlips.map((slip) => (
                        <Link
                          key={slip.id}
                          href={`/picking-slips/${slip.id}`}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <span className="text-sm font-medium text-primary-600">
                            {slip.number}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">
                              {getWarehouseLabel(slip.warehouse)}
                            </span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job Cards */}
                {jobCards.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <Wrench className="h-4 w-4 text-purple-500" />
                      Job Cards
                    </h3>
                    <div className="space-y-1">
                      {jobCards.map((jc) => (
                        <Link
                          key={jc.id}
                          href={`/job-cards/${jc.id}`}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <span className="text-sm font-medium text-primary-600">
                            {jc.number}
                          </span>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transfer Requests */}
                {transferRequests.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <Truck className="h-4 w-4 text-blue-500" />
                      Transfer Requests
                    </h3>
                    <div className="space-y-1">
                      {transferRequests.map((tr) => (
                        <Link
                          key={tr.id}
                          href={`/transfer-requests/${tr.id}`}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <span className="text-sm font-medium text-primary-600">
                            {tr.number}
                          </span>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Purchase Orders */}
                {purchaseOrders.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <ShoppingCart className="h-4 w-4 text-amber-500" />
                      Purchase Orders
                    </h3>
                    <div className="space-y-1">
                      {purchaseOrders.map((po) => (
                        <Link
                          key={po.id}
                          href={`/purchase-orders/${po.id}`}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <span className="text-sm font-medium text-primary-600">
                            {po.number}
                          </span>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Status Update */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-sm text-slate-600">
                    Order status updated to{' '}
                    <span className="font-medium text-slate-900">{result.orderStatusUpdated}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <p className="text-sm text-red-700">{result.error || 'An unknown error occurred'}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
