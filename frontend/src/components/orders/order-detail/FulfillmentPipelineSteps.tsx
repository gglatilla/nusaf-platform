'use client';

import { Check } from 'lucide-react';
import type { SalesOrderStatus } from '@nusaf/shared';

interface FulfillmentPipelineStepsProps {
  orderStatus: SalesOrderStatus;
}

const PIPELINE_STEPS = [
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'READY_TO_SHIP', label: 'Ready to Ship' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'INVOICED', label: 'Invoiced' },
  { key: 'CLOSED', label: 'Closed' },
] as const;

function getStepIndex(status: SalesOrderStatus): number {
  switch (status) {
    case 'DRAFT':
      return -1;
    case 'CONFIRMED':
      return 0;
    case 'PROCESSING':
      return 1;
    case 'READY_TO_SHIP':
      return 2;
    case 'PARTIALLY_SHIPPED':
      return 2;
    case 'SHIPPED':
      return 3;
    case 'DELIVERED':
      return 4;
    case 'INVOICED':
      return 5;
    case 'CLOSED':
      return 6;
    case 'ON_HOLD':
    case 'CANCELLED':
      return -2; // Special states
    default:
      return -1;
  }
}

export function FulfillmentPipelineSteps({ orderStatus }: FulfillmentPipelineStepsProps) {
  const currentIndex = getStepIndex(orderStatus);
  const isSpecialState = orderStatus === 'ON_HOLD' || orderStatus === 'CANCELLED' || orderStatus === 'DRAFT';

  if (isSpecialState) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        {PIPELINE_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'bg-green-600 border-green-600 text-white'
                      : isCurrent
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium text-center ${
                    isCompleted
                      ? 'text-green-700'
                      : isCurrent
                        ? 'text-primary-700'
                        : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < PIPELINE_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 mt-[-1.25rem] ${
                    isCompleted ? 'bg-green-600' : isFuture ? 'bg-slate-200' : 'bg-primary-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
