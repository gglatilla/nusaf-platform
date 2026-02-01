'use client';

import Link from 'next/link';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Supplier } from '@/lib/api';
import { useDeleteSupplier } from '@/hooks/useSuppliers';
import { SupplierFormModal } from './SupplierFormModal';

interface SupplierListTableProps {
  suppliers: Supplier[];
  isLoading: boolean;
  isAdmin: boolean;
  onRefresh: () => void;
}

export function SupplierListTable({
  suppliers,
  isLoading,
  isAdmin,
  onRefresh,
}: SupplierListTableProps) {
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const deleteSupplier = useDeleteSupplier();

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Are you sure you want to deactivate supplier "${supplier.name}"?`)) {
      return;
    }

    try {
      await deleteSupplier.mutateAsync(supplier.id);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete supplier:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-8 text-center text-slate-500">Loading suppliers...</div>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-8 text-center text-slate-500">No suppliers found</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Country
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Currency
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-slate-900">{supplier.code}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/admin/suppliers/${supplier.id}`}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {supplier.name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-slate-600">{supplier.country}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-slate-600">{supplier.currency}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-slate-600">{supplier._count?.products || 0}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      supplier.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setMenuOpen(menuOpen === supplier.id ? null : supplier.id)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>

                    {menuOpen === supplier.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 z-20 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                          <Link
                            href={`/admin/suppliers/${supplier.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            onClick={() => setMenuOpen(null)}
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Link>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingSupplier(supplier);
                                  setMenuOpen(null);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </button>
                              {supplier.isActive && (
                                <button
                                  onClick={() => {
                                    handleDelete(supplier);
                                    setMenuOpen(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Deactivate
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingSupplier && (
        <SupplierFormModal
          isOpen={true}
          supplier={editingSupplier}
          onClose={() => {
            setEditingSupplier(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
