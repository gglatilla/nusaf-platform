'use client';

import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportReviewProps {
  fileName: string;
  supplierCode: string;
  totalRows: number;
  validRows: number;
  newProducts: number;
  existingProducts: number;
  hasErrors: boolean;
  skipErrors: boolean;
  onSkipErrorsChange: (skip: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function ImportReview({
  fileName,
  supplierCode,
  totalRows,
  validRows,
  newProducts,
  existingProducts,
  hasErrors,
  skipErrors,
  onSkipErrorsChange,
  onConfirm,
  onCancel,
  isLoading,
}: ImportReviewProps) {
  const willImport = hasErrors ? (skipErrors ? validRows : 0) : validRows;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Import Summary</h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-500 mb-1">File</p>
            <p className="text-sm font-medium text-slate-900">{fileName}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Supplier</p>
            <p className="text-sm font-medium text-slate-900">{supplierCode}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Total Rows</p>
            <p className="text-sm font-medium text-slate-900">{totalRows}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Valid Rows</p>
            <p className="text-sm font-medium text-emerald-600">{validRows}</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-sm text-emerald-700 mb-1">New Products</p>
              <p className="text-2xl font-bold text-emerald-600">{newProducts}</p>
              <p className="text-xs text-emerald-600 mt-1">Will be created</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-1">Existing Products</p>
              <p className="text-2xl font-bold text-blue-600">{existingProducts}</p>
              <p className="text-xs text-blue-600 mt-1">Will be updated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error handling option */}
      {hasErrors && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                Some rows have validation errors
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {totalRows - validRows} row(s) failed validation and cannot be imported.
              </p>

              <label className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  checked={skipErrors}
                  onChange={(e) => onSkipErrorsChange(e.target.checked)}
                  className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-amber-800">
                  Skip invalid rows and import only valid ones ({validRows} products)
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation message */}
      <div
        className={cn(
          'rounded-lg p-4 flex items-start gap-3',
          willImport > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'
        )}
      >
        {willImport > 0 ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <p
            className={cn(
              'text-sm font-medium',
              willImport > 0 ? 'text-emerald-900' : 'text-slate-700'
            )}
          >
            {willImport > 0
              ? `Ready to import ${willImport} products`
              : 'No products will be imported'}
          </p>
          <p className={cn('text-sm mt-1', willImport > 0 ? 'text-emerald-700' : 'text-slate-500')}>
            {willImport > 0
              ? 'This action will add new products and update existing ones based on SKU matching.'
              : hasErrors
                ? 'Check the "skip invalid rows" option above to import valid rows only.'
                : 'Please go back and check your file.'}
          </p>
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
          Go Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={willImport === 0 || isLoading}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-2',
            willImport > 0
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            `Confirm Import (${willImport} products)`
          )}
        </button>
      </div>
    </div>
  );
}
