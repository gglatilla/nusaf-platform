// Inventory types shared between frontend and backend

export type Warehouse = 'JHB' | 'CT';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER' | 'OVERSTOCK';

export type StockMovementType =
  | 'RECEIPT'
  | 'ISSUE'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'MANUFACTURE_IN'
  | 'MANUFACTURE_OUT'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'SCRAP';

export type StockAdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type StockAdjustmentReason =
  | 'PHYSICAL_COUNT'
  | 'DAMAGE'
  | 'THEFT'
  | 'FOUND'
  | 'CORRECTION'
  | 'INITIAL'
  | 'OTHER';

export type ReservationType = 'SOFT' | 'HARD';

export interface StockLevel {
  id: string;
  productId: string;
  location: Warehouse;
  onHand: number;
  softReserved: number;
  hardReserved: number;
  onOrder: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  minimumStock?: number;
  maximumStock?: number;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  location: Warehouse;
  movementType: StockMovementType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  location: Warehouse;
  reason: StockAdjustmentReason;
  notes?: string;
  status: StockAdjustmentStatus;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  createdBy: string;
}

export interface StockReservation {
  id: string;
  productId: string;
  location: Warehouse;
  quantity: number;
  reservationType: ReservationType;
  referenceType: string;
  referenceId: string;
  expiresAt?: Date;
  releasedAt?: Date;
  releasedBy?: string;
  releaseReason?: string;
  createdAt: Date;
  createdBy: string;
}
