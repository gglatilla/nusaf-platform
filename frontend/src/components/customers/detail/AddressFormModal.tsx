'use client';

import { useState, useEffect } from 'react';
import type { CompanyAddress } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseButton,
} from '@/components/ui/dialog';
import { SA_PROVINCES } from '@/components/customers/constants';

interface AddressFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: CompanyAddress | null;
  onSubmit: (data: AddressFormData) => Promise<void>;
}

export interface AddressFormData {
  type: 'BILLING' | 'SHIPPING';
  label: string;
  line1: string;
  line2: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  deliveryInstructions: string;
  contactName: string;
  contactPhone: string;
}

const EMPTY_FORM: AddressFormData = {
  type: 'SHIPPING',
  label: '',
  line1: '',
  line2: '',
  suburb: '',
  city: '',
  province: '',
  postalCode: '',
  country: 'South Africa',
  isDefault: false,
  deliveryInstructions: '',
  contactName: '',
  contactPhone: '',
};

export function AddressFormModal({ open, onOpenChange, address, onSubmit }: AddressFormModalProps): JSX.Element {
  const isEdit = !!address;
  const [formData, setFormData] = useState<AddressFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (address) {
        setFormData({
          type: address.type,
          label: address.label || '',
          line1: address.line1,
          line2: address.line2 || '',
          suburb: address.suburb || '',
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
          deliveryInstructions: address.deliveryInstructions || '',
          contactName: address.contactName || '',
          contactPhone: address.contactPhone || '',
        });
      } else {
        setFormData(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [open, address]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.line1.trim()) newErrors.line1 = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.province) newErrors.province = 'Province is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to save address' });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
  const errorInputClass = 'w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Address' : 'Add Address'}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <div className="space-y-4">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {errors.submit}
                </div>
              )}

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Address Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  {(['SHIPPING', 'BILLING'] as const).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="addressType"
                        value={type}
                        checked={formData.type === type}
                        onChange={() => setFormData({ ...formData, type })}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-700">{type === 'SHIPPING' ? 'Shipping' : 'Billing'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Head Office, Warehouse"
                />
              </div>

              {/* Line 1 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.line1}
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                  className={errors.line1 ? errorInputClass : inputClass}
                  placeholder="Street address"
                />
                {errors.line1 && <p className="mt-1 text-xs text-red-500">{errors.line1}</p>}
              </div>

              {/* Line 2 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={formData.line2}
                  onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                  className={inputClass}
                  placeholder="Building, floor, unit (optional)"
                />
              </div>

              {/* Suburb + City */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Suburb</label>
                  <input
                    type="text"
                    value={formData.suburb}
                    onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={errors.city ? errorInputClass : inputClass}
                  />
                  {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                </div>
              </div>

              {/* Province + Postal Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className={errors.province ? errorInputClass : inputClass}
                  >
                    <option value="">Select province...</option>
                    {SA_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {errors.province && <p className="mt-1 text-xs text-red-500">{errors.province}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className={errors.postalCode ? errorInputClass : inputClass}
                    placeholder="e.g. 2001"
                  />
                  {errors.postalCode && <p className="mt-1 text-xs text-red-500">{errors.postalCode}</p>}
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className={inputClass}
                />
              </div>

              {/* Is Default */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-700">Set as default {formData.type.toLowerCase()} address</span>
              </label>

              {/* Delivery Instructions (shipping only) */}
              {formData.type === 'SHIPPING' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Instructions</label>
                  <textarea
                    value={formData.deliveryInstructions}
                    onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
                    rows={2}
                    className={inputClass}
                    placeholder="e.g. Gate code 1234, use side entrance"
                  />
                </div>
              )}

              {/* Contact Name + Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className={inputClass}
                    placeholder="Delivery contact person"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. 011 123 4567"
                  />
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : isEdit ? 'Update Address' : 'Add Address'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
