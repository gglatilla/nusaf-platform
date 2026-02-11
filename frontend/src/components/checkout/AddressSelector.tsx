'use client';

import { MapPin, Check } from 'lucide-react';
import type { CompanyAddress } from '@/lib/api';

interface AddressSelectorProps {
  addresses: CompanyAddress[];
  selectedId: string | null;
  onSelect: (addressId: string) => void;
  isLoading?: boolean;
}

function formatAddress(addr: CompanyAddress): string {
  const parts = [addr.line1, addr.line2, addr.suburb, addr.city, addr.province, addr.postalCode].filter(Boolean);
  return parts.join(', ');
}

export function AddressSelector({ addresses, selectedId, onSelect, isLoading }: AddressSelectorProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-slate-500">
        <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-2" />
        Loading addresses...
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg">
        <MapPin className="h-8 w-8 mx-auto mb-2 text-slate-300" />
        <p>No shipping addresses on file.</p>
        <p className="text-xs mt-1">The order will use your default warehouse address.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {addresses.map((addr) => {
        const isSelected = selectedId === addr.id;
        return (
          <button
            key={addr.id}
            type="button"
            onClick={() => onSelect(addr.id)}
            className={`relative text-left p-4 rounded-lg border-2 transition-colors ${
              isSelected
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {/* Selection indicator */}
            <div className={`absolute top-3 right-3 h-5 w-5 rounded-full flex items-center justify-center ${
              isSelected
                ? 'bg-primary-500 text-white'
                : 'border-2 border-slate-300'
            }`}>
              {isSelected && <Check className="h-3 w-3" />}
            </div>

            {/* Address content */}
            <div className="pr-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-slate-900">
                  {addr.label || `${addr.type === 'SHIPPING' ? 'Shipping' : 'Billing'} Address`}
                </span>
                {addr.isDefault && (
                  <span className="text-xs px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded font-medium">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">{formatAddress(addr)}</p>
              {addr.contactName && (
                <p className="text-xs text-slate-500 mt-1">
                  Contact: {addr.contactName}{addr.contactPhone ? ` (${addr.contactPhone})` : ''}
                </p>
              )}
              {addr.deliveryInstructions && (
                <p className="text-xs text-slate-400 mt-1 italic">
                  {addr.deliveryInstructions}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
