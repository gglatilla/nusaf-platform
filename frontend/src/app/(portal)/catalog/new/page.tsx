'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useCreateProduct } from '@/hooks/useProducts';
import { useAuthStore } from '@/stores/auth-store';
import { ProductEditor, ProductFormData } from '@/components/products';

export default function ProductCreatePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const createProduct = useCreateProduct();

  // Check if user is admin (can create products)
  const canCreateProduct = user?.role === 'ADMIN';

  // Redirect non-admins
  if (!canCreateProduct) {
    router.push('/catalog');
    return null;
  }

  const handleSave = async (formData: ProductFormData) => {
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

    const response = await createProduct.mutateAsync(data);

    // Redirect to the new product's detail page
    if (response?.id) {
      router.push(`/catalog/${response.id}`);
    } else {
      router.push('/catalog');
    }
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/catalog" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Create Product</h1>
          <p className="text-sm text-slate-600">Add a new product to the catalog</p>
        </div>
      </div>

      {/* Product Editor */}
      <ProductEditor
        product={null}
        onSave={handleSave}
        isLoading={false}
        isCreating={true}
      />
    </div>
  );
}
