'use client';

import { Pencil, Trash2, AlertCircle } from 'lucide-react';
import { type PricingRule } from '@/lib/api';

interface PricingRulesTableProps {
  rules: PricingRule[];
  isLoading: boolean;
  onEdit: (rule: PricingRule) => void;
  onDelete: (rule: PricingRule) => void;
}

export function PricingRulesTable({ rules, isLoading, onEdit, onDelete }: PricingRulesTableProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded" />
        ))}
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No pricing rules configured</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Pricing rules determine how imported product prices are calculated. Without rules, products will show
          &quot;Price on Request&quot;.
        </p>
        <p className="text-sm text-slate-500 mt-4">
          Click <span className="font-medium">Add Rule</span> to create your first pricing rule.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Supplier
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              SubCategory
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
              Gross
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Discount
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Freight
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Margin
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {rules.map((rule) => (
            <tr key={rule.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-900">{rule.supplier.name}</div>
                <div className="text-xs text-slate-500">{rule.supplier.code}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-slate-900">{rule.category.name}</div>
                <div className="text-xs text-slate-500">{rule.category.code}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {rule.subCategory ? (
                  <>
                    <div className="text-sm text-slate-900">{rule.subCategory.name}</div>
                    <div className="text-xs text-slate-500">{rule.subCategory.code}</div>
                  </>
                ) : (
                  <span className="text-sm text-slate-400">All</span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center">
                {rule.isGross ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                    Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                    No
                  </span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                {rule.isGross && rule.discountPercent !== null ? (
                  <span className="text-slate-900">{rule.discountPercent}%</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-900">
                {rule.freightPercent}%
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-900">
                {rule.marginDivisor}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(rule)}
                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                    title="Edit rule"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(rule)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
