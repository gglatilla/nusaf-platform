'use client';

interface PONotesSectionProps {
  supplierNotes: string | null;
  internalNotes: string | null;
}

export function PONotesSection({ supplierNotes, internalNotes }: PONotesSectionProps) {
  if (!supplierNotes && !internalNotes) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Notes</h2>
      {supplierNotes && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-700 mb-1">Supplier Notes</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{supplierNotes}</p>
        </div>
      )}
      {internalNotes && (
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">Internal Notes</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{internalNotes}</p>
        </div>
      )}
    </div>
  );
}
