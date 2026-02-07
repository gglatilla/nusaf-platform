'use client';

import Link from 'next/link';
import { DeliveryNoteStatusBadge } from './DeliveryNoteStatusBadge';
import type { DeliveryNoteListItem } from '@/lib/api';

interface DeliveryNoteListTableProps {
  deliveryNotes: DeliveryNoteListItem[];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

function getLocationLabel(location: string): string {
  return location === 'JHB' ? 'Johannesburg' : 'Cape Town';
}

export function DeliveryNoteListTable({ deliveryNotes }: DeliveryNoteListTableProps) {
  if (deliveryNotes.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-sm">No delivery notes found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">DN Number</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Dispatched</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Delivered</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Lines</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {deliveryNotes.map((dn) => (
            <tr key={dn.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-sm">
                <Link
                  href={`/delivery-notes/${dn.id}`}
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  {dn.deliveryNoteNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm">
                <Link
                  href={`/orders/${dn.orderId}`}
                  className="text-primary-600 hover:text-primary-700"
                >
                  {dn.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">{dn.customerName}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{getLocationLabel(dn.location)}</td>
              <td className="px-4 py-3">
                <DeliveryNoteStatusBadge status={dn.status} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{formatDate(dn.dispatchedAt)}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{formatDate(dn.deliveredAt)}</td>
              <td className="px-4 py-3 text-sm text-slate-600 text-right">{dn.lineCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
