/**
 * Shared reference type → route mapping for clickable document links
 * Used by AuditLogTab, MovementLogTable, and other components
 */
export const REFERENCE_TYPE_ROUTES: Record<string, string> = {
  GoodsReceivedVoucher: '/goods-receipts',
  PurchaseOrder: '/purchase-orders',
  SalesOrder: '/orders',
  PickingSlip: '/picking-slips',
  TransferRequest: '/transfer-requests',
  JobCard: '/job-cards',
  StockAdjustment: '/inventory/adjustments',
  DeliveryNote: '/delivery-notes',
  ProformaInvoice: '/orders',
};

/**
 * Warehouse location codes → display names
 */
export const WAREHOUSE_NAMES: Record<string, string> = {
  JHB: 'Johannesburg',
  CT: 'Cape Town',
};
