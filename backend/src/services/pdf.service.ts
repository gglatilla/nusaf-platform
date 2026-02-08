import PDFDocument from 'pdfkit';
import type { PurchaseOrderData } from './purchase-order.service';
import type { ProformaInvoiceData } from './proforma-invoice.service';
import type { TaxInvoiceData } from './tax-invoice.service';
import type { PackingListData } from './packing-list.service';

// ============================================
// CONSTANTS
// ============================================

const COLORS = {
  primary: '#1a5f7a',      // Nusaf teal
  secondary: '#2e8b57',    // Sea green
  text: '#333333',
  lightGray: '#f5f5f5',
  mediumGray: '#cccccc',
  darkGray: '#666666',
};

const FONTS = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold',
};

// ============================================
// PDF GENERATION
// ============================================

/**
 * Generate a professional PDF for a purchase order
 */
export async function generatePurchaseOrderPDF(po: PurchaseOrderData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Purchase Order ${po.poNumber}`,
          Author: 'Nusaf Dynamic Technologies',
          Subject: `Purchase Order to ${po.supplier.name}`,
          Creator: 'Nusaf Platform',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Build the PDF with type-safe layout state tracking
      drawHeader(doc, po);
      drawSupplierInfo(doc, po);
      drawOrderDetails(doc, po);
      const lastLineY = drawLineItems(doc, po);
      const totalsEndY = drawTotals(doc, po, lastLineY);
      drawNotes(doc, po, totalsEndY);
      drawFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// ============================================
// PDF SECTIONS
// ============================================

function drawHeader(doc: PDFKit.PDFDocument, po: PurchaseOrderData): void {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Company header bar
  doc.rect(50, 50, pageWidth, 60).fill(COLORS.primary);

  // Company name
  doc.fillColor('white')
    .font(FONTS.bold)
    .fontSize(20)
    .text('NUSAF DYNAMIC TECHNOLOGIES', 60, 65);

  // Tagline
  doc.font(FONTS.regular)
    .fontSize(10)
    .text('Conveyor Components | Power Transmission | Industrial Supplies', 60, 90);

  // PURCHASE ORDER title
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(28)
    .text('PURCHASE ORDER', 50, 130, { align: 'center', width: pageWidth });

  // PO Number and Date
  doc.fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(14)
    .text(po.poNumber, 50, 170, { align: 'center', width: pageWidth });

  const dateStr = new Date().toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.font(FONTS.regular)
    .fontSize(10)
    .text(`Date: ${dateStr}`, 50, 190, { align: 'center', width: pageWidth });

  doc.moveDown(2);
}

function drawSupplierInfo(doc: PDFKit.PDFDocument, po: PurchaseOrderData): void {
  const startY = 220;
  const leftCol = 50;
  const rightCol = 320;

  // Supplier section
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(11)
    .text('SUPPLIER', leftCol, startY);

  doc.fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(10)
    .text(po.supplier.name, leftCol, startY + 18);

  doc.font(FONTS.regular)
    .fontSize(9)
    .text(`Code: ${po.supplier.code}`, leftCol, startY + 32);

  if (po.supplier.email) {
    doc.text(`Email: ${po.supplier.email}`, leftCol, startY + 44);
  }

  // Delivery section
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(11)
    .text('DELIVER TO', rightCol, startY);

  doc.fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(10)
    .text('Nusaf Dynamic Technologies', rightCol, startY + 18);

  doc.font(FONTS.regular)
    .fontSize(9);

  const warehouseAddress = po.deliveryLocation === 'JHB'
    ? 'Johannesburg Warehouse\nGauteng, South Africa'
    : 'Cape Town Warehouse\nWestern Cape, South Africa';

  doc.text(warehouseAddress, rightCol, startY + 32);

  doc.moveDown(3);
}

function drawOrderDetails(doc: PDFKit.PDFDocument, po: PurchaseOrderData): void {
  const startY = 310;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Order details box
  doc.rect(50, startY, pageWidth, 50)
    .fillAndStroke(COLORS.lightGray, COLORS.mediumGray);

  const col1 = 60;
  const col2 = 180;
  const col3 = 320;
  const col4 = 440;
  const textY = startY + 12;

  doc.fillColor(COLORS.darkGray)
    .font(FONTS.regular)
    .fontSize(8)
    .text('PO Number', col1, textY)
    .text('Currency', col2, textY)
    .text('Expected Delivery', col3, textY)
    .text('Status', col4, textY);

  doc.fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(10)
    .text(po.poNumber, col1, textY + 14)
    .text(po.currency, col2, textY + 14)
    .text(
      po.expectedDate
        ? po.expectedDate.toLocaleDateString('en-ZA')
        : 'To be confirmed',
      col3,
      textY + 14
    )
    .text(formatStatus(po.status), col4, textY + 14);

  doc.moveDown(2);
}

function drawLineItems(doc: PDFKit.PDFDocument, po: PurchaseOrderData): number {
  const startY = 380;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Table header
  const headerY = startY;
  doc.rect(50, headerY, pageWidth, 22).fill(COLORS.primary);

  // Column positions
  const cols = {
    line: 55,
    sku: 80,
    description: 160,
    qty: 380,
    unitCost: 430,
    total: 500,
  };

  doc.fillColor('white')
    .font(FONTS.bold)
    .fontSize(9)
    .text('#', cols.line, headerY + 6)
    .text('SKU', cols.sku, headerY + 6)
    .text('Description', cols.description, headerY + 6)
    .text('Qty', cols.qty, headerY + 6)
    .text('Unit Cost', cols.unitCost, headerY + 6)
    .text('Total', cols.total, headerY + 6);

  // Table rows
  let rowY = headerY + 22;
  const rowHeight = 24;
  const currencySymbol = po.currency === 'EUR' ? '€' : 'R';

  po.lines.forEach((line, index) => {
    // Check if we need a new page
    if (rowY > doc.page.height - 150) {
      doc.addPage();
      rowY = 50;
    }

    // Alternating row background
    if (index % 2 === 0) {
      doc.rect(50, rowY, pageWidth, rowHeight).fill(COLORS.lightGray);
    }

    // Row border
    doc.rect(50, rowY, pageWidth, rowHeight).stroke(COLORS.mediumGray);

    // Row content
    doc.fillColor(COLORS.text)
      .font(FONTS.regular)
      .fontSize(9)
      .text(line.lineNumber.toString(), cols.line, rowY + 7)
      .text(truncateText(line.productSku, 12), cols.sku, rowY + 7)
      .text(truncateText(line.productDescription, 35), cols.description, rowY + 7)
      .text(line.quantityOrdered.toString(), cols.qty, rowY + 7)
      .text(`${currencySymbol}${line.unitCost.toFixed(2)}`, cols.unitCost, rowY + 7)
      .text(`${currencySymbol}${line.lineTotal.toFixed(2)}`, cols.total, rowY + 7);

    rowY += rowHeight;
  });

  // Return the final Y position for totals section
  return rowY;
}

function drawTotals(doc: PDFKit.PDFDocument, po: PurchaseOrderData, lastLineY: number): number {
  const startY = lastLineY + 20;
  const rightAlign = 545;
  const currencySymbol = po.currency === 'EUR' ? '€' : 'R';

  // Totals box
  doc.rect(380, startY, 165, 60)
    .fillAndStroke(COLORS.lightGray, COLORS.mediumGray);

  doc.fillColor(COLORS.text)
    .font(FONTS.regular)
    .fontSize(10)
    .text('Subtotal:', 390, startY + 10)
    .text(`${currencySymbol}${po.subtotal.toFixed(2)}`, rightAlign, startY + 10, { align: 'right', width: 90 });

  // For purchase orders, no VAT line (foreign suppliers)
  doc.font(FONTS.bold)
    .fontSize(12)
    .text('TOTAL:', 390, startY + 35)
    .fillColor(COLORS.primary)
    .text(`${currencySymbol}${po.total.toFixed(2)}`, rightAlign, startY + 35, { align: 'right', width: 90 });

  // Return position for notes section
  return startY + 70;
}

function drawNotes(doc: PDFKit.PDFDocument, po: PurchaseOrderData, totalsEndY: number): void {
  const startY = totalsEndY;

  if (po.supplierNotes) {
    // Check if we need a new page
    if (startY > doc.page.height - 100) {
      doc.addPage();
    }

    doc.fillColor(COLORS.primary)
      .font(FONTS.bold)
      .fontSize(10)
      .text('NOTES TO SUPPLIER', 50, startY);

    doc.fillColor(COLORS.text)
      .font(FONTS.regular)
      .fontSize(9)
      .text(po.supplierNotes, 50, startY + 15, {
        width: doc.page.width - 100,
        lineGap: 3,
      });
  }
}

function drawFooter(doc: PDFKit.PDFDocument): void {
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 60;

  // Footer line
  doc.strokeColor(COLORS.mediumGray)
    .lineWidth(0.5)
    .moveTo(50, footerY)
    .lineTo(doc.page.width - 50, footerY)
    .stroke();

  // Footer text
  doc.fillColor(COLORS.darkGray)
    .font(FONTS.regular)
    .fontSize(8)
    .text(
      'Nusaf Dynamic Technologies (Pty) Ltd | Johannesburg, South Africa | www.nusaf.co.za',
      50,
      footerY + 10,
      { align: 'center', width: doc.page.width - 100 }
    );

  doc.text(
    'This is a computer-generated document. No signature required.',
    50,
    footerY + 22,
    { align: 'center', width: doc.page.width - 100 }
    );
}

// ============================================
// HELPERS
// ============================================

function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// ============================================
// PROFORMA INVOICE PDF
// ============================================

/**
 * Generate a professional PDF for a proforma invoice
 */
export async function generateProformaInvoicePDF(pi: ProformaInvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Proforma Invoice ${pi.proformaNumber}`,
          Author: 'Nusaf Dynamic Technologies',
          Subject: `Proforma Invoice for Order ${pi.orderNumber}`,
          Creator: 'Nusaf Platform',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      drawPIHeader(doc, pi);
      drawPICustomerInfo(doc, pi);
      drawPIOrderDetails(doc, pi);
      const lastLineY = drawPILineItems(doc, pi);
      const totalsEndY = drawPITotals(doc, pi, lastLineY);
      drawPIPaymentTerms(doc, pi, totalsEndY);
      drawPIFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawPIHeader(doc: PDFKit.PDFDocument, pi: ProformaInvoiceData): void {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Company header bar
  doc.rect(50, 50, pageWidth, 60).fill(COLORS.primary);

  // Company name
  doc.fillColor('white')
    .font(FONTS.bold)
    .fontSize(20)
    .text('NUSAF DYNAMIC TECHNOLOGIES', 60, 65);

  // Tagline
  doc.font(FONTS.regular)
    .fontSize(10)
    .text('Conveyor Components | Power Transmission | Industrial Supplies', 60, 90);

  // PROFORMA INVOICE title
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(28)
    .text('PROFORMA INVOICE', 50, 130, { align: 'center', width: pageWidth });

  // PI Number and Date
  doc.fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(14)
    .text(pi.proformaNumber, 50, 170, { align: 'center', width: pageWidth });

  const dateStr = pi.issueDate.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.font(FONTS.regular)
    .fontSize(10)
    .text(`Date: ${dateStr}`, 50, 190, { align: 'center', width: pageWidth });
}

function drawPICustomerInfo(doc: PDFKit.PDFDocument, pi: ProformaInvoiceData): void {
  const startY = 220;
  const leftCol = 50;
  const rightCol = 320;

  // Bill To section
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(11)
    .text('BILL TO', leftCol, startY);

  doc.fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(10)
    .text(pi.customerName, leftCol, startY + 18);

  let addressY = startY + 32;
  if (pi.billingAddress) {
    doc.font(FONTS.regular)
      .fontSize(9)
      .text(pi.billingAddress, leftCol, addressY, { width: 250 });
    addressY += 24;
  }

  // Order Info section
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(11)
    .text('ORDER REFERENCE', rightCol, startY);

  doc.fillColor(COLORS.text)
    .font(FONTS.regular)
    .fontSize(9);

  let infoY = startY + 18;
  doc.font(FONTS.bold).text(`Order: ${pi.orderNumber}`, rightCol, infoY);
  infoY += 14;

  if (pi.customerPoNumber) {
    doc.font(FONTS.regular).text(`Customer PO: ${pi.customerPoNumber}`, rightCol, infoY);
    infoY += 14;
  }

  const validStr = pi.validUntil.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.font(FONTS.regular).text(`Valid Until: ${validStr}`, rightCol, infoY);
}

function drawPIOrderDetails(doc: PDFKit.PDFDocument, pi: ProformaInvoiceData): void {
  const startY = 310;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Details box
  doc.rect(50, startY, pageWidth, 40)
    .fillAndStroke(COLORS.lightGray, COLORS.mediumGray);

  const col1 = 60;
  const col2 = 200;
  const col3 = 340;
  const textY = startY + 8;

  doc.fillColor(COLORS.darkGray)
    .font(FONTS.regular)
    .fontSize(8)
    .text('Proforma Number', col1, textY)
    .text('Order Number', col2, textY)
    .text('Currency', col3, textY);

  doc.fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(10)
    .text(pi.proformaNumber, col1, textY + 14)
    .text(pi.orderNumber, col2, textY + 14)
    .text('ZAR', col3, textY + 14);
}

function drawPILineItems(doc: PDFKit.PDFDocument, pi: ProformaInvoiceData): number {
  const startY = 370;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Table header
  doc.rect(50, startY, pageWidth, 22).fill(COLORS.primary);

  const cols = {
    line: 55,
    sku: 80,
    description: 160,
    qty: 370,
    unit: 400,
    unitPrice: 440,
    total: 500,
  };

  doc.fillColor('white')
    .font(FONTS.bold)
    .fontSize(9)
    .text('#', cols.line, startY + 6)
    .text('SKU', cols.sku, startY + 6)
    .text('Description', cols.description, startY + 6)
    .text('Qty', cols.qty, startY + 6)
    .text('UoM', cols.unit, startY + 6)
    .text('Unit Price', cols.unitPrice, startY + 6)
    .text('Total', cols.total, startY + 6);

  // Table rows
  let rowY = startY + 22;
  const rowHeight = 24;

  pi.lines.forEach((line, index) => {
    if (rowY > doc.page.height - 180) {
      doc.addPage();
      rowY = 50;
    }

    // Alternating row background
    if (index % 2 === 0) {
      doc.rect(50, rowY, pageWidth, rowHeight).fill(COLORS.lightGray);
    }

    doc.rect(50, rowY, pageWidth, rowHeight).stroke(COLORS.mediumGray);

    doc.fillColor(COLORS.text)
      .font(FONTS.regular)
      .fontSize(9)
      .text(line.lineNumber.toString(), cols.line, rowY + 7)
      .text(truncateText(line.productSku, 12), cols.sku, rowY + 7)
      .text(truncateText(line.productDescription, 32), cols.description, rowY + 7)
      .text(line.quantity.toString(), cols.qty, rowY + 7)
      .text(line.unitOfMeasure, cols.unit, rowY + 7)
      .text(`R${Number(line.unitPrice).toFixed(2)}`, cols.unitPrice, rowY + 7)
      .text(`R${Number(line.lineTotal).toFixed(2)}`, cols.total, rowY + 7);

    rowY += rowHeight;
  });

  return rowY;
}

function drawPITotals(doc: PDFKit.PDFDocument, pi: ProformaInvoiceData, lastLineY: number): number {
  const startY = lastLineY + 20;
  const rightAlign = 545;

  // Totals box
  doc.rect(380, startY, 165, 75)
    .fillAndStroke(COLORS.lightGray, COLORS.mediumGray);

  doc.fillColor(COLORS.text)
    .font(FONTS.regular)
    .fontSize(10)
    .text('Subtotal:', 390, startY + 10)
    .text(`R${Number(pi.subtotal).toFixed(2)}`, rightAlign, startY + 10, { align: 'right', width: 90 });

  doc.text(`VAT (${Number(pi.vatRate)}%):`, 390, startY + 28)
    .text(`R${Number(pi.vatAmount).toFixed(2)}`, rightAlign, startY + 28, { align: 'right', width: 90 });

  doc.font(FONTS.bold)
    .fontSize(13)
    .text('TOTAL:', 390, startY + 50)
    .fillColor(COLORS.primary)
    .text(`R${Number(pi.total).toFixed(2)}`, rightAlign, startY + 50, { align: 'right', width: 90 });

  return startY + 85;
}

function drawPIPaymentTerms(doc: PDFKit.PDFDocument, pi: ProformaInvoiceData, totalsEndY: number): void {
  let startY = totalsEndY;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Check if we need a new page
  if (startY > doc.page.height - 200) {
    doc.addPage();
    startY = 50;
  }

  // Payment Terms
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(10)
    .text('PAYMENT TERMS', 50, startY);

  doc.fillColor(COLORS.text)
    .font(FONTS.regular)
    .fontSize(9)
    .text(pi.paymentTerms, 50, startY + 15, { width: pageWidth, lineGap: 3 });

  // Banking Details (placeholder)
  const bankY = startY + 45;
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(10)
    .text('BANKING DETAILS', 50, bankY);

  doc.rect(50, bankY + 15, pageWidth, 60)
    .fillAndStroke(COLORS.lightGray, COLORS.mediumGray);

  doc.fillColor(COLORS.text)
    .font(FONTS.regular)
    .fontSize(9)
    .text('Bank: [Bank Name]', 60, bankY + 25)
    .text('Account Name: Nusaf Dynamic Technologies (Pty) Ltd', 60, bankY + 38)
    .text('Account Number: [Account Number]', 60, bankY + 51)
    .text('Branch Code: [Branch Code]', 300, bankY + 25)
    .text('Swift: [Swift Code]', 300, bankY + 38)
    .text(`Reference: ${pi.orderNumber}`, 300, bankY + 51);

  // Notes
  if (pi.notes) {
    const notesY = bankY + 85;
    doc.fillColor(COLORS.primary)
      .font(FONTS.bold)
      .fontSize(10)
      .text('NOTES', 50, notesY);

    doc.fillColor(COLORS.text)
      .font(FONTS.regular)
      .fontSize(9)
      .text(pi.notes, 50, notesY + 15, { width: pageWidth, lineGap: 3 });
  }

  // Disclaimer
  const disclaimerY = pi.notes ? bankY + 130 : bankY + 95;

  if (disclaimerY > doc.page.height - 100) {
    doc.addPage();
  }

  doc.rect(50, disclaimerY, pageWidth, 30)
    .fillAndStroke('#fff8e1', '#e6c200');

  doc.fillColor('#856404')
    .font(FONTS.bold)
    .fontSize(9)
    .text('THIS IS NOT A TAX INVOICE', 60, disclaimerY + 5);

  doc.font(FONTS.regular)
    .fontSize(8)
    .text('A tax invoice will be issued upon delivery of goods. This proforma invoice is valid for 30 days from the date of issue.', 60, disclaimerY + 17, { width: pageWidth - 20 });
}

function drawPIFooter(doc: PDFKit.PDFDocument): void {
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 60;

  doc.strokeColor(COLORS.mediumGray)
    .lineWidth(0.5)
    .moveTo(50, footerY)
    .lineTo(doc.page.width - 50, footerY)
    .stroke();

  doc.fillColor(COLORS.darkGray)
    .font(FONTS.regular)
    .fontSize(8)
    .text(
      'Nusaf Dynamic Technologies (Pty) Ltd | Johannesburg, South Africa | www.nusaf.co.za',
      50,
      footerY + 10,
      { align: 'center', width: doc.page.width - 100 }
    );

  doc.text(
    'This is a computer-generated document. No signature required.',
    50,
    footerY + 22,
    { align: 'center', width: doc.page.width - 100 }
  );
}

// ============================================
// PACKING LIST PDF
// ============================================

/**
 * Generate a professional PDF for a packing list
 */
export async function generatePackingListPDF(pl: PackingListData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Packing List ${pl.packingListNumber}`,
          Author: 'Nusaf Dynamic Technologies',
          Subject: `Packing List for Order ${pl.orderNumber}`,
          Creator: 'Nusaf Platform',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      drawPLHeader(doc, pl);
      drawPLShipmentInfo(doc, pl);
      drawPLDetailsBox(doc, pl);
      const afterPackagesY = drawPLPackageSummary(doc, pl);
      const afterItemsY = drawPLLineItems(doc, pl, afterPackagesY);
      drawPLTotals(doc, pl, afterItemsY);
      drawPLHandlingInstructions(doc, pl);
      drawPLFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawPLHeader(doc: PDFKit.PDFDocument, pl: PackingListData): void {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Company header bar
  doc.rect(50, 50, pageWidth, 60).fill(COLORS.primary);

  doc.fillColor('white')
    .font(FONTS.bold)
    .fontSize(20)
    .text('NUSAF DYNAMIC TECHNOLOGIES', 60, 65);

  doc.font(FONTS.regular)
    .fontSize(10)
    .text('Conveyor Components | Power Transmission | Industrial Supplies', 60, 90);

  // PACKING LIST title
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(28)
    .text('PACKING LIST', 50, 130, { align: 'center', width: pageWidth });

  // PL Number and Date
  doc.fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(14)
    .text(pl.packingListNumber, 50, 170, { align: 'center', width: pageWidth });

  const dateStr = pl.createdAt.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.font(FONTS.regular)
    .fontSize(10)
    .text(`Date: ${dateStr}`, 50, 190, { align: 'center', width: pageWidth });
}

function drawPLShipmentInfo(doc: PDFKit.PDFDocument, pl: PackingListData): void {
  const startY = 220;
  const leftCol = 50;
  const rightCol = 320;

  // Ship To section
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(11)
    .text('SHIP TO', leftCol, startY);

  doc.fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(10)
    .text(pl.customerName, leftCol, startY + 18);

  // Shipment Details section
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(11)
    .text('SHIPMENT DETAILS', rightCol, startY);

  doc.fillColor(COLORS.text)
    .font(FONTS.regular)
    .fontSize(9);

  let infoY = startY + 18;
  doc.font(FONTS.bold).text(`Order: ${pl.orderNumber}`, rightCol, infoY);
  infoY += 14;

  if (pl.deliveryNoteNumber) {
    doc.font(FONTS.regular).text(`Delivery Note: ${pl.deliveryNoteNumber}`, rightCol, infoY);
    infoY += 14;
  }

  const locationLabel = pl.location === 'JHB' ? 'Johannesburg' : 'Cape Town';
  doc.font(FONTS.regular).text(`Warehouse: ${locationLabel}`, rightCol, infoY);
}

function drawPLDetailsBox(doc: PDFKit.PDFDocument, pl: PackingListData): void {
  const startY = 290;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc.rect(50, startY, pageWidth, 40)
    .fillAndStroke(COLORS.lightGray, COLORS.mediumGray);

  const col1 = 60;
  const col2 = 200;
  const col3 = 340;
  const col4 = 440;
  const textY = startY + 8;

  doc.fillColor(COLORS.darkGray)
    .font(FONTS.regular)
    .fontSize(8)
    .text('PL Number', col1, textY)
    .text('Order Number', col2, textY)
    .text('Status', col3, textY)
    .text('Packages', col4, textY);

  doc.fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(10)
    .text(pl.packingListNumber, col1, textY + 14)
    .text(pl.orderNumber, col2, textY + 14)
    .text(formatStatus(pl.status), col3, textY + 14)
    .text(pl.packages.length.toString(), col4, textY + 14);
}

function drawPLPackageSummary(doc: PDFKit.PDFDocument, pl: PackingListData): number {
  const startY = 350;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Section title
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(11)
    .text('PACKAGE SUMMARY', 50, startY);

  // Table header
  const headerY = startY + 18;
  doc.rect(50, headerY, pageWidth, 20).fill(COLORS.primary);

  const cols = {
    pkg: 55,
    type: 95,
    dimensions: 180,
    gross: 360,
    net: 430,
    notes: 490,
  };

  doc.fillColor('white')
    .font(FONTS.bold)
    .fontSize(8)
    .text('Pkg#', cols.pkg, headerY + 5)
    .text('Type', cols.type, headerY + 5)
    .text('Dimensions (L x W x H cm)', cols.dimensions, headerY + 5)
    .text('Gross (kg)', cols.gross, headerY + 5)
    .text('Net (kg)', cols.net, headerY + 5)
    .text('Notes', cols.notes, headerY + 5);

  let rowY = headerY + 20;
  const rowHeight = 20;

  pl.packages.forEach((pkg, index) => {
    if (index % 2 === 0) {
      doc.rect(50, rowY, pageWidth, rowHeight).fill(COLORS.lightGray);
    }
    doc.rect(50, rowY, pageWidth, rowHeight).stroke(COLORS.mediumGray);

    const dims = (pkg.length != null && pkg.width != null && pkg.height != null)
      ? `${pkg.length} x ${pkg.width} x ${pkg.height}`
      : '-';

    doc.fillColor(COLORS.text)
      .font(FONTS.regular)
      .fontSize(8)
      .text(pkg.packageNumber.toString(), cols.pkg, rowY + 5)
      .text(pkg.packageType, cols.type, rowY + 5)
      .text(dims, cols.dimensions, rowY + 5)
      .text(pkg.grossWeight != null ? pkg.grossWeight.toFixed(2) : '-', cols.gross, rowY + 5)
      .text(pkg.netWeight != null ? pkg.netWeight.toFixed(2) : '-', cols.net, rowY + 5)
      .text(truncateText(pkg.notes || '', 15), cols.notes, rowY + 5);

    rowY += rowHeight;
  });

  return rowY + 15;
}

function drawPLLineItems(doc: PDFKit.PDFDocument, pl: PackingListData, startAfterY: number): number {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Group lines by package number
  const linesByPackage = new Map<number, typeof pl.lines>();
  for (const line of pl.lines) {
    const existing = linesByPackage.get(line.packageNumber) || [];
    existing.push(line);
    linesByPackage.set(line.packageNumber, existing);
  }

  let currentY = startAfterY;

  // Section title
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(11)
    .text('ITEMS BY PACKAGE', 50, currentY);
  currentY += 18;

  const cols = {
    line: 55,
    sku: 80,
    description: 180,
    qty: 420,
    uom: 470,
  };

  // Sort packages by package number
  const sortedPackageNumbers = [...linesByPackage.keys()].sort((a, b) => a - b);

  for (const pkgNum of sortedPackageNumbers) {
    const lines = linesByPackage.get(pkgNum) || [];
    const pkg = pl.packages.find((p) => p.packageNumber === pkgNum);

    // Check for new page
    if (currentY > doc.page.height - 150) {
      doc.addPage();
      currentY = 50;
    }

    // Package subheader
    const pkgLabel = pkg ? `Package ${pkgNum} — ${pkg.packageType}` : `Package ${pkgNum}`;
    doc.rect(50, currentY, pageWidth, 20).fill('#e0f2fe');
    doc.fillColor(COLORS.primary)
      .font(FONTS.bold)
      .fontSize(9)
      .text(pkgLabel, 55, currentY + 5);
    currentY += 20;

    // Column headers
    doc.rect(50, currentY, pageWidth, 18).fill(COLORS.primary);
    doc.fillColor('white')
      .font(FONTS.bold)
      .fontSize(8)
      .text('#', cols.line, currentY + 4)
      .text('SKU', cols.sku, currentY + 4)
      .text('Description', cols.description, currentY + 4)
      .text('Qty', cols.qty, currentY + 4)
      .text('UoM', cols.uom, currentY + 4);
    currentY += 18;

    // Lines
    lines.forEach((line, index) => {
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }

      if (index % 2 === 0) {
        doc.rect(50, currentY, pageWidth, 20).fill(COLORS.lightGray);
      }
      doc.rect(50, currentY, pageWidth, 20).stroke(COLORS.mediumGray);

      doc.fillColor(COLORS.text)
        .font(FONTS.regular)
        .fontSize(8)
        .text(line.lineNumber.toString(), cols.line, currentY + 5)
        .text(truncateText(line.productSku, 15), cols.sku, currentY + 5)
        .text(truncateText(line.productDescription, 38), cols.description, currentY + 5)
        .text(line.quantity.toString(), cols.qty, currentY + 5)
        .text(line.unitOfMeasure, cols.uom, currentY + 5);

      currentY += 20;
    });

    currentY += 8;
  }

  return currentY;
}

function drawPLTotals(doc: PDFKit.PDFDocument, pl: PackingListData, afterItemsY: number): void {
  let startY = afterItemsY + 5;

  if (startY > doc.page.height - 120) {
    doc.addPage();
    startY = 50;
  }

  const totalGross = pl.packages.reduce((sum, p) => sum + (p.grossWeight ?? 0), 0);
  const totalNet = pl.packages.reduce((sum, p) => sum + (p.netWeight ?? 0), 0);
  const totalItems = pl.lines.reduce((sum, l) => sum + l.quantity, 0);

  doc.rect(50, startY, 250, 55)
    .fillAndStroke(COLORS.lightGray, COLORS.mediumGray);

  doc.fillColor(COLORS.text)
    .font(FONTS.regular)
    .fontSize(9)
    .text(`Total Packages: ${pl.packages.length}`, 60, startY + 8)
    .text(`Total Items: ${totalItems}`, 60, startY + 22)
    .text(`Total Gross Weight: ${totalGross.toFixed(2)} kg`, 60, startY + 36);

  doc.text(`Total Net Weight: ${totalNet.toFixed(2)} kg`, 180, startY + 36);
}

function drawPLHandlingInstructions(doc: PDFKit.PDFDocument, pl: PackingListData): void {
  if (!pl.handlingInstructions) return;

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startY = doc.y + 20;

  if (startY > doc.page.height - 100) {
    doc.addPage();
  }

  const y = startY > doc.page.height - 100 ? 50 : startY;

  doc.rect(50, y, pageWidth, 40)
    .fillAndStroke('#fff8e1', '#e6c200');

  doc.fillColor('#856404')
    .font(FONTS.bold)
    .fontSize(9)
    .text('HANDLING INSTRUCTIONS', 60, y + 5);

  doc.font(FONTS.regular)
    .fontSize(8)
    .text(pl.handlingInstructions, 60, y + 18, { width: pageWidth - 20 });
}

function drawPLFooter(doc: PDFKit.PDFDocument): void {
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 60;

  doc.strokeColor(COLORS.mediumGray)
    .lineWidth(0.5)
    .moveTo(50, footerY)
    .lineTo(doc.page.width - 50, footerY)
    .stroke();

  doc.fillColor(COLORS.darkGray)
    .font(FONTS.regular)
    .fontSize(8)
    .text(
      'Nusaf Dynamic Technologies (Pty) Ltd | Johannesburg, South Africa | www.nusaf.co.za',
      50,
      footerY + 10,
      { align: 'center', width: doc.page.width - 100 }
    );

  doc.text(
    'This is a computer-generated document. No signature required.',
    50,
    footerY + 22,
    { align: 'center', width: doc.page.width - 100 }
  );
}

// ============================================
// TAX INVOICE PDF
// ============================================

/**
 * Generate a SARS-compliant Tax Invoice PDF
 */
export async function generateTaxInvoicePDF(ti: TaxInvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Tax Invoice ${ti.invoiceNumber}`,
          Author: 'Nusaf Dynamic Technologies',
          Subject: `Tax Invoice for Order ${ti.orderNumber}`,
          Creator: 'Nusaf Platform',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      drawTIHeader(doc, ti);
      drawTIPartyInfo(doc, ti);
      drawTIInvoiceDetails(doc, ti);
      const lastLineY = drawTILineItems(doc, ti);
      const totalsEndY = drawTITotals(doc, ti, lastLineY);
      drawTIBankingDetails(doc, ti, totalsEndY);
      drawTIFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawTIHeader(doc: PDFKit.PDFDocument, ti: TaxInvoiceData): void {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Company header bar
  doc.rect(50, 50, pageWidth, 60).fill(COLORS.primary);

  // Company name
  doc.fillColor('white')
    .font(FONTS.bold)
    .fontSize(20)
    .text('NUSAF DYNAMIC TECHNOLOGIES', 60, 65);

  // Tagline
  doc.font(FONTS.regular)
    .fontSize(10)
    .text('Conveyor Components | Power Transmission | Industrial Supplies', 60, 90);

  // TAX INVOICE title — prominent and clear
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(28)
    .text('TAX INVOICE', 50, 130, { align: 'center', width: pageWidth });

  // Invoice Number and Date
  doc.fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(14)
    .text(ti.invoiceNumber, 50, 170, { align: 'center', width: pageWidth });

  const dateStr = ti.issueDate.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.font(FONTS.regular)
    .fontSize(10)
    .text(`Date of Issue: ${dateStr}`, 50, 190, { align: 'center', width: pageWidth });
}

function drawTIPartyInfo(doc: PDFKit.PDFDocument, ti: TaxInvoiceData): void {
  const startY = 220;
  const leftCol = 50;
  const rightCol = 320;

  // Seller (Nusaf) section
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(11)
    .text('FROM (SELLER)', leftCol, startY);

  doc.fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(10)
    .text('Nusaf Dynamic Technologies (Pty) Ltd', leftCol, startY + 18);

  doc.font(FONTS.regular)
    .fontSize(9);

  let sellerY = startY + 32;
  doc.text('Reg: [Company Reg Number]', leftCol, sellerY);
  sellerY += 12;
  doc.text('VAT: [VAT Registration Number]', leftCol, sellerY);
  sellerY += 12;
  doc.text('Johannesburg, Gauteng, South Africa', leftCol, sellerY);

  // Buyer (Customer) section
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(11)
    .text('TO (BUYER)', rightCol, startY);

  doc.fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(10)
    .text(ti.customerName, rightCol, startY + 18);

  doc.font(FONTS.regular)
    .fontSize(9);

  let buyerY = startY + 32;
  if (ti.customerRegNumber) {
    doc.text(`Reg: ${ti.customerRegNumber}`, rightCol, buyerY);
    buyerY += 12;
  }
  if (ti.customerVatNumber) {
    doc.text(`VAT: ${ti.customerVatNumber}`, rightCol, buyerY);
    buyerY += 12;
  }
  if (ti.billingAddress) {
    doc.text(ti.billingAddress, rightCol, buyerY, { width: 220 });
  }
}

function drawTIInvoiceDetails(doc: PDFKit.PDFDocument, ti: TaxInvoiceData): void {
  const startY = 310;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Details box
  doc.rect(50, startY, pageWidth, 40)
    .fillAndStroke(COLORS.lightGray, COLORS.mediumGray);

  const col1 = 60;
  const col2 = 180;
  const col3 = 310;
  const col4 = 440;
  const textY = startY + 8;

  doc.fillColor(COLORS.darkGray)
    .font(FONTS.regular)
    .fontSize(8)
    .text('Invoice Number', col1, textY)
    .text('Order Number', col2, textY)
    .text('Issue Date', col3, textY)
    .text('Currency', col4, textY);

  const dateStr = ti.issueDate.toLocaleDateString('en-ZA');

  doc.fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(10)
    .text(ti.invoiceNumber, col1, textY + 14)
    .text(ti.orderNumber, col2, textY + 14)
    .text(dateStr, col3, textY + 14)
    .text('ZAR', col4, textY + 14);
}

function drawTILineItems(doc: PDFKit.PDFDocument, ti: TaxInvoiceData): number {
  const startY = 370;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Table header
  doc.rect(50, startY, pageWidth, 22).fill(COLORS.primary);

  const cols = {
    line: 55,
    sku: 80,
    description: 160,
    qty: 370,
    unit: 400,
    unitPrice: 440,
    total: 500,
  };

  doc.fillColor('white')
    .font(FONTS.bold)
    .fontSize(9)
    .text('#', cols.line, startY + 6)
    .text('SKU', cols.sku, startY + 6)
    .text('Description', cols.description, startY + 6)
    .text('Qty', cols.qty, startY + 6)
    .text('UoM', cols.unit, startY + 6)
    .text('Unit Price', cols.unitPrice, startY + 6)
    .text('Total', cols.total, startY + 6);

  // Table rows
  let rowY = startY + 22;
  const rowHeight = 24;

  ti.lines.forEach((line, index) => {
    if (rowY > doc.page.height - 180) {
      doc.addPage();
      rowY = 50;
    }

    // Alternating row background
    if (index % 2 === 0) {
      doc.rect(50, rowY, pageWidth, rowHeight).fill(COLORS.lightGray);
    }

    doc.rect(50, rowY, pageWidth, rowHeight).stroke(COLORS.mediumGray);

    doc.fillColor(COLORS.text)
      .font(FONTS.regular)
      .fontSize(9)
      .text(line.lineNumber.toString(), cols.line, rowY + 7)
      .text(truncateText(line.productSku, 12), cols.sku, rowY + 7)
      .text(truncateText(line.productDescription, 32), cols.description, rowY + 7)
      .text(line.quantity.toString(), cols.qty, rowY + 7)
      .text(line.unitOfMeasure, cols.unit, rowY + 7)
      .text(`R${Number(line.unitPrice).toFixed(2)}`, cols.unitPrice, rowY + 7)
      .text(`R${Number(line.lineTotal).toFixed(2)}`, cols.total, rowY + 7);

    rowY += rowHeight;
  });

  return rowY;
}

function drawTITotals(doc: PDFKit.PDFDocument, ti: TaxInvoiceData, lastLineY: number): number {
  const startY = lastLineY + 20;
  const rightAlign = 545;

  // Totals box
  doc.rect(380, startY, 165, 75)
    .fillAndStroke(COLORS.lightGray, COLORS.mediumGray);

  doc.fillColor(COLORS.text)
    .font(FONTS.regular)
    .fontSize(10)
    .text('Subtotal:', 390, startY + 10)
    .text(`R${Number(ti.subtotal).toFixed(2)}`, rightAlign, startY + 10, { align: 'right', width: 90 });

  doc.text(`VAT (${Number(ti.vatRate)}%):`, 390, startY + 28)
    .text(`R${Number(ti.vatAmount).toFixed(2)}`, rightAlign, startY + 28, { align: 'right', width: 90 });

  doc.font(FONTS.bold)
    .fontSize(13)
    .text('TOTAL:', 390, startY + 50)
    .fillColor(COLORS.primary)
    .text(`R${Number(ti.total).toFixed(2)}`, rightAlign, startY + 50, { align: 'right', width: 90 });

  return startY + 85;
}

function drawTIBankingDetails(doc: PDFKit.PDFDocument, ti: TaxInvoiceData, totalsEndY: number): void {
  let startY = totalsEndY;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Check if we need a new page
  if (startY > doc.page.height - 200) {
    doc.addPage();
    startY = 50;
  }

  // Banking Details
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(10)
    .text('BANKING DETAILS', 50, startY);

  doc.rect(50, startY + 15, pageWidth, 60)
    .fillAndStroke(COLORS.lightGray, COLORS.mediumGray);

  doc.fillColor(COLORS.text)
    .font(FONTS.regular)
    .fontSize(9)
    .text('Bank: [Bank Name]', 60, startY + 25)
    .text('Account Name: Nusaf Dynamic Technologies (Pty) Ltd', 60, startY + 38)
    .text('Account Number: [Account Number]', 60, startY + 51)
    .text('Branch Code: [Branch Code]', 300, startY + 25)
    .text('Swift: [Swift Code]', 300, startY + 38)
    .text(`Reference: ${ti.orderNumber}`, 300, startY + 51);

  // Notes
  let afterBankY = startY + 85;
  if (ti.notes) {
    doc.fillColor(COLORS.primary)
      .font(FONTS.bold)
      .fontSize(10)
      .text('NOTES', 50, afterBankY);

    doc.fillColor(COLORS.text)
      .font(FONTS.regular)
      .fontSize(9)
      .text(ti.notes, 50, afterBankY + 15, { width: pageWidth, lineGap: 3 });

    afterBankY += 45;
  }

  // Tax invoice compliance statement
  if (afterBankY > doc.page.height - 100) {
    doc.addPage();
    afterBankY = 50;
  }

  doc.rect(50, afterBankY, pageWidth, 25)
    .fillAndStroke('#e8f5e9', '#4caf50');

  doc.fillColor('#2e7d32')
    .font(FONTS.bold)
    .fontSize(9)
    .text('TAX INVOICE', 60, afterBankY + 4);

  doc.font(FONTS.regular)
    .fontSize(8)
    .text('This document is a valid tax invoice issued in terms of section 20 of the Value-Added Tax Act, No. 89 of 1991.', 60, afterBankY + 14, { width: pageWidth - 20 });
}

function drawTIFooter(doc: PDFKit.PDFDocument): void {
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 60;

  doc.strokeColor(COLORS.mediumGray)
    .lineWidth(0.5)
    .moveTo(50, footerY)
    .lineTo(doc.page.width - 50, footerY)
    .stroke();

  doc.fillColor(COLORS.darkGray)
    .font(FONTS.regular)
    .fontSize(8)
    .text(
      'Nusaf Dynamic Technologies (Pty) Ltd | Johannesburg, South Africa | www.nusaf.co.za',
      50,
      footerY + 10,
      { align: 'center', width: doc.page.width - 100 }
    );

  doc.text(
    'This is a computer-generated document. No signature required.',
    50,
    footerY + 22,
    { align: 'center', width: doc.page.width - 100 }
  );
}
