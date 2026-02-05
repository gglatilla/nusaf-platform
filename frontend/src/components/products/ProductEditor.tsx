'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, ImageIcon, FileText } from 'lucide-react';
import type { ProductWithInventory, ProductType, CatalogCategory } from '@/lib/api';
import { useCategories } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/useSuppliers';
import {
  useProductImages,
  useUploadProductImage,
  useSetPrimaryImage,
  useDeleteProductImage,
  useProductDocuments,
  useUploadProductDocument,
  useDeleteProductDocument,
} from '@/hooks/useProductMedia';
import { SpecificationsEditor } from './SpecificationsEditor';
import { ProductImageGallery } from './ProductImageGallery';
import { ProductDocumentsList, type ProductDocumentType } from './ProductDocumentsList';
import { cn } from '@/lib/utils';

// Collapsible section component
function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
        {Icon && <Icon className="h-4 w-4 text-slate-500" />}
        <span className="font-medium text-slate-900">{title}</span>
      </button>
      {isOpen && <div className="px-4 pb-4 pt-2 border-t border-slate-100">{children}</div>}
    </div>
  );
}

// Form field wrapper
function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Character counter for SEO fields
function CharCounter({ current, max }: { current: number; max: number }) {
  const isOver = current > max;
  return (
    <span className={cn('text-xs', isOver ? 'text-red-500' : 'text-slate-400')}>
      {current}/{max}
    </span>
  );
}

const PRODUCT_TYPE_OPTIONS: { value: ProductType; label: string; description: string }[] = [
  { value: 'STOCK_ONLY', label: 'Stock Only', description: 'Standard stock item, no assembly required' },
  { value: 'ASSEMBLY_REQUIRED', label: 'Assembly Required', description: 'Requires assembly before shipping' },
  { value: 'MADE_TO_ORDER', label: 'Made to Order', description: 'Manufactured on demand' },
  { value: 'KIT', label: 'Kit', description: 'Collection of items sold together' },
];

const UOM_OPTIONS = ['EA', 'MTR', 'KG', 'SET', 'PR', 'ROL', 'BX'];

export interface ProductFormData {
  // Basic
  supplierSku: string;
  nusafSku: string;
  description: string;
  supplierId: string;
  categoryId: string;
  subCategoryId: string;
  unitOfMeasure: string;
  longDescription: string;
  // Classification
  productType: ProductType;
  assemblyLeadDays: string;
  isConfigurable: boolean;
  weight: string;
  // Pricing
  costPrice: string;
  listPrice: string;
  // Marketing
  marketingTitle: string;
  marketingDescription: string;
  metaTitle: string;
  metaDescription: string;
  specifications: Record<string, string>;
  // Inventory
  defaultReorderPoint: string;
  defaultReorderQty: string;
  defaultMinStock: string;
  defaultMaxStock: string;
  leadTimeDays: string;
}

const initialFormData: ProductFormData = {
  supplierSku: '',
  nusafSku: '',
  description: '',
  supplierId: '',
  categoryId: '',
  subCategoryId: '',
  unitOfMeasure: 'EA',
  longDescription: '',
  productType: 'STOCK_ONLY',
  assemblyLeadDays: '',
  isConfigurable: false,
  weight: '',
  costPrice: '',
  listPrice: '',
  marketingTitle: '',
  marketingDescription: '',
  metaTitle: '',
  metaDescription: '',
  specifications: {},
  defaultReorderPoint: '',
  defaultReorderQty: '',
  defaultMinStock: '',
  defaultMaxStock: '',
  leadTimeDays: '',
};

interface ProductEditorProps {
  product?: ProductWithInventory | null;
  onSave: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
  isCreating?: boolean;
}

