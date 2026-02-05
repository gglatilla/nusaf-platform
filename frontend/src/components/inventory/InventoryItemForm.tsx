'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { ProductWithInventory, UpdateProductData, CatalogCategory, Supplier } from '@/lib/api';

// Collapsible section component
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

// Field wrapper component
function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// Read-only display field
function DisplayField({ value }: { value: string | number | null | undefined }) {
  return (
    <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
      {value ?? '—'}
    </div>
  );
}

export interface InventoryItemFormData {
  description: string;
  unitOfMeasure: string;
  productType: string;
  categoryId: string;
  subCategoryId: string;
  supplierId: string;
  supplierSku: string;
  weight: number | null;
  leadTimeDays: number | null;
  defaultReorderPoint: number | null;
  defaultReorderQty: number | null;
  defaultMinStock: number | null;
  defaultMaxStock: number | null;
}

interface InventoryItemFormProps {
  product?: ProductWithInventory | null;
  categories: CatalogCategory[];
  suppliers?: Supplier[];
  canEdit: boolean;
  canViewCosts: boolean;
  formData: InventoryItemFormData;
  onFieldChange: (field: keyof InventoryItemFormData, value: unknown) => void;
  isNew?: boolean;
  nusafSku?: string;
  onSkuChange?: (value: string) => void;
  errors?: Record<string, string>;
}

// Format price for display
function formatPrice(price: number | null | undefined) {
  if (!price) return '—';
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
}

// Item type label
function getTypeLabel(type: string) {
  return type === 'ASSEMBLY_REQUIRED' ? 'Assembly Required'
    : type === 'MADE_TO_ORDER' ? 'Made to Order'
    : type === 'KIT' ? 'Kit'
    : 'Stock Only';
}

