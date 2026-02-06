'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  StockOverviewCards,
  WarehouseStockTable,
  StockMovementsTable,
  AdjustStockModal,
} from '@/components/inventory';
import { useCreateStockAdjustment } from '@/hooks/useProductInventory';
import type { ProductWithInventory } from '@/lib/api/types/products';
import type { CreateStockAdjustmentData } from '@/lib/api';

interface InventoryTabProps {
  product: ProductWithInventory;
  userRole: string;
  userPrimaryWarehouse: string | null;
  canAdjustStock: boolean;
}

export function InventoryTab({ product, userRole, userPrimaryWarehouse, canAdjustStock }: InventoryTabProps) {
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const createAdjustment = useCreateStockAdjustment(product.id);

  const inventory = product.inventory;
  const movements = product.movements || [];

  // Map user role to what StockOverviewCards expects
  const overviewRole = (userRole === 'ADMIN' || userRole === 'MANAGER')
    ? userRole as 'ADMIN' | 'MANAGER'
    : userRole === 'CUSTOMER'
      ? 'CUSTOMER' as const
      : 'SALES' as const;

  const handleAdjustSubmit = async (data: CreateStockAdjustmentData) => {
    await createAdjustment.mutateAsync(data);
    setAdjustModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Stock Overview Cards */}
      {inventory && (
        <StockOverviewCards
          inventory={inventory}
          userRole={overviewRole}
          userPrimaryWarehouse={userPrimaryWarehouse}
        />
      )}

      {/* Per-Warehouse Breakdown */}
      {inventory?.byLocation && (
        <WarehouseStockTable
          locations={inventory.byLocation}
          userPrimaryWarehouse={userPrimaryWarehouse}
        />
      )}

      {/* Adjust Stock Button */}
      {canAdjustStock && (
        <div className="flex justify-end">
          <button
            onClick={() => setAdjustModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            Adjust Stock
          </button>
        </div>
      )}

      {/* Recent Movements */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900">Recent Movements</h3>
          <Link
            href={`/inventory?productId=${product.id}`}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            View All Movements
          </Link>
        </div>
        <StockMovementsTable movements={movements} limit={20} />
      </div>

      {/* Adjust Stock Modal */}
      <AdjustStockModal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        productId={product.id}
        productSku={product.nusafSku}
        productDescription={product.description}
        onSubmit={handleAdjustSubmit}
        isSubmitting={createAdjustment.isPending}
      />
    </div>
  );
}
