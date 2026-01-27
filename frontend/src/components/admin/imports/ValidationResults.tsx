'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RowError {
  field: string;
  message: string;
}

interface RowWarning {
  field: string;
  message: string;
}

interface RowValidationResult {
  rowNumber: number;
  isValid: boolean;
  errors: RowError[];
  warnings: RowWarning[];
  data: {
    supplierSku: string;
    nusafSku: string;
    description: string;
    price: number;
    unitOfMeasure: string;
    categoryCode: string;
    subcategoryCode?: string;
  } | null;
}

interface ValidationSummary {
  newProducts: number;
  existingProducts: number;
  categoryBreakdown: Record<string, number>;
}

interface ImportValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  errors: Array<{ code: string; message: string }>;
  rows: RowValidationResult[];
  summary: ValidationSummary;
}

interface ValidationResultsProps {
  result: ImportValidationResult;
  onContinue: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type FilterType = 'all' | 'valid' | 'errors' | 'warnings';

export function ValidationResults({
  result,
  onContinue,
  onCancel,
  isLoading,
}: ValidationResultsProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (rowNumber: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) {
        next.delete(rowNumber);
      } else {
        next.add(rowNumber);
      }
      return next;
    });
  };

  const filteredRows = result.rows.filter((row) => {
    switch (filter) {
      case 'valid':
        return row.isValid;
      case 'errors':
        return !row.isValid;
      case 'warnings':
        return row.warnings.length > 0;
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Rows"
          value={result.totalRows}
          icon={<Filter className="h-5 w-5" />}
          color="slate"
        />
        <SummaryCard
          label="Valid"
          value={result.validRows}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="emerald"
        />
        <SummaryCard
          label="Errors"
          value={result.errorRows}
          icon={<XCircle className="h-5 w-5" />}
          color="red"
        />
        <SummaryCard
          label="Warnings"
          value={result.warningRows}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="amber"
        />
      </div>

      {/* Import summary */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Import Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-500">New products:</span>
            <span className="ml-2 font-medium text-emerald-600">{result.summary.newProducts}</span>
          </div>
          <div>
            <span className="text-slate-500">Updates:</span>
            <span className="ml-2 font-medium text-blue-600">{result.summary.existingProducts}</span>
          </div>
          <div>
            <span className="text-slate-500">Categories:</span>
            <span className="ml-2 font-medium text-slate-700">
              {Object.keys(result.summary.categoryBreakdown).length}
            </span>
          </div>
        </div>

        {/* Category breakdown */}
        {Object.keys(result.summary.categoryBreakdown).length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-2">Products by category:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.summary.categoryBreakdown).map(([code, count]) => (
                <span
                  key={code}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-slate-200"
                >
                  <span className="font-medium text-slate-700">{code}</span>
                  <span className="ml-1 text-slate-500">({count})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* File-level errors */}
      {result.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-900 mb-2">File Errors</h3>
          <ul className="space-y-1">
            {result.errors.map((error, idx) => (
              <li key={idx} className="text-sm text-red-700">
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <FilterTab
          label="All"
          count={result.totalRows}
          isActive={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <FilterTab
          label="Valid"
          count={result.validRows}
          isActive={filter === 'valid'}
          onClick={() => setFilter('valid')}
          color="emerald"
        />
        <FilterTab
          label="Errors"
          count={result.errorRows}
          isActive={filter === 'errors'}
          onClick={() => setFilter('errors')}
          color="red"
        />
        <FilterTab
          label="Warnings"
          count={result.warningRows}
          isActive={filter === 'warnings'}
          onClick={() => setFilter('warnings')}
          color="amber"
        />
      </div>

      {/* Row list */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          {filteredRows.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No rows match the selected filter
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredRows.slice(0, 100).map((row) => (
                <RowItem
                  key={row.rowNumber}
                  row={row}
                  isExpanded={expandedRows.has(row.rowNumber)}
                  onToggle={() => toggleRow(row.rowNumber)}
                />
              ))}
              {filteredRows.length > 100 && (
                <div className="p-4 text-center text-sm text-slate-500 bg-slate-50">
                  Showing first 100 of {filteredRows.length} rows
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!result.isValid && result.validRows === 0}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            result.isValid
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : result.validRows > 0
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          )}
        >
          {result.isValid
            ? `Import ${result.validRows} Products`
            : result.validRows > 0
              ? `Import ${result.validRows} Valid Products`
              : 'No Valid Rows'}
        </button>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'slate' | 'emerald' | 'red' | 'amber';
}

function SummaryCard({ label, value, icon, color }: SummaryCardProps) {
  const colorClasses = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

interface FilterTabProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  color?: 'emerald' | 'red' | 'amber';
}

function FilterTab({ label, count, isActive, onClick, color }: FilterTabProps) {
  const countColorClass = color
    ? {
        emerald: 'text-emerald-600',
        red: 'text-red-600',
        amber: 'text-amber-600',
      }[color]
    : 'text-slate-500';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
        isActive
          ? 'border-primary-600 text-primary-600'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      )}
    >
      {label}
      <span className={cn('ml-1.5', isActive ? 'text-primary-600' : countColorClass)}>
        ({count})
      </span>
    </button>
  );
}

interface RowItemProps {
  row: RowValidationResult;
  isExpanded: boolean;
  onToggle: () => void;
}

function RowItem({ row, isExpanded, onToggle }: RowItemProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors',
          !row.isValid && 'bg-red-50/50'
        )}
      >
        {/* Status icon */}
        {row.isValid ? (
          row.warnings.length > 0 ? (
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          )
        ) : (
          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
        )}

        {/* Row info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Row {row.rowNumber}</span>
            <span className="text-sm font-medium text-slate-900 truncate">
              {row.data?.supplierSku || '—'}
            </span>
          </div>
          {row.data && (
            <p className="text-xs text-slate-500 truncate">{row.data.description}</p>
          )}
        </div>

        {/* Error/warning counts */}
        <div className="flex items-center gap-2">
          {row.errors.length > 0 && (
            <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
              {row.errors.length} error{row.errors.length !== 1 ? 's' : ''}
            </span>
          )}
          {row.warnings.length > 0 && (
            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              {row.warnings.length} warning{row.warnings.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Expand icon */}
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-3 pl-11 space-y-2">
          {/* Errors */}
          {row.errors.length > 0 && (
            <div className="space-y-1">
              {row.errors.map((error, idx) => (
                <p key={idx} className="text-sm text-red-600">
                  <span className="font-medium">{error.field}:</span> {error.message}
                </p>
              ))}
            </div>
          )}

          {/* Warnings */}
          {row.warnings.length > 0 && (
            <div className="space-y-1">
              {row.warnings.map((warning, idx) => (
                <p key={idx} className="text-sm text-amber-600">
                  <span className="font-medium">{warning.field}:</span> {warning.message}
                </p>
              ))}
            </div>
          )}

          {/* Data preview */}
          {row.data && (
            <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <p>
                <span className="text-slate-400">Nusaf SKU:</span> {row.data.nusafSku}
              </p>
              <p>
                <span className="text-slate-400">Price:</span> €{row.data.price.toFixed(2)}
              </p>
              <p>
                <span className="text-slate-400">Category:</span> {row.data.categoryCode}
                {row.data.subcategoryCode && ` / ${row.data.subcategoryCode}`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
