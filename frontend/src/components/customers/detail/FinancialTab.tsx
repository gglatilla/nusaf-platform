'use client';

import { useState } from 'react';
import { Pencil, Save, X, Loader2 } from 'lucide-react';
import type { CompanyDetail, CreditStatusType } from '@/lib/api';
import { useUpdateCustomer } from '@/hooks/useCustomers';
import { formatCurrency, formatDate } from '@/lib/formatting';
import {
  CREDIT_STATUS_LABELS,
  CREDIT_STATUS_COLORS,
} from '@/components/customers/constants';

interface FinancialTabProps {
  customer: CompanyDetail;
  canEdit: boolean;
}

interface CreditFormData {
  creditLimit: string;
  creditStatus: string;
  discountOverride: string;
}

interface EmailFormData {
  statementEmail: string;
  invoiceEmail: string;
}

interface BbbeeFormData {
  bbbeeLevel: string;
  bbbeeExpiryDate: string;
}

function Section({
  title,
  isEditing,
  canEdit,
  onEdit,
  onSave,
  onCancel,
  saving,
  children,
}: {
  title: string;
  isEditing: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {canEdit && !isEditing && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
        {isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </button>
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

function DisplayField({ label, value, badge }: { label: string; value: string | null | undefined; badge?: { text: string; className: string } }): JSX.Element {
  return (
    <div>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">
        {badge ? (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
            {badge.text}
          </span>
        ) : (
          value || '—'
        )}
      </dd>
    </div>
  );
}

export function FinancialTab({ customer, canEdit }: FinancialTabProps): JSX.Element {
  const updateCustomer = useUpdateCustomer();

  // Credit edit state
  const [editingCredit, setEditingCredit] = useState(false);
  const [creditForm, setCreditForm] = useState<CreditFormData>({
    creditLimit: customer.creditLimit !== null ? String(customer.creditLimit) : '',
    creditStatus: customer.creditStatus || 'GOOD_STANDING',
    discountOverride: customer.discountOverride !== null ? String(customer.discountOverride) : '',
  });

  // Email edit state
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailForm, setEmailForm] = useState<EmailFormData>({
    statementEmail: customer.statementEmail || '',
    invoiceEmail: customer.invoiceEmail || '',
  });

  // B-BBEE edit state
  const [editingBbbee, setEditingBbbee] = useState(false);
  const [bbbeeForm, setBbbeeForm] = useState<BbbeeFormData>({
    bbbeeLevel: customer.bbbeeLevel !== null ? String(customer.bbbeeLevel) : '',
    bbbeeExpiryDate: customer.bbbeeExpiryDate
      ? customer.bbbeeExpiryDate.split('T')[0]
      : '',
  });

  const [error, setError] = useState<string | null>(null);

  const handleSaveCredit = async (): Promise<void> => {
    setError(null);
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        data: {
          creditLimit: creditForm.creditLimit ? Number(creditForm.creditLimit) : null,
          creditStatus: creditForm.creditStatus as CreditStatusType,
          discountOverride: creditForm.discountOverride ? Number(creditForm.discountOverride) : null,
        },
      });
      setEditingCredit(false);
    } catch {
      setError('Failed to update credit settings');
    }
  };

  const handleSaveEmail = async (): Promise<void> => {
    setError(null);
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        data: {
          statementEmail: emailForm.statementEmail || null,
          invoiceEmail: emailForm.invoiceEmail || null,
        },
      });
      setEditingEmail(false);
    } catch {
      setError('Failed to update email settings');
    }
  };

  const handleSaveBbbee = async (): Promise<void> => {
    setError(null);
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        data: {
          bbbeeLevel: bbbeeForm.bbbeeLevel ? Number(bbbeeForm.bbbeeLevel) : null,
          bbbeeExpiryDate: bbbeeForm.bbbeeExpiryDate || null,
        },
      });
      setEditingBbbee(false);
    } catch {
      setError('Failed to update B-BBEE information');
    }
  };

  const cancelCredit = (): void => {
    setCreditForm({
      creditLimit: customer.creditLimit !== null ? String(customer.creditLimit) : '',
      creditStatus: customer.creditStatus || 'GOOD_STANDING',
      discountOverride: customer.discountOverride !== null ? String(customer.discountOverride) : '',
    });
    setEditingCredit(false);
  };

  const cancelEmail = (): void => {
    setEmailForm({
      statementEmail: customer.statementEmail || '',
      invoiceEmail: customer.invoiceEmail || '',
    });
    setEditingEmail(false);
  };

  const cancelBbbee = (): void => {
    setBbbeeForm({
      bbbeeLevel: customer.bbbeeLevel !== null ? String(customer.bbbeeLevel) : '',
      bbbeeExpiryDate: customer.bbbeeExpiryDate
        ? customer.bbbeeExpiryDate.split('T')[0]
        : '',
    });
    setEditingBbbee(false);
  };

  const inputClass = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
  const selectClass = inputClass;

  const creditStatusBadge = customer.creditStatus
    ? {
        text: CREDIT_STATUS_LABELS[customer.creditStatus],
        className: CREDIT_STATUS_COLORS[customer.creditStatus],
      }
    : undefined;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Credit & Billing */}
      <Section
        title="Credit & Billing"
        isEditing={editingCredit}
        canEdit={canEdit}
        onEdit={() => setEditingCredit(true)}
        onSave={handleSaveCredit}
        onCancel={cancelCredit}
        saving={updateCustomer.isPending}
      >
        {editingCredit ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Credit Limit (ZAR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={creditForm.creditLimit}
                onChange={(e) => setCreditForm({ ...creditForm, creditLimit: e.target.value })}
                className={inputClass}
                placeholder="e.g. 50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Credit Status</label>
              <select
                value={creditForm.creditStatus}
                onChange={(e) => setCreditForm({ ...creditForm, creditStatus: e.target.value })}
                className={selectClass}
              >
                {Object.entries(CREDIT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Discount Override (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={creditForm.discountOverride}
                onChange={(e) => setCreditForm({ ...creditForm, discountOverride: e.target.value })}
                className={inputClass}
                placeholder="Leave empty for tier default"
              />
              <p className="mt-1 text-xs text-slate-500">Overrides the tier-based discount if set</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cash Account</label>
              <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                {customer.isCashAccount ? 'Yes' : 'No'}
                <span className="text-xs text-slate-400 ml-2">(read-only)</span>
              </div>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DisplayField
              label="Credit Limit"
              value={customer.creditLimit !== null ? formatCurrency(customer.creditLimit) : null}
            />
            <DisplayField
              label="Credit Status"
              value={null}
              badge={creditStatusBadge}
            />
            <DisplayField
              label="Discount Override"
              value={customer.discountOverride !== null ? `${customer.discountOverride}%` : null}
            />
            <DisplayField
              label="Cash Account"
              value={customer.isCashAccount ? 'Yes' : 'No'}
            />
          </dl>
        )}
      </Section>

      {/* Email Settings */}
      <Section
        title="Email Settings"
        isEditing={editingEmail}
        canEdit={canEdit}
        onEdit={() => setEditingEmail(true)}
        onSave={handleSaveEmail}
        onCancel={cancelEmail}
        saving={updateCustomer.isPending}
      >
        {editingEmail ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Statement Email</label>
              <input
                type="email"
                value={emailForm.statementEmail}
                onChange={(e) => setEmailForm({ ...emailForm, statementEmail: e.target.value })}
                className={inputClass}
                placeholder="statements@company.co.za"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Email</label>
              <input
                type="email"
                value={emailForm.invoiceEmail}
                onChange={(e) => setEmailForm({ ...emailForm, invoiceEmail: e.target.value })}
                className={inputClass}
                placeholder="invoices@company.co.za"
              />
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DisplayField label="Statement Email" value={customer.statementEmail} />
            <DisplayField label="Invoice Email" value={customer.invoiceEmail} />
          </dl>
        )}
      </Section>

      {/* B-BBEE Compliance */}
      <Section
        title="B-BBEE Compliance"
        isEditing={editingBbbee}
        canEdit={canEdit}
        onEdit={() => setEditingBbbee(true)}
        onSave={handleSaveBbbee}
        onCancel={cancelBbbee}
        saving={updateCustomer.isPending}
      >
        {editingBbbee ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">B-BBEE Level</label>
              <select
                value={bbbeeForm.bbbeeLevel}
                onChange={(e) => setBbbeeForm({ ...bbbeeForm, bbbeeLevel: e.target.value })}
                className={selectClass}
              >
                <option value="">Not set</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => (
                  <option key={level} value={level}>Level {level}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">B-BBEE Expiry Date</label>
              <input
                type="date"
                value={bbbeeForm.bbbeeExpiryDate}
                onChange={(e) => setBbbeeForm({ ...bbbeeForm, bbbeeExpiryDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DisplayField
              label="B-BBEE Level"
              value={customer.bbbeeLevel !== null ? `Level ${customer.bbbeeLevel}` : null}
            />
            <DisplayField
              label="B-BBEE Expiry"
              value={customer.bbbeeExpiryDate ? formatDate(customer.bbbeeExpiryDate) : null}
            />
          </dl>
        )}
      </Section>

      {/* Users (read-only) */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Users
          <span className="ml-2 text-sm font-normal text-slate-500">({customer.users.length})</span>
        </h2>
        {customer.users.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No users associated with this customer</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="pb-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="pb-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="pb-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customer.users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5 text-sm text-slate-900">{u.firstName} {u.lastName}</td>
                    <td className="py-2.5 text-sm text-slate-600">{u.email}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`inline-block h-2 w-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
