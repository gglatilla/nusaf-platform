'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Star, MapPin, Phone, Truck, CreditCard } from 'lucide-react';
import type { CompanyDetail, CompanyAddress } from '@/lib/api';
import {
  useCreateCompanyAddress,
  useUpdateCompanyAddress,
  useDeleteCompanyAddress,
} from '@/hooks/useCustomers';
import { AddressFormModal, type AddressFormData } from './AddressFormModal';

interface AddressesTabProps {
  customer: CompanyDetail;
  canEdit: boolean;
}

function AddressCard({
  address,
  canEdit,
  onEdit,
  onSetDefault,
  onDelete,
  settingDefault,
}: {
  address: CompanyAddress;
  canEdit: boolean;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  settingDefault: boolean;
}): JSX.Element {
  const isShipping = address.type === 'SHIPPING';
  const TypeIcon = isShipping ? Truck : CreditCard;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <TypeIcon className="h-4 w-4 text-slate-400" />
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            isShipping ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
          }`}>
            {isShipping ? 'Shipping' : 'Billing'}
          </span>
          {address.isDefault && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
              <Star className="h-3 w-3" />
              Default
            </span>
          )}
          {address.label && (
            <span className="text-sm font-medium text-slate-700">{address.label}</span>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-1">
            {!address.isDefault && (
              <button
                onClick={onSetDefault}
                disabled={settingDefault}
                className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors"
                title="Set as default"
              >
                <Star className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={onEdit}
              className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-slate-300 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-slate-700">
          <p>{address.line1}</p>
          {address.line2 && <p>{address.line2}</p>}
          <p>
            {[address.suburb, address.city].filter(Boolean).join(', ')}
          </p>
          <p>
            {address.province}{address.postalCode ? `, ${address.postalCode}` : ''}
          </p>
          {address.country !== 'South Africa' && <p>{address.country}</p>}
        </div>
      </div>

      {address.deliveryInstructions && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Delivery Instructions</p>
          <p className="text-sm text-slate-600">{address.deliveryInstructions}</p>
        </div>
      )}

      {(address.contactName || address.contactPhone) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-sm text-slate-600">
            {[address.contactName, address.contactPhone].filter(Boolean).join(' — ')}
          </span>
        </div>
      )}
    </div>
  );
}

export function AddressesTab({ customer, canEdit }: AddressesTabProps): JSX.Element {
  const createAddress = useCreateCompanyAddress();
  const updateAddress = useUpdateCompanyAddress();
  const deleteAddress = useDeleteCompanyAddress();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CompanyAddress | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (): void => {
    setEditingAddress(null);
    setModalOpen(true);
  };

  const handleEdit = (address: CompanyAddress): void => {
    setEditingAddress(address);
    setModalOpen(true);
  };

  const handleSubmit = async (data: AddressFormData): Promise<void> => {
    setError(null);
    const payload = {
      type: data.type,
      label: data.label || undefined,
      line1: data.line1,
      line2: data.line2 || undefined,
      suburb: data.suburb || undefined,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode,
      country: data.country || undefined,
      isDefault: data.isDefault,
      deliveryInstructions: data.deliveryInstructions || undefined,
      contactName: data.contactName || undefined,
      contactPhone: data.contactPhone || undefined,
    };

    if (editingAddress) {
      await updateAddress.mutateAsync({
        companyId: customer.id,
        addressId: editingAddress.id,
        data: payload,
      });
    } else {
      await createAddress.mutateAsync({
        companyId: customer.id,
        data: payload,
      });
    }
  };

  const handleSetDefault = async (address: CompanyAddress): Promise<void> => {
    setError(null);
    try {
      await updateAddress.mutateAsync({
        companyId: customer.id,
        addressId: address.id,
        data: { isDefault: true },
      });
    } catch {
      setError('Failed to set default address');
    }
  };

  const handleDelete = async (addressId: string): Promise<void> => {
    setError(null);
    try {
      await deleteAddress.mutateAsync({
        companyId: customer.id,
        addressId,
      });
      setDeletingId(null);
    } catch {
      setError('Failed to delete address');
    }
  };

  const shippingAddresses = customer.addresses.filter((a) => a.type === 'SHIPPING');
  const billingAddresses = customer.addresses.filter((a) => a.type === 'BILLING');

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add button */}
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Address
          </button>
        </div>
      )}

      {customer.addresses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No addresses added yet</p>
          {canEdit && (
            <button
              onClick={handleCreate}
              className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Add the first address
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Shipping Addresses */}
          {shippingAddresses.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                Shipping Addresses ({shippingAddresses.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shippingAddresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    canEdit={canEdit}
                    onEdit={() => handleEdit(address)}
                    onSetDefault={() => handleSetDefault(address)}
                    onDelete={() => setDeletingId(address.id)}
                    settingDefault={updateAddress.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Billing Addresses */}
          {billingAddresses.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                Billing Addresses ({billingAddresses.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {billingAddresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    canEdit={canEdit}
                    onEdit={() => handleEdit(address)}
                    onSetDefault={() => handleSetDefault(address)}
                    onDelete={() => setDeletingId(address.id)}
                    settingDefault={updateAddress.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Address</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete this address? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={deleteAddress.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteAddress.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Form Modal */}
      <AddressFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        address={editingAddress}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
