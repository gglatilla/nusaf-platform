'use client';

import Link from 'next/link';
import { MapPin, Clock } from 'lucide-react';
import { DeliveryNoteStatusBadge } from '@/components/delivery-notes/DeliveryNoteStatusBadge';
import type { OrderDeliveryNoteSummary } from '@/lib/api';

interface DeliveryNotesSectionProps {
  deliveryNotes: OrderDeliveryNoteSummary[];
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

export function DeliveryNotesSection({ deliveryNotes }: DeliveryNotesSectionProps) {
  if (!deliveryNotes || deliveryNotes.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Delivery Notes</h2>
        <span className="text-sm text-slate-500">{deliveryNotes.length} note{deliveryNotes.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-3">
        {deliveryNotes.map((dn) => (
          <div
            key={dn.id}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/delivery-notes/${dn.id}`}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                {dn.deliveryNoteNumber}
              </Link>
              <DeliveryNoteStatusBadge status={dn.status} />
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {getLocationLabel(dn.location)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {dn.deliveredAt ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Delivered {formatShortDate(dn.deliveredAt)}
                </span>
              ) : dn.dispatchedAt ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Dispatched {formatShortDate(dn.dispatchedAt)}
                </span>
              ) : (
                <span>Created {formatShortDate(dn.createdAt)}</span>
              )}
              <span className="text-slate-500">{dn.lineCount} line{dn.lineCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
