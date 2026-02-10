'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Star, Users, Mail, Phone } from 'lucide-react';
import type { CompanyDetail, CompanyContact, ContactRoleType } from '@/lib/api';
import {
  useCreateCompanyContact,
  useUpdateCompanyContact,
  useDeleteCompanyContact,
} from '@/hooks/useCustomers';
import { CONTACT_ROLE_LABELS, CONTACT_ROLE_COLORS } from '@/components/customers/constants';
import { ContactFormModal, type ContactFormData } from './ContactFormModal';

interface ContactsTabProps {
  customer: CompanyDetail;
  canEdit: boolean;
}

export function ContactsTab({ customer, canEdit }: ContactsTabProps): JSX.Element {
  const createContact = useCreateCompanyContact();
  const updateContact = useUpdateCompanyContact();
  const deleteContact = useDeleteCompanyContact();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CompanyContact | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (): void => {
    setEditingContact(null);
    setModalOpen(true);
  };

  const handleEdit = (contact: CompanyContact): void => {
    setEditingContact(contact);
    setModalOpen(true);
  };

  const handleSubmit = async (data: ContactFormData): Promise<void> => {
    setError(null);
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || undefined,
      mobile: data.mobile || undefined,
      jobTitle: data.jobTitle || undefined,
      contactRole: (data.contactRole || undefined) as ContactRoleType | undefined,
      isPrimary: data.isPrimary,
      isActive: data.isActive,
    };

    if (editingContact) {
      await updateContact.mutateAsync({
        companyId: customer.id,
        contactId: editingContact.id,
        data: payload,
      });
    } else {
      await createContact.mutateAsync({
        companyId: customer.id,
        data: payload,
      });
    }
  };

  const handleSetPrimary = async (contact: CompanyContact): Promise<void> => {
    setError(null);
    try {
      await updateContact.mutateAsync({
        companyId: customer.id,
        contactId: contact.id,
        data: { isPrimary: true },
      });
    } catch {
      setError('Failed to set primary contact');
    }
  };

  const handleDelete = async (contactId: string): Promise<void> => {
    setError(null);
    try {
      await deleteContact.mutateAsync({
        companyId: customer.id,
        contactId,
      });
      setDeletingId(null);
    } catch {
      setError('Failed to delete contact');
    }
  };

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
            Add Contact
          </button>
        </div>
      )}

      {customer.contacts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <Users className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No contacts added yet</p>
          {canEdit && (
            <button
              onClick={handleCreate}
              className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Add the first contact
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  {canEdit && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {customer.contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">
                          {contact.firstName} {contact.lastName}
                        </span>
                        {contact.isPrimary && (
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          {contact.email}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-600">
                        {contact.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.mobile && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{contact.mobile}</span>
                          </div>
                        )}
                        {!contact.phone && !contact.mobile && (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {contact.jobTitle || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {contact.contactRole ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          CONTACT_ROLE_COLORS[contact.contactRole] || 'bg-slate-100 text-slate-700'
                        }`}>
                          {CONTACT_ROLE_LABELS[contact.contactRole] || contact.contactRole}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block h-2 w-2 rounded-full ${
                        contact.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                      }`} />
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {!contact.isPrimary && (
                            <button
                              onClick={() => handleSetPrimary(contact)}
                              disabled={updateContact.isPending}
                              className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors"
                              title="Set as primary"
                            >
                              <Star className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(contact)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(contact.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Contact</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete this contact? This action cannot be undone.
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
                disabled={deleteContact.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteContact.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Form Modal */}
      <ContactFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contact={editingContact}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
