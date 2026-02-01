'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Tag, Building, Ruler, Edit } from 'lucide-react';
import { useProductWithInventory } from '@/hooks/useProductInventory';
import { useAuthStore } from '@/stores/auth-store';
import {
  StockStatusBadge,
  StockOverviewCards,
  WarehouseStockTable,
  StockMovementsTable,
  AdjustStockModal,
  InventorySettings,
} from '@/components/inventory';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { ProductBomTab } from '@/components/products/ProductBomTab';
import { useCreateStockAdjustment } from '@/hooks/useProductInventory';
import { cn } from '@/lib/utils';

type TabType = 'details' | 'inventory' | 'pricing' | 'images' | 'bom';

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-6 w-6 bg-slate-200 rounded" />
        <div className="h-8 bg-slate-200 rounded w-64" />
      </div>
      <div className="h-10 bg-slate-200 rounded w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-slate-200 rounded-lg" />
        <div className="h-64 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return 'Price on Request';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [showEditModal, setShowEditModal] = useState(false);
  const { user } = useAuthStore();

  const { data: product, isLoading, error, refetch } = useProductWithInventory(productId, {
    enabled: !!productId,
  });

  // Check if user can see inventory tab (all authenticated users for now)
  const canSeeInventory = !!user;

  // Check if user is internal (not customer)
  const isInternalUser = user && user.role !== 'CUSTOMER';

  // Check if user is admin or manager (can adjust stock)
  const canAdjustStock = user && (user.role === 'ADMIN' || user.role === 'MANAGER');

  // Check if user is admin (can edit product)
  const canEditProduct = user?.role === 'ADMIN';

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">Product not found</p>
        <Link href="/products" className="text-primary-600 hover:text-primary-700">
          Back to Products
        </Link>
      </div>
    );
  }

  const supplierBadgeClass = cn(
    'inline-flex px-2 py-1 text-xs font-medium rounded',
    product.supplier.code === 'TECOM' && 'bg-blue-100 text-blue-700',
    product.supplier.code === 'CHIARAVALLI' && 'bg-green-100 text-green-700',
    product.supplier.code === 'REGINA' && 'bg-purple-100 text-purple-700',
    product.supplier.code === 'NUSAF' && 'bg-orange-100 text-orange-700',
    !['TECOM', 'CHIARAVALLI', 'REGINA', 'NUSAF'].includes(product.supplier.code) &&
      'bg-slate-100 text-slate-700'
  );

  const tabs: { id: TabType; label: string; show: boolean }[] = [
    { id: 'details', label: 'Details', show: true },
    { id: 'pricing', label: 'Pricing', show: isInternalUser ?? false },
    { id: 'images', label: 'Images', show: true },
    { id: 'inventory', label: 'Inventory', show: canSeeInventory ?? false },
    { id: 'bom', label: 'Bill of Materials', show: isInternalUser ?? false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">{product.nusafSku}</h1>
              {product.inventory && (
                <StockStatusBadge status={product.inventory.stockStatus} />
              )}
            </div>
            <p className="text-sm text-slate-600">{product.description}</p>
          </div>
        </div>
        {canEditProduct && (
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Edit className="h-4 w-4" />
            Edit Product
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-0" aria-label="Tabs">
          {tabs.filter(t => t.show).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Information</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Nusaf SKU</dt>
                    <dd className="font-mono text-sm text-slate-900">{product.nusafSku}</dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Supplier SKU</dt>
                    <dd className="font-mono text-sm text-slate-600">{product.supplierSku}</dd>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <Package className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Description</dt>
                    <dd className="text-sm text-slate-900">{product.description}</dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Supplier</dt>
                    <dd><span className={supplierBadgeClass}>{product.supplier.name}</span></dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Category</dt>
                    <dd className="text-sm text-slate-600">
                      {product.category.name}
                      {product.subCategory && (
                        <>
                          <span className="mx-1.5 text-slate-400">/</span>
                          {product.subCategory.name}
                        </>
                      )}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Ruler className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-xs text-slate-500 uppercase">Unit of Measure</dt>
                    <dd>
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700">
                        {product.unitOfMeasure}
                      </span>
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>

          {/* Sidebar - Price */}
          <div>
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Pricing</h2>
              {product.hasPrice ? (
                <div>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(product.price)}</p>
                  <p className="text-sm text-slate-500 mt-1">{product.priceLabel}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Price on Request</p>
              )}

              <div className="mt-6 pt-4 border-t border-slate-200">
                <Link
                  href={`/products?modal=${product.id}`}
                  className="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                >
                  Add to Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && isInternalUser && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pricing Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-500 uppercase mb-2">Cost Price</h3>
              <p className="text-2xl font-bold text-slate-900">
                {product.costPrice != null ? (
                  <>EUR {product.costPrice.toFixed(4)}</>
                ) : (
                  <span className="text-slate-400 text-lg font-normal">Not set</span>
                )}
              </p>
              <p className="text-sm text-slate-500 mt-1">Supplier cost in EUR</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 uppercase mb-2">List Price</h3>
              <p className="text-2xl font-bold text-slate-900">
                {product.listPrice != null ? (
                  <>{formatCurrency(product.listPrice)}</>
                ) : (
                  <span className="text-slate-400 text-lg font-normal">Not set</span>
                )}
              </p>
              <p className="text-sm text-slate-500 mt-1">Base price before tier discounts</p>
            </div>
          </div>
          {product.priceUpdatedAt && (
            <p className="text-sm text-slate-500 mt-6">
              Price last updated: {new Date(product.priceUpdatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Images Tab */}
      {activeTab === 'images' && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Images</h2>
          {product.imageUrl ? (
            <div className="max-w-md">
              <img
                src={product.imageUrl}
                alt={product.description}
                className="w-full h-auto rounded-lg border border-slate-200"
              />
              <p className="text-sm text-slate-500 mt-2 break-all">{product.imageUrl}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-center">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No image available</p>
                {canEditProduct && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    Add image URL
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && canSeeInventory && (
        <ProductInventoryTab
          product={product}
          isInternalUser={isInternalUser ?? false}
          canAdjustStock={canAdjustStock ?? false}
          userPrimaryWarehouse={user?.primaryWarehouse ?? null}
          userRole={(user?.role as 'ADMIN' | 'MANAGER' | 'SALES' | 'CUSTOMER') ?? 'CUSTOMER'}
        />
      )}

      {activeTab === 'bom' && isInternalUser && (
        <ProductBomTab
          productId={product.id}
          productSku={product.nusafSku}
          canEdit={canEditProduct ?? false}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <ProductFormModal
          isOpen={true}
          product={product as import('@/lib/api').ProductWithInventory}
          onClose={() => {
            setShowEditModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

// ProductInventoryTab - assembles all inventory components
function ProductInventoryTab({
  product,
  isInternalUser,
  canAdjustStock,
  userPrimaryWarehouse,
  userRole,
}: {
  product: NonNullable<ReturnType<typeof useProductWithInventory>['data']>;
  isInternalUser: boolean;
  canAdjustStock: boolean;
  userPrimaryWarehouse: string | null;
  userRole: 'ADMIN' | 'MANAGER' | 'SALES' | 'CUSTOMER';
}) {
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const createAdjustment = useCreateStockAdjustment(product.id);

  if (!product.inventory) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
        <p className="text-slate-500">No inventory data available for this product.</p>
      </div>
    );
  }

  const handleAdjustStock = async (data: Parameters<typeof createAdjustment.mutateAsync>[0]) => {
    await createAdjustment.mutateAsync(data);
  };

  return (
    <div className="space-y-6">
      {/* Stock Overview Cards with 4-view logic */}
      <StockOverviewCards
        inventory={product.inventory}
        userRole={userRole}
        userPrimaryWarehouse={userPrimaryWarehouse}
      />

      {/* Warehouse Breakdown Table - for internal users only */}
      {isInternalUser && (
        <WarehouseStockTable
          locations={product.inventory.byLocation}
          userPrimaryWarehouse={userPrimaryWarehouse}
        />
      )}

      {/* Recent Movements - for internal users only */}
      {isInternalUser && product.movements && (
        <StockMovementsTable movements={product.movements} />
      )}

      {/* Inventory Settings - for admins/managers only */}
      {canAdjustStock && (
        <InventorySettings
          productDefaults={{
            defaultReorderPoint: product.defaultReorderPoint,
            defaultReorderQty: product.defaultReorderQty,
            defaultMinStock: product.defaultMinStock,
            defaultMaxStock: product.defaultMaxStock,
            leadTimeDays: product.leadTimeDays,
          }}
          locationOverrides={product.inventory.byLocation.map((loc) => ({
            warehouseId: loc.warehouseId,
            warehouseName: loc.warehouseName,
            reorderPoint: loc.reorderPoint,
            minimumStock: loc.minimumStock,
            maximumStock: loc.maximumStock,
          }))}
          canEdit={canAdjustStock}
          // TODO: Add onSave handler when PATCH endpoint is wired up
        />
      )}

      {/* Adjust Stock Button + Modal - for admins/managers */}
      {canAdjustStock && (
        <>
          <div className="flex justify-end">
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              onClick={() => setShowAdjustModal(true)}
            >
              Adjust Stock
            </button>
          </div>

          <AdjustStockModal
            isOpen={showAdjustModal}
            onClose={() => setShowAdjustModal(false)}
            productId={product.id}
            productSku={product.nusafSku}
            productDescription={product.description}
            onSubmit={handleAdjustStock}
            isSubmitting={createAdjustment.isPending}
          />
        </>
      )}
    </div>
  );
}
