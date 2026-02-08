'use client';

import Link from 'next/link';
import { MapPin, Clock, Download } from 'lucide-react';
import { PackingListStatusBadge } from '@/components/packing-lists/PackingListStatusBadge';
import { useDownloadPackingListPDF } from '@/hooks/usePackingLists';
import type { OrderPackingListSummary } from '@/lib/api';

interface PackingListsSectionProps {
  packingLists: OrderPackingListSummary[];
  isCustomer?: boolean;
}

function formatShortDate(dateString: string | null): string {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-ZA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function getLocationLabel(location: string): string {
  return location === 'JHB' ? 'Johannesburg' : 'Cape Town';
}

export function PackingListsSection({ packingLists, isCustomer = false }: PackingListsSectionProps) {
  const downloadPDF = useDownloadPackingListPDF();

  // Customers only see finalized packing lists
  const visible = isCustomer
    ? packingLists.filter((pl) => pl.status === 'FINALIZED')
    : packingLists;

  if (!visible || visible.length === 0) return null;

  const handleDownload = async (pl: OrderPackingListSummary) => {
    try {
      const blob = await downloadPDF.mutateAsync(pl.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pl.packingListNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Packing Lists</h2>
        <span className="text-sm text-slate-500">
          {visible.length} list{visible.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-3">
        {visible.map((pl) => (
          <div
            key={pl.id}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={isCustomer ? `/packing-lists/${pl.id}` : `/packing-lists/${pl.id}`}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                {pl.packingListNumber}
              </Link>
              <PackingListStatusBadge status={pl.status} />
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {getLocationLabel(pl.location)}
              </span>
              <span className="text-xs text-slate-500">
                {pl.packageCount} pkg{pl.packageCount !== 1 ? 's' : ''} &middot; {pl.lineCount} item{pl.lineCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatShortDate(pl.createdAt)}
              </span>
              {pl.status === 'FINALIZED' && (
                <button
                  onClick={() => handleDownload(pl)}
                  disabled={downloadPDF.isPending}
                  className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium"
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
