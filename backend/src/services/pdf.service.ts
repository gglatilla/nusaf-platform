import PDFDocument from 'pdfkit';
import type { PurchaseOrderData } from './purchase-order.service';

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

      // Build the PDF
      drawHeader(doc, po);
      drawSupplierInfo(doc, po);
      drawOrderDetails(doc, po);
      drawLineItems(doc, po);
      drawTotals(doc, po);
      drawNotes(doc, po);
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

function drawLineItems(doc: PDFKit.PDFDocument, po: PurchaseOrderData): void {
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

  // Store the final Y position for totals
  (doc as any)._lastLineY = rowY;
}

function drawTotals(doc: PDFKit.PDFDocument, po: PurchaseOrderData): void {
  const lastLineY = (doc as any)._lastLineY || 500;
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

  // Store position for notes
  (doc as any)._totalsEndY = startY + 70;
}

function drawNotes(doc: PDFKit.PDFDocument, po: PurchaseOrderData): void {
  const startY = (doc as any)._totalsEndY || 580;

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
