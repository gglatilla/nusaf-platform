'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, AlertCircle, CheckCircle, RefreshCw, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PricingRulesTable } from '@/components/admin/pricing/PricingRulesTable';
import { PricingRuleModal } from '@/components/admin/pricing/PricingRuleModal';
import {
  api,
  type GlobalSettings,
  type PricingRule,
  type ImportSupplier,
  type ImportCategory,
  type CreatePricingRuleData,
  type UpdatePricingRuleData,
  ApiError,
} from '@/lib/api';

type SettingsTab = 'exchange-rate' | 'pricing-rules' | 'categories';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('exchange-rate');

  // Exchange rate state
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [eurZarRate, setEurZarRate] = useState('');
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Recalculate prices state
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcMessage, setRecalcMessage] = useState<string | null>(null);

  // Pricing rules state
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [suppliers, setSuppliers] = useState<ImportSupplier[]>([]);
  const [categories, setCategories] = useState<ImportCategory[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isLoadingRef, setIsLoadingRef] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [deletingRule, setDeletingRule] = useState<PricingRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Shared state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch exchange rate settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await api.getSettings();
        if (response.success && response.data) {
          setSettings(response.data);
          setEurZarRate(response.data.eurZarRate.toString());
        }
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to load settings';
        setError(message);
      } finally {
        setIsLoadingSettings(false);
      }
    }

    fetchSettings();
  }, []);

  // Fetch reference data (suppliers, categories) for pricing rules
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
          setCategories(categoriesRes.data.categories || []);
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
    if (activeTab === 'pricing-rules') {
      fetchRules();
    }
  }, [fetchRules, activeTab]);

  // Handle save exchange rate
  const handleSaveRate = async () => {
    setError(null);
    setSuccess(null);

    const rate = parseFloat(eurZarRate);
    if (isNaN(rate) || rate <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    if (rate > 1000) {
      setError('Rate seems unreasonably high. Maximum is 1000.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.updateSettings({ eurZarRate: rate });
      if (response.success && response.data) {
        setSettings(response.data);
        setEurZarRate(response.data.eurZarRate.toString());
        setSuccess('Exchange rate saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save settings';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle recalculate all prices
  const handleRecalculateAll = async () => {
    setIsRecalculating(true);
    setRecalcMessage(null);
    setError(null);

    try {
      const response = await api.recalculatePrices();
      if (response.success && response.data) {
        setRecalcMessage(`Recalculated ${response.data.updated}/${response.data.total} products`);
        setTimeout(() => setRecalcMessage(null), 5000);
      } else {
        setError('Failed to recalculate prices');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to recalculate prices';
      setError(message);
    } finally {
      setIsRecalculating(false);
    }
  };

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

  // Handle save pricing rule (create or update)
  const handleSaveRule = async (
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

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if rate has changed
  const hasRateChanges = settings && parseFloat(eurZarRate) !== settings.eurZarRate;

  const tabs = [
    { id: 'exchange-rate' as const, label: 'Exchange Rate' },
    { id: 'pricing-rules' as const, label: 'Pricing Rules' },
    { id: 'categories' as const, label: 'Categories' },
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure pricing and system settings"
        actions={
          activeTab === 'pricing-rules' ? (
            <button
              onClick={handleAddRule}
              disabled={isLoadingRef}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Rule
            </button>
          ) : undefined
        }
      />

      <div className="p-6 lg:p-8">
        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="-mb-px flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setError(null);
                  setSuccess(null);
                }}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

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

        {/* Exchange Rate Tab */}
        {activeTab === 'exchange-rate' && (
          <div className="max-w-2xl">
            {/* Loading state */}
            {isLoadingSettings && (
              <div className="bg-white border border-slate-200 rounded-lg p-8">
                <div className="flex items-center justify-center gap-3 text-slate-500">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Loading settings...</span>
                </div>
              </div>
            )}

            {/* Settings form */}
            {!isLoadingSettings && (
              <div className="bg-white border border-slate-200 rounded-lg">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900">EUR/ZAR Exchange Rate</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Configure the EUR to ZAR exchange rate used for imported product pricing
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* EUR/ZAR Rate input */}
                  <div>
                    <label htmlFor="eurZarRate" className="block text-sm font-medium text-slate-700 mb-2">
                      EUR/ZAR Rate
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 max-w-xs">
                        <input
                          type="number"
                          id="eurZarRate"
                          value={eurZarRate}
                          onChange={(e) => {
                            setEurZarRate(e.target.value);
                            setError(null);
                          }}
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-md text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="20.50"
                        />
                      </div>
                      <span className="text-sm text-slate-500">ZAR per EUR</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      This rate is multiplied by the EUR price to get the base ZAR amount before margins
                    </p>
                  </div>

                  {/* Last updated info */}
                  {settings && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Last updated:</span>{' '}
                        {formatDate(settings.rateUpdatedAt)}
                        {settings.rateUpdatedBy && (
                          <span className="text-slate-500"> by Admin</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Pricing formula info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Pricing Formula</h3>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>Supplier Price (EUR) × EUR/ZAR Rate × (1 + Freight%) ÷ Margin Divisor × 1.40 = List Price</p>
                      <p className="text-xs text-blue-600 mt-2">
                        Note: Pricing rules for supplier/category combinations must also be configured in the Pricing Rules tab.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                  <button
                    onClick={handleSaveRate}
                    disabled={isSaving || !hasRateChanges}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Recalculate Prices Section */}
            {!isLoadingSettings && (
              <div className="bg-white border border-slate-200 rounded-lg mt-6">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900">Recalculate Product Prices</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Recalculate list prices for all products using current pricing rules and exchange rate
                  </p>
                </div>

                <div className="p-6">
                  <p className="text-sm text-slate-600 mb-4">
                    Use this to update all product prices after changing the exchange rate or pricing rules.
                    Products without matching pricing rules will remain as &quot;Price on Request&quot;.
                  </p>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleRecalculateAll}
                      disabled={isRecalculating}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md border border-slate-300 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRecalculating ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Recalculating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Recalculate All Prices
                        </>
                      )}
                    </button>

                    {recalcMessage && (
                      <div className="flex items-center gap-2 text-sm text-emerald-600">
                        <CheckCircle className="h-4 w-4" />
                        {recalcMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pricing Rules Tab */}
        {activeTab === 'pricing-rules' && (
          <>
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
          </>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="max-w-4xl">
            <div className="bg-white border border-slate-200 rounded-lg">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Product Categories</h2>
                <p className="text-sm text-slate-500 mt-1">
                  View all product categories and their codes used for pricing rules
                </p>
              </div>

              {/* Loading state */}
              {isLoadingRef && (
                <div className="p-8">
                  <div className="flex items-center justify-center gap-3 text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Loading categories...</span>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!isLoadingRef && categories.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-slate-500">No categories found</p>
                </div>
              )}

              {/* Categories table */}
              {!isLoadingRef && categories.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Category Name
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                          Subcategories
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {categories.map((category) => (
                        <tr key={category.code} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded font-mono text-sm bg-slate-100 text-slate-700">
                              {category.code}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-slate-900">{category.name}</p>
                              {category.subcategories.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {category.subcategories.map((sub) => (
                                    <div key={sub.code} className="flex items-center gap-2 text-sm text-slate-600">
                                      <span className="text-slate-400">└</span>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs bg-slate-100 text-slate-600">
                                        {sub.code}
                                      </span>
                                      <span>{sub.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-slate-500">
                            {category.subcategories.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary footer */}
              {!isLoadingRef && categories.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">{categories.length}</span> categories with{' '}
                    <span className="font-medium">
                      {categories.reduce((acc, cat) => acc + cat.subcategories.length, 0)}
                    </span>{' '}
                    subcategories
                  </p>
                </div>
              )}
            </div>

            {/* Info box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">About Category Codes</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>
                  Category codes are used to match products with pricing rules during import.
                </p>
                <p className="mt-2">
                  Subcategory codes follow the pattern <code className="font-mono bg-blue-100 px-1 rounded">X-NNN</code> where X is the category code and NNN is the subcategory number.
                </p>
              </div>
            </div>
          </div>
        )}
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
        onSave={handleSaveRule}
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
