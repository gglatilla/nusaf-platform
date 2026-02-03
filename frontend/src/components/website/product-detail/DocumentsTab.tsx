'use client';

import { FileText, Download, File, Ruler, Box } from 'lucide-react';
import { PublicProductDocument, ProductDocumentType } from '@/lib/api';

interface DocumentsTabProps {
  documents: PublicProductDocument[];
}

// Categorize document types
const CAD_2D_TYPES: ProductDocumentType[] = ['CAD_2D_DXF', 'CAD_2D_DWG', 'CAD_2D_PDF', 'CAD_DRAWING'];
const CAD_3D_TYPES: ProductDocumentType[] = [
  'CAD_3D_STEP',
  'CAD_3D_IGES',
  'CAD_3D_SAT',
  'CAD_3D_PARASOLID',
  'CAD_3D_SOLIDWORKS',
  'CAD_3D_INVENTOR',
  'CAD_3D_CATIA',
];

function isCAD2D(type: ProductDocumentType): boolean {
  return CAD_2D_TYPES.includes(type);
}

function isCAD3D(type: ProductDocumentType): boolean {
  return CAD_3D_TYPES.includes(type);
}

function isCAD(type: ProductDocumentType): boolean {
  return isCAD2D(type) || isCAD3D(type);
}

// Get icon based on document type
function getDocumentIcon(type: ProductDocumentType) {
  if (isCAD2D(type)) return Ruler;
  if (isCAD3D(type)) return Box;
  switch (type) {
    case 'DATASHEET':
      return FileText;
    default:
      return File;
  }
}

// Format file size
function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Format document type for display
function formatDocumentType(type: ProductDocumentType): string {
  // Handle CAD types specially
  const cadLabels: Partial<Record<ProductDocumentType, string>> = {
    CAD_2D_DXF: 'DXF',
    CAD_2D_DWG: 'DWG',
    CAD_2D_PDF: 'PDF Drawing',
    CAD_3D_STEP: 'STEP',
    CAD_3D_IGES: 'IGES',
    CAD_3D_SAT: 'SAT (ACIS)',
    CAD_3D_PARASOLID: 'Parasolid',
    CAD_3D_SOLIDWORKS: 'SolidWorks',
    CAD_3D_INVENTOR: 'Inventor',
    CAD_3D_CATIA: 'CATIA',
    CAD_DRAWING: 'Technical Drawing',
  };

  if (cadLabels[type]) return cadLabels[type];

  return type
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Get format extension hint
function getFormatHint(type: ProductDocumentType): string | null {
  const hints: Partial<Record<ProductDocumentType, string>> = {
    CAD_2D_DXF: '.dxf',
    CAD_2D_DWG: '.dwg',
    CAD_3D_STEP: '.stp, .step',
    CAD_3D_IGES: '.igs, .iges',
    CAD_3D_SAT: '.sat',
    CAD_3D_PARASOLID: '.x_t, .x_b',
    CAD_3D_SOLIDWORKS: '.sldprt',
    CAD_3D_INVENTOR: '.ipt',
    CAD_3D_CATIA: '.catpart',
  };
  return hints[type] || null;
}

interface DocumentItemProps {
  doc: PublicProductDocument;
  variant?: 'default' | 'cad';
}

function DocumentItem({ doc, variant = 'default' }: DocumentItemProps) {
  const Icon = getDocumentIcon(doc.type);
  const formatHint = getFormatHint(doc.type);

  const isCad = variant === 'cad';

  return (
    <a
      href={doc.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      download
      className={`flex items-center gap-4 p-4 border rounded-lg transition-colors group ${
        isCad
          ? 'bg-slate-50 border-slate-300 hover:border-primary-400 hover:bg-primary-50'
          : 'bg-white border-slate-200 hover:border-primary-300 hover:bg-primary-50'
      }`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          isCad
            ? 'bg-slate-200 group-hover:bg-primary-100'
            : 'bg-slate-100 group-hover:bg-primary-100'
        }`}
      >
        <Icon
          className={`h-5 w-5 ${
            isCad ? 'text-slate-600' : 'text-slate-500'
          } group-hover:text-primary-600`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
        <p className="text-xs text-slate-500">
          {formatDocumentType(doc.type)}
          {formatHint && <span className="text-slate-400 ml-1">({formatHint})</span>}
          {doc.fileSize && ` • ${formatFileSize(doc.fileSize)}`}
        </p>
      </div>
      <Download className="h-5 w-5 text-slate-400 group-hover:text-primary-600 flex-shrink-0" />
    </a>
  );
}

export function DocumentsTab({ documents }: DocumentsTabProps) {
  if (documents.length === 0) {
    return (
      <div className="py-8 text-center">
        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No documents available for this product.</p>
      </div>
    );
  }

  // Group documents
  const cad2dDocs = documents.filter((d) => isCAD2D(d.type));
  const cad3dDocs = documents.filter((d) => isCAD3D(d.type));
  const generalDocs = documents.filter((d) => !isCAD(d.type));

  const hasCADDocs = cad2dDocs.length > 0 || cad3dDocs.length > 0;

  return (
    <div className="py-6 space-y-8">
      {/* General Documents */}
      {generalDocs.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Documents
          </h3>
          <ul className="space-y-3">
            {generalDocs.map((doc) => (
              <li key={doc.id}>
                <DocumentItem doc={doc} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* CAD Downloads */}
      {hasCADDocs && (
        <section>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            CAD Downloads
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 2D CAD */}
            {cad2dDocs.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-500 mb-3">2D Formats</h4>
                <ul className="space-y-2">
                  {cad2dDocs.map((doc) => (
                    <li key={doc.id}>
                      <DocumentItem doc={doc} variant="cad" />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 3D CAD */}
            {cad3dDocs.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1">
                  <Box className="h-3 w-3" />
                  3D Formats
                </h4>
                <ul className="space-y-2">
                  {cad3dDocs.map((doc) => (
                    <li key={doc.id}>
                      <DocumentItem doc={doc} variant="cad" />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
