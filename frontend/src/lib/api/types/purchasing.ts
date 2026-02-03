// Purchasing types - Purchase Orders, GRVs

import type { Warehouse } from '@nusaf/shared';

// Purchase Order types
export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'SENT'
  | 'CONFIRMED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CLOSED'
  | 'CANCELLED';

export interface PurchaseOrderLine {
  id: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number;
  lineTotal: number;
  notes: string | null;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  supplier: {
    id: string;
    code: string;
    name: string;
  };
  warehouse: Warehouse;
  lines: PurchaseOrderLine[];
  subtotal: number;
  currency: string;
  expectedDate: string | null;
  notes: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  sentAt: string | null;
  sentBy: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
}

export interface PurchaseOrderListItem {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  supplierName: string;
  supplierCode: string;
  warehouse: Warehouse;
  lineCount: number;
  subtotal: number;
  currency: string;
  expectedDate: string | null;
  createdAt: string;
}

export interface PurchaseOrdersListResponse {
  purchaseOrders: PurchaseOrderListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface PurchaseOrdersQueryParams {
  supplierId?: string;
  status?: PurchaseOrderStatus;
  warehouse?: Warehouse;
  page?: number;
  pageSize?: number;
}

export interface CreatePurchaseOrderData {
  supplierId: string;
  warehouse: Warehouse;
  expectedDate?: string;
  notes?: string;
  lines: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
}

export interface UpdatePurchaseOrderData {
  expectedDate?: string;
  notes?: string;
}

export interface AddPOLineData {
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface UpdatePOLineData {
  quantity?: number;
  unitPrice?: number;
  notes?: string;
}

// GRV (Goods Received Voucher) types
export type GRVStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export interface GRVLine {
  id: string;
  lineNumber: number;
  poLineId: string;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityOrdered: number;
  quantityPreviouslyReceived: number;
  quantityReceived: number;
  quantityRejected: number;
  rejectionReason: string | null;
  notes: string | null;
}

export interface GRV {
  id: string;
  grvNumber: string;
  status: GRVStatus;
  purchaseOrder: {
    id: string;
    poNumber: string;
  };
  supplier: {
    id: string;
    code: string;
    name: string;
  };
  warehouse: Warehouse;
  lines: GRVLine[];
  deliveryNote: string | null;
  notes: string | null;
  receivedAt: string | null;
  postedAt: string | null;
  postedBy: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
}

export interface GRVListItem {
  id: string;
  grvNumber: string;
  status: GRVStatus;
  poNumber: string;
  supplierName: string;
  warehouse: Warehouse;
  lineCount: number;
  receivedAt: string | null;
  createdAt: string;
}

export interface GRVsListResponse {
  grvs: GRVListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface GRVsQueryParams {
  purchaseOrderId?: string;
  supplierId?: string;
  status?: GRVStatus;
  warehouse?: Warehouse;
  page?: number;
  pageSize?: number;
}

export interface CreateGRVData {
  purchaseOrderId: string;
  deliveryNote?: string;
  notes?: string;
  lines: Array<{
    poLineId: string;
    quantityReceived: number;
    quantityRejected?: number;
    rejectionReason?: string;
    notes?: string;
  }>;
}

export interface UpdateGRVLineData {
  quantityReceived?: number;
  quantityRejected?: number;
  rejectionReason?: string;
  notes?: string;
}

export interface POReceivableItem {
  poLineId: string;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityOutstanding: number;
}

export interface POReceivableResponse {
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouse: Warehouse;
  items: POReceivableItem[];
}
