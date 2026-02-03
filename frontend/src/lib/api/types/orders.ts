// Order types - quotes, sales orders, picking slips, job cards, transfer requests

import type {
  Warehouse,
  SalesOrderStatus,
  QuoteStatus,
  PickingSlipStatus,
  JobCardStatus,
  JobType,
} from '@nusaf/shared';

// Quote types
export interface QuoteItem {
  id: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  customerTier: string;
  company: {
    id: string;
    name: string;
  };
  items: QuoteItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  customerNotes: string | null;
  validUntil: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteListItem {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  itemCount: number;
  total: number;
  validUntil: string | null;
  createdAt: string;
}

export interface QuotesListResponse {
  quotes: QuoteListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ActiveDraftQuote {
  id: string;
  quoteNumber: string;
  itemCount: number;
  items: QuoteItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
}

export interface CreateQuoteResponse {
  id: string;
  quoteNumber: string;
  isNew: boolean;
}

export interface AddQuoteItemData {
  productId: string;
  quantity: number;
}

export interface AddQuoteItemResponse {
  id: string;
  lineNumber: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface FinalizeQuoteResponse {
  id: string;
  quoteNumber: string;
  validUntil: string;
}

export interface QuotesQueryParams {
  status?: QuoteStatus;
  page?: number;
  pageSize?: number;
}

// Sales Order types
export type FulfillmentType = 'STOCK_ONLY' | 'ASSEMBLY_REQUIRED' | 'MIXED';
export type SalesOrderLineStatus = 'PENDING' | 'PICKING' | 'PICKED' | 'SHIPPED' | 'DELIVERED';

export interface SalesOrderLine {
  id: string;
  lineNumber: number;
  status: SalesOrderLineStatus;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityOrdered: number;
  quantityPicked: number;
  quantityShipped: number;
  unitPrice: number;
  lineTotal: number;
  notes: string | null;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  status: SalesOrderStatus;
  company: {
    id: string;
    name: string;
  };
  quoteId: string | null;
  quoteNumber: string | null;
  customerPoNumber: string | null;
  customerPoDate: string | null;
  fulfillmentType: FulfillmentType;
  warehouse: Warehouse;
  requiredDate: string | null;
  promisedDate: string | null;
  shippedDate: string | null;
  deliveredDate: string | null;
  lines: SalesOrderLine[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  internalNotes: string | null;
  customerNotes: string | null;
  holdReason: string | null;
  cancelReason: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderListItem {
  id: string;
  orderNumber: string;
  status: SalesOrderStatus;
  quoteNumber: string | null;
  customerPoNumber: string | null;
  lineCount: number;
  total: number;
  createdAt: string;
}

export interface SalesOrdersListResponse {
  orders: SalesOrderListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface CreateOrderFromQuoteData {
  quoteId: string;
  customerPoNumber?: string;
  customerPoDate?: string;
  requiredDate?: string;
  customerNotes?: string;
}

export interface CreateOrderResponse {
  id: string;
  orderNumber: string;
}

export interface OrdersQueryParams {
  status?: SalesOrderStatus;
  page?: number;
  pageSize?: number;
}

// Picking Slip types
export interface PickingSlipLine {
  id: string;
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityToPick: number;
  quantityPicked: number;
  pickedAt: string | null;
  pickedBy: string | null;
  binLocation: string | null;
}

export interface PickingSlip {
  id: string;
  pickingSlipNumber: string;
  companyId: string;
  orderId: string;
  orderNumber: string;
  location: Warehouse;
  status: PickingSlipStatus;
  assignedTo: string | null;
  assignedToName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  lines: PickingSlipLine[];
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
}

export interface PickingSlipListItem {
  id: string;
  pickingSlipNumber: string;
  orderNumber: string;
  orderId: string;
  location: Warehouse;
  status: PickingSlipStatus;
  assignedToName: string | null;
  lineCount: number;
  createdAt: string;
}

export interface PickingSlipsListResponse {
  pickingSlips: PickingSlipListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface PickingSlipsQueryParams {
  orderId?: string;
  location?: Warehouse;
  status?: PickingSlipStatus;
  page?: number;
  pageSize?: number;
}

export interface GeneratePickingSlipsLineInput {
  orderLineId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityToPick: number;
  location: Warehouse;
}

export interface GeneratePickingSlipsData {
  lines: GeneratePickingSlipsLineInput[];
}

export interface GeneratePickingSlipsResponse {
  pickingSlips: Array<{ id: string; pickingSlipNumber: string; location: Warehouse }>;
  errors?: string[];
}

export interface OrderPickingSlipSummary {
  id: string;
  pickingSlipNumber: string;
  location: Warehouse;
  status: PickingSlipStatus;
  lineCount: number;
}

// Job Card types
export interface JobCard {
  id: string;
  jobCardNumber: string;
  companyId: string;
  orderId: string;
  orderNumber: string;
  orderLineId: string;
  productId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
  jobType: JobType;
  status: JobCardStatus;
  holdReason: string | null;
  notes: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
}

export interface JobCardListItem {
  id: string;
  jobCardNumber: string;
  orderNumber: string;
  orderId: string;
  productSku: string;
  productDescription: string;
  quantity: number;
  jobType: JobType;
  status: JobCardStatus;
  assignedToName: string | null;
  createdAt: string;
}

export interface JobCardsListResponse {
  jobCards: JobCardListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface JobCardsQueryParams {
  orderId?: string;
  status?: JobCardStatus;
  page?: number;
  pageSize?: number;
}

export interface GenerateJobCardsData {
  lines: Array<{
    orderLineId: string;
    productId: string;
    productSku: string;
    productDescription: string;
    quantity: number;
    jobType: JobType;
  }>;
}

export interface GenerateJobCardsResponse {
  jobCards: Array<{ id: string; jobCardNumber: string }>;
  errors?: string[];
}

export interface OrderJobCardSummary {
  id: string;
  jobCardNumber: string;
  productSku: string;
  jobType: JobType;
  status: JobCardStatus;
}

// Transfer Request types
export type TransferRequestStatus = 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export interface TransferRequestLine {
  id: string;
  productId: string;
  productSku: string;
  productDescription: string;
  quantityRequested: number;
  quantityShipped: number;
  quantityReceived: number;
}

export interface TransferRequest {
  id: string;
  requestNumber: string;
  orderId: string | null;
  orderNumber: string | null;
  fromLocation: Warehouse;
  toLocation: Warehouse;
  status: TransferRequestStatus;
  lines: TransferRequestLine[];
  notes: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  receivedBy: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
}

export interface TransferRequestListItem {
  id: string;
  requestNumber: string;
  orderNumber: string | null;
  fromLocation: Warehouse;
  toLocation: Warehouse;
  status: TransferRequestStatus;
  lineCount: number;
  createdAt: string;
}

export interface TransferRequestsListResponse {
  transferRequests: TransferRequestListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface TransferRequestsQueryParams {
  orderId?: string;
  fromLocation?: Warehouse;
  toLocation?: Warehouse;
  status?: TransferRequestStatus;
  page?: number;
  pageSize?: number;
}

export interface GenerateTransferRequestsData {
  lines: Array<{
    productId: string;
    productSku: string;
    productDescription: string;
    quantityRequested: number;
    fromLocation: Warehouse;
    toLocation: Warehouse;
  }>;
}

export interface GenerateTransferRequestsResponse {
  transferRequests: Array<{ id: string; requestNumber: string }>;
  errors?: string[];
}

// Issue Flag types
export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface IssueFlag {
  id: string;
  referenceType: string;
  referenceId: string;
  referenceNumber: string;
  issueType: string;
  severity: IssueSeverity;
  status: IssueStatus;
  description: string;
  resolution: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
}

export interface IssueFlagListItem {
  id: string;
  referenceType: string;
  referenceNumber: string;
  issueType: string;
  severity: IssueSeverity;
  status: IssueStatus;
  description: string;
  createdAt: string;
}

export interface IssueFlagsListResponse {
  issues: IssueFlagListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface IssueFlagsQueryParams {
  referenceType?: string;
  referenceId?: string;
  status?: IssueStatus;
  severity?: IssueSeverity;
  page?: number;
  pageSize?: number;
}

export interface CreateIssueFlagData {
  referenceType: string;
  referenceId: string;
  issueType: string;
  severity: IssueSeverity;
  description: string;
}

export interface UpdateIssueFlagData {
  status?: IssueStatus;
  severity?: IssueSeverity;
  description?: string;
  resolution?: string;
}
