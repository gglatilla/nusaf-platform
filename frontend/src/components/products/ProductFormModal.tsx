'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ProductWithInventory, ProductType, CatalogCategory } from '@/lib/api';
import { useCreateProduct, useUpdateProduct, useCategories } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/useSuppliers';

interface ProductFormModalProps {
  isOpen: boolean;
  product?: ProductWithInventory | null;
  onClose: () => void;
}

const PRODUCT_TYPE_OPTIONS: { value: ProductType; label: string; description: string }[] = [
  { value: 'STOCK_ONLY', label: 'Stock Only', description: 'Standard stock item, no assembly required' },
  { value: 'ASSEMBLY_REQUIRED', label: 'Assembly Required', description: 'Requires assembly before shipping' },
  { value: 'MADE_TO_ORDER', label: 'Made to Order', description: 'Manufactured on demand' },
  { value: 'KIT', label: 'Kit', description: 'Collection of items sold together' },
];

const UOM_OPTIONS = ['EA', 'MTR', 'KG', 'SET', 'PR', 'ROL', 'BX'];

interface FormData {
  supplierSku: string;
  nusafSku: string;
  description: string;
  supplierId: string;
  categoryId: string;
  subCategoryId: string;
  unitOfMeasure: string;
  costPrice: string;
  listPrice: string;
  productType: ProductType;
  assemblyLeadDays: string;
  isConfigurable: boolean;
  longDescription: string;
  weight: string;
  imageUrl: string;
  defaultReorderPoint: string;
  defaultReorderQty: string;
  defaultMinStock: string;
  defaultMaxStock: string;
  leadTimeDays: string;
}

const initialFormData: FormData = {
  supplierSku: '',
  nusafSku: '',
  description: '',
  supplierId: '',
  categoryId: '',
  subCategoryId: '',
  unitOfMeasure: 'EA',
  costPrice: '',
  listPrice: '',
  productType: 'STOCK_ONLY',
  assemblyLeadDays: '',
  isConfigurable: false,
  longDescription: '',
  weight: '',
  imageUrl: '',
  defaultReorderPoint: '',
  defaultReorderQty: '',
  defaultMinStock: '',
  defaultMaxStock: '',
  leadTimeDays: '',
};

