/**
 * Cash customer detail fields, shared between Quote and SalesOrder.
 */
export interface CashCustomerDetails {
  cashCustomerName: string | null;
  cashCustomerPhone: string | null;
  cashCustomerEmail: string | null;
  cashCustomerCompany: string | null;
  cashCustomerVat: string | null;
  cashCustomerAddress: string | null;
}

/**
 * Resolve the display customer name for documents (invoices, delivery notes, etc.).
 * For cash orders: use company name > personal name > generic cash company name.
 * For regular orders: use company name as-is.
 */
export function resolveCustomerName(order: {
  cashCustomerCompany?: string | null;
  cashCustomerName?: string | null;
  company: { name: string };
}): string {
  return order.cashCustomerCompany || order.cashCustomerName || order.company.name;
}

/**
 * Resolve the VAT number for documents.
 * For cash orders: use cash customer VAT if provided, else company VAT.
 */
export function resolveCustomerVat(order: {
  cashCustomerVat?: string | null;
  company: { vatNumber?: string | null };
}): string | null {
  return order.cashCustomerVat || order.company.vatNumber || null;
}

/**
 * Pick only the cash customer fields from an object (for copying between quote → order).
 */
export function pickCashCustomerFields(source: Partial<CashCustomerDetails>): Partial<CashCustomerDetails> {
  return {
    cashCustomerName: source.cashCustomerName ?? null,
    cashCustomerPhone: source.cashCustomerPhone ?? null,
    cashCustomerEmail: source.cashCustomerEmail ?? null,
    cashCustomerCompany: source.cashCustomerCompany ?? null,
    cashCustomerVat: source.cashCustomerVat ?? null,
    cashCustomerAddress: source.cashCustomerAddress ?? null,
  };
}
