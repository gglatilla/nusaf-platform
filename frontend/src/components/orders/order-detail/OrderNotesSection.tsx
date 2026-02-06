'use client';

interface OrderNotesSectionProps {
  customerNotes: string | null;
  internalNotes: string | null;
}

export function OrderNotesSection({ customerNotes, internalNotes }: OrderNotesSectionProps) {
  if (!customerNotes && !internalNotes) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Notes</h2>
      {customerNotes && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-700 mb-1">Customer Notes</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{customerNotes}</p>
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