export function ProductFormModal({ isOpen, product, onClose }: ProductFormModalProps) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: categoriesData } = useCategories();
  const { data: suppliersData } = useSuppliers({ pageSize: 100, isActive: true });

  const isEdit = !!product;

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'classification' | 'pricing' | 'inventory'>('basic');

  const categories: CatalogCategory[] = categoriesData ?? [];
  const suppliers = suppliersData?.suppliers ?? [];

  // Get subcategories for selected category
  const selectedCategory = categories.find((c: CatalogCategory) => c.id === formData.categoryId);
  const subCategories = selectedCategory?.subCategories ?? [];

  useEffect(() => {
    if (product) {
      setFormData({
        supplierSku: product.supplierSku,
        nusafSku: product.nusafSku,
        description: product.description,
        supplierId: product.supplierId,
        categoryId: product.categoryId,
        subCategoryId: product.subCategoryId ?? '',
        unitOfMeasure: product.unitOfMeasure,
        costPrice: product.costPrice?.toString() ?? '',
        listPrice: product.listPrice?.toString() ?? '',
        productType: product.productType ?? 'STOCK_ONLY',
        assemblyLeadDays: product.assemblyLeadDays?.toString() ?? '',
        isConfigurable: product.isConfigurable ?? false,
        longDescription: product.longDescription ?? '',
        weight: product.weight?.toString() ?? '',
        imageUrl: product.imageUrl ?? '',
        defaultReorderPoint: product.defaultReorderPoint?.toString() ?? '',
        defaultReorderQty: product.defaultReorderQty?.toString() ?? '',
        defaultMinStock: product.defaultMinStock?.toString() ?? '',
        defaultMaxStock: product.defaultMaxStock?.toString() ?? '',
        leadTimeDays: product.leadTimeDays?.toString() ?? '',
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
    setActiveSection('basic');
  }, [product, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplierSku.trim()) {
      newErrors.supplierSku = 'Supplier SKU is required';
    }

    if (!formData.nusafSku.trim()) {
      newErrors.nusafSku = 'Nusaf SKU is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.supplierId) {
      newErrors.supplierId = 'Supplier is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (formData.costPrice && isNaN(parseFloat(formData.costPrice))) {
      newErrors.costPrice = 'Must be a valid number';
    }

    if (formData.listPrice && isNaN(parseFloat(formData.listPrice))) {
      newErrors.listPrice = 'Must be a valid number';
    }

    if (formData.weight && isNaN(parseFloat(formData.weight))) {
      newErrors.weight = 'Must be a valid number';
    }

    if (formData.imageUrl && !/^https?:\/\/.+/.test(formData.imageUrl)) {
      newErrors.imageUrl = 'Must be a valid URL starting with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        supplierSku: formData.supplierSku,
        nusafSku: formData.nusafSku,
        description: formData.description,
        supplierId: formData.supplierId,
        categoryId: formData.categoryId,
        subCategoryId: formData.subCategoryId || null,
        unitOfMeasure: formData.unitOfMeasure,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
        listPrice: formData.listPrice ? parseFloat(formData.listPrice) : null,
        productType: formData.productType,
        assemblyLeadDays: formData.assemblyLeadDays ? parseInt(formData.assemblyLeadDays) : null,
        isConfigurable: formData.isConfigurable,
        longDescription: formData.longDescription || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        imageUrl: formData.imageUrl || null,
        defaultReorderPoint: formData.defaultReorderPoint ? parseInt(formData.defaultReorderPoint) : null,
        defaultReorderQty: formData.defaultReorderQty ? parseInt(formData.defaultReorderQty) : null,
        defaultMinStock: formData.defaultMinStock ? parseInt(formData.defaultMinStock) : null,
        defaultMaxStock: formData.defaultMaxStock ? parseInt(formData.defaultMaxStock) : null,
        leadTimeDays: formData.leadTimeDays ? parseInt(formData.leadTimeDays) : null,
      };

      if (isEdit && product) {
        await updateProduct.mutateAsync({ id: product.id, data });
      } else {
        await createProduct.mutateAsync(data);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Clear subcategory if category changes
    if (name === 'categoryId') {
      setFormData((prev) => ({ ...prev, subCategoryId: '' }));
    }
  };

  if (!isOpen) return null;

  const sections = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'classification', label: 'Classification' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'inventory', label: 'Inventory' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? 'Edit Product' : 'Create Product'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Section Tabs */}
          <div className="flex border-b border-slate-200 px-6">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeSection === section.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            {/* Basic Info Section */}
            {activeSection === 'basic' && (
              <div className="space-y-4">
                {/* SKUs Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nusaf SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nusafSku"
                      value={formData.nusafSku}
                      onChange={handleChange}
                      disabled={isEdit}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 ${
                        errors.nusafSku ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {errors.nusafSku && <p className="mt-1 text-xs text-red-500">{errors.nusafSku}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Supplier SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="supplierSku"
                      value={formData.supplierSku}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.supplierSku ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {errors.supplierSku && <p className="mt-1 text-xs text-red-500">{errors.supplierSku}</p>}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.description ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.supplierId ? 'border-red-500' : 'border-slate-200'
                    }`}
                  >
                    <option value="">Select a supplier...</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.code} - {supplier.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplierId && <p className="mt-1 text-xs text-red-500">{errors.supplierId}</p>}
                </div>

                {/* Category & Subcategory Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.categoryId ? 'border-red-500' : 'border-slate-200'
                      }`}
                    >
                      <option value="">Select a category...</option>
                      {categories.map((cat: CatalogCategory) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subcategory</label>
                    <select
                      name="subCategoryId"
                      value={formData.subCategoryId}
                      onChange={handleChange}
                      disabled={!formData.categoryId || subCategories.length === 0}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100"
                    >
                      <option value="">None</option>
                      {subCategories.map((sub: { id: string; code: string; name: string }) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Unit of Measure */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    name="unitOfMeasure"
                    value={formData.unitOfMeasure}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {UOM_OPTIONS.map((uom) => (
                      <option key={uom} value={uom}>
                        {uom}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Long Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Long Description</label>
                  <textarea
                    name="longDescription"
                    value={formData.longDescription}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://..."
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.imageUrl ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  {errors.imageUrl && <p className="mt-1 text-xs text-red-500">{errors.imageUrl}</p>}
                </div>
              </div>
            )}

            {/* Classification Section */}
            {activeSection === 'classification' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Product Type</label>
                  <div className="space-y-2">
                    {PRODUCT_TYPE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.productType === option.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="productType"
                          value={option.value}
                          checked={formData.productType === option.value}
                          onChange={handleChange}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="font-medium text-sm text-slate-900">{option.label}</div>
                          <div className="text-xs text-slate-500">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Assembly Lead Days - only show for assembly types */}
                {(formData.productType === 'ASSEMBLY_REQUIRED' || formData.productType === 'MADE_TO_ORDER') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Assembly Lead Time (days)
                    </label>
                    <input
                      type="number"
                      name="assemblyLeadDays"
                      value={formData.assemblyLeadDays}
                      onChange={handleChange}
                      min="0"
                      className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    min="0"
                    step="0.001"
                    className={`w-32 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.weight ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  {errors.weight && <p className="mt-1 text-xs text-red-500">{errors.weight}</p>}
                </div>

                {/* Configurable Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isConfigurable"
                    name="isConfigurable"
                    checked={formData.isConfigurable}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="isConfigurable" className="text-sm text-slate-700">
                    This product is configurable (modular chain, custom options)
                  </label>
                </div>
              </div>
            )}

            {/* Pricing Section */}
            {activeSection === 'pricing' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 mb-4">
                  Set cost and list prices independently. Prices are not auto-calculated.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Cost Price (Supplier)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="costPrice"
                        value={formData.costPrice}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className={`w-full pl-12 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.costPrice ? 'border-red-500' : 'border-slate-200'
                        }`}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">EUR</span>
                    </div>
                    {errors.costPrice && <p className="mt-1 text-xs text-red-500">{errors.costPrice}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">List Price</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="listPrice"
                        value={formData.listPrice}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className={`w-full pl-12 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.listPrice ? 'border-red-500' : 'border-slate-200'
                        }`}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">ZAR</span>
                    </div>
                    {errors.listPrice && <p className="mt-1 text-xs text-red-500">{errors.listPrice}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Section */}
            {activeSection === 'inventory' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 mb-4">
                  Set default inventory thresholds. These can be overridden per warehouse.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Point</label>
                    <input
                      type="number"
                      name="defaultReorderPoint"
                      value={formData.defaultReorderPoint}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">Trigger reorder when stock falls below</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Quantity</label>
                    <input
                      type="number"
                      name="defaultReorderQty"
                      value={formData.defaultReorderQty}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">How many to order when reordering</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Stock</label>
                    <input
                      type="number"
                      name="defaultMinStock"
                      value={formData.defaultMinStock}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">Safety stock level</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Stock</label>
                    <input
                      type="number"
                      name="defaultMaxStock"
                      value={formData.defaultMaxStock}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">Maximum storage capacity</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Supplier Lead Time (days)
                  </label>
                  <input
                    type="number"
                    name="leadTimeDays"
                    value={formData.leadTimeDays}
                    onChange={handleChange}
                    min="0"
                    className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">Days from order to delivery</p>
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
