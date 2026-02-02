import { FileText, Download, File } from 'lucide-react';
import { PublicProductDocument } from '@/lib/api';

interface DocumentsTabProps {
  documents: PublicProductDocument[];
}

// Get icon based on document type
function getDocumentIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'datasheet':
    case 'technical_datasheet':
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
function formatDocumentType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
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

  return (
    <div className="py-6">
      <ul className="space-y-3">
        {documents.map((doc) => {
          const Icon = getDocumentIcon(doc.type);
          return (
            <li key={doc.id}>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                  <Icon className="h-5 w-5 text-slate-500 group-hover:text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatDocumentType(doc.type)}
                    {doc.fileSize && ` • ${formatFileSize(doc.fileSize)}`}
                  </p>
                </div>
                <Download className="h-5 w-5 text-slate-400 group-hover:text-primary-600 flex-shrink-0" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
