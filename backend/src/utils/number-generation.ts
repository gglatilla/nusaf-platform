import { prisma } from '../config/database';
import type { PrismaClient } from '@prisma/client';

/**
 * Generic counter model delegate — all counter models share this shape.
 * Prisma generates separate types per model, so we use a structural type.
 */
interface CounterDelegate {
  findUnique(args: { where: { id: string } }): Promise<{ id: string; year: number; count: number } | null>;
  create(args: { data: { id: string; year: number; count: number } }): Promise<{ id: string; year: number; count: number }>;
  update(args: { where: { id: string }; data: { year?: number; count: number | { increment: number } } }): Promise<{ id: string; year: number; count: number }>;
}

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export interface DocumentNumberConfig {
  /** The counter record ID, e.g. 'order_counter' */
  counterId: string;
  /** The document prefix, e.g. 'SO' */
  prefix: string;
  /** Zero-pad length for the sequence number (default: 5) */
  padLength?: number;
  /** Accessor to get the counter model from a Prisma client */
  getCounter: (client: TransactionClient) => CounterDelegate;
}

/**
 * Generate a sequential document number using a transactional counter.
 *
 * Format: {PREFIX}-{YEAR}-{PADDED_COUNT}
 * Example: SO-2026-00042
 *
 * Uses a database transaction to safely increment, with automatic year reset.
 */
export async function generateDocumentNumber(config: DocumentNumberConfig): Promise<string> {
  const { counterId, prefix, padLength = 5, getCounter } = config;
  const currentYear = new Date().getFullYear();

  const counter = await prisma.$transaction(async (tx) => {
    const model = getCounter(tx as unknown as TransactionClient);

    let record = await model.findUnique({ where: { id: counterId } });

    if (!record) {
      record = await model.create({
        data: { id: counterId, year: currentYear, count: 1 },
      });
      return record;
    }

    if (record.year !== currentYear) {
      record = await model.update({
        where: { id: counterId },
        data: { year: currentYear, count: 1 },
      });
      return record;
    }

    record = await model.update({
      where: { id: counterId },
      data: { count: { increment: 1 } },
    });
    return record;
  });

  return `${prefix}-${currentYear}-${counter.count.toString().padStart(padLength, '0')}`;
}

/**
 * Generate a sequential document number within an existing transaction.
 * Use this when you need the number generation to be part of a larger transaction.
 */
export async function generateDocumentNumberTx(
  tx: TransactionClient,
  config: Omit<DocumentNumberConfig, 'getCounter'> & { getCounter: (client: TransactionClient) => CounterDelegate }
): Promise<string> {
  const { counterId, prefix, padLength = 5, getCounter } = config;
  const currentYear = new Date().getFullYear();
  const model = getCounter(tx);

  let record = await model.findUnique({ where: { id: counterId } });

  if (!record) {
    record = await model.create({
      data: { id: counterId, year: currentYear, count: 1 },
    });
  } else if (record.year !== currentYear) {
    record = await model.update({
      where: { id: counterId },
      data: { year: currentYear, count: 1 },
    });
  } else {
    record = await model.update({
      where: { id: counterId },
      data: { count: { increment: 1 } },
    });
  }

  return `${prefix}-${currentYear}-${record.count.toString().padStart(padLength, '0')}`;
}

// ============================================
// Pre-configured document number generators
// ============================================

/** Generate: SO-YYYY-NNNNN */
export const generateOrderNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'order_counter', prefix: 'SO', getCounter: (c) => c.salesOrderCounter as unknown as CounterDelegate });

/** Generate: QUO-YYYY-NNNNN */
export const generateQuoteNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'quote_counter', prefix: 'QUO', getCounter: (c) => c.quoteCounter as unknown as CounterDelegate });

/** Generate: PAY-YYYY-NNNNN */
export const generatePaymentNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'payment_counter', prefix: 'PAY', getCounter: (c) => c.paymentCounter as unknown as CounterDelegate });

/** Generate: PS-YYYY-NNNNN */
export const generatePickingSlipNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'picking_slip_counter', prefix: 'PS', getCounter: (c) => c.pickingSlipCounter as unknown as CounterDelegate });

/** Generate: JC-YYYY-NNNNN */
export const generateJobCardNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'job_card_counter', prefix: 'JC', getCounter: (c) => c.jobCardCounter as unknown as CounterDelegate });

/** Generate: TR-YYYY-NNNNN */
export const generateTransferRequestNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'transfer_request_counter', prefix: 'TR', getCounter: (c) => c.transferRequestCounter as unknown as CounterDelegate });

