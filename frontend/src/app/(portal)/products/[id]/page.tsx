'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Tag, Building, Ruler } from 'lucide-react';
import { useProductWithInventory } from '@/hooks/useProductInventory';
import { useAuthStore } from '@/stores/auth-store';
import { StockStatusBadge } from '@/components/inventory/StockStatusBadge';
import { cn } from '@/lib/utils';

type TabType = 'details' | 'inventory';

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
  const { user } = useAuthStore();

  const { data: product, isLoading, error } = useProductWithInventory(productId, {
    enabled: !!productId,
  });

  // Check if user can see inventory tab (all authenticated users for now)
  const canSeeInventory = !!user;

  // Check if user is internal (not customer)
  const isInternalUser = user && user.role !== 'CUSTOMER';

  // Check if user is admin or manager (can adjust stock)
  const canAdjustStock = user && (user.role === 'ADMIN' || user.role === 'MANAGER');

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
    { id: 'inventory', label: 'Inventory', show: canSeeInventory },
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

      {activeTab === 'inventory' && canSeeInventory && (
        <ProductInventoryTab
          product={product}
          isInternalUser={isInternalUser ?? false}
          canAdjustStock={canAdjustStock ?? false}
          userPrimaryWarehouse={user?.primaryWarehouse ?? null}
        />
      )}
    </div>
  );
}

// Placeholder component - will be replaced with actual implementation
function ProductInventoryTab({
  product,
  isInternalUser,
  canAdjustStock,
  userPrimaryWarehouse,
}: {
  product: NonNullable<ReturnType<typeof useProductWithInventory>['data']>;
  isInternalUser: boolean;
  canAdjustStock: boolean;
  userPrimaryWarehouse: string | null;
}) {
  if (!product.inventory) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
        <p className="text-slate-500">No inventory data available for this product.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stock Overview - placeholder */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Stock Overview</h2>
          <StockStatusBadge status={product.inventory.stockStatus} />
        </div>

        {/* Hero Card - Available to Sell */}
        <div className="mb-6 p-6 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm font-medium text-green-700 mb-1">Available to Sell</p>
          <p className="text-4xl font-bold text-green-800">{product.inventory.available}</p>
          <p className="text-sm text-green-600 mt-1">
            {isInternalUser ? 'Total across all warehouses' : 'Ready for immediate dispatch'}
          </p>
        </div>

        {/* Secondary Cards */}
        {isInternalUser && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase">On Hand</p>
              <p className="text-xl font-semibold text-slate-700">{product.inventory.onHand}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase">Reserved</p>
              <p className="text-xl font-semibold text-slate-700">{product.inventory.reserved}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase">On Order</p>
              <p className="text-xl font-semibold text-slate-700">{product.inventory.onOrder}</p>
            </div>
          </div>
        )}

        {/* Formula bar */}
        {isInternalUser && (
          <p className="text-sm text-slate-500">
            Available = On Hand ({product.inventory.onHand}) − Reserved ({product.inventory.reserved}) = {product.inventory.available}
          </p>
        )}
      </div>

      {/* Warehouse Breakdown Table - for internal users */}
      {isInternalUser && product.inventory.byLocation.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Stock by Warehouse</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-500 uppercase text-xs">Warehouse</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500 uppercase text-xs">Available</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500 uppercase text-xs text-slate-400">On Hand</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500 uppercase text-xs">Reserved</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500 uppercase text-xs">On Order</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500 uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {product.inventory.byLocation
                  .sort((a, b) => {
                    // Sort user's primary warehouse to top
                    if (userPrimaryWarehouse) {
                      if (a.warehouseId === userPrimaryWarehouse) return -1;
                      if (b.warehouseId === userPrimaryWarehouse) return 1;
                    }
                    return a.warehouseName.localeCompare(b.warehouseName);
                  })
                  .map((loc) => {
                    const isPrimary = loc.warehouseId === userPrimaryWarehouse;
                    return (
                      <tr
                        key={loc.warehouseId}
                        className={cn(
                          'border-b border-slate-100',
                          isPrimary && 'bg-blue-50'
                        )}
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-900">
                            {isPrimary && <span className="text-amber-500 mr-1">★</span>}
                            {loc.warehouseName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{loc.available}</td>
                        <td className="py-3 px-4 text-right text-slate-500">{loc.onHand}</td>
                        <td className="py-3 px-4 text-right text-slate-700">{loc.softReserved + loc.hardReserved}</td>
                        <td className="py-3 px-4 text-right text-slate-700">{loc.onOrder}</td>
                        <td className="py-3 px-4 text-right">
                          <StockStatusBadge status={loc.stockStatus} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Movements - for internal users */}
      {isInternalUser && product.movements && product.movements.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Stock Movements</h2>
          <div className="space-y-2">
            {product.movements.slice(0, 10).map((movement) => (
              <div
                key={movement.id}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">
                    {new Date(movement.createdAt).toLocaleDateString('en-ZA', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {movement.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-slate-500">{movement.warehouseName}</span>
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adjust Stock Button - for admins/managers */}
      {canAdjustStock && (
        <div className="flex justify-end">
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            onClick={() => {
              // TODO: Open adjust stock modal
              alert('Adjust Stock modal - coming soon');
            }}
          >
            Adjust Stock
          </button>
        </div>
      )}
    </div>
  );
}
