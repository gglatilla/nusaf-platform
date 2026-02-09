// Order types shared between frontend and backend

import type { Warehouse } from './inventory';

export type SalesOrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'PARTIALLY_SHIPPED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'INVOICED'
  | 'CLOSED'
  | 'ON_HOLD'
  | 'CANCELLED';

export type FulfillmentPolicy = 'SHIP_PARTIAL' | 'SHIP_COMPLETE' | 'SALES_DECISION';

export type PaymentTerms = 'PREPAY' | 'COD' | 'NET_30' | 'NET_60' | 'NET_90';

export type OrderPaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'NOT_REQUIRED';

export type QuoteStatus =
  | 'DRAFT'
  | 'CREATED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'CONVERTED';

export type PickingSlipStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'CANCELLED';

export type JobCardStatus = 'PENDING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETE' | 'CANCELLED';

export type JobType = 'MACHINING' | 'ASSEMBLY';

export type TransferRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'CANCELLED';

export interface SalesOrder {
  id: string;
  orderNumber: string;
  companyId: string;
  userId: string;
  quoteId?: string;
  status: SalesOrderStatus;
  paymentTerms?: PaymentTerms;
  paymentStatus?: OrderPaymentStatus;
  currency: 'ZAR';
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  customerReference?: string;
  notes?: string;
  createdAt: Date;
  createdBy?: string;
  confirmedAt?: Date;
  confirmedBy?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  companyId: string;
  userId: string;
  status: QuoteStatus;
  currency: 'ZAR';
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  notes?: string;
  validUntil: Date;
  createdAt: Date;
  createdBy?: string;
  finalizedAt?: Date;
}

export interface PickingSlip {
  id: string;
  slipNumber: string;
  orderId: string;
  companyId: string;
  location: Warehouse;
  status: PickingSlipStatus;
  notes?: string;
  createdAt: Date;
  createdBy?: string;
}

export interface JobCard {
  id: string;
  cardNumber: string;
  orderId: string;
  companyId: string;
  productId: string;
  quantity: number;
  jobType: JobType;
  status: JobCardStatus;
  notes?: string;
  dueDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  createdBy?: string;
}

export interface TransferRequest {
  id: string;
  requestNumber: string;
  orderId?: string;
  companyId: string;
  fromLocation: Warehouse;
  toLocation: Warehouse;
  status: TransferRequestStatus;
  notes?: string;
  requestedDate?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  shippedAt?: Date;
  receivedAt?: Date;
  receivedBy?: string;
  createdAt: Date;
  createdBy?: string;
}