/** Generate: PO-YYYY-NNNNN */
export const generatePONumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'purchase_order_counter', prefix: 'PO', getCounter: (c) => c.purchaseOrderCounter as unknown as CounterDelegate });

/** Generate: GRV-YYYY-NNNNN */
export const generateGRVNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'grv_counter', prefix: 'GRV', getCounter: (c) => c.grvCounter as unknown as CounterDelegate });

/** Generate: CC-YYYY-NNNNN */
export const generateCycleCountNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'cycle_count_counter', prefix: 'CC', getCounter: (c) => c.cycleCountCounter as unknown as CounterDelegate });

/** Generate: ISS-YYYY-NNNNN */
export const generateIssueNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'issue_flag_counter', prefix: 'ISS', getCounter: (c) => c.issueFlagCounter as unknown as CounterDelegate });

/** Generate: ADJ-YYYY-NNNNN */
export const generateAdjustmentNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'adjustment_counter', prefix: 'ADJ', getCounter: (c) => c.stockAdjustmentCounter as unknown as CounterDelegate });

/** Generate: DN-YYYY-NNNNN */
export const generateDeliveryNoteNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'delivery_note_counter', prefix: 'DN', getCounter: (c) => c.deliveryNoteCounter as unknown as CounterDelegate });

/** Generate: PI-YYYY-NNNNN */
export const generateProformaNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'proforma_invoice_counter', prefix: 'PI', getCounter: (c) => c.proformaInvoiceCounter as unknown as CounterDelegate });

/** Generate: INV-YYYY-NNNNN */
export const generateInvoiceNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'tax_invoice_counter', prefix: 'INV', getCounter: (c) => c.taxInvoiceCounter as unknown as CounterDelegate });

/** Generate: PR-YYYY-NNNNN */
export const generateRequisitionNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'purchase_requisition_counter', prefix: 'PR', getCounter: (c) => c.purchaseRequisitionCounter as unknown as CounterDelegate });

/** Generate: RA-YYYY-NNNNN */
export const generateRANumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'return_auth_counter', prefix: 'RA', getCounter: (c) => c.returnAuthorizationCounter as unknown as CounterDelegate });

/** Generate: PL-YYYY-NNNNN */
export const generatePackingListNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'packing_list_counter', prefix: 'PL', getCounter: (c) => c.packingListCounter as unknown as CounterDelegate });

/** Generate: CN-YYYY-NNNNN */
export const generateCreditNoteNumber = (): Promise<string> =>
  generateDocumentNumber({ counterId: 'credit_note_counter', prefix: 'CN', getCounter: (c) => c.creditNoteCounter as unknown as CounterDelegate });

/**
 * Generate: NUS-NNNN (customer account number, no year reset)
 * Uses a simple sequential counter that never resets.
 */
export async function generateAccountNumber(): Promise<string> {
  const counter = await prisma.$transaction(async (tx) => {
    const model = (tx as unknown as TransactionClient).companyCounter as unknown as CounterDelegate;

    let record = await model.findUnique({ where: { id: 'company_counter' } });

    if (!record) {
      record = await model.create({
        data: { id: 'company_counter', year: 0, count: 1 },
      });
      return record;
    }

    record = await model.update({
      where: { id: 'company_counter' },
      data: { count: { increment: 1 } },
    });
    return record;
  });

  return `NUS-${counter.count.toString().padStart(4, '0')}`;
}

// ============================================
// Transaction variants (for orchestration)
// ============================================

/** Generate PS number within existing transaction */
export const generatePickingSlipNumberTx = (tx: TransactionClient): Promise<string> =>
  generateDocumentNumberTx(tx, { counterId: 'picking_slip_counter', prefix: 'PS', getCounter: (c) => c.pickingSlipCounter as unknown as CounterDelegate });

/** Generate JC number within existing transaction */
export const generateJobCardNumberTx = (tx: TransactionClient): Promise<string> =>
  generateDocumentNumberTx(tx, { counterId: 'job_card_counter', prefix: 'JC', getCounter: (c) => c.jobCardCounter as unknown as CounterDelegate });

/** Generate TR number within existing transaction */
export const generateTransferNumberTx = (tx: TransactionClient): Promise<string> =>
  generateDocumentNumberTx(tx, { counterId: 'transfer_request_counter', prefix: 'TR', getCounter: (c) => c.transferRequestCounter as unknown as CounterDelegate });

/** Generate PO number within existing transaction */
export const generatePurchaseOrderNumberTx = (tx: TransactionClient): Promise<string> =>
  generateDocumentNumberTx(tx, { counterId: 'purchase_order_counter', prefix: 'PO', getCounter: (c) => c.purchaseOrderCounter as unknown as CounterDelegate });
