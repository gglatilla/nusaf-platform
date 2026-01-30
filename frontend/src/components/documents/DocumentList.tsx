'use client';

import { Download, Trash2, FileText, FileCheck, Loader2 } from 'lucide-react';
import type { DocumentForOrder, DocumentType } from '@/lib/api';

interface DocumentListProps {
  documents: DocumentForOrder[];
  onDownload: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isLoading?: boolean;
}

function getDocumentIcon(type: DocumentType) {
  switch (type) {
    case 'CUSTOMER_PO':
      return FileText;
    case 'SIGNED_DELIVERY_NOTE':
      return FileCheck;
    default:
      return FileText;
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DocumentList({ documents, onDownload, onDelete, isLoading }: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200">
      {documents.map((doc) => {
        const Icon = getDocumentIcon(doc.type);

        return (
          <div
            key={doc.id}
            className="flex items-center justify-between py-3 px-4 hover:bg-slate-50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Icon className="h-5 w-5 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {doc.filename}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{doc.typeLabel}</span>
                  <span>&middot;</span>
                  <span>{formatFileSize(doc.sizeBytes)}</span>
                  <span>&middot;</span>
                  <span>{formatDate(doc.uploadedAt)}</span>
                </div>
                <p className="text-xs text-slate-400">
                  Uploaded by {doc.uploadedByName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => onDownload(doc.id)}
                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(doc.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
