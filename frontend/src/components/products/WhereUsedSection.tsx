'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useGetWhereUsed } from '@/hooks/useBom';

interface WhereUsedSectionProps {
  productId: string;
}

export function WhereUsedSection({ productId }: WhereUsedSectionProps) {
  const { data, isLoading, error } = useGetWhereUsed(productId);
  const [isExpanded, setIsExpanded] = useState(true);

  const usedIn = data?.usedIn ?? [];
  const hasItems = usedIn.length > 0;

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="p-4 flex items-center gap-2 text-slate-500">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-primary-600 rounded-full animate-spin" />
          <span className="text-sm">Loading where used...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="p-4 text-sm text-red-600">
          Failed to load where used data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg">
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <span className="font-medium text-slate-900">Where Used</span>
          <span className="text-sm text-slate-500">
            ({usedIn.length} {usedIn.length === 1 ? 'product' : 'products'})
          </span>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-slate-200">
          {!hasItems ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              This product is not used as a component in any other products.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Parent Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Qty per Unit
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">
                      View
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usedIn.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <span className="font-mono text-sm text-slate-900">
                          {item.nusafSku}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-700">
                        {item.description}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Link
                          href={`/products/${item.id}`}
                          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
