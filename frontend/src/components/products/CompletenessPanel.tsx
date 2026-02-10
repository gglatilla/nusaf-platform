'use client';

import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { CompletenessResult } from '@/lib/product-completeness';
import { cn } from '@/lib/utils';

interface CompletenessPanelProps {
  completeness: CompletenessResult;
}

export function CompletenessPanel({ completeness }: CompletenessPanelProps) {
  const { score, fields, canPublish, requiredMet, requiredTotal } = completeness;

  // Color based on score
  const progressColor = score >= 85
    ? 'bg-green-500'
    : score >= 50
      ? 'bg-amber-500'
      : 'bg-red-500';

  const scoreColor = score >= 85
    ? 'text-green-700'
    : score >= 50
      ? 'text-amber-700'
      : 'text-red-700';

  return (
    <div className="border border-slate-200 rounded-lg bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Content Completeness</h3>
        <span className={cn('text-lg font-bold', scoreColor)}>{score}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full mb-4">
        <div
          className={cn('h-2 rounded-full transition-all duration-300', progressColor)}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Field checklist */}
      <ul className="space-y-2">
        {fields.map((field) => (
          <li key={field.key} className="flex items-center gap-2 text-sm">
            {field.met ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className={cn(
                'h-4 w-4 flex-shrink-0',
                field.required ? 'text-red-400' : 'text-slate-300'
              )} />
            )}
            <span className={cn(
              field.met ? 'text-slate-600' : field.required ? 'text-slate-900' : 'text-slate-400',
            )}>
              {field.label}
            </span>
            {field.required && !field.met && (
              <span className="text-[10px] font-medium text-red-500 uppercase">Required</span>
            )}
          </li>
        ))}
      </ul>

      {/* Status message */}
      {!canPublish && (
        <div className="mt-4 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Complete all required fields ({requiredMet}/{requiredTotal}) before publishing.
          </p>
        </div>
      )}

      {canPublish && (
        <div className="mt-4 flex items-start gap-2 p-2.5 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-green-800">
            Ready to publish. All required content is complete.
          </p>
        </div>
      )}
    </div>
  );
}