export function ProductEditor({ product, onSave, isLoading, isCreating }: ProductEditorProps) {
  const { data: categoriesData } = useCategories();
  const { data: suppliersData, isLoading: suppliersLoading } = useSuppliers({ pageSize: 100 });

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: CatalogCategory[] = categoriesData ?? [];
  const suppliers = suppliersData?.suppliers ?? [];

  // Media hooks - only active when editing existing product
  const productId = product?.id ?? '';
  const { data: images = [] } = useProductImages(productId, { enabled: !!productId });
  const { data: documents = [] } = useProductDocuments(productId, { enabled: !!productId });
  const uploadImage = useUploadProductImage(productId);
  const setPrimaryImage = useSetPrimaryImage(productId);
  const deleteImage = useDeleteProductImage(productId);
  const uploadDocument = useUploadProductDocument(productId);
  const deleteDocument = useDeleteProductDocument(productId);

  // Get subcategories for selected category
  const selectedCategory = categories.find((c: CatalogCategory) => c.id === formData.categoryId);
  const subCategories = selectedCategory?.subCategories ?? [];

  // Initialize form from product
  useEffect(() => {
    if (product && !suppliersLoading) {
      setFormData({
        supplierSku: product.supplierSku,
        nusafSku: product.nusafSku,
        description: product.description,
        supplierId: product.supplierId ?? '',
        categoryId: product.categoryId,
        subCategoryId: product.subCategoryId ?? '',
        unitOfMeasure: product.unitOfMeasure,
        longDescription: product.longDescription ?? '',
        productType: product.productType ?? 'STOCK_ONLY',
        assemblyLeadDays: product.assemblyLeadDays?.toString() ?? '',
        isConfigurable: product.isConfigurable ?? false,
        weight: product.weight?.toString() ?? '',
        costPrice: product.costPrice?.toString() ?? '',
        listPrice: product.listPrice?.toString() ?? '',
        marketingTitle: (product as any).marketingTitle ?? '',
        marketingDescription: (product as any).marketingDescription ?? '',
        metaTitle: (product as any).metaTitle ?? '',
        metaDescription: (product as any).metaDescription ?? '',
        specifications: (product as any).specifications ?? {},
        defaultReorderPoint: product.defaultReorderPoint?.toString() ?? '',
        defaultReorderQty: product.defaultReorderQty?.toString() ?? '',
        defaultMinStock: product.defaultMinStock?.toString() ?? '',
        defaultMaxStock: product.defaultMaxStock?.toString() ?? '',
        leadTimeDays: product.leadTimeDays?.toString() ?? '',
      });
    } else if (!product) {
      setFormData(initialFormData);
    }
  }, [product, suppliersLoading]);

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
    if (formData.metaTitle.length > 60) {
      newErrors.metaTitle = 'Meta title must be 60 characters or less';
    }
    if (formData.metaDescription.length > 160) {
      newErrors.metaDescription = 'Meta description must be 160 characters or less';
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
      await onSave(formData);
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

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-64 bg-slate-200 rounded-lg" />
        <div className="h-96 bg-slate-200 rounded-lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Media */}
        <div className="lg:col-span-1 space-y-4">
          {/* Image Gallery */}
          <div className="border border-slate-200 rounded-lg bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-900">Images</span>
            </div>
            {isCreating ? (
              <div className="py-6 text-center text-sm text-slate-500">
                Save the product first to upload images
              </div>
            ) : (
              <ProductImageGallery
                productId={productId}
                images={images}
                canEdit={true}
                onUpload={async (file) => {
                  await uploadImage.mutateAsync({ file, isPrimary: images.length === 0 });
                }}
                onSetPrimary={async (imageId) => {
                  await setPrimaryImage.mutateAsync(imageId);
                }}
                onDelete={async (imageId) => {
                  await deleteImage.mutateAsync(imageId);
                }}
                isUploading={uploadImage.isPending}
              />
            )}
          </div>

          {/* Documents */}
          <div className="border border-slate-200 rounded-lg bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-900">Documents</span>
            </div>
            {isCreating ? (
              <div className="py-6 text-center text-sm text-slate-500">
                Save the product first to upload documents
              </div>
            ) : (
              <ProductDocumentsList
                productId={productId}
                documents={documents}
                canEdit={true}
                onUpload={async (file, type, name) => {
                  await uploadDocument.mutateAsync({ file, type, name });
                }}
                onDelete={async (documentId) => {
                  await deleteDocument.mutateAsync(documentId);
                }}
                isUploading={uploadDocument.isPending}
              />
            )}
          </div>
        </div>

        {/* Right Column - Form Sections */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Information */}
          <Section title="Basic Information" defaultOpen={true}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nusaf SKU" required error={errors.nusafSku}>
                  <input
                    type="text"
                    name="nusafSku"
                    value={formData.nusafSku}
                    onChange={handleChange}
                    disabled={!isCreating}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100',
                      errors.nusafSku ? 'border-red-500' : 'border-slate-200'
                    )}
                  />
                </Field>

                <Field label="Supplier SKU" required error={errors.supplierSku}>
                  <input
                    type="text"
                    name="supplierSku"
                    value={formData.supplierSku}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                      errors.supplierSku ? 'border-red-500' : 'border-slate-200'
                    )}
                  />
                </Field>
              </div>

              <Field label="Description" required error={errors.description}>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors.description ? 'border-red-500' : 'border-slate-200'
                  )}
                />
              </Field>

              <Field label="Supplier" required error={errors.supplierId}>
                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors.supplierId ? 'border-red-500' : 'border-slate-200'
                  )}
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.code} - {supplier.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Category" required error={errors.categoryId}>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                      errors.categoryId ? 'border-red-500' : 'border-slate-200'
                    )}
                  >
                    <option value="">Select a category...</option>
                    {categories.map((cat: CatalogCategory) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Subcategory">
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
                </Field>
              </div>

              <Field label="Unit of Measure">
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
              </Field>

              <Field label="Long Description" hint="Detailed internal description">
                <textarea
                  name="longDescription"
                  value={formData.longDescription}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </Field>
            </div>
          </Section>

          {/* Classification */}
          <Section title="Classification" defaultOpen={false}>
            <div className="space-y-4">
              <Field label="Product Type">
                <div className="space-y-2">
                  {PRODUCT_TYPE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        'flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                        formData.productType === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
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
              </Field>

              {(formData.productType === 'ASSEMBLY_REQUIRED' || formData.productType === 'MADE_TO_ORDER') && (
                <Field label="Assembly Lead Time (days)">
                  <input
                    type="number"
                    name="assemblyLeadDays"
                    value={formData.assemblyLeadDays}
                    onChange={handleChange}
                    min="0"
                    className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </Field>
              )}

              <Field label="Weight (kg)" error={errors.weight}>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  min="0"
                  step="0.001"
                  className={cn(
                    'w-32 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors.weight ? 'border-red-500' : 'border-slate-200'
                  )}
                />
              </Field>

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
          </Section>

          {/* Pricing */}
          <Section title="Pricing" defaultOpen={false}>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Set cost and list prices independently. Prices are not auto-calculated.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Cost Price (EUR)" error={errors.costPrice} hint="Raw cost from supplier">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">EUR</span>
                    <input
                      type="number"
                      name="costPrice"
                      value={formData.costPrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className={cn(
                        'w-full pl-12 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                        errors.costPrice ? 'border-red-500' : 'border-slate-200'
                      )}
                    />
                  </div>
                </Field>

                <Field label="List Price (ZAR)" error={errors.listPrice} hint="Base price before discounts">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">ZAR</span>
                    <input
                      type="number"
                      name="listPrice"
                      value={formData.listPrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className={cn(
                        'w-full pl-12 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                        errors.listPrice ? 'border-red-500' : 'border-slate-200'
                      )}
                    />
                  </div>
                </Field>
              </div>
            </div>
          </Section>

          {/* Marketing & SEO */}
          <Section title="Marketing & SEO" defaultOpen={false}>
            <div className="space-y-4">
              <Field label="Marketing Title" hint="SEO-friendly title for the website">
                <input
                  type="text"
                  name="marketingTitle"
                  value={formData.marketingTitle}
                  onChange={handleChange}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </Field>

              <Field label="Marketing Description" hint="Rich description shown on public website">
                <textarea
                  name="marketingDescription"
                  value={formData.marketingDescription}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </Field>

              <Field
                label="Meta Title"
                error={errors.metaTitle}
                hint={
                  <span className="flex items-center justify-between">
                    <span>Shows in browser tab and Google results</span>
                    <CharCounter current={formData.metaTitle.length} max={60} />
                  </span>
                }
              >
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleChange}
                  maxLength={70}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors.metaTitle ? 'border-red-500' : 'border-slate-200'
                  )}
                />
              </Field>

              <Field
                label="Meta Description"
                error={errors.metaDescription}
                hint={
                  <span className="flex items-center justify-between">
                    <span>Shows in Google search results</span>
                    <CharCounter current={formData.metaDescription.length} max={160} />
                  </span>
                }
              >
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleChange}
                  rows={2}
                  maxLength={170}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors.metaDescription ? 'border-red-500' : 'border-slate-200'
                  )}
                />
              </Field>

              <Field label="Technical Specifications" hint="Key-value pairs for product specs">
                <SpecificationsEditor
                  value={formData.specifications}
                  onChange={(specs) =>
                    setFormData((prev) => ({ ...prev, specifications: specs }))
                  }
                />
              </Field>
            </div>
          </Section>

          {/* Inventory Defaults */}
          <Section title="Inventory Defaults" defaultOpen={false}>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Set default inventory thresholds. These can be overridden per warehouse.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Reorder Point" hint="Trigger reorder when stock falls below">
                  <input
                    type="number"
                    name="defaultReorderPoint"
                    value={formData.defaultReorderPoint}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </Field>

                <Field label="Reorder Quantity" hint="How many to order when reordering">
                  <input
                    type="number"
                    name="defaultReorderQty"
                    value={formData.defaultReorderQty}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Minimum Stock" hint="Safety stock level">
                  <input
                    type="number"
                    name="defaultMinStock"
                    value={formData.defaultMinStock}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </Field>

                <Field label="Maximum Stock" hint="Maximum storage capacity">
                  <input
                    type="number"
                    name="defaultMaxStock"
                    value={formData.defaultMaxStock}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </Field>
              </div>

              <Field label="Supplier Lead Time (days)" hint="Days from order to delivery">
                <input
                  type="number"
                  name="leadTimeDays"
                  value={formData.leadTimeDays}
                  onChange={handleChange}
                  min="0"
                  className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </Field>
            </div>
          </Section>
        </div>
      </div>

      {/* Form Actions - Sticky at bottom */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 -mx-4 sm:-mx-6 xl:-mx-8 px-4 sm:px-6 xl:px-8 py-4 flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : isCreating ? 'Create Product' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
