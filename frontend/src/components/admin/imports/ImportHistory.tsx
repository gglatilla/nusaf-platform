'use client';

import { FileSpreadsheet, CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImportHistoryItem } from '@/lib/api';

interface ImportHistoryProps {
  items: ImportHistoryItem[];
  isLoading?: boolean;
  onItemClick?: (id: string) => void;
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'slate', icon: Clock },
  VALIDATING: { label: 'Validating', color: 'blue', icon: Clock },
  VALIDATED: { label: 'Validated', color: 'blue', icon: CheckCircle2 },
  IMPORTING: { label: 'Importing', color: 'blue', icon: Clock },
  COMPLETED: { label: 'Completed', color: 'emerald', icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: 'red', icon: XCircle },
} as const;

export function ImportHistory({ items, isLoading, onItemClick }: ImportHistoryProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-100 rounded-lg h-20" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
        <FileSpreadsheet className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700">No import history</p>
        <p className="text-xs text-slate-500 mt-1">
          Import a supplier price list to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden">
      {items.map((item) => (
        <ImportHistoryRow key={item.id} item={item} onClick={onItemClick} />
      ))}
    </div>
  );
}

interface ImportHistoryRowProps {
  item: ImportHistoryItem;
  onClick?: (id: string) => void;
}

function ImportHistoryRow({ item, onClick }: ImportHistoryRowProps) {
  const config = STATUS_CONFIG[item.status];
  const StatusIcon = config.icon;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const colorClasses = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-600',
  } as const;

  return (
    <button
      type="button"
      onClick={() => onClick?.(item.id)}
      className="w-full px-4 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
      disabled={!onClick}
    >
      {/* File icon */}
      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <FileSpreadsheet className="h-5 w-5 text-slate-500" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-900 truncate">{item.fileName}</p>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              colorClasses[config.color]
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <span>{item.supplierCode}</span>
          <span>•</span>
          <span>{formatDate(item.createdAt)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        {item.status === 'COMPLETED' && (
          <>
            <div className="text-right">
              <p className="font-medium text-emerald-600">{item.successRows}</p>
              <p className="text-xs text-slate-400">imported</p>
            </div>
            {item.errorRows > 0 && (
              <div className="text-right">
                <p className="font-medium text-red-600">{item.errorRows}</p>
                <p className="text-xs text-slate-400">errors</p>
              </div>
            )}
          </>
        )}
        {item.status === 'FAILED' && (
          <div className="text-right">
            <p className="font-medium text-red-600">{item.errorRows}</p>
            <p className="text-xs text-slate-400">failed</p>
          </div>
        )}
        {['PENDING', 'VALIDATING', 'VALIDATED', 'IMPORTING'].includes(item.status) && (
          <div className="text-right">
            <p className="font-medium text-slate-600">{item.totalRows}</p>
            <p className="text-xs text-slate-400">rows</p>
          </div>
        )}
      </div>

      {/* Arrow */}
      {onClick && <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />}
    </button>
  );
}
