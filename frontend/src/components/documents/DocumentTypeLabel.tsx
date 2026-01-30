'use client';

import { FileText, FileCheck } from 'lucide-react';
import type { DocumentType } from '@/lib/api';
import { DOCUMENT_TYPE_LABELS } from '@/lib/api';

interface DocumentTypeLabelProps {
  type: DocumentType;
  showIcon?: boolean;
}

export function DocumentTypeLabel({ type, showIcon = true }: DocumentTypeLabelProps) {
  const label = DOCUMENT_TYPE_LABELS[type] || type;

  const Icon = type === 'CUSTOMER_PO' ? FileText : FileCheck;

  return (
    <span className="inline-flex items-center gap-1.5">
      {showIcon && <Icon className="h-4 w-4 text-slate-500" />}
      <span>{label}</span>
    </span>
  );
}
