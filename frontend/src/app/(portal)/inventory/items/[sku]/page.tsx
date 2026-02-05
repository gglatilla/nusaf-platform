'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, ExternalLink, Loader2 } from 'lucide-react';
import { useUpdateProduct, useCategories } from '@/hooks/useProducts';
import { useProductWithInventory } from '@/hooks/useProductInventory';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';
import type { UpdateProductData } from '@/lib/api';

export default function InventoryItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sku = params.sku as string;

  const { user, isLoading: authLoading } = useAuthStore();
  const { data: product, isLoading: productLoading, error: productError } = useProductWithInventory(sku);
  const { data: categories = [] } = useCategories();
  const updateProduct = useUpdateProduct();

  // Check access
  const isInternal = user && ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'PURCHASER'].includes(user.role);
  const canEdit = user && ['ADMIN', 'MANAGER'].includes(user.role);
  const canViewCosts = user && ['ADMIN', 'MANAGER'].includes(user.role);

  // Form state
  const [formData, setFormData] = useState<Partial<UpdateProductData>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when product loads
  useEffect(() => {
    if (product) {
      setFormData({
        description: product.description || '',
        unitOfMeasure: product.unitOfMeasure || 'EACH',
        productType: product.productType || 'STOCK_ONLY',
        categoryId: product.categoryId || undefined,
        subCategoryId: product.subCategoryId || undefined,
        weight: product.weight || undefined,
        leadTimeDays: product.leadTimeDays || undefined,
        defaultReorderPoint: product.defaultReorderPoint || undefined,
        defaultReorderQty: product.defaultReorderQty || undefined,
        defaultMinStock: product.defaultMinStock || undefined,
        defaultMaxStock: product.defaultMaxStock || undefined,
      });
    }
  }, [product]);

  // Redirect non-internal users
  useEffect(() => {
    if (!authLoading && user && !isInternal) {
      router.push('/dashboard');
    }
  }, [user, authLoading, isInternal, router]);

  const handleFieldChange = (field: keyof UpdateProductData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!product || !canEdit) return;

    setIsSaving(true);
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: formData as UpdateProductData,
      });
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading states
  if (authLoading || productLoading) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-96 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!isInternal) {
    return null;
  }

  if (productError || !product) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Item not found or failed to load.
        </div>
      </div>
    );
  }

  // Get category and subcategory names
  const category = categories.find(c => c.id === product.categoryId);
  const subCategory = category?.subCategories?.find(s => s.id === product.subCategoryId);

  // Format price
  const formatPrice = (price: number | null | undefined) => {
    if (!price) return '—';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
  };

  // Item type label
  const typeLabel = product.productType === 'ASSEMBLY_REQUIRED' ? 'Assembly Required'
    : product.productType === 'MADE_TO_ORDER' ? 'Made to Order'
    : product.productType === 'KIT' ? 'Kit'
    : 'Stock Only';

  return (
    <>
      <PageHeader
        title={product.nusafSku}
        description={product.description}
        actions={
          <div className="flex items-center gap-3">
            {/* Link to marketing edit if stock item */}
            {product.productType === 'STOCK_ONLY' && (
              <Link
                href={`/catalog/${product.nusafSku}/edit`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" />
                Edit Marketing
              </Link>
            )}
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            )}
          </div>
        }
      />

      <div className="p-4 sm:p-6 xl:p-8">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/inventory/items"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Items
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <section className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={product.nusafSku}
                    disabled
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono"
                  />
                  <p className="mt-1 text-xs text-slate-500">SKU cannot be changed after creation</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Item Type</label>
                  {canEdit ? (
                    <select
                      value={formData.productType || 'STOCK_ONLY'}
                      onChange={(e) => handleFieldChange('productType', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="STOCK_ONLY">Stock Only</option>
                      <option value="ASSEMBLY_REQUIRED">Assembly Required</option>
                      <option value="MADE_TO_ORDER">Made to Order</option>
                      <option value="KIT">Kit</option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                      {typeLabel}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  {canEdit ? (
                    <input
                      type="text"
                      value={formData.description || ''}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                      {product.description || '—'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit of Measure</label>
                  {canEdit ? (
                    <select
                      value={formData.unitOfMeasure || 'EACH'}
                      onChange={(e) => handleFieldChange('unitOfMeasure', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="EACH">Each</option>
                      <option value="METER">Meter</option>
                      <option value="KG">Kilogram</option>
                      <option value="SET">Set</option>
                      <option value="PAIR">Pair</option>
                      <option value="BOX">Box</option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                      {product.unitOfMeasure || 'Each'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                  {canEdit ? (
                    <input
                      type="number"
                      step="0.001"
                      value={formData.weight || ''}
                      onChange={(e) => handleFieldChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0.00"
                    />
                  ) : (
                    <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                      {product.weight ? `${product.weight} kg` : '—'}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Supplier & Lead Time */}
            <section className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Supplier & Lead Time</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                  <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                    {product.supplierName || '—'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Supplier SKU</label>
                  <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono">
                    {product.supplierSku || '—'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lead Time (days)</label>
                  {canEdit ? (
                    <input
                      type="number"
                      value={formData.supplierLeadDays || ''}
                      onChange={(e) => handleFieldChange('supplierLeadDays', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="14"
                    />
                  ) : (
                    <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                      {product.supplierLeadDays ? `${product.supplierLeadDays} days` : '—'}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Costs & Pricing - Only for Admin/Manager */}
            {canViewCosts && (
              <section className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Costs & Pricing</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price</label>
                    <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                      {formatPrice(product.costPrice)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">List Price</label>
                    <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                      {formatPrice(product.listPrice)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Margin</label>
                    <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                      {product.costPrice && product.listPrice
                        ? `${(((product.listPrice - product.costPrice) / product.listPrice) * 100).toFixed(1)}%`
                        : '—'}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Pricing is managed through supplier imports. Edit in Pricing settings.
                </p>
              </section>
            )}

            {/* Stock Settings */}
            <section className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Stock Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Point</label>
                  {canEdit ? (
                    <input
                      type="number"
                      value={formData.reorderPoint || ''}
                      onChange={(e) => handleFieldChange('reorderPoint', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0"
                    />
                  ) : (
                    <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                      {product.reorderPoint ?? '—'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Qty</label>
                  {canEdit ? (
                    <input
                      type="number"
                      value={formData.reorderQty || ''}
                      onChange={(e) => handleFieldChange('reorderQty', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0"
                    />
                  ) : (
                    <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                      {product.reorderQty ?? '—'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min Stock</label>
                  {canEdit ? (
                    <input
                      type="number"
                      value={formData.minStock || ''}
                      onChange={(e) => handleFieldChange('minStock', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0"
                    />
                  ) : (
                    <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                      {product.minStock ?? '—'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Stock</label>
                  {canEdit ? (
                    <input
                      type="number"
                      value={formData.maxStock || ''}
                      onChange={(e) => handleFieldChange('maxStock', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0"
                    />
                  ) : (
                    <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                      {product.maxStock ?? '—'}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Item Type Badge */}
            <section className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="text-center">
                <span className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full ${
                  product.productType === 'FINISHED_GOOD' ? 'bg-green-100 text-green-800' :
                  product.productType === 'RAW_MATERIAL' ? 'bg-amber-100 text-amber-800' :
                  product.productType === 'COMPONENT' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {typeLabel}
                </span>
              </div>
            </section>

            {/* Category */}
            <section className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Category</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-500">Category</span>
                  <p className="text-sm text-slate-900">{category?.name || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Subcategory</span>
                  <p className="text-sm text-slate-900">{subCategory?.name || '—'}</p>
                </div>
              </div>
            </section>

            {/* Current Stock */}
            <section className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Current Stock</h3>
              {product.stockSummary ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Available</span>
                    <span className="text-sm font-medium text-slate-900">
                      {product.stockSummary.totalAvailable ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Reserved</span>
                    <span className="text-sm font-medium text-slate-900">
                      {product.stockSummary.totalReserved ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">On Order</span>
                    <span className="text-sm font-medium text-slate-900">
                      {product.stockSummary.totalOnOrder ?? 0}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between">
                    <span className="text-sm font-medium text-slate-700">Total On Hand</span>
                    <span className="text-sm font-bold text-slate-900">
                      {product.stockSummary.totalOnHand ?? 0}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No stock data available</p>
              )}
              <Link
                href="/inventory"
                className="mt-4 block text-sm text-primary-600 hover:text-primary-700"
              >
                View Stock Details →
              </Link>
            </section>

            {/* Quick Links */}
            {product.productType === 'FINISHED_GOOD' && (
              <section className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <Link
                    href={`/catalog/${product.nusafSku}/edit`}
                    className="block text-sm text-primary-600 hover:text-primary-700"
                  >
                    Edit Marketing Content →
                  </Link>
                  {product.isPublished && (
                    <a
                      href={`/products/${product.nusafSku}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-primary-600 hover:text-primary-700"
                    >
                      View on Website →
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
