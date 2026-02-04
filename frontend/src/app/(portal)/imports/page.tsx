'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ImportHistory } from '@/components/admin/imports/ImportHistory';
import { api, type ImportHistoryItem } from '@/lib/api';

export default function ImportsPage() {
  const [imports, setImports] = useState<ImportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getImportHistory()
      .then((res) => {
        if (res.success && res.data) {
          setImports(res.data);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch import history:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <>
      <PageHeader
        title="Price List Imports"
        description="Import and manage supplier product data"
        actions={
          <Link
            href="/imports/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Import
          </Link>
        }
      />

      <div className="p-4 sm:p-6 xl:p-8">
        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/imports/new"
            className="bg-white border border-slate-200 rounded-lg p-6 hover:border-primary-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <FileSpreadsheet className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary-600">
                  Import Price List
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a supplier Excel file to import products
                </p>
              </div>
            </div>
          </Link>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 opacity-60">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Export Products</h3>
                <p className="text-xs text-slate-400 mt-1">Coming soon</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 opacity-60">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Bulk Update Prices</h3>
                <p className="text-xs text-slate-400 mt-1">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Import history */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent Imports</h2>
          </div>
          <div className="p-6">
            <ImportHistory items={imports} isLoading={isLoading} />
          </div>
        </div>

        {/* Supported suppliers info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">Supported Suppliers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SupplierCard
              name="Tecom"
              country="Italy"
              note="SKU conversion applied"
            />
            <SupplierCard
              name="Chiaravalli"
              country="Italy"
              note="Direct SKU mapping"
            />
            <SupplierCard
              name="Regina"
              country="Italy"
              note="Direct SKU mapping"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">How to Import</h3>
          <ol className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs font-medium">
                1
              </span>
              <span>
                Prepare your Excel file with columns: <code className="bg-slate-200 px-1 rounded">CODE</code>,{' '}
                <code className="bg-slate-200 px-1 rounded">DESCRIPTION</code>,{' '}
                <code className="bg-slate-200 px-1 rounded">PRICE</code>,{' '}
                <code className="bg-slate-200 px-1 rounded">CATEGORY</code>, and optionally{' '}
                <code className="bg-slate-200 px-1 rounded">SUBCATEGORY</code>,{' '}
                <code className="bg-slate-200 px-1 rounded">UM</code>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs font-medium">
                2
              </span>
              <span>
                Category codes: <code className="bg-slate-200 px-1 rounded">C</code> (Conveyor),{' '}
                <code className="bg-slate-200 px-1 rounded">B</code> (Bearings),{' '}
                <code className="bg-slate-200 px-1 rounded">P</code> (Power Trans), etc.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs font-medium">
                3
              </span>
              <span>
                Subcategory codes: <code className="bg-slate-200 px-1 rounded">C-001</code>,{' '}
                <code className="bg-slate-200 px-1 rounded">B-001</code>, etc.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs font-medium">
                4
              </span>
              <span>Upload, map columns, review validation, and import</span>
            </li>
          </ol>
        </div>
      </div>
    </>
  );
}

interface SupplierCardProps {
  name: string;
  country: string;
  note: string;
}

function SupplierCard({ name, country, note }: SupplierCardProps) {
  return (
    <div className="bg-white rounded-lg border border-blue-100 p-4">
      <p className="font-medium text-blue-900">{name}</p>
      <p className="text-xs text-blue-700 mt-0.5">{country}</p>
      <p className="text-xs text-blue-600 mt-2">{note}</p>
    </div>
  );
}
