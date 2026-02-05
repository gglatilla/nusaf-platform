'use client';

import { useState, useRef } from 'react';
import { Upload, Download, Trash2, FileText, File, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Document type enum matching backend
export type ProductDocumentType =
  | 'DATASHEET'
  | 'CATALOG'
  | 'CAD_DRAWING'
  | 'INSTALLATION_MANUAL'
  | 'CERTIFICATE'
  | 'MSDS'
  | 'OTHER'
  | 'CAD_2D_DXF'
  | 'CAD_2D_DWG'
  | 'CAD_2D_PDF'
  | 'CAD_3D_STEP'
  | 'CAD_3D_IGES'
  | 'CAD_3D_SAT'
  | 'CAD_3D_PARASOLID'
  | 'CAD_3D_SOLIDWORKS'
  | 'CAD_3D_INVENTOR'
  | 'CAD_3D_CATIA';

// Document type display info
const DOCUMENT_TYPES: { value: ProductDocumentType; label: string; color: string }[] = [
  { value: 'DATASHEET', label: 'Datasheet', color: 'bg-blue-100 text-blue-700' },
  { value: 'CATALOG', label: 'Catalog', color: 'bg-purple-100 text-purple-700' },
  { value: 'INSTALLATION_MANUAL', label: 'Manual', color: 'bg-green-100 text-green-700' },
  { value: 'CERTIFICATE', label: 'Certificate', color: 'bg-amber-100 text-amber-700' },
  { value: 'MSDS', label: 'MSDS', color: 'bg-red-100 text-red-700' },
  { value: 'CAD_2D_DXF', label: '2D DXF', color: 'bg-slate-100 text-slate-700' },
  { value: 'CAD_2D_DWG', label: '2D DWG', color: 'bg-slate-100 text-slate-700' },
  { value: 'CAD_2D_PDF', label: '2D PDF', color: 'bg-slate-100 text-slate-700' },
  { value: 'CAD_3D_STEP', label: '3D STEP', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'CAD_3D_IGES', label: '3D IGES', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'CAD_3D_SAT', label: '3D SAT', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'CAD_3D_PARASOLID', label: '3D Parasolid', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'CAD_3D_SOLIDWORKS', label: '3D SolidWorks', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'CAD_3D_INVENTOR', label: '3D Inventor', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'CAD_3D_CATIA', label: '3D CATIA', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'CAD_DRAWING', label: 'CAD', color: 'bg-slate-100 text-slate-700' },
  { value: 'OTHER', label: 'Other', color: 'bg-slate-100 text-slate-700' },
];

// Document type matching backend ProductDocument model
export interface ProductDocument {
  id: string;
  type: ProductDocumentType;
  name: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  sortOrder: number;
}

interface ProductDocumentsListProps {
  productId: string;
  documents: ProductDocument[];
  canEdit: boolean;
  onUpload?: (file: File, type: ProductDocumentType, name: string) => Promise<void>;
  onDelete?: (documentId: string) => Promise<void>;
  isUploading?: boolean;
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocumentTypeInfo(type: ProductDocumentType) {
  return DOCUMENT_TYPES.find((t) => t.value === type) || DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1];
}

export function ProductDocumentsList({
  productId,
  documents,
  canEdit,
  onUpload,
  onDelete,
  isUploading,
}: ProductDocumentsListProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadType, setUploadType] = useState<ProductDocumentType>('DATASHEET');
  const [uploadName, setUploadName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sort documents by sortOrder
  const sortedDocuments = [...documents].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      const name = uploadName.trim() || file.name.replace(/\.[^/.]+$/, '');
      await onUpload(file, uploadType, name);
      setShowUploadForm(false);
      setUploadName('');
      setUploadType('DATASHEET');
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!onDelete) return;
    setDeletingId(documentId);
    try {
      await onDelete(documentId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Document List */}
      {sortedDocuments.length > 0 ? (
        <div className="space-y-2">
          {sortedDocuments.map((doc) => {
            const typeInfo = getDocumentTypeInfo(doc.type);
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-slate-900 truncate">
                      {doc.name}
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-xs font-medium rounded',
                        typeInfo.color
                      )}
                    >
                      {typeInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="truncate">{doc.fileName}</span>
                    {doc.fileSize && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-primary-600 rounded hover:bg-white transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-white transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center text-sm text-slate-500">
          No documents uploaded
        </div>
      )}

      {/* Upload Section */}
      {canEdit && (
        <>
          {showUploadForm ? (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Document Type
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as ProductDocumentType)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <optgroup label="General">
                    <option value="DATASHEET">Datasheet</option>
                    <option value="CATALOG">Catalog</option>
                    <option value="INSTALLATION_MANUAL">Installation Manual</option>
                    <option value="CERTIFICATE">Certificate</option>
                    <option value="MSDS">MSDS</option>
                    <option value="OTHER">Other</option>
                  </optgroup>
                  <optgroup label="2D CAD">
                    <option value="CAD_2D_DXF">2D CAD - DXF</option>
                    <option value="CAD_2D_DWG">2D CAD - DWG</option>
                    <option value="CAD_2D_PDF">2D CAD - PDF</option>
                  </optgroup>
                  <optgroup label="3D CAD">
                    <option value="CAD_3D_STEP">3D CAD - STEP</option>
                    <option value="CAD_3D_IGES">3D CAD - IGES</option>
                    <option value="CAD_3D_SAT">3D CAD - SAT</option>
                    <option value="CAD_3D_PARASOLID">3D CAD - Parasolid</option>
                    <option value="CAD_3D_SOLIDWORKS">3D CAD - SolidWorks</option>
                    <option value="CAD_3D_INVENTOR">3D CAD - Inventor</option>
                    <option value="CAD_3D_CATIA">3D CAD - CATIA</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Display Name (optional)
                </label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g., Product Datasheet"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 py-2 px-4 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Select File
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false);
                    setUploadName('');
                    setUploadType('DATASHEET');
                  }}
                  className="py-2 px-4 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowUploadForm(true)}
              className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-600 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Document
            </button>
          )}
        </>
      )}
    </div>
  );
}
