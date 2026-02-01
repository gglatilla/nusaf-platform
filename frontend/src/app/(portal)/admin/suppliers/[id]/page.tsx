'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Factory,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  FileText,
  Users,
  Edit,
  Plus,
  Trash2,
} from 'lucide-react';
import { useSupplier, useDeleteSupplierContact } from '@/hooks/useSuppliers';
import { useAuthStore } from '@/stores/auth-store';
import { SupplierFormModal } from '@/components/suppliers/SupplierFormModal';
import { ContactFormModal } from '@/components/suppliers/ContactFormModal';
import type { SupplierContact } from '@/lib/api';
import { cn } from '@/lib/utils';

type TabType = 'details' | 'contacts';

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-6 w-6 bg-slate-200 rounded" />
        <div className="h-8 bg-slate-200 rounded w-64" />
      </div>
      <div className="h-10 bg-slate-200 rounded w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-slate-200 rounded-lg" />
        <div className="h-64 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}

export default function SupplierDetailPage() {
  const params = useParams();
  const supplierId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<SupplierContact | null>(null);
  const { user } = useAuthStore();

  const { data: supplier, isLoading, error, refetch } = useSupplier(supplierId);
  const deleteContact = useDeleteSupplierContact();

  const isAdmin = user?.role === 'ADMIN';

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !supplier) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">Supplier not found</p>
        <Link href="/admin/suppliers" className="text-primary-600 hover:text-primary-700">
          Back to Suppliers
        </Link>
      </div>
    );
  }

  const handleDeleteContact = async (contact: SupplierContact) => {
    if (!confirm(`Are you sure you want to delete contact "${contact.firstName} ${contact.lastName}"?`)) {
      return;
    }

    try {
      await deleteContact.mutateAsync({ supplierId: supplier.id, contactId: contact.id });
      refetch();
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const tabs: { id: TabType; label: string; icon: typeof Factory }[] = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'contacts', label: 'Contacts', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/suppliers" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Factory className="h-6 w-6 text-slate-400" />
              <h1 className="text-2xl font-semibold text-slate-900">{supplier.name}</h1>
              <span
                className={cn(
                  'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                  supplier.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                {supplier.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-slate-600">Code: {supplier.code}</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Edit className="h-4 w-4" />
            Edit Supplier
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-0" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.id === 'contacts' && supplier.contacts && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                  {supplier.contacts.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Factory className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Supplier Code</dt>
                    <dd className="font-mono text-sm text-slate-900">{supplier.code}</dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Country</dt>
                    <dd className="text-sm text-slate-900">{supplier.country}</dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Currency</dt>
                    <dd className="text-sm text-slate-900">{supplier.currency}</dd>
                  </div>
                </div>

                {supplier.paymentTerms && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <dt className="text-xs text-slate-500 uppercase">Payment Terms</dt>
                      <dd className="text-sm text-slate-900">{supplier.paymentTerms}</dd>
                    </div>
                  </div>
                )}

                {supplier.minimumOrderValue && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <dt className="text-xs text-slate-500 uppercase">Minimum Order Value</dt>
                      <dd className="text-sm text-slate-900">
                        {new Intl.NumberFormat('en-ZA', {
                          style: 'currency',
                          currency: supplier.currency,
                        }).format(Number(supplier.minimumOrderValue))}
                      </dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplier.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <dt className="text-xs text-slate-500 uppercase">Email</dt>
                      <dd className="text-sm text-slate-900">
                        <a href={`mailto:${supplier.email}`} className="text-primary-600 hover:text-primary-700">
                          {supplier.email}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}

                {supplier.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <dt className="text-xs text-slate-500 uppercase">Phone</dt>
                      <dd className="text-sm text-slate-900">
                        <a href={`tel:${supplier.phone}`} className="text-primary-600 hover:text-primary-700">
                          {supplier.phone}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}

                {supplier.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <dt className="text-xs text-slate-500 uppercase">Website</dt>
                      <dd className="text-sm text-slate-900">
                        <a
                          href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {supplier.website}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}
              </dl>

              {!supplier.email && !supplier.phone && !supplier.website && (
                <p className="text-sm text-slate-500 italic">No contact information available</p>
              )}
            </div>

            {/* Address */}
            {(supplier.addressLine1 || supplier.city) && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Address</h2>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-900">
                    {supplier.addressLine1 && <p>{supplier.addressLine1}</p>}
                    {supplier.addressLine2 && <p>{supplier.addressLine2}</p>}
                    {(supplier.city || supplier.postalCode) && (
                      <p>
                        {supplier.city}
                        {supplier.city && supplier.postalCode && ', '}
                        {supplier.postalCode}
                      </p>
                    )}
                    <p>{supplier.country}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Products Count */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Products</h2>
              <p className="text-3xl font-bold text-slate-900">{supplier._count?.products || 0}</p>
              <p className="text-sm text-slate-500 mt-1">products from this supplier</p>
            </div>

            {/* Notes */}
            {supplier.notes && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Notes</h2>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{supplier.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="space-y-4">
          {/* Add Contact Button */}
          {isAdmin && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingContact(null);
                  setShowContactModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Contact
              </button>
            </div>
          )}

          {/* Contacts List */}
          {supplier.contacts && supplier.contacts.length > 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Phone
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {supplier.contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            {contact.firstName} {contact.lastName}
                          </span>
                          {contact.isPrimary && (
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                              Primary
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">{contact.role || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          {contact.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contact.phone ? (
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            {contact.phone}
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => {
                              setEditingContact(contact);
                              setShowContactModal(true);
                            }}
                            className="text-slate-400 hover:text-slate-600 p-1"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact)}
                            className="text-slate-400 hover:text-red-600 p-1 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
              No contacts found for this supplier
            </div>
          )}
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditModal && (
        <SupplierFormModal
          isOpen={true}
          supplier={supplier}
          onClose={() => {
            setShowEditModal(false);
            refetch();
          }}
        />
      )}

      {/* Contact Form Modal */}
      {showContactModal && (
        <ContactFormModal
          isOpen={true}
          supplierId={supplier.id}
          contact={editingContact}
          onClose={() => {
            setShowContactModal(false);
            setEditingContact(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
