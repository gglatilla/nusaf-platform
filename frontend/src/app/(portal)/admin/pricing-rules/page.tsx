'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PricingRulesTable } from '@/components/admin/pricing/PricingRulesTable';
import { PricingRuleModal } from '@/components/admin/pricing/PricingRuleModal';
import {
  api,
  type PricingRule,
  type ImportSupplier,
  type ImportCategory,
  type CreatePricingRuleData,
  type UpdatePricingRuleData,
  ApiError,
} from '@/lib/api';

export default function PricingRulesPage() {
  // Data state
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [suppliers, setSuppliers] = useState<ImportSupplier[]>([]);
  const [categories, setCategories] = useState<ImportCategory[]>([]);

  // Filter state
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');

  // Loading/error state
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isLoadingRef, setIsLoadingRef] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [deletingRule, setDeletingRule] = useState<PricingRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch reference data (suppliers, categories)
  useEffect(() => {
    async function fetchRefData() {
      try {
        const [suppliersRes, categoriesRes] = await Promise.all([
          api.getImportSuppliers(),
          api.getImportCategories(),
        ]);

        if (suppliersRes.success && suppliersRes.data) {
          setSuppliers(suppliersRes.data);
        }
        if (categoriesRes.success && categoriesRes.data) {
          setCategories(categoriesRes.data);
        }
      } catch (err) {
        console.error('Failed to load reference data:', err);
      } finally {
        setIsLoadingRef(false);
      }
    }

    fetchRefData();
  }, []);

  // Fetch pricing rules
  const fetchRules = useCallback(async () => {
    setIsLoadingRules(true);
    setError(null);

    try {
      const response = await api.getPricingRules(selectedSupplier || undefined);
      if (response.success && response.data) {
        setRules(response.data);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load pricing rules';
      setError(message);
    } finally {
      setIsLoadingRules(false);
    }
  }, [selectedSupplier]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Handle add rule
  const handleAddRule = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  // Handle edit rule
  const handleEditRule = (rule: PricingRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (rule: PricingRule) => {
    setDeletingRule(rule);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingRule) return;

    setIsDeleting(true);
    setError(null);

    try {
      await api.deletePricingRule(deletingRule.id);
      setSuccess('Pricing rule deleted');
      setTimeout(() => setSuccess(null), 3000);
      setDeletingRule(null);
      fetchRules();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete pricing rule';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle save (create or update)
  const handleSave = async (
    data: CreatePricingRuleData | UpdatePricingRuleData,
    isEdit: boolean,
    ruleId?: string
  ) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit && ruleId) {
        await api.updatePricingRule(ruleId, data as UpdatePricingRuleData);
        setSuccess('Pricing rule updated');
      } else {
        await api.createPricingRule(data as CreatePricingRuleData);
        setSuccess('Pricing rule created');
      }

      setTimeout(() => setSuccess(null), 3000);
      setIsModalOpen(false);
      setEditingRule(null);
      fetchRules();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save pricing rule';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Pricing Rules"
        description="Configure pricing calculations for imported products"
        actions={
          <button
            onClick={handleAddRule}
            disabled={isLoadingRef}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Rule
          </button>
        }
      />

      <div className="p-6 lg:p-8">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <label htmlFor="supplierFilter" className="text-sm font-medium text-slate-700">
              Filter by Supplier:
            </label>
            <select
              id="supplierFilter"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            {isLoadingRules && (
              <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
            )}
          </div>
        </div>

        {/* Rules table */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <PricingRulesTable
            rules={rules}
            isLoading={isLoadingRules}
            onEdit={handleEditRule}
            onDelete={handleDeleteClick}
          />
        </div>

        {/* Info box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How Pricing Rules Work</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              Each rule defines how to calculate the list price for products from a specific supplier and category.
            </p>
            <p className="mt-2">
              <strong>Formula:</strong> Supplier Price × EUR/ZAR Rate × (1 + Freight%) ÷ Margin Divisor × 1.40
            </p>
            <p className="mt-2 text-xs text-blue-600">
              Products without a matching pricing rule will show &quot;Price on Request&quot;.
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <PricingRuleModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingRule(null);
        }}
        rule={editingRule}
        suppliers={suppliers}
        categories={categories}
        onSave={handleSave}
        isSubmitting={isSubmitting}
      />

      {/* Delete confirmation dialog */}
      {deletingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeletingRule(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Pricing Rule?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete the pricing rule for{' '}
              <strong>{deletingRule.supplier.name}</strong> /{' '}
              <strong>{deletingRule.category.name}</strong>
              {deletingRule.subCategory && (
                <>
                  {' '}/ <strong>{deletingRule.subCategory.name}</strong>
                </>
              )}
              ?
            </p>
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
              Products using this rule will show &quot;Price on Request&quot; until a new rule is created.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingRule(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Rule'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
