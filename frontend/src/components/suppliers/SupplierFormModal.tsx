'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Supplier, SkuHandling, SupplierCurrency } from '@/lib/api';
import { useCreateSupplier, useUpdateSupplier } from '@/hooks/useSuppliers';

interface SupplierFormModalProps {
  isOpen: boolean;
  supplier?: Supplier | null;
  onClose: () => void;
}

const SKU_HANDLING_OPTIONS: { value: SkuHandling; label: string }[] = [
  { value: 'DIRECT', label: 'Direct (use supplier SKU)' },
  { value: 'TECOM_CONVERSION', label: 'Tecom Conversion' },
  { value: 'NUSAF_INTERNAL', label: 'Nusaf Internal' },
];

const CURRENCY_OPTIONS: { value: SupplierCurrency; label: string }[] = [
  { value: 'EUR', label: 'EUR (Euro)' },
  { value: 'ZAR', label: 'ZAR (South African Rand)' },
];

export function SupplierFormModal({ isOpen, supplier, onClose }: SupplierFormModalProps) {
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const isEdit = !!supplier;

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    country: 'Italy',
    currency: 'EUR' as SupplierCurrency,
    skuHandling: 'DIRECT' as SkuHandling,
    isLocal: false,
    email: '',
    phone: '',
    website: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    paymentTerms: '',
    minimumOrderValue: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (supplier) {
      setFormData({
        code: supplier.code,
        name: supplier.name,
        country: supplier.country,
        currency: supplier.currency,
        skuHandling: supplier.skuHandling,
        isLocal: supplier.isLocal,
        email: supplier.email || '',
        phone: supplier.phone || '',
        website: supplier.website || '',
        addressLine1: supplier.addressLine1 || '',
        addressLine2: supplier.addressLine2 || '',
        city: supplier.city || '',
        postalCode: supplier.postalCode || '',
        paymentTerms: supplier.paymentTerms || '',
        minimumOrderValue: supplier.minimumOrderValue?.toString() || '',
        notes: supplier.notes || '',
      });
    } else {
      setFormData({
        code: '',
        name: '',
        country: 'Italy',
        currency: 'EUR',
        skuHandling: 'DIRECT',
        isLocal: false,
        email: '',
        phone: '',
        website: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        postalCode: '',
        paymentTerms: '',
        minimumOrderValue: '',
        notes: '',
      });
    }
    setErrors({});
  }, [supplier, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    } else if (!/^[A-Za-z0-9_-]+$/.test(formData.code)) {
      newErrors.code = 'Code must only contain letters, numbers, hyphens, and underscores';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    if (formData.minimumOrderValue && isNaN(parseFloat(formData.minimumOrderValue))) {
      newErrors.minimumOrderValue = 'Must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        country: formData.country || undefined,
        currency: formData.currency,
        skuHandling: formData.skuHandling,
        isLocal: formData.isLocal,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        addressLine1: formData.addressLine1 || undefined,
        addressLine2: formData.addressLine2 || undefined,
        city: formData.city || undefined,
        postalCode: formData.postalCode || undefined,
        paymentTerms: formData.paymentTerms || undefined,
        minimumOrderValue: formData.minimumOrderValue
          ? parseFloat(formData.minimumOrderValue)
          : undefined,
        notes: formData.notes || undefined,
      };

      if (isEdit && supplier) {
        await updateSupplier.mutateAsync({ id: supplier.id, data });
      } else {
        await createSupplier.mutateAsync(data);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save supplier:', error);
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? 'Edit Supplier' : 'Add Supplier'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  disabled={isEdit}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.code ? 'border-red-300' : 'border-slate-200'
                  } ${isEdit ? 'bg-slate-100' : ''}`}
                  placeholder="SUPPLIER_CODE"
                />
                {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code}</p>}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.name ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder="Supplier Name"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Italy"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value as SupplierCurrency })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* SKU Handling */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  SKU Handling <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.skuHandling}
                  onChange={(e) =>
                    setFormData({ ...formData, skuHandling: e.target.value as SkuHandling })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {SKU_HANDLING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Is Local */}
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isLocal"
                  checked={formData.isLocal}
                  onChange={(e) => setFormData({ ...formData, isLocal: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isLocal" className="text-sm text-slate-700">
                  Local Supplier (ZAR pricing)
                </label>
              </div>

              {/* Divider */}
              <div className="col-span-2 border-t border-slate-200 my-2" />

              {/* Contact Info */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.email ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder="supplier@example.com"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="+39 123 456 7890"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.website ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder="https://www.supplier.com"
                />
                {errors.website && <p className="mt-1 text-xs text-red-600">{errors.website}</p>}
              </div>

              {/* Address */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Street address"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Suite, floor, building, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Milan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="20100"
                />
              </div>

              {/* Divider */}
              <div className="col-span-2 border-t border-slate-200 my-2" />

              {/* Business Terms */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="NET30, COD, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Minimum Order Value
                </label>
                <input
                  type="text"
                  value={formData.minimumOrderValue}
                  onChange={(e) =>
                    setFormData({ ...formData, minimumOrderValue: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.minimumOrderValue ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder="500.00"
                />
                {errors.minimumOrderValue && (
                  <p className="mt-1 text-xs text-red-600">{errors.minimumOrderValue}</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Additional notes about this supplier..."
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Supplier' : 'Create Supplier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
