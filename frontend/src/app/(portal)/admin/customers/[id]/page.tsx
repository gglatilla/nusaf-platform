'use client';

import { useParams } from 'next/navigation';
import { Building2 } from 'lucide-react';

export default function CustomerDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-slate-400" />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Customer Detail</h1>
          <p className="text-sm text-slate-600">
            Customer ID: {id}
          </p>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
        Full customer detail page coming in Phase 1.8
      </div>
    </div>
  );
}
