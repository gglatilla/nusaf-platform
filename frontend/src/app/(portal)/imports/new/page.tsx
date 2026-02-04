'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { FileUpload } from '@/components/admin/imports/FileUpload';
import { ColumnMapper, type ColumnMapping } from '@/components/admin/imports/ColumnMapper';
import { ValidationResults } from '@/components/admin/imports/ValidationResults';
import { ImportReview } from '@/components/admin/imports/ImportReview';
import {
  api,
  ApiError,
  type UploadResponse,
  type ImportValidationResult,
  type ImportSupplier,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

type WizardStep = 'upload' | 'map' | 'validate' | 'review' | 'complete';

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'map', label: 'Map Columns' },
  { key: 'validate', label: 'Validate' },
  { key: 'review', label: 'Review' },
];

export default function NewImportPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();

  // State
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [suppliers, setSuppliers] = useState<ImportSupplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [mappingValid, setMappingValid] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [skipErrors, setSkipErrors] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number } | null>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load suppliers when access token is available
  useEffect(() => {
    if (!accessToken) return;

    async function loadSuppliers() {
      try {
        const response = await api.getImportSuppliers();
        if (response.success && response.data) {
          setSuppliers(response.data);
        }
      } catch (err) {
        console.error('Failed to load suppliers:', err);
      }
    }
    loadSuppliers();
  }, [accessToken]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
  }, []);

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null);
    setUploadResult(null);
    setError(null);
  }, []);

  // Upload file and move to map step
  const handleUpload = useCallback(async () => {
    if (!selectedFile || !selectedSupplier) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.uploadImportFile(selectedFile, selectedSupplier);
      if (response.success && response.data) {
        setUploadResult(response.data);
        setCurrentStep('map');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to upload file. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, selectedSupplier]);

  // Validate and move to validate step
  const handleValidate = useCallback(async () => {
    if (!uploadResult || !columnMapping) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.validateImport(
        uploadResult.fileId,
        selectedSupplier,
        columnMapping
      );
      if (response.success && response.data) {
        setValidationResult(response.data);
        setCurrentStep('validate');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to validate import. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [uploadResult, columnMapping, selectedSupplier]);

  // Move to review step
  const handleContinueToReview = useCallback(() => {
    if (validationResult) {
      setCurrentStep('review');
    }
  }, [validationResult]);

  // Execute import
  const handleExecuteImport = useCallback(async () => {
    if (!uploadResult || !columnMapping) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.executeImport(
        uploadResult.fileId,
        selectedSupplier,
        columnMapping,
        skipErrors
      );
      if (response.success && response.data) {
        setImportResult({
          created: response.data.created,
          updated: response.data.updated,
        });
        setCurrentStep('complete');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to execute import. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [uploadResult, columnMapping, selectedSupplier, skipErrors]);

  // Go back to previous step
  const handleBack = useCallback(() => {
    switch (currentStep) {
      case 'map':
        setCurrentStep('upload');
        break;
      case 'validate':
        setCurrentStep('map');
        break;
      case 'review':
        setCurrentStep('validate');
        break;
    }
  }, [currentStep]);

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="space-y-6">
            {/* Supplier selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select supplier...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.code} value={supplier.code}>
                    {supplier.name} ({supplier.country})
                  </option>
                ))}
              </select>
            </div>

            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Price List File <span className="text-red-500">*</span>
              </label>
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                selectedFile={selectedFile}
                isUploading={isLoading}
                error={error || undefined}
              />
            </div>

            {/* Next button */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || !selectedSupplier || isLoading}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-2',
                  selectedFile && selectedSupplier
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Next: Map Columns'
                )}
              </button>
            </div>
          </div>
        );

      case 'map':
        return uploadResult ? (
          <div className="space-y-6">
            <ColumnMapper
              headers={uploadResult.headers}
              sampleData={uploadResult.sampleRows}
              initialMapping={uploadResult.detectedMapping}
              onMappingChange={setColumnMapping}
              onValidationChange={setMappingValid}
              supplierCode={selectedSupplier}
            />

            {/* Error message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleValidate}
                disabled={!mappingValid || isLoading}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-2',
                  mappingValid
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Next: Validate'
                )}
              </button>
            </div>
          </div>
        ) : null;

      case 'validate':
        return validationResult ? (
          <ValidationResults
            result={validationResult}
            onContinue={handleContinueToReview}
            onCancel={handleBack}
            isLoading={isLoading}
          />
        ) : null;

      case 'review':
        return validationResult && uploadResult ? (
          <ImportReview
            fileName={uploadResult.fileName}
            supplierCode={selectedSupplier}
            totalRows={validationResult.totalRows}
            validRows={validationResult.validRows}
            newProducts={validationResult.summary.newProducts}
            existingProducts={validationResult.summary.existingProducts}
            hasErrors={validationResult.errorRows > 0}
            skipErrors={skipErrors}
            onSkipErrorsChange={setSkipErrors}
            onConfirm={handleExecuteImport}
            onCancel={handleBack}
            isLoading={isLoading}
          />
        ) : null;

      case 'complete':
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Import Complete</h2>
            <p className="text-slate-600 mb-6">
              Successfully imported products from {uploadResult?.fileName}
            </p>

            {importResult && (
              <div className="inline-flex gap-6 bg-slate-50 rounded-lg px-6 py-4 mb-8">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{importResult.created}</p>
                  <p className="text-xs text-slate-500">Created</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{importResult.updated}</p>
                  <p className="text-xs text-slate-500">Updated</p>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <Link
                href="/imports"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                View History
              </Link>
              <button
                type="button"
                onClick={() => {
                  setCurrentStep('upload');
                  setSelectedFile(null);
                  setUploadResult(null);
                  setColumnMapping(null);
                  setValidationResult(null);
                  setImportResult(null);
                  setSkipErrors(false);
                }}
                className="px-4 py-2 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-md transition-colors"
              >
                Import Another File
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <PageHeader
        title="Import Price List"
        description="Import products from supplier Excel files"
        actions={
          <Link
            href="/imports"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to History
          </Link>
        }
      />

      <div className="p-4 sm:p-6 xl:p-8">
        {/* Progress steps */}
        {currentStep !== 'complete' && (
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {STEPS.map((step, index) => {
                const stepIndex = STEPS.findIndex((s) => s.key === currentStep);
                const isActive = step.key === currentStep;
                const isCompleted = index < stepIndex;

                return (
                  <div key={step.key} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                          isActive && 'bg-primary-600 text-white',
                          isCompleted && 'bg-emerald-500 text-white',
                          !isActive && !isCompleted && 'bg-slate-200 text-slate-500'
                        )}
                      >
                        {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                      </div>
                      <span
                        className={cn(
                          'mt-2 text-xs font-medium',
                          isActive && 'text-primary-600',
                          isCompleted && 'text-emerald-600',
                          !isActive && !isCompleted && 'text-slate-400'
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={cn(
                          'w-16 h-0.5 mx-2',
                          index < stepIndex ? 'bg-emerald-500' : 'bg-slate-200'
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step content */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-4xl mx-auto">
          {renderStepContent()}
        </div>
      </div>
    </>
  );
}
