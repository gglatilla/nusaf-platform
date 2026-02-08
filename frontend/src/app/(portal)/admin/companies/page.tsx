'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Search, X, ChevronDown, Check, RefreshCw } from 'lucide-react';
import { api, type CompanyListItem, type PaymentTermsType, ApiError } from '@/lib/api';

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

function PaymentTermsBadge({ terms }: { terms: PaymentTermsType }) {
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

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
      {TIER_LABELS[tier] || tier}
    </span>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTerms, setEditingTerms] = useState<PaymentTermsType | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getCompanies({
        search: search || undefined,
        page,
        pageSize: 20,
      });
      if (response.success && response.data) {
        setCompanies(response.data.companies);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load companies';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCompanies();
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  const handleEditTerms = (company: CompanyListItem) => {
    setEditingId(company.id);
    setEditingTerms(company.paymentTerms);
  };

  const handleSaveTerms = async (companyId: string) => {
    if (!editingTerms) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateCompany(companyId, { paymentTerms: editingTerms });
      setSuccess('Payment terms updated');
      setTimeout(() => setSuccess(null), 3000);
      setEditingId(null);
      setEditingTerms(null);
      fetchCompanies();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update payment terms';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTerms(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-slate-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>
            <p className="text-sm text-slate-600">
              Manage customer companies and payment terms
            </p>
          </div>
        </div>
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
            placeholder="Search companies..."
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
          {total} {total === 1 ? 'company' : 'companies'}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center gap-3 text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading companies...</span>
          </div>
        ) : companies.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No companies found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Payment Terms
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Users
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
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{company.name}</p>
                        {company.tradingName && company.tradingName !== company.name && (
                          <p className="text-xs text-slate-500">t/a {company.tradingName}</p>
                        )}
                        {company.vatNumber && (
                          <p className="text-xs text-slate-400">VAT: {company.vatNumber}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TierBadge tier={company.tier} />
                    </td>
                    <td className="px-4 py-3">
                      {editingId === company.id ? (
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
                            onClick={() => handleSaveTerms(company.id)}
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
                          onClick={() => handleEditTerms(company)}
                          className="flex items-center gap-1 group"
                          title="Click to edit payment terms"
                        >
                          <PaymentTermsBadge terms={company.paymentTerms} />
                          <ChevronDown className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {company.primaryWarehouse || 'JHB'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-right">
                      {company._count.users}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-right">
                      {company._count.orders}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          company.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {company.isActive ? 'Active' : 'Inactive'}
                      </span>
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
    </div>
  );
}
