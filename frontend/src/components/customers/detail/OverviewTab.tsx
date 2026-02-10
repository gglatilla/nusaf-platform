'use client';

import { useState } from 'react';
import { Pencil, Save, X, Loader2 } from 'lucide-react';
import type { CompanyDetail, StaffUserOption } from '@/lib/api';
import { useUpdateCustomer, useStaffUsersForAssignment } from '@/hooks/useCustomers';
import {
  TIER_LABELS,
  TIER_OPTIONS,
  ACCOUNT_STATUS_LABELS,
  PAYMENT_TERMS_LABELS,
  PAYMENT_TERMS_OPTIONS,
  FULFILLMENT_POLICY_LABELS,
  SHIPPING_METHOD_LABELS,
  WAREHOUSE_LABELS,
} from '@/components/customers/constants';
import type {
  PaymentTermsType,
  AccountStatusType,
  ShippingMethodType,
} from '@/lib/api';

interface OverviewTabProps {
  customer: CompanyDetail;
  canEdit: boolean;
}

interface CompanyFormData {
  name: string;
  tradingName: string;
  registrationNumber: string;
  vatNumber: string;
  tier: string;
  accountStatus: string;
  territory: string;
}

interface LogisticsFormData {
  primaryWarehouse: string;
  fulfillmentPolicy: string;
  defaultShippingMethod: string;
  paymentTerms: string;
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

function DisplayField({ label, value }: { label: string; value: string | null | undefined }): JSX.Element {
  return (
    <div>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value || '—'}</dd>
    </div>
  );
}

