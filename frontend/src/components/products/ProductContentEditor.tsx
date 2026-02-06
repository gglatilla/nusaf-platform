'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, ImageIcon, FileText, ExternalLink } from 'lucide-react';
import type { ProductWithInventory } from '@/lib/api';
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
    <div className="border border-slate-200 rounded-lg bg-white">
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

export interface ProductContentFormData {
  marketingTitle: string;
  marketingDescription: string;
  metaTitle: string;
  metaDescription: string;
  specifications: Record<string, string>;
}

const initialFormData: ProductContentFormData = {
  marketingTitle: '',
  marketingDescription: '',
  metaTitle: '',
  metaDescription: '',
  specifications: {},
};

interface ProductContentEditorProps {
  product: ProductWithInventory;
  onSave: (data: ProductContentFormData) => Promise<void>;
  isLoading?: boolean;
}

export function ProductContentEditor({ product, onSave, isLoading }: ProductContentEditorProps) {
  const [formData, setFormData] = useState<ProductContentFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Media hooks
  const productId = product.id;
  const { data: images = [] } = useProductImages(productId, { enabled: !!productId });
  const { data: documents = [] } = useProductDocuments(productId, { enabled: !!productId });
  const uploadImage = useUploadProductImage(productId);
  const setPrimaryImage = useSetPrimaryImage(productId);
  const deleteImage = useDeleteProductImage(productId);
  const uploadDocument = useUploadProductDocument(productId);
  const deleteDocument = useDeleteProductDocument(productId);

  // Initialize form from product
  useEffect(() => {
    if (product) {
      setFormData({
        marketingTitle: (product as any).marketingTitle ?? '',
        marketingDescription: (product as any).marketingDescription ?? '',
        metaTitle: (product as any).metaTitle ?? '',
        metaDescription: (product as any).metaDescription ?? '',
        specifications: (product as any).specifications ?? {},
      });
    }
  }, [product]);

  const handleChange = (field: keyof ProductContentFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Media handlers
  const handleImageUpload = async (file: File) => {
    await uploadImage.mutateAsync({ file, isPrimary: images.length === 0 });
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    await setPrimaryImage.mutateAsync(imageId);
  };

  const handleDeleteImage = async (imageId: string) => {
    await deleteImage.mutateAsync(imageId);
  };

  const handleDocumentUpload = async (file: File, type: ProductDocumentType, name: string) => {
    await uploadDocument.mutateAsync({ file, type, name });
  };

  const handleDeleteDocument = async (documentId: string) => {
    await deleteDocument.mutateAsync(documentId);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar - Inherited from Inventory (Read-only) */}
      <div className="lg:col-span-1 space-y-4">
        <Section title="Product Information" defaultOpen={true}>
          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-500">SKU</span>
              <p className="text-sm font-mono text-slate-900">{product.nusafSku}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Description</span>
              <p className="text-sm text-slate-900">{product.description}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Supplier</span>
              <p className="text-sm text-slate-900">{product.supplier?.name || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Category</span>
              <p className="text-sm text-slate-900">
                {product.category?.name || '—'}
                {product.subCategory?.name && ` > ${product.subCategory.name}`}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Weight</span>
              <p className="text-sm text-slate-900">
                {product.weight ? `${product.weight} kg` : '—'}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <Link
                href={`/inventory/items/${product.nusafSku}`}
                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Edit in Item Master
              </Link>
            </div>
          </div>
        </Section>

        <Section title="Product Images" icon={ImageIcon} defaultOpen={true}>
          <ProductImageGallery
            productId={productId}
            images={images}
            canEdit={true}
            onUpload={handleImageUpload}
            onSetPrimary={handleSetPrimaryImage}
            onDelete={handleDeleteImage}
          />
        </Section>

        <Section title="Documents" icon={FileText} defaultOpen={false}>
          <ProductDocumentsList
            productId={productId}
            documents={documents}
            canEdit={true}
            onUpload={handleDocumentUpload}
            onDelete={handleDeleteDocument}
          />
        </Section>
      </div>

      {/* Main content - Marketing & SEO */}
      <div className="lg:col-span-2 space-y-6">
        {/* Marketing Content */}
        <Section title="Marketing Content" defaultOpen={true}>
          <div className="space-y-4">
            <Field
              label="Marketing Title"
              hint="Customer-facing product title. Shown on website and catalog."
            >
              <input
                type="text"
                value={formData.marketingTitle}
                onChange={(e) => handleChange('marketingTitle', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., High-Performance Chiaravalli Power Chain"
              />
            </Field>

            <Field
              label="Marketing Description"
              hint="Customer-facing description. Shown on product detail page."
            >
              <textarea
                value={formData.marketingDescription}
                onChange={(e) => handleChange('marketingDescription', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                placeholder="Professional-grade power transmission chain from Italy's leading manufacturer..."
              />
            </Field>
          </div>
        </Section>

        {/* SEO Metadata */}
        <Section title="SEO Metadata" defaultOpen={true}>
          <div className="space-y-4">
            <Field
              label="Meta Title"
              hint={
                <span className="flex items-center justify-between">
                  <span>For search engines. Recommended: 50-60 characters.</span>
                  <CharCounter current={formData.metaTitle.length} max={60} />
                </span>
              }
            >
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => handleChange('metaTitle', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Chiaravalli Power Chain 12.7mm | Nusaf"
              />
            </Field>

            <Field
              label="Meta Description"
              hint={
                <span className="flex items-center justify-between">
                  <span>For search engines. Recommended: 150-160 characters.</span>
                  <CharCounter current={formData.metaDescription.length} max={160} />
                </span>
              }
            >
              <textarea
                value={formData.metaDescription}
                onChange={(e) => handleChange('metaDescription', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                placeholder="Buy high-quality Chiaravalli power transmission chain. 12.7mm pitch, industrial grade. Fast delivery across South Africa."
              />
            </Field>
          </div>
        </Section>

        {/* Technical Specifications */}
        <Section title="Technical Specifications" defaultOpen={true}>
          <SpecificationsEditor
            value={formData.specifications}
            onChange={(specs) => handleChange('specifications', specs)}
          />
        </Section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
