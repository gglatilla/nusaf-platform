// Inventory dashboard types

import type { Warehouse, StockStatus } from '@nusaf/shared';

export interface WarehouseInventorySummary {
  warehouseId: string;
  warehouseName: string;
  totalProducts: number;
  totalValue: number;
  stockStatusBreakdown: {
    inStock: number;
    lowStock: number;
    outOfStock: number;
    onOrder: number;
    overstock: number;
  };
}

export interface InventoryDashboard {
  totalProducts: number;
  totalValue: number;
  warehouses: WarehouseInventorySummary[];
  recentMovements: Array<{
    id: string;
    productSku: string;
    productDescription: string;
    warehouseName: string;
    type: string;
    quantity: number;
    createdAt: string;
  }>;
  lowStockAlerts: Array<{
    productId: string;
    productSku: string;
    productDescription: string;
    warehouseName: string;
    onHand: number;
    reorderPoint: number;
  }>;
}

export interface StockLevelUpdate {
  productId: string;
  warehouseId: string;
  onHand?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  minimumStock?: number;
  maximumStock?: number;
}

export interface StockAdjustmentData {
  productId: string;
  warehouseId: string;
  quantity: number;
  reason: string;
  notes?: string;
}

export interface StockAdjustmentResponse {
  id: string;
  movementId: string;
  newOnHand: number;
}

export interface StockMovementQueryParams {
  productId?: string;
  warehouseId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface StockMovementsListResponse {
  movements: Array<{
    id: string;
    productId: string;
    productSku: string;
    productDescription: string;
    warehouseId: string;
    warehouseName: string;
    type: string;
    quantity: number;
    referenceType: string | null;
    referenceId: string | null;
    notes: string | null;
    createdAt: string;
    createdBy: string | null;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ProductStockLevel {
  productId: string;
  productSku: string;
  productDescription: string;
  warehouseId: string;
  warehouseName: string;
  onHand: number;
  softReserved: number;
  hardReserved: number;
  available: number;
  onOrder: number;
  reorderPoint: number | null;
  reorderQuantity: number | null;
  minimumStock: number | null;
  maximumStock: number | null;
  stockStatus: StockStatus;
}

export interface ProductStockLevelsResponse {
  stockLevels: ProductStockLevel[];
}

export interface InventoryValuationReport {
  totalValue: number;
  byWarehouse: Array<{
    warehouseId: string;
    warehouseName: string;
    totalValue: number;
    productCount: number;
  }>;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    totalValue: number;
    productCount: number;
  }>;
}