export function OverviewTab({ customer, canEdit }: OverviewTabProps): JSX.Element {
  const updateCustomer = useUpdateCustomer();
  const { data: staffUsers } = useStaffUsersForAssignment();

  // Company info edit state
  const [editingCompany, setEditingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState<CompanyFormData>({
    name: customer.name,
    tradingName: customer.tradingName || '',
    registrationNumber: customer.registrationNumber || '',
    vatNumber: customer.vatNumber || '',
    tier: customer.tier,
    accountStatus: customer.accountStatus || 'ACTIVE',
    territory: customer.territory || '',
  });

  // Logistics edit state
  const [editingLogistics, setEditingLogistics] = useState(false);
  const [logisticsForm, setLogisticsForm] = useState<LogisticsFormData>({
    primaryWarehouse: customer.primaryWarehouse || 'JHB',
    fulfillmentPolicy: customer.fulfillmentPolicy,
    defaultShippingMethod: customer.defaultShippingMethod || '',
    paymentTerms: customer.paymentTerms,
  });

  // Sales rep edit state
  const [editingSalesRep, setEditingSalesRep] = useState(false);
  const [salesRepId, setSalesRepId] = useState<string>(customer.assignedSalesRepId || '');

  // Notes edit state
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(customer.internalNotes || '');

  const [error, setError] = useState<string | null>(null);

  const handleSaveCompany = async (): Promise<void> => {
    setError(null);
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        data: {
          name: companyForm.name,
          tradingName: companyForm.tradingName || undefined,
          registrationNumber: companyForm.registrationNumber || undefined,
          vatNumber: companyForm.vatNumber || undefined,
          tier: companyForm.tier,
          accountStatus: companyForm.accountStatus as AccountStatusType,
          territory: companyForm.territory || null,
        },
      });
      setEditingCompany(false);
    } catch {
      setError('Failed to update company information');
    }
  };

  const handleSaveLogistics = async (): Promise<void> => {
    setError(null);
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        data: {
          primaryWarehouse: (logisticsForm.primaryWarehouse || null) as 'JHB' | 'CT' | null,
          fulfillmentPolicy: logisticsForm.fulfillmentPolicy,
          defaultShippingMethod: (logisticsForm.defaultShippingMethod || null) as ShippingMethodType | null,
          paymentTerms: logisticsForm.paymentTerms as PaymentTermsType,
        },
      });
      setEditingLogistics(false);
    } catch {
      setError('Failed to update logistics');
    }
  };

  const handleSaveSalesRep = async (): Promise<void> => {
    setError(null);
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        data: {
          assignedSalesRepId: salesRepId || null,
        },
      });
      setEditingSalesRep(false);
    } catch {
      setError('Failed to update sales rep');
    }
  };

  const handleSaveNotes = async (): Promise<void> => {
    setError(null);
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        data: {
          internalNotes: notes || null,
        },
      });
      setEditingNotes(false);
    } catch {
      setError('Failed to update notes');
    }
  };

  const cancelCompany = (): void => {
    setCompanyForm({
      name: customer.name,
      tradingName: customer.tradingName || '',
      registrationNumber: customer.registrationNumber || '',
      vatNumber: customer.vatNumber || '',
      tier: customer.tier,
      accountStatus: customer.accountStatus || 'ACTIVE',
      territory: customer.territory || '',
    });
    setEditingCompany(false);
  };

  const cancelLogistics = (): void => {
    setLogisticsForm({
      primaryWarehouse: customer.primaryWarehouse || 'JHB',
      fulfillmentPolicy: customer.fulfillmentPolicy,
      defaultShippingMethod: customer.defaultShippingMethod || '',
      paymentTerms: customer.paymentTerms,
    });
    setEditingLogistics(false);
  };

  const cancelSalesRep = (): void => {
    setSalesRepId(customer.assignedSalesRepId || '');
    setEditingSalesRep(false);
  };

  const cancelNotes = (): void => {
    setNotes(customer.internalNotes || '');
    setEditingNotes(false);
  };

  const inputClass = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
  const selectClass = inputClass;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <Section
            title="Company Information"
            isEditing={editingCompany}
            canEdit={canEdit}
            onEdit={() => setEditingCompany(true)}
            onSave={handleSaveCompany}
            onCancel={cancelCompany}
            saving={updateCustomer.isPending}
          >
            {editingCompany ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trading Name</label>
                  <input
                    type="text"
                    value={companyForm.tradingName}
                    onChange={(e) => setCompanyForm({ ...companyForm, tradingName: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={companyForm.registrationNumber}
                    onChange={(e) => setCompanyForm({ ...companyForm, registrationNumber: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. 2024/123456/07"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">VAT Number</label>
                  <input
                    type="text"
                    value={companyForm.vatNumber}
                    onChange={(e) => setCompanyForm({ ...companyForm, vatNumber: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. 4123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Tier</label>
                  <select
                    value={companyForm.tier}
                    onChange={(e) => setCompanyForm({ ...companyForm, tier: e.target.value })}
                    className={selectClass}
                  >
                    {TIER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Account Status</label>
                  <select
                    value={companyForm.accountStatus}
                    onChange={(e) => setCompanyForm({ ...companyForm, accountStatus: e.target.value })}
                    className={selectClass}
                  >
                    {Object.entries(ACCOUNT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Territory</label>
                  <input
                    type="text"
                    value={companyForm.territory}
                    onChange={(e) => setCompanyForm({ ...companyForm, territory: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Gauteng North"
                  />
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DisplayField label="Company Name" value={customer.name} />
                <DisplayField label="Trading Name" value={customer.tradingName} />
                <DisplayField label="Registration Number" value={customer.registrationNumber} />
                <DisplayField label="VAT Number" value={customer.vatNumber} />
                <DisplayField label="Customer Tier" value={TIER_LABELS[customer.tier] || customer.tier} />
                <DisplayField label="Account Status" value={ACCOUNT_STATUS_LABELS[customer.accountStatus || 'ACTIVE']} />
                <DisplayField label="Territory" value={customer.territory} />
              </dl>
            )}
          </Section>

          {/* Logistics */}
          <Section
            title="Logistics & Payment"
            isEditing={editingLogistics}
            canEdit={canEdit}
            onEdit={() => setEditingLogistics(true)}
            onSave={handleSaveLogistics}
            onCancel={cancelLogistics}
            saving={updateCustomer.isPending}
          >
            {editingLogistics ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Primary Warehouse</label>
                  <select
                    value={logisticsForm.primaryWarehouse}
                    onChange={(e) => setLogisticsForm({ ...logisticsForm, primaryWarehouse: e.target.value })}
                    className={selectClass}
                  >
                    <option value="JHB">Johannesburg</option>
                    <option value="CT">Cape Town</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fulfillment Policy</label>
                  <select
                    value={logisticsForm.fulfillmentPolicy}
                    onChange={(e) => setLogisticsForm({ ...logisticsForm, fulfillmentPolicy: e.target.value })}
                    className={selectClass}
                  >
                    {Object.entries(FULFILLMENT_POLICY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Default Shipping</label>
                  <select
                    value={logisticsForm.defaultShippingMethod}
                    onChange={(e) => setLogisticsForm({ ...logisticsForm, defaultShippingMethod: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">Not set</option>
                    {Object.entries(SHIPPING_METHOD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={logisticsForm.paymentTerms}
                    onChange={(e) => setLogisticsForm({ ...logisticsForm, paymentTerms: e.target.value })}
                    className={selectClass}
                  >
                    {PAYMENT_TERMS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{PAYMENT_TERMS_LABELS[opt]}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DisplayField label="Primary Warehouse" value={WAREHOUSE_LABELS[customer.primaryWarehouse || 'JHB'] || customer.primaryWarehouse} />
                <DisplayField label="Fulfillment Policy" value={FULFILLMENT_POLICY_LABELS[customer.fulfillmentPolicy] || customer.fulfillmentPolicy} />
                <DisplayField label="Default Shipping" value={customer.defaultShippingMethod ? SHIPPING_METHOD_LABELS[customer.defaultShippingMethod] : null} />
                <DisplayField label="Payment Terms" value={PAYMENT_TERMS_LABELS[customer.paymentTerms] || customer.paymentTerms} />
              </dl>
            )}
          </Section>
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-6">
          {/* Sales Rep */}
          <Section
            title="Sales Representative"
            isEditing={editingSalesRep}
            canEdit={canEdit}
            onEdit={() => setEditingSalesRep(true)}
            onSave={handleSaveSalesRep}
            onCancel={cancelSalesRep}
            saving={updateCustomer.isPending}
          >
            {editingSalesRep ? (
              <select
                value={salesRepId}
                onChange={(e) => setSalesRepId(e.target.value)}
                className={selectClass}
              >
                <option value="">Unassigned</option>
                {(staffUsers as StaffUserOption[] | undefined)?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                    {u.employeeCode ? ` (${u.employeeCode})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div>
                {customer.assignedSalesRep ? (
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {customer.assignedSalesRep.firstName} {customer.assignedSalesRep.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{customer.assignedSalesRep.email}</p>
                    {customer.assignedSalesRep.employeeCode && (
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        {customer.assignedSalesRep.employeeCode}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No sales rep assigned</p>
                )}
              </div>
            )}
          </Section>

          {/* Internal Notes */}
          <Section
            title="Internal Notes"
            isEditing={editingNotes}
            canEdit={canEdit}
            onEdit={() => setEditingNotes(true)}
            onSave={handleSaveNotes}
            onCancel={cancelNotes}
            saving={updateCustomer.isPending}
          >
            {editingNotes ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className={inputClass}
                placeholder="Add internal notes about this customer..."
              />
            ) : (
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {customer.internalNotes || <span className="text-slate-400 italic">No notes</span>}
              </p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
