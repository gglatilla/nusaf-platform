'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, FileCheck } from 'lucide-react';
import type { DocumentType } from '@/lib/api';
import { DOCUMENT_TYPE_LABELS } from '@/lib/api';

interface DocumentUploadButtonProps {
  orderId: string;
  onUpload: (data: { orderId: string; type: DocumentType; file: File }) => Promise<void>;
  disabled?: boolean;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string; icon: typeof FileText }[] = [
  { value: 'CUSTOMER_PO', label: DOCUMENT_TYPE_LABELS.CUSTOMER_PO, icon: FileText },
  { value: 'SIGNED_DELIVERY_NOTE', label: DOCUMENT_TYPE_LABELS.SIGNED_DELIVERY_NOTE, icon: FileCheck },
];

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUploadButton({ orderId, onUpload, disabled }: DocumentUploadButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('CUSTOMER_PO');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload a PDF, JPEG, PNG, or WebP file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      await onUpload({
        orderId,
        type: selectedType,
        file: selectedFile,
      });
      // Reset and close
      setSelectedFile(null);
      setSelectedType('CUSTOMER_PO');
      setIsModalOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setIsModalOpen(false);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className="inline-flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload className="h-4 w-4" />
        Upload Document
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Upload Document</h2>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isUploading}
                  className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Document Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Document Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DOCUMENT_TYPES.map((docType) => {
                      const Icon = docType.icon;
                      return (
                        <button
                          key={docType.value}
                          type="button"
                          onClick={() => setSelectedType(docType.value)}
                          disabled={isUploading}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                            selectedType === docType.value
                              ? 'bg-primary-50 border-primary-300 text-primary-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {docType.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* File Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="hidden"
                    id="document-file-input"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        disabled={isUploading}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="document-file-input"
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:border-slate-400 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600">
                        Click to select a file
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        PDF, JPEG, PNG, or WebP (max 10MB)
                      </p>
                    </label>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
