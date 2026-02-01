'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Factory, Plus, Search, X } from 'lucide-react';
import { useSuppliers } from '@/hooks/useSuppliers';
import { SupplierListTable } from '@/components/suppliers/SupplierListTable';
import { SupplierFormModal } from '@/components/suppliers/SupplierFormModal';
import { Pagination } from '@/components/products/Pagination';
import { useAuthStore } from '@/stores/auth-store';

export default function SuppliersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const searchParam = searchParams.get('search') || '';
  const activeParam = searchParams.get('active');
  const pageParam = searchParams.get('page');

  const [search, setSearch] = useState(searchParam);
  const [showActive, setShowActive] = useState<boolean | undefined>(
    activeParam === 'true' ? true : activeParam === 'false' ? false : undefined
  );
  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, refetch } = useSuppliers({
    search: search || undefined,
    isActive: showActive,
    page,
    pageSize: 20,
  });

  const updateUrl = (params: { search?: string; active?: boolean; page?: number }) => {
    const urlParams = new URLSearchParams();
    if (params.search) urlParams.set('search', params.search);
    if (params.active !== undefined) urlParams.set('active', params.active.toString());
    if (params.page && params.page > 1) urlParams.set('page', params.page.toString());

    const queryString = urlParams.toString();
    router.push(queryString ? `/admin/suppliers?${queryString}` : '/admin/suppliers');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateUrl({ search, active: showActive, page: 1 });
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
    updateUrl({ active: showActive, page: 1 });
  };

  const handleActiveToggle = (value: boolean | undefined) => {
    setShowActive(value);
    setPage(1);
    updateUrl({ search, active: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ search, active: showActive, page: newPage });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Factory className="h-8 w-8 text-slate-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Suppliers</h1>
            <p className="text-sm text-slate-600">Manage supplier information and contacts</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Supplier
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers..."
            className="pl-10 pr-10 py-2 w-64 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Active Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Status:</span>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => handleActiveToggle(undefined)}
              className={`px-3 py-1.5 text-sm ${
                showActive === undefined
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleActiveToggle(true)}
              className={`px-3 py-1.5 text-sm border-l border-slate-200 ${
                showActive === true
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleActiveToggle(false)}
              className={`px-3 py-1.5 text-sm border-l border-slate-200 ${
                showActive === false
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {data && (
          <span className="text-sm text-slate-600 ml-auto">
            {data.pagination.totalItems} supplier{data.pagination.totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Supplier List */}
      <SupplierListTable
        suppliers={data?.suppliers || []}
        isLoading={isLoading}
        isAdmin={isAdmin}
        onRefresh={refetch}
      />

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={data.pagination.totalPages}
          totalItems={data.pagination.totalItems}
          pageSize={data.pagination.pageSize}
          onPageChange={handlePageChange}
        />
      )}

      {/* Add Supplier Modal */}
      {isAdmin && (
        <SupplierFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
