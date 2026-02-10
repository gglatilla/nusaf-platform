'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, Eye, Loader2 } from 'lucide-react';
import { useProductWithInventory } from '@/hooks/useProductInventory';
import { useUpdateProduct, usePublishProduct, useUnpublishProduct } from '@/hooks/useProducts';
import { useAuthStore } from '@/stores/auth-store';
import { websiteUrls } from '@/lib/urls';
import { ProductContentEditor, type ProductContentFormData } from '@/components/products/ProductContentEditor';
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
  const publishProduct = usePublishProduct();
  const unpublishProduct = useUnpublishProduct();

  // Check if user is admin (can edit product content)
  const canEditProduct = user?.role === 'ADMIN';

  // Redirect non-admins
  if (!canEditProduct && !isLoading) {
    router.push(`/catalog/${productId}`);
    return null;
  }

  const handleSave = async (formData: ProductContentFormData) => {
    // Only save marketing-related fields
    const data = {
      marketingTitle: formData.marketingTitle || null,
      marketingDescription: formData.marketingDescription || null,
      metaTitle: formData.metaTitle || null,
      metaDescription: formData.metaDescription || null,
      specifications: Object.keys(formData.specifications).length > 0 ? formData.specifications : null,
    };

    await updateProduct.mutateAsync({ id: productId, data });
    refetch();
  };

  // Publish status (from product data if available)
  const isPublished = (product as any)?.isPublished ?? false;
  const isPublishing = publishProduct.isPending || unpublishProduct.isPending;

  const handlePublish = async () => {
    try {
      await publishProduct.mutateAsync(productId);
      refetch();
    } catch (error) {
      console.error('Failed to publish product:', error);
    }
  };

  const handleUnpublish = async () => {
    try {
      await unpublishProduct.mutateAsync(productId);
      refetch();
    } catch (error) {
      console.error('Failed to unpublish product:', error);
    }
  };

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
          <Link href="/catalog" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">Edit Marketing Content</h1>
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
            href={websiteUrls.productPreview(product.nusafSku)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            Preview
          </a>

          {/* Publish/Unpublish Button */}
          <button
            type="button"
            onClick={isPublished ? handleUnpublish : handlePublish}
            disabled={isPublishing}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              isPublished
                ? 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50'
                : 'text-white bg-green-600 hover:bg-green-700'
            )}
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            {isPublishing
              ? (isPublished ? 'Unpublishing...' : 'Publishing...')
              : (isPublished ? 'Unpublish' : 'Publish')}
          </button>
        </div>
      </div>

      {/* Marketing Content Editor */}
      <ProductContentEditor
        product={product}
        onSave={handleSave}
        isLoading={updateProduct.isPending}
      />
    </div>
  );
}
