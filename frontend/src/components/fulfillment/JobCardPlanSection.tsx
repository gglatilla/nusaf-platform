'use client';

import { Wrench, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import type { JobCardPlan } from '@/lib/api';

interface JobCardPlanSectionProps {
  jobCards: JobCardPlan[];
}

function JobTypeBadge({ jobType }: { jobType: string }) {
  const isAssembly = jobType === 'ASSEMBLY';
  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
      ${isAssembly ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'}
    `}>
      {isAssembly ? 'Assembly' : 'Machining'}
    </span>
  );
}

export function JobCardPlanSection({ jobCards }: JobCardPlanSectionProps) {
  return (
    <div className="divide-y divide-slate-100">
      {jobCards.map((jobCard, index) => {
        const hasShortfalls = !jobCard.componentAvailability.allComponentsAvailable;

        return (
          <div key={index} className="p-4">
            {/* Job Card Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <Wrench className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-slate-900">
                      {jobCard.productSku}
                    </span>
                    <JobTypeBadge jobType={jobCard.jobType} />
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {jobCard.productDescription}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-slate-900">
                  {jobCard.quantity}
                </span>
                <p className="text-xs text-slate-500">to produce</p>
              </div>
            </div>

            {/* Component Availability */}
            {hasShortfalls && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm text-amber-700">
                  {jobCard.componentAvailability.componentsWithShortfall.length} component{jobCard.componentAvailability.componentsWithShortfall.length !== 1 ? 's' : ''} have insufficient stock
                </span>
              </div>
            )}

            {/* Components List */}
            {jobCard.components.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">
                  Components Required
                </h4>
                <div className="space-y-1">
                  {jobCard.components.map((component, compIndex) => {
                    const hasShortfall = component.shortfall > 0;
                    return (
                      <div
                        key={compIndex}
                        className={`
                          flex items-center justify-between px-3 py-2 rounded-lg text-sm
                          ${hasShortfall ? 'bg-red-50 border border-red-100' : 'bg-slate-50'}
                        `}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {hasShortfall ? (
                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          )}
                          <Package className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="font-mono text-slate-700 truncate">
                            {component.productSku}
                          </span>
                          <span className="text-slate-500 truncate hidden md:inline">
                            {component.productDescription}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-slate-500">
                            Need: <strong className="text-slate-700">{component.requiredQuantity}</strong>
                          </span>
                          <span className={hasShortfall ? 'text-red-600' : 'text-emerald-600'}>
                            Have: <strong>{component.availableQuantity}</strong>
                          </span>
                          {hasShortfall && (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-medium">
                              -{component.shortfall}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {jobCard.components.length === 0 && (
              <p className="text-sm text-slate-400 italic">No BOM components defined</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
