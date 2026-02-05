'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Globe, Eye, Loader2 } from 'lucide-react';
import { useProductWithInventory } from '@/hooks/useProductInventory';
import { useUpdateProduct } from '@/hooks/useProducts';
import { useAuthStore } from '@/stores/auth-store';
import { ProductEditor, ProductFormData } from '@/components/products';
import { cn } from '@/lib/utils';

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-6 w-6 bg-slate-200 rounded" />
        <div className="h-8 bg-slate-200 rounded w-64" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-96 bg-slate-200 rounded-lg" />
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 bg-slate-200 rounded-lg" />
          <div className="h-48 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.slug as string;
  const { user } = useAuthStore();

  const { data: product, isLoading, error, refetch } = useProductWithInventory(productId, {
    enabled: !!productId,
  });

  const updateProduct = useUpdateProduct();

  // Check if user is admin (can edit product)
  const canEditProduct = user?.role === 'ADMIN';

  // Redirect non-admins
  if (!canEditProduct && !isLoading) {
    router.push(`/catalog/${productId}`);
    return null;
  }

  const handleSave = async (formData: ProductFormData) => {
    const data = {
      supplierSku: formData.supplierSku,
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
      // Marketing fields
      marketingTitle: formData.marketingTitle || null,
      marketingDescription: formData.marketingDescription || null,
      metaTitle: formData.metaTitle || null,
      metaDescription: formData.metaDescription || null,
      specifications: Object.keys(formData.specifications).length > 0 ? formData.specifications : null,
      // Inventory defaults
      defaultReorderPoint: formData.defaultReorderPoint ? parseInt(formData.defaultReorderPoint) : null,
      defaultReorderQty: formData.defaultReorderQty ? parseInt(formData.defaultReorderQty) : null,
      defaultMinStock: formData.defaultMinStock ? parseInt(formData.defaultMinStock) : null,
      defaultMaxStock: formData.defaultMaxStock ? parseInt(formData.defaultMaxStock) : null,
      leadTimeDays: formData.leadTimeDays ? parseInt(formData.leadTimeDays) : null,
    };

    await updateProduct.mutateAsync({ id: productId, data });
    refetch();
  };

  // Publish status (from product data if available)
  const isPublished = (product as any)?.isPublished ?? false;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-4 sm:p-6 xl:p-8">
        <div className="text-center py-12">
          <p className="text-lg text-red-600 mb-4">Product not found</p>
          <Link href="/catalog" className="text-primary-600 hover:text-primary-700">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 xl:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/catalog/${productId}`} className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">Edit Product</h1>
              <span className="font-mono text-lg text-slate-600">{product.nusafSku}</span>
              {/* Publish Status Badge */}
              <span
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded',
                  isPublished
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                {isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <p className="text-sm text-slate-600">{product.description}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Preview on Website */}
          <a
            href={`/products/p/${product.nusafSku}?preview=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            Preview
          </a>

          {/* Publish/Unpublish Button (placeholder - will be wired up in Phase 1) */}
          <button
            type="button"
            disabled
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed',
              isPublished
                ? 'text-slate-700 bg-white border border-slate-200'
                : 'text-white bg-green-600'
            )}
            title="Publishing will be enabled after saving"
          >
            <Globe className="h-4 w-4" />
            {isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Product Editor */}
      <ProductEditor
        product={product}
        onSave={handleSave}
        isLoading={false}
        isCreating={false}
      />
    </div>
  );
}
