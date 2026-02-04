'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// File constraints (must match backend)
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.dxf', '.dwg', '.step', '.stp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_FILES = 5;

export interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  progress?: number;
  error?: string;
  // After successful upload
  key?: string;
  url?: string;
}

export interface FileAttachment {
  key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

interface FileUploadZoneProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  sessionId: string;
  disabled?: boolean;
  className?: string;
}

export function FileUploadZone({
  files,
  onFilesChange,
  sessionId,
  disabled = false,
  className,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check extension
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return `File type "${ext}" is not allowed. Allowed: PDF, images, CAD files (DXF, DWG, STEP)`;
      }

      // Check individual file size
      if (file.size > MAX_FILE_SIZE) {
        return `File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
      }

      // Check total size
      const currentTotal = files.reduce((sum, f) => sum + f.file.size, 0);
      if (currentTotal + file.size > MAX_TOTAL_SIZE) {
        return `Total file size would exceed ${MAX_TOTAL_SIZE / (1024 * 1024)}MB limit`;
      }

      // Check file count
      if (files.length >= MAX_FILES) {
        return `Maximum ${MAX_FILES} files allowed`;
      }

      // Check for duplicates
      if (files.some((f) => f.file.name === file.name && f.file.size === file.size)) {
        return `File "${file.name}" has already been added`;
      }

      return null;
    },
    [files]
  );

  const uploadFile = useCallback(
    async (uploadedFile: UploadedFile): Promise<UploadedFile> => {
      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      formData.append('sessionId', sessionId);

      try {
        const response = await fetch('/api/v1/public/quote-requests/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          return {
            ...uploadedFile,
            status: 'error',
            error: result.error?.message || 'Upload failed',
          };
        }

        return {
          ...uploadedFile,
          status: 'complete',
          key: result.data.key,
          url: result.data.url,
        };
      } catch (err) {
        return {
          ...uploadedFile,
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
        };
      }
    },
    [sessionId]
  );

  const handleFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(newFiles);

      // Validate all files first
      const validFiles: File[] = [];
      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return; // Stop on first error
        }
        validFiles.push(file);
      }

      // Check if adding these would exceed max files
      if (files.length + validFiles.length > MAX_FILES) {
        setError(`Can only add ${MAX_FILES - files.length} more file(s). Maximum ${MAX_FILES} files allowed.`);
        return;
      }

      // Create upload entries
      const newUploads: UploadedFile[] = validFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        status: 'uploading' as const,
      }));

      // Add to list immediately (showing uploading state)
      const updatedFiles = [...files, ...newUploads];
      onFilesChange(updatedFiles);

      // Upload each file sequentially and update state
      let currentFiles = updatedFiles;
      for (const upload of newUploads) {
        const result = await uploadFile(upload);
        // Update the specific file's status
        currentFiles = currentFiles.map((f) => (f.id === upload.id ? result : f));
        onFilesChange(currentFiles);
      }
    },
    [files, onFilesChange, validateFile, uploadFile]
  );

  const handleRemove = useCallback(
    (id: string) => {
      onFilesChange(files.filter((f) => f.id !== id));
      setError(null);
    },
    [files, onFilesChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

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

      if (disabled) return;

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles);
      }
    },
    [disabled, handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        handleFiles(selectedFiles);
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFiles]
  );

  const handleClick = useCallback(() => {
    if (!disabled && files.length < MAX_FILES) {
      fileInputRef.current?.click();
    }
  }, [disabled, files.length]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    // Could add specific icons for different file types
    return <FileText className="h-5 w-5 text-slate-500" />;
  };

  const canAddMore = files.length < MAX_FILES && !disabled;
  const hasFiles = files.length > 0;

  return (
    <div className={cn('w-full', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
        multiple
      />

      {/* File list */}
      {hasFiles && (
        <div className="mb-3 space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                file.status === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-slate-50 border-slate-200'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    file.status === 'error' ? 'bg-red-100' : 'bg-white'
                  )}
                >
                  {getFileIcon(file.file.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.file.size)}
                    {file.status === 'complete' && (
                      <span className="ml-2 text-green-600">Uploaded</span>
                    )}
                    {file.status === 'error' && (
                      <span className="ml-2 text-red-600">{file.error}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {file.status === 'uploading' && (
                  <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
                )}
                {file.status === 'complete' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(file.id)}
                  disabled={file.status === 'uploading'}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50',
            disabled && 'pointer-events-none opacity-50'
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                isDragging ? 'bg-primary-100' : 'bg-slate-100'
              )}
            >
              <Upload
                className={cn(
                  'h-5 w-5',
                  isDragging ? 'text-primary-600' : 'text-slate-400'
                )}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700">
                {isDragging
                  ? 'Drop your files here'
                  : hasFiles
                  ? 'Add more files'
                  : 'Attach drawings or specifications'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {hasFiles ? (
                  `${files.length} of ${MAX_FILES} files`
                ) : (
                  <>
                    or <span className="text-primary-600">browse</span> to choose
                  </>
                )}
              </p>
            </div>

            {!hasFiles && (
              <p className="text-xs text-slate-400">
                PDF, JPEG, PNG, DXF, DWG, STEP • Max 10MB per file
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 flex items-start gap-2 text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Max files reached message */}
      {files.length >= MAX_FILES && !error && (
        <p className="mt-2 text-xs text-slate-500 text-center">
          Maximum {MAX_FILES} files reached
        </p>
      )}
    </div>
  );
}

/**
 * Get attachment data from uploaded files for form submission
 */
export function getAttachmentsFromFiles(files: UploadedFile[]): FileAttachment[] {
  return files
    .filter((f) => f.status === 'complete' && f.key)
    .map((f) => ({
      key: f.key!,
      filename: f.file.name,
      mimeType: f.file.type || 'application/octet-stream',
      sizeBytes: f.file.size,
    }));
}
