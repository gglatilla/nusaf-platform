'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { DocumentList } from './DocumentList';
import { DocumentUploadButton } from './DocumentUploadButton';
import { useDocumentsForOrder, useUploadDocument, useDocumentDownload, useDeleteDocument } from '@/hooks/useDocuments';
import type { DocumentType } from '@/lib/api';

interface OrderDocumentsSectionProps {
  orderId: string;
  orderNumber: string;
  defaultExpanded?: boolean;
}

export function OrderDocumentsSection({ orderId, orderNumber, defaultExpanded = true }: OrderDocumentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { data: documents = [], isLoading } = useDocumentsForOrder(orderId);
  const uploadMutation = useUploadDocument();
  const downloadMutation = useDocumentDownload();
  const deleteMutation = useDeleteDocument();

  const handleUpload = async (data: { orderId: string; type: DocumentType; file: File }) => {
    await uploadMutation.mutateAsync(data);
  };

  const handleDownload = async (id: string) => {
    const result = await downloadMutation.mutateAsync(id);
    // Open the signed URL in a new tab to trigger download
    if (result?.url) {
      window.open(result.url, '_blank');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }
    await deleteMutation.mutateAsync({ id, orderId });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-600" />
          <h3 className="font-medium text-slate-900">Documents</h3>
          {documents.length > 0 && (
            <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {documents.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-slate-200">
          {/* Upload Button */}
          <div className="px-4 py-3 border-b border-slate-100">
            <DocumentUploadButton
              orderId={orderId}
              onUpload={handleUpload}
              disabled={uploadMutation.isPending}
            />
          </div>

          {/* Documents List */}
          <DocumentList
            documents={documents}
            onDownload={handleDownload}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
