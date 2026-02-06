'use client';

import { Check } from 'lucide-react';
import type { PurchaseOrderStatus } from '@/lib/api';

interface POPipelineStepsProps {
  status: PurchaseOrderStatus;
}

const PIPELINE_STEPS = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'PENDING_APPROVAL', label: 'Approval' },
  { key: 'SENT', label: 'Sent' },
  { key: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { key: 'RECEIVING', label: 'Receiving' },
  { key: 'RECEIVED', label: 'Received' },
] as const;

function getStepIndex(status: PurchaseOrderStatus): number {
  switch (status) {
    case 'DRAFT':
      return 0;
    case 'PENDING_APPROVAL':
      return 1;
    case 'SENT':
      return 2;
    case 'ACKNOWLEDGED':
      return 3;
    case 'PARTIALLY_RECEIVED':
      return 4;
    case 'RECEIVED':
      return 5;
    case 'CLOSED':
      return 6; // Past final step
    case 'CANCELLED':
      return -1;
    default:
      return 0;
  }
}

export function POPipelineSteps({ status }: POPipelineStepsProps) {
  if (status === 'CANCELLED') {
    return null;
  }

  const currentIndex = getStepIndex(status);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        {PIPELINE_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
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

              {index < PIPELINE_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 mt-[-1.25rem] ${
                    isCompleted ? 'bg-green-600' : 'bg-slate-200'
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
