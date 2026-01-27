'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, File, X, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  isUploading: boolean;
  error?: string;
  accept?: string;
  maxSize?: number; // in bytes
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  isUploading,
  error,
  accept = '.xlsx,.xls',
  maxSize = 10 * 1024 * 1024, // 10MB default
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      const allowedExtensions = ['.xlsx', '.xls'];
      const hasValidExtension = allowedExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );
      if (!hasValidExtension) {
        return 'Please upload an Excel file (.xlsx or .xls)';
      }

      // Check file size
      if (file.size > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024));
        return `File size must be less than ${maxMB}MB`;
      }

      return null;
    },
    [maxSize]
  );

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        // Parent component should handle error display
        return;
      }
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isUploading}
      />

      {/* Drop zone / Selected file display */}
      {!selectedFile ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50',
            isUploading && 'pointer-events-none opacity-50'
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                isDragging ? 'bg-primary-100' : 'bg-slate-100'
              )}
            >
              <Upload
                className={cn(
                  'h-6 w-6',
                  isDragging ? 'text-primary-600' : 'text-slate-400'
                )}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700">
                {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                or <span className="text-primary-600 hover:underline">browse</span> to choose a file
              </p>
            </div>

            <p className="text-xs text-slate-400">
              Excel files only (.xlsx, .xls) • Max {Math.round(maxSize / (1024 * 1024))}MB
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <File className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isUploading ? (
                <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileRemove();
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 flex items-start gap-2 text-error">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
