'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useCreateProduct, useCategories } from '@/hooks/useProducts';
import { useAuthStore } from '@/stores/auth-store';

interface FormData {
  nusafSku: string;
  supplierSku: string;
  description: string;
  productType: string;
  unitOfMeasure: string;
  categoryId: string;
  subCategoryId: string;
  weight: string;
  supplierLeadDays: string;
  reorderPoint: string;
  reorderQty: string;
  minStock: string;
  maxStock: string;
}

const initialFormData: FormData = {
  nusafSku: '',
  supplierSku: '',
  description: '',
  productType: 'FINISHED_GOOD',
  unitOfMeasure: 'EACH',
  categoryId: '',
  subCategoryId: '',
  weight: '',
  supplierLeadDays: '',
  reorderPoint: '',
  reorderQty: '',
  minStock: '',
  maxStock: '',
};

export default function NewInventoryItemPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Check access
  const canCreate = user && ['ADMIN', 'MANAGER'].includes(user.role);

  // Redirect if not authorized
  useEffect(() => {
    if (!authLoading && user && !canCreate) {
      router.push('/inventory/items');
    }
  }, [user, authLoading, canCreate, router]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.nusafSku.trim()) {
      newErrors.nusafSku = 'SKU is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const data = {
        nusafSku: formData.nusafSku.trim(),
        supplierSku: formData.supplierSku.trim() || null,
        description: formData.description.trim(),
        productType: formData.productType,
        unitOfMeasure: formData.unitOfMeasure,
        categoryId: formData.categoryId || null,
        subCategoryId: formData.subCategoryId || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        supplierLeadDays: formData.supplierLeadDays ? parseInt(formData.supplierLeadDays) : null,
        defaultReorderPoint: formData.reorderPoint ? parseInt(formData.reorderPoint) : null,
        defaultReorderQty: formData.reorderQty ? parseInt(formData.reorderQty) : null,
        defaultMinStock: formData.minStock ? parseInt(formData.minStock) : null,
        defaultMaxStock: formData.maxStock ? parseInt(formData.maxStock) : null,
      };

      const response = await createProduct.mutateAsync(data);

      if (response?.nusafSku) {
        router.push(`/inventory/items/${response.nusafSku}`);
      } else if (response?.id) {
        router.push(`/inventory/items/${response.id}`);
      } else {
        router.push('/inventory/items');
      }
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  // Get subcategories for selected category
  const selectedCategory = categories.find(c => c.id === formData.categoryId);
  const subCategories = selectedCategory?.subCategories || [];

  if (authLoading) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-96 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!canCreate) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 xl:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/inventory/items" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Create Item</h1>
            <p className="text-sm text-slate-600">Add a new item to inventory</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={createProduct.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {createProduct.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Create Item
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Basic Information */}
        <section className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                SKU / Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nusafSku}
                onChange={(e) => handleChange('nusafSku', e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono ${
                  errors.nusafSku ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="e.g., CH-2000-A"
              />
              {errors.nusafSku && (
                <p className="mt-1 text-xs text-red-500">{errors.nusafSku}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Item Type
              </label>
              <select
                value={formData.productType}
                onChange={(e) => handleChange('productType', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="FINISHED_GOOD">Finished Good</option>
                <option value="RAW_MATERIAL">Raw Material</option>
                <option value="COMPONENT">Component</option>
                <option value="ASSEMBLY">Assembly</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.description ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="e.g., Power transmission chain, pitch 12.7mm"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unit of Measure
              </label>
              <select
                value={formData.unitOfMeasure}
                onChange={(e) => handleChange('unitOfMeasure', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="EACH">Each</option>
                <option value="METER">Meter</option>
                <option value="KG">Kilogram</option>
                <option value="SET">Set</option>
                <option value="PAIR">Pair</option>
                <option value="BOX">Box</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </section>

        {/* Classification */}
        <section className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Classification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => {
                  handleChange('categoryId', e.target.value);
                  handleChange('subCategoryId', ''); // Reset subcategory
                }}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.categoryId ? 'border-red-500' : 'border-slate-300'
                }`}
              >
                <option value="">Select category...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subcategory
              </label>
              <select
                value={formData.subCategoryId}
                onChange={(e) => handleChange('subCategoryId', e.target.value)}
                disabled={!formData.categoryId || subCategories.length === 0}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="">Select subcategory...</option>
                {subCategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Supplier SKU
              </label>
              <input
                type="text"
                value={formData.supplierSku}
                onChange={(e) => handleChange('supplierSku', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
                placeholder="Supplier's product code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Lead Time (days)
              </label>
              <input
                type="number"
                value={formData.supplierLeadDays}
                onChange={(e) => handleChange('supplierLeadDays', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="14"
              />
            </div>
          </div>
        </section>

        {/* Stock Settings */}
        <section className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Stock Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reorder Point
              </label>
              <input
                type="number"
                value={formData.reorderPoint}
                onChange={(e) => handleChange('reorderPoint', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reorder Qty
              </label>
              <input
                type="number"
                value={formData.reorderQty}
                onChange={(e) => handleChange('reorderQty', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Min Stock
              </label>
              <input
                type="number"
                value={formData.minStock}
                onChange={(e) => handleChange('minStock', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Stock
              </label>
              <input
                type="number"
                value={formData.maxStock}
                onChange={(e) => handleChange('maxStock', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            These are default stock settings. Actual stock levels are managed per warehouse.
          </p>
        </section>
      </form>
    </div>
  );
}
