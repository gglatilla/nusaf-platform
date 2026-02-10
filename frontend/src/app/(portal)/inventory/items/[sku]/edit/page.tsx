'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Save, Loader2 } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useUpdateProduct, useCategories } from '@/hooks/useProducts';
import { useProductWithInventory } from '@/hooks/useProductInventory';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/layout/PageHeader';
import type { UpdateProductData } from '@/lib/api';
import { UOM_SELECT_OPTIONS, getUomLabel } from '@/lib/constants/unit-of-measure';

function LoadingSkeleton() {
  return (
    <div className="p-4 sm:p-6 xl:p-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-96 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

const formatPrice = (price: number | null | undefined) => {
  if (!price) return '—';
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

export default function InventoryItemEditPage() {
  const router = useRouter();
  const params = useParams();
  const sku = params.sku as string;

  const { user, isLoading: authLoading } = useAuthStore();
  const { data: product, isLoading: productLoading, error: productError } = useProductWithInventory(sku);
  const { data: categories = [] } = useCategories();
  const updateProduct = useUpdateProduct();

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
        supplierSku: product.supplierSku || '',
        unitOfMeasure: product.unitOfMeasure || 'EA',
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

  // Redirect non-editors
  useEffect(() => {
    if (!authLoading && user && !canEdit) {
      router.push(`/inventory/items/${sku}`);
    }
  }, [user, authLoading, canEdit, router, sku]);

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

  if (authLoading || productLoading) {
    return <LoadingSkeleton />;
  }

  if (!canEdit) {
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

  // Category/subcategory state
  const currentCategoryId = formData.categoryId || product.categoryId;
  const category = categories.find(c => c.id === currentCategoryId);
  const subCategories = category?.subCategories || [];

  const typeLabel = product.productType === 'ASSEMBLY_REQUIRED' ? 'Assembly Required'
    : product.productType === 'MADE_TO_ORDER' ? 'Made to Order'
    : product.productType === 'KIT' ? 'Kit'
    : 'Stock Only';

  return (
    <>
      <PageHeader
        title={`Edit: ${product.nusafSku}`}
        description={product.description}
        actions={
          <div className="flex items-center gap-3">
            <Link
              href={`/inventory/items/${sku}`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </Link>
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
          </div>
        }
      />

      <div className="p-4 sm:p-6 xl:p-8">
        <Breadcrumb items={[{ label: 'Items', href: '/inventory/items' }, { label: sku, href: `/inventory/items/${sku}` }, { label: 'Edit' }]} />

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
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    value={formData.unitOfMeasure || 'EA'}
                    onChange={(e) => handleFieldChange('unitOfMeasure', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {UOM_SELECT_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.weight || ''}
                    onChange={(e) => handleFieldChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
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
                    {product.supplier?.name || '—'}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Supplier cannot be changed (affects pricing)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Supplier SKU</label>
                  <input
                    type="text"
                    value={formData.supplierSku ?? product.supplierSku ?? ''}
                    onChange={(e) => handleFieldChange('supplierSku', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
                    placeholder="Supplier's product code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lead Time (days)</label>
                  <input
                    type="number"
                    value={formData.leadTimeDays || ''}
                    onChange={(e) => handleFieldChange('leadTimeDays', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="14"
                  />
                </div>
              </div>
            </section>

            {/* Costs & Pricing - Read-only context */}
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
                  <input
                    type="number"
                    value={formData.defaultReorderPoint || ''}
                    onChange={(e) => handleFieldChange('defaultReorderPoint', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Qty</label>
                  <input
                    type="number"
                    value={formData.defaultReorderQty || ''}
                    onChange={(e) => handleFieldChange('defaultReorderQty', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min Stock</label>
                  <input
                    type="number"
                    value={formData.defaultMinStock || ''}
                    onChange={(e) => handleFieldChange('defaultMinStock', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Stock</label>
                  <input
                    type="number"
                    value={formData.defaultMaxStock || ''}
                    onChange={(e) => handleFieldChange('defaultMaxStock', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                  />
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
                  product.productType === 'STOCK_ONLY' ? 'bg-green-100 text-green-800' :
                  product.productType === 'ASSEMBLY_REQUIRED' ? 'bg-amber-100 text-amber-800' :
                  product.productType === 'MADE_TO_ORDER' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {typeLabel}
                </span>
              </div>
            </section>

            {/* Category */}
            <section className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Category</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-500">Category</span>
                  <select
                    value={formData.categoryId || ''}
                    onChange={(e) => {
                      handleFieldChange('categoryId', e.target.value);
                      handleFieldChange('subCategoryId', undefined);
                    }}
                    className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Subcategory</span>
                  <select
                    value={formData.subCategoryId || ''}
                    onChange={(e) => handleFieldChange('subCategoryId', e.target.value || undefined)}
                    disabled={!formData.categoryId || subCategories.length === 0}
                    className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value="">Select subcategory...</option>
                    {subCategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
