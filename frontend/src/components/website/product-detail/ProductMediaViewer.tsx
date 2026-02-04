'use client';

import { useState, useMemo } from 'react';
import { ImageIcon, FileText, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublicProductImage, PublicProductDocument, ProductDocumentType } from '@/lib/api';
import { ProductImageGallery } from './ProductImageGallery';

type ViewMode = 'photo' | 'drawing';

// CAD 2D document types that should appear in drawing view
const CAD_2D_TYPES: ProductDocumentType[] = [
  'CAD_DRAWING',
  'CAD_2D_DXF',
  'CAD_2D_DWG',
  'CAD_2D_PDF',
];

interface ProductMediaViewerProps {
  images: PublicProductImage[];
  documents: PublicProductDocument[];
  productTitle: string;
}

export function ProductMediaViewer({
  images,
  documents,
  productTitle,
}: ProductMediaViewerProps) {
  // Filter to get only CAD 2D drawings
  const drawingDocuments = useMemo(
    () => documents.filter((doc) => CAD_2D_TYPES.includes(doc.type)),
    [documents]
  );

  // Determine if we have content for each view
  const hasPhotos = images.length > 0;
  const hasDrawings = drawingDocuments.length > 0;

  // Default to photo if available, otherwise drawing
  const [viewMode, setViewMode] = useState<ViewMode>(hasPhotos ? 'photo' : 'drawing');

  // If neither photos nor drawings exist, show the gallery placeholder
  if (!hasPhotos && !hasDrawings) {
    return <ProductImageGallery images={[]} productTitle={productTitle} />;
  }

  // If only one type exists, don't show toggle
  const showToggle = hasPhotos && hasDrawings;

  return (
    <div className="space-y-4">
      {/* View toggle */}
      {showToggle && (
        <div className="flex items-center justify-center gap-1 p-1 bg-slate-100 rounded-lg w-fit mx-auto">
          <button
            onClick={() => setViewMode('photo')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              viewMode === 'photo'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
            aria-pressed={viewMode === 'photo'}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Photo</span>
          </button>
          <button
            onClick={() => setViewMode('drawing')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              viewMode === 'drawing'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
            aria-pressed={viewMode === 'drawing'}
          >
            <FileText className="h-4 w-4" />
            <span>Drawing</span>
          </button>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'photo' && hasPhotos && (
        <ProductImageGallery images={images} productTitle={productTitle} />
      )}

      {viewMode === 'drawing' && hasDrawings && (
        <DrawingViewer documents={drawingDocuments} productTitle={productTitle} />
      )}

      {/* Fallback if current view mode has no content */}
      {viewMode === 'photo' && !hasPhotos && (
        <ProductImageGallery images={[]} productTitle={productTitle} />
      )}
      {viewMode === 'drawing' && !hasDrawings && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 aspect-square flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-24 w-24 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No technical drawings available</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface DrawingViewerProps {
  documents: PublicProductDocument[];
  productTitle: string;
}

function DrawingViewer({ documents, productTitle }: DrawingViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedDoc = documents[selectedIndex];

  // Check if document is a PDF (can be embedded)
  const isPdf =
    selectedDoc.type === 'CAD_2D_PDF' ||
    selectedDoc.fileUrl.toLowerCase().endsWith('.pdf');

  const getFormatLabel = (type: ProductDocumentType): string => {
    switch (type) {
      case 'CAD_2D_PDF':
        return 'PDF Drawing';
      case 'CAD_2D_DXF':
        return 'DXF';
      case 'CAD_2D_DWG':
        return 'DWG';
      case 'CAD_DRAWING':
        return 'Drawing';
      default:
        return 'Document';
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Main viewer */}
      <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isPdf ? (
          // Embed PDF for viewing
          <div className="aspect-square bg-slate-100">
            <iframe
              src={`${selectedDoc.fileUrl}#view=FitH`}
              className="w-full h-full"
              title={`${productTitle} - ${selectedDoc.name}`}
            />
          </div>
        ) : (
          // Non-PDF: show download card
          <div className="aspect-square flex items-center justify-center bg-slate-50">
            <div className="text-center p-8 max-w-sm">
              <div className="w-20 h-20 mx-auto mb-6 bg-primary-100 rounded-2xl flex items-center justify-center">
                <FileText className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {selectedDoc.name}
              </h3>
              <p className="text-sm text-slate-500 mb-1">
                {getFormatLabel(selectedDoc.type)} format
              </p>
              {selectedDoc.fileSize && (
                <p className="text-xs text-slate-400 mb-6">
                  {formatFileSize(selectedDoc.fileSize)}
                </p>
              )}
              <a
                href={selectedDoc.fileUrl}
                download
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download Drawing
              </a>
            </div>
          </div>
        )}

        {/* Open in new tab button for PDFs */}
        {isPdf && (
          <a
            href={selectedDoc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4 text-slate-700" />
          </a>
        )}
      </div>

      {/* Drawing selector (if multiple) */}
      {documents.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {documents.map((doc, index) => (
            <button
              key={doc.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                index === selectedIndex
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              )}
            >
              {getFormatLabel(doc.type)}
              {doc.fileSize && (
                <span className="ml-2 text-xs text-slate-400">
                  ({formatFileSize(doc.fileSize)})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Download info */}
      <p className="text-xs text-slate-500 text-center">
        {isPdf
          ? 'PDF preview shown above. Click the icon to open full screen.'
          : `This ${getFormatLabel(selectedDoc.type)} file requires CAD software to view.`}
      </p>
    </div>
  );
}
