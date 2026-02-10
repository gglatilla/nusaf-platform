'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Building2, Search, X, ChevronDown, Check, RefreshCw, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseButton,
} from '@/components/ui/dialog';
import { api, type CompanyListItem, type StaffUserOption, type PaymentTermsType, ApiError } from '@/lib/api';

const PAYMENT_TERMS_LABELS: Record<PaymentTermsType, string> = {
  PREPAY: 'Prepay',
  COD: 'COD',
  NET_30: 'Net 30',
  NET_60: 'Net 60',
  NET_90: 'Net 90',
};

const PAYMENT_TERMS_OPTIONS: PaymentTermsType[] = ['PREPAY', 'COD', 'NET_30', 'NET_60', 'NET_90'];

const TIER_LABELS: Record<string, string> = {
  END_USER: 'End User',
  OEM_RESELLER: 'OEM/Reseller',
  DISTRIBUTOR: 'Distributor',
};

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  PROSPECT: 'Prospect',
  ACTIVE: 'Active',
  DORMANT: 'Dormant',
  CHURNED: 'Churned',
};

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  PROSPECT: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  DORMANT: 'bg-amber-100 text-amber-800',
  CHURNED: 'bg-red-100 text-red-800',
};

function PaymentTermsBadge({ terms }: { terms: PaymentTermsType }): JSX.Element {
  const isPrepay = terms === 'PREPAY' || terms === 'COD';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isPrepay
          ? 'bg-amber-100 text-amber-800'
          : 'bg-blue-100 text-blue-800'
      }`}
    >
      {PAYMENT_TERMS_LABELS[terms] || terms}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }): JSX.Element {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
      {TIER_LABELS[tier] || tier}
    </span>
  );
}

function AccountStatusBadge({ status }: { status: string }): JSX.Element {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        ACCOUNT_STATUS_COLORS[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {ACCOUNT_STATUS_LABELS[status] || status}
    </span>
  );
}

type EditField = 'terms' | 'salesRep';

export default function CustomersPage(): JSX.Element {
  const [customers, setCustomers] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editField, setEditField] = useState<EditField | null>(null);
  const [editingTerms, setEditingTerms] = useState<PaymentTermsType | null>(null);
  const [editingSalesRepId, setEditingSalesRepId] = useState<string | null>(null);

  // Staff users for sales rep dropdown
  const [staffUsers, setStaffUsers] = useState<StaffUserOption[]>([]);
  const [staffLoaded, setStaffLoaded] = useState(false);

  const fetchCustomers = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getCompanies({
        search: search || undefined,
        page,
        pageSize: 20,
      });
      if (response.success && response.data) {
        setCustomers(response.data.companies);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load customers';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Lazy-load staff users on first edit
  const ensureStaffLoaded = useCallback(async (): Promise<void> => {
    if (staffLoaded) return;
    try {
      const res = await api.getStaffUsersForAssignment();
      if (res.success && res.data) {
        setStaffUsers(res.data);
      }
    } catch {
      // Non-critical — dropdown will just be empty
    }
    setStaffLoaded(true);
  }, [staffLoaded]);

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleClearSearch = (): void => {
    setSearch('');
    setPage(1);
  };

  const handleCancelEdit = (): void => {
    setEditingId(null);
    setEditField(null);
    setEditingTerms(null);
    setEditingSalesRepId(null);
  };

  // --- Payment Terms inline edit ---
  const handleEditTerms = (customer: CompanyListItem): void => {
    setEditingId(customer.id);
    setEditField('terms');
    setEditingTerms(customer.paymentTerms);
  };

  const handleSaveTerms = async (customerId: string): Promise<void> => {
    if (!editingTerms) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateCompany(customerId, { paymentTerms: editingTerms });
      setSuccess('Payment terms updated');
      setTimeout(() => setSuccess(null), 3000);
      handleCancelEdit();
      fetchCustomers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update payment terms';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // --- Sales Rep inline edit ---
  const handleEditSalesRep = async (customer: CompanyListItem): Promise<void> => {
    await ensureStaffLoaded();
    setEditingId(customer.id);
    setEditField('salesRep');
    setEditingSalesRepId(customer.assignedSalesRepId);
  };

  const handleSaveSalesRep = async (customerId: string): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await api.updateCompany(customerId, {
        assignedSalesRepId: editingSalesRepId || null,
      });
      setSuccess('Sales rep updated');
      setTimeout(() => setSuccess(null), 3000);
      handleCancelEdit();
      fetchCustomers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update sales rep';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-slate-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
            <p className="text-sm text-slate-600">
              Manage customer accounts, payment terms, and sales rep assignments
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10 py-2 w-72 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </form>
        <span className="text-sm text-slate-500">
          {total} {total === 1 ? 'customer' : 'customers'}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center gap-3 text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading customers...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No customers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Payment Terms
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Sales Rep
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      {customer.accountNumber ? (
                        <span className="text-xs font-mono text-slate-500">{customer.accountNumber}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          {customer.name}
                        </Link>
                        {customer.tradingName && customer.tradingName !== customer.name && (
                          <p className="text-xs text-slate-500">t/a {customer.tradingName}</p>
                        )}
                        {customer.territory && (
                          <p className="text-xs text-slate-400">{customer.territory}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TierBadge tier={customer.tier} />
                    </td>
                    {/* Payment Terms — inline editable */}
                    <td className="px-4 py-3">
                      {editingId === customer.id && editField === 'terms' ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingTerms || ''}
                            onChange={(e) =>
                              setEditingTerms(e.target.value as PaymentTermsType)
                            }
                            className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            {PAYMENT_TERMS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {PAYMENT_TERMS_LABELS[opt]}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleSaveTerms(customer.id)}
                            disabled={saving}
                            className="p-1 text-emerald-600 hover:text-emerald-700"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditTerms(customer)}
                          className="flex items-center gap-1 group"
                          title="Click to edit payment terms"
                        >
                          <PaymentTermsBadge terms={customer.paymentTerms} />
                          <ChevronDown className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </td>
                    {/* Sales Rep — inline editable */}
                    <td className="px-4 py-3">
                      {editingId === customer.id && editField === 'salesRep' ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingSalesRepId || ''}
                            onChange={(e) => setEditingSalesRepId(e.target.value || null)}
                            className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-[180px]"
                          >
                            <option value="">Unassigned</option>
                            {staffUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.firstName} {u.lastName}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleSaveSalesRep(customer.id)}
                            disabled={saving}
                            className="p-1 text-emerald-600 hover:text-emerald-700"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditSalesRep(customer)}
                          className="flex items-center gap-1 group text-left"
                          title="Click to assign sales rep"
                        >
                          {customer.assignedSalesRep ? (
                            <span className="text-sm text-slate-700">
                              {customer.assignedSalesRep.firstName} {customer.assignedSalesRep.lastName}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400 italic">Unassigned</span>
                          )}
                          <ChevronDown className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {customer.primaryWarehouse || 'JHB'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-right">
                      {customer._count.orders}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AccountStatusBadge status={customer.accountStatus || 'ACTIVE'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Create Customer Modal */}
      <CreateCustomerModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreated={() => {
          setShowCreateModal(false);
          setSuccess('Customer created');
          setTimeout(() => setSuccess(null), 3000);
          fetchCustomers();
        }}
      />
    </div>
  );
}

// ---------- Create Customer Modal ----------

const TIER_OPTIONS = [
  { value: 'END_USER', label: 'End User (30% off list)' },
  { value: 'OEM_RESELLER', label: 'OEM/Reseller (40% off list)' },
  { value: 'DISTRIBUTOR', label: 'Distributor (50% off list)' },
];

function CreateCustomerModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}): JSX.Element {
  const [formData, setFormData] = useState({
    name: '',
    tradingName: '',
    registrationNumber: '',
    vatNumber: '',
    tier: 'END_USER' as 'END_USER' | 'OEM_RESELLER' | 'DISTRIBUTOR',
    primaryWarehouse: 'JHB' as 'JHB' | 'CT',
    paymentTerms: 'NET_30' as PaymentTermsType,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Customer name is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.createCompany({
        name: formData.name.trim(),
        tradingName: formData.tradingName.trim() || undefined,
        registrationNumber: formData.registrationNumber.trim() || undefined,
        vatNumber: formData.vatNumber.trim() || undefined,
        tier: formData.tier,
        primaryWarehouse: formData.primaryWarehouse,
        paymentTerms: formData.paymentTerms,
      });
      // Reset form
      setFormData({
        name: '',
        tradingName: '',
        registrationNumber: '',
        vatNumber: '',
        tier: 'END_USER',
        primaryWarehouse: 'JHB',
        paymentTerms: 'NET_30',
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Name (required) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Acme Manufacturing"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Trading Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Trading Name
                </label>
                <input
                  type="text"
                  value={formData.tradingName}
                  onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                  placeholder="Optional trading name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Registration + VAT side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="e.g. 2024/123456/07"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    VAT Number
                  </label>
                  <input
                    type="text"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    placeholder="e.g. 4123456789"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Tier */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Customer Tier
                </label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value as typeof formData.tier })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {TIER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouse + Payment Terms side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Primary Warehouse
                  </label>
                  <select
                    value={formData.primaryWarehouse}
                    onChange={(e) => setFormData({ ...formData, primaryWarehouse: e.target.value as 'JHB' | 'CT' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="JHB">Johannesburg</option>
                    <option value="CT">Cape Town</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value as PaymentTermsType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {PAYMENT_TERMS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {PAYMENT_TERMS_LABELS[opt]}
                      </option>
                    ))}
                  </select>
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
              disabled={saving || !formData.name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Creating...' : 'Create Customer'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