export function InventoryItemForm({
  product,
  categories,
  suppliers = [],
  canEdit,
  canViewCosts,
  formData,
  onFieldChange,
  isNew = false,
  nusafSku,
  onSkuChange,
  errors = {},
}: InventoryItemFormProps) {
  // Get subcategories for selected category
  const selectedCategory = categories.find(c => c.id === formData.categoryId);
  const subCategories = selectedCategory?.subCategories || [];

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Section title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="SKU / Code" required={isNew} hint={isNew ? undefined : "SKU cannot be changed after creation"}>
            {isNew ? (
              <input
                type="text"
                value={nusafSku || ''}
                onChange={(e) => onSkuChange?.(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono ${
                  errors.nusafSku ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="e.g., CH-2000-A"
              />
            ) : (
              <input
                type="text"
                value={product?.nusafSku || ''}
                disabled
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono"
              />
            )}
            {errors.nusafSku && <p className="mt-1 text-xs text-red-500">{errors.nusafSku}</p>}
          </Field>

          <Field label="Item Type">
            {canEdit ? (
              <select
                value={formData.productType}
                onChange={(e) => onFieldChange('productType', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="STOCK_ONLY">Stock Only</option>
                <option value="ASSEMBLY_REQUIRED">Assembly Required</option>
                <option value="MADE_TO_ORDER">Made to Order</option>
                <option value="KIT">Kit</option>
              </select>
            ) : (
              <DisplayField value={getTypeLabel(formData.productType)} />
            )}
          </Field>

          <div className="md:col-span-2">
            <Field label="Description" required>
              {canEdit ? (
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => onFieldChange('description', e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.description ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., Power transmission chain, pitch 12.7mm"
                />
              ) : (
                <DisplayField value={formData.description} />
              )}
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            </Field>
          </div>

          <Field label="Unit of Measure">
            {canEdit ? (
              <select
                value={formData.unitOfMeasure}
                onChange={(e) => onFieldChange('unitOfMeasure', e.target.value)}
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
              <DisplayField value={formData.unitOfMeasure || 'Each'} />
            )}
          </Field>

          <Field label="Weight (kg)">
            {canEdit ? (
              <input
                type="number"
                step="0.001"
                value={formData.weight ?? ''}
                onChange={(e) => onFieldChange('weight', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
            ) : (
              <DisplayField value={formData.weight ? `${formData.weight} kg` : null} />
            )}
          </Field>
        </div>
      </Section>

      {/* Classification */}
      <Section title="Classification">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Category" required>
            {canEdit ? (
              <select
                value={formData.categoryId}
                onChange={(e) => {
                  onFieldChange('categoryId', e.target.value);
                  onFieldChange('subCategoryId', ''); // Reset subcategory
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
            ) : (
              <DisplayField value={selectedCategory?.name} />
            )}
            {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>}
          </Field>

          <Field label="Subcategory">
            {canEdit ? (
              <select
                value={formData.subCategoryId}
                onChange={(e) => onFieldChange('subCategoryId', e.target.value)}
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
            ) : (
              <DisplayField value={subCategories.find(s => s.id === formData.subCategoryId)?.name} />
            )}
          </Field>
        </div>
      </Section>

      {/* Supplier & Lead Time */}
      <Section title="Supplier & Lead Time">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Supplier" required={isNew}>
            {canEdit && isNew ? (
              <select
                value={formData.supplierId}
                onChange={(e) => onFieldChange('supplierId', e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.supplierId ? 'border-red-500' : 'border-slate-300'
                }`}
              >
                <option value="">Select supplier...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            ) : (
              <DisplayField value={product?.supplier?.name} />
            )}
            {errors.supplierId && <p className="mt-1 text-xs text-red-500">{errors.supplierId}</p>}
          </Field>

          <Field label="Supplier SKU">
            {canEdit && isNew ? (
              <input
                type="text"
                value={formData.supplierSku}
                onChange={(e) => onFieldChange('supplierSku', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
                placeholder="Supplier's product code"
              />
            ) : (
              <DisplayField value={product?.supplierSku} />
            )}
          </Field>

          <Field label="Lead Time (days)">
            {canEdit ? (
              <input
                type="number"
                value={formData.leadTimeDays ?? ''}
                onChange={(e) => onFieldChange('leadTimeDays', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="14"
              />
            ) : (
              <DisplayField value={formData.leadTimeDays ? `${formData.leadTimeDays} days` : null} />
            )}
          </Field>
        </div>
      </Section>

      {/* Costs & Pricing - Only for Admin/Manager */}
      {canViewCosts && product && (
        <Section title="Costs & Pricing">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Cost Price">
              <DisplayField value={formatPrice(product.costPrice)} />
            </Field>
            <Field label="List Price">
              <DisplayField value={formatPrice(product.listPrice)} />
            </Field>
            <Field label="Margin">
              <DisplayField
                value={
                  product.costPrice && product.listPrice
                    ? `${(((product.listPrice - product.costPrice) / product.listPrice) * 100).toFixed(1)}%`
                    : null
                }
              />
            </Field>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Pricing is managed through supplier imports. Edit in Pricing settings.
          </p>
        </Section>
      )}

      {/* Stock Settings */}
      <Section title="Stock Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Reorder Point">
            {canEdit ? (
              <input
                type="number"
                value={formData.defaultReorderPoint ?? ''}
                onChange={(e) => onFieldChange('defaultReorderPoint', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
              />
            ) : (
              <DisplayField value={formData.defaultReorderPoint} />
            )}
          </Field>

          <Field label="Reorder Qty">
            {canEdit ? (
              <input
                type="number"
                value={formData.defaultReorderQty ?? ''}
                onChange={(e) => onFieldChange('defaultReorderQty', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
              />
            ) : (
              <DisplayField value={formData.defaultReorderQty} />
            )}
          </Field>

          <Field label="Min Stock">
            {canEdit ? (
              <input
                type="number"
                value={formData.defaultMinStock ?? ''}
                onChange={(e) => onFieldChange('defaultMinStock', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
              />
            ) : (
              <DisplayField value={formData.defaultMinStock} />
            )}
          </Field>

          <Field label="Max Stock">
            {canEdit ? (
              <input
                type="number"
                value={formData.defaultMaxStock ?? ''}
                onChange={(e) => onFieldChange('defaultMaxStock', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
              />
            ) : (
              <DisplayField value={formData.defaultMaxStock} />
            )}
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          These are default stock settings. Actual stock levels are managed per warehouse.
        </p>
      </Section>

      {/* Link to marketing edit for stock items */}
      {!isNew && product?.productType === 'STOCK_ONLY' && (
        <div className="flex justify-center">
          <Link
            href={`/catalog/${product.nusafSku}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Edit Marketing Content
          </Link>
        </div>
      )}
    </div>
  );
}
