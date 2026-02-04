import nodemailer from 'nodemailer';

// ============================================
// TYPES
// ============================================

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface EmailOptions {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// TRANSPORTER
// ============================================

/**
 * Create nodemailer transporter based on environment
 * In development, use ethereal.email for testing
 * In production, use configured SMTP settings
 */
function createTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === 'true';

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('SMTP not configured - emails will be logged to console only');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

let transporter: nodemailer.Transporter | null = null;

/**
 * Get or create the email transporter
 */
function getTransporter(): nodemailer.Transporter | null {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
}

// ============================================
// EMAIL SENDING
// ============================================

/**
 * Send an email
 * If SMTP is not configured, logs the email to console (dev mode)
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const fromAddress = process.env.SMTP_FROM || 'noreply@nusaf.co.za';
  const fromName = process.env.SMTP_FROM_NAME || 'Nusaf Dynamic Technologies';

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${fromName}" <${fromAddress}>`,
    to: options.to,
    cc: options.cc?.join(', '),
    bcc: options.bcc?.join(', '),
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
    })),
  };

  const transport = getTransporter();

  if (!transport) {
    // Dev mode - log email details to console
    console.log('='.repeat(60));
    console.log('EMAIL (SMTP not configured - dev mode)');
    console.log('='.repeat(60));
    console.log(`To: ${options.to}`);
    if (options.cc?.length) console.log(`CC: ${options.cc.join(', ')}`);
    console.log(`Subject: ${options.subject}`);
    console.log('-'.repeat(60));
    console.log(options.text || '(HTML only)');
    if (options.attachments?.length) {
      console.log('-'.repeat(60));
      console.log(`Attachments: ${options.attachments.map((a) => a.filename).join(', ')}`);
    }
    console.log('='.repeat(60));

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  }

  try {
    const info = await transport.sendMail(mailOptions);

    console.log(`Email sent: ${info.messageId} to ${options.to}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * Generate HTML email for purchase order
 */
export function generatePurchaseOrderEmail(data: {
  poNumber: string;
  supplierName: string;
  contactName?: string;
  expectedDate?: Date | null;
  totalAmount: number;
  currency: string;
  lineCount: number;
  customMessage?: string;
}): { subject: string; html: string; text: string } {
  const subject = `Purchase Order ${data.poNumber} from Nusaf Dynamic Technologies`;

  const greeting = data.contactName
    ? `Dear ${data.contactName},`
    : `Dear ${data.supplierName} Team,`;

  const expectedDateText = data.expectedDate
    ? `Expected Delivery Date: ${data.expectedDate.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`
    : '';

  const currencySymbol = data.currency === 'EUR' ? '€' : 'R';
  const formattedTotal = `${currencySymbol}${data.totalAmount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const customMessageHtml = data.customMessage
    ? `<p style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #1a5f7a;">${data.customMessage}</p>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1a5f7a; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Purchase Order</h1>
  </div>

  <div style="padding: 30px 20px; background-color: #ffffff;">
    <p>${greeting}</p>

    <p>Please find attached our Purchase Order <strong>${data.poNumber}</strong>.</p>

    ${customMessageHtml}

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="background-color: #f8f9fa;">
        <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>PO Number</strong></td>
        <td style="padding: 12px; border: 1px solid #dee2e6;">${data.poNumber}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Number of Items</strong></td>
        <td style="padding: 12px; border: 1px solid #dee2e6;">${data.lineCount}</td>
      </tr>
      <tr style="background-color: #f8f9fa;">
        <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Total Amount</strong></td>
        <td style="padding: 12px; border: 1px solid #dee2e6;">${formattedTotal}</td>
      </tr>
      ${expectedDateText ? `
      <tr>
        <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Expected Delivery</strong></td>
        <td style="padding: 12px; border: 1px solid #dee2e6;">${data.expectedDate?.toLocaleDateString('en-ZA')}</td>
      </tr>
      ` : ''}
    </table>

    <p>Please acknowledge receipt of this order by replying to this email.</p>

    <p>If you have any questions, please don't hesitate to contact us.</p>

    <p style="margin-top: 30px;">
      Kind regards,<br>
      <strong>Nusaf Dynamic Technologies</strong><br>
      Procurement Team
    </p>
  </div>

  <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
    <p style="margin: 0;">
      Nusaf Dynamic Technologies (Pty) Ltd<br>
      Johannesburg, South Africa<br>
      <a href="https://www.nusaf.co.za" style="color: #1a5f7a;">www.nusaf.co.za</a>
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
${greeting}

Please find attached our Purchase Order ${data.poNumber}.

${data.customMessage ? `Message: ${data.customMessage}\n` : ''}
PO Number: ${data.poNumber}
Number of Items: ${data.lineCount}
Total Amount: ${formattedTotal}
${expectedDateText}

Please acknowledge receipt of this order by replying to this email.

If you have any questions, please don't hesitate to contact us.

Kind regards,
Nusaf Dynamic Technologies
Procurement Team

---
Nusaf Dynamic Technologies (Pty) Ltd
Johannesburg, South Africa
www.nusaf.co.za
  `.trim();

  return { subject, html, text };
}

// ============================================
// QUOTE REQUEST EMAILS
// ============================================

export interface QuoteRequestItem {
  sku: string;
  name: string;
  quantity: number;
  notes?: string;
}

export interface QuoteRequestAttachment {
  filename: string;
  url: string;
  sizeBytes: number;
}

export interface QuoteRequestNotificationData {
  requestId: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  customerPhone?: string;
  customerNotes?: string;
  items: QuoteRequestItem[];
  submittedAt: Date;
  attachments?: QuoteRequestAttachment[];
}

/**
 * Send notification email to sales team when a new quote request is received
 */
export async function sendQuoteRequestNotification(
  data: QuoteRequestNotificationData
): Promise<EmailResult> {
  const salesEmail = process.env.SALES_EMAIL || 'sales@nusaf.co.za';

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #dee2e6;"><code>${item.sku}</code></td>
        <td style="padding: 10px; border: 1px solid #dee2e6;">${item.name}</td>
        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border: 1px solid #dee2e6;">${item.notes || '-'}</td>
      </tr>
    `
    )
    .join('');

  const itemsText = data.items
    .map((item) => `  - ${item.sku}: ${item.name} x${item.quantity}${item.notes ? ` (${item.notes})` : ''}`)
    .join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f59e0b; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px;">New Quote Request</h1>
  </div>

  <div style="padding: 25px 20px; background-color: #ffffff;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      A new quote request has been submitted from the website.
    </p>

    <h3 style="color: #1a5f7a; border-bottom: 2px solid #1a5f7a; padding-bottom: 8px;">
      Customer Information
    </h3>
    <table style="width: 100%; margin-bottom: 25px;">
      <tr>
        <td style="padding: 8px 0; width: 140px;"><strong>Name:</strong></td>
        <td style="padding: 8px 0;">${data.customerName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>Company:</strong></td>
        <td style="padding: 8px 0;">${data.customerCompany}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>Email:</strong></td>
        <td style="padding: 8px 0;"><a href="mailto:${data.customerEmail}" style="color: #1a5f7a;">${data.customerEmail}</a></td>
      </tr>
      ${data.customerPhone ? `
      <tr>
        <td style="padding: 8px 0;"><strong>Phone:</strong></td>
        <td style="padding: 8px 0;"><a href="tel:${data.customerPhone}" style="color: #1a5f7a;">${data.customerPhone}</a></td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 8px 0;"><strong>Submitted:</strong></td>
        <td style="padding: 8px 0;">${data.submittedAt.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      </tr>
    </table>

    ${data.customerNotes ? `
    <h3 style="color: #1a5f7a; border-bottom: 2px solid #1a5f7a; padding-bottom: 8px;">
      Customer Notes
    </h3>
    <p style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #1a5f7a; margin-bottom: 25px;">
      ${data.customerNotes}
    </p>
    ` : ''}

    <h3 style="color: #1a5f7a; border-bottom: 2px solid #1a5f7a; padding-bottom: 8px;">
      Requested Items (${data.items.length})
    </h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
      <thead>
        <tr style="background-color: #1a5f7a; color: white;">
          <th style="padding: 12px 10px; text-align: left;">SKU</th>
          <th style="padding: 12px 10px; text-align: left;">Product</th>
          <th style="padding: 12px 10px; text-align: center;">Qty</th>
          <th style="padding: 12px 10px; text-align: left;">Notes</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    ${data.attachments && data.attachments.length > 0 ? `
    <h3 style="color: #1a5f7a; border-bottom: 2px solid #1a5f7a; padding-bottom: 8px;">
      Attachments (${data.attachments.length})
    </h3>
    <ul style="margin-bottom: 25px; padding-left: 20px;">
      ${data.attachments.map((att) => `
        <li style="margin-bottom: 8px;">
          <a href="${att.url}" style="color: #1a5f7a; text-decoration: none;">
            ${att.filename}
          </a>
          <span style="color: #666; font-size: 12px;"> (${(att.sizeBytes / 1024).toFixed(1)} KB)</span>
        </li>
      `).join('')}
    </ul>
    ` : ''}

    <p style="text-align: center;">
      <a href="${process.env.PORTAL_URL || 'https://app.nusaf.net'}/admin/quote-requests/${data.requestId}"
         style="display: inline-block; padding: 12px 30px; background-color: #1a5f7a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View in Portal
      </a>
    </p>
  </div>

  <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
    <p style="margin: 0;">
      Request ID: ${data.requestId}<br>
      This is an automated notification from the Nusaf website.
    </p>
  </div>
</body>
</html>
  `.trim();

  // Build attachments text for plain text email
  const attachmentsText = data.attachments && data.attachments.length > 0
    ? `\nAttachments (${data.attachments.length}):\n${data.attachments.map((att) => `  - ${att.filename}: ${att.url}`).join('\n')}\n`
    : '';

  const text = `
NEW QUOTE REQUEST
${'='.repeat(50)}

Customer Information:
- Name: ${data.customerName}
- Company: ${data.customerCompany}
- Email: ${data.customerEmail}
${data.customerPhone ? `- Phone: ${data.customerPhone}` : ''}
- Submitted: ${data.submittedAt.toLocaleString('en-ZA')}

${data.customerNotes ? `Customer Notes:\n${data.customerNotes}\n` : ''}
Requested Items (${data.items.length}):
${itemsText}
${attachmentsText}
Request ID: ${data.requestId}

View in portal: ${process.env.PORTAL_URL || 'https://app.nusaf.net'}/admin/quote-requests/${data.requestId}
  `.trim();

  return sendEmail({
    to: salesEmail,
    subject: `[Quote Request] ${data.customerCompany} - ${data.items.length} item${data.items.length === 1 ? '' : 's'}`,
    html,
    text,
  });
}

/**
 * Send confirmation email to customer after quote request submission
 */
export async function sendQuoteRequestConfirmation(
  data: QuoteRequestNotificationData
): Promise<EmailResult> {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #dee2e6;">${item.name}</td>
        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">${item.quantity}</td>
      </tr>
    `
    )
    .join('');

  const itemsText = data.items.map((item) => `  - ${item.name} x${item.quantity}`).join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1a5f7a; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Quote Request Received</h1>
  </div>

  <div style="padding: 25px 20px; background-color: #ffffff;">
    <p>Dear ${data.customerName},</p>

    <p>Thank you for your quote request. We have received your enquiry and our sales team will be in touch within <strong>1-2 business days</strong>.</p>

    <h3 style="color: #1a5f7a; border-bottom: 2px solid #1a5f7a; padding-bottom: 8px; margin-top: 25px;">
      Request Summary
    </h3>
    <p style="margin-bottom: 5px;"><strong>Reference:</strong> ${data.requestId.slice(0, 8).toUpperCase()}</p>
    <p style="margin-bottom: 15px;"><strong>Company:</strong> ${data.customerCompany}</p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
      <thead>
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 12px 10px; text-align: left; border: 1px solid #dee2e6;">Product</th>
          <th style="padding: 12px 10px; text-align: center; border: 1px solid #dee2e6; width: 80px;">Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    ${data.attachments && data.attachments.length > 0 ? `
    <p style="background-color: #e8f4f8; padding: 12px 15px; border-radius: 6px; margin-bottom: 20px;">
      <strong>Attachments received:</strong> ${data.attachments.map((a) => a.filename).join(', ')}
    </p>
    ` : ''}

    <p>If you have any urgent requirements or questions, please don't hesitate to contact us:</p>

    <table style="margin: 20px 0;">
      <tr>
        <td style="padding: 5px 15px 5px 0;"><strong>Email:</strong></td>
        <td><a href="mailto:sales@nusaf.co.za" style="color: #1a5f7a;">sales@nusaf.co.za</a></td>
      </tr>
      <tr>
        <td style="padding: 5px 15px 5px 0;"><strong>Phone:</strong></td>
        <td><a href="tel:+27115921962" style="color: #1a5f7a;">+27 11 592 1962</a></td>
      </tr>
    </table>

    <p style="margin-top: 30px;">
      Kind regards,<br>
      <strong>The Nusaf Team</strong>
    </p>
  </div>

  <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
    <p style="margin: 0 0 10px 0;">
      <strong>Nusaf Dynamic Technologies (Pty) Ltd</strong><br>
      Johannesburg, South Africa
    </p>
    <p style="margin: 0;">
      <a href="https://www.nusaf.co.za" style="color: #1a5f7a;">www.nusaf.co.za</a>
    </p>
  </div>
</body>
</html>
  `.trim();

  // Build attachments mention for plain text
  const attachmentsMention = data.attachments && data.attachments.length > 0
    ? `\nAttachments received: ${data.attachments.map((a) => a.filename).join(', ')}\n`
    : '';

  const text = `
Dear ${data.customerName},

Thank you for your quote request. We have received your enquiry and our sales team will be in touch within 1-2 business days.

REQUEST SUMMARY
${'='.repeat(40)}
Reference: ${data.requestId.slice(0, 8).toUpperCase()}
Company: ${data.customerCompany}

Items:
${itemsText}
${attachmentsMention}
If you have any urgent requirements or questions, please don't hesitate to contact us:
- Email: sales@nusaf.co.za
- Phone: +27 11 592 1962

Kind regards,
The Nusaf Team

---
Nusaf Dynamic Technologies (Pty) Ltd
Johannesburg, South Africa
www.nusaf.co.za
  `.trim();

  return sendEmail({
    to: data.customerEmail,
    subject: `Quote Request Received - Nusaf Dynamic Technologies`,
    html,
    text,
  });
}

// ============================================
// CONTACT FORM EMAILS
// ============================================

export interface ContactMessageData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
  submittedAt: Date;
}

/**
 * Send notification email when a contact form message is received
 */
export async function sendContactFormNotification(data: ContactMessageData): Promise<EmailResult> {
  const infoEmail = process.env.INFO_EMAIL || 'info@nusaf.co.za';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1a5f7a; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px;">New Contact Form Message</h1>
  </div>

  <div style="padding: 25px 20px; background-color: #ffffff;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      A new message has been submitted via the website contact form.
    </p>

    <table style="width: 100%; margin-bottom: 25px;">
      <tr>
        <td style="padding: 8px 0; width: 100px;"><strong>From:</strong></td>
        <td style="padding: 8px 0;">${data.name}</td>
      </tr>
      ${data.company ? `
      <tr>
        <td style="padding: 8px 0;"><strong>Company:</strong></td>
        <td style="padding: 8px 0;">${data.company}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 8px 0;"><strong>Email:</strong></td>
        <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #1a5f7a;">${data.email}</a></td>
      </tr>
      ${data.phone ? `
      <tr>
        <td style="padding: 8px 0;"><strong>Phone:</strong></td>
        <td style="padding: 8px 0;"><a href="tel:${data.phone}" style="color: #1a5f7a;">${data.phone}</a></td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 8px 0;"><strong>Received:</strong></td>
        <td style="padding: 8px 0;">${data.submittedAt.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      </tr>
    </table>

    <h3 style="color: #1a5f7a; border-bottom: 2px solid #1a5f7a; padding-bottom: 8px;">
      Message
    </h3>
    <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #1a5f7a; white-space: pre-wrap;">
${data.message}
    </div>

    <p style="margin-top: 25px; text-align: center;">
      <a href="mailto:${data.email}?subject=Re: Your enquiry to Nusaf"
         style="display: inline-block; padding: 12px 30px; background-color: #1a5f7a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Reply to ${data.name.split(' ')[0]}
      </a>
    </p>
  </div>

  <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
    <p style="margin: 0;">This is an automated notification from the Nusaf website contact form.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
NEW CONTACT FORM MESSAGE
${'='.repeat(50)}

From: ${data.name}
${data.company ? `Company: ${data.company}` : ''}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}
Received: ${data.submittedAt.toLocaleString('en-ZA')}

Message:
${'-'.repeat(50)}
${data.message}
${'-'.repeat(50)}

Reply to this enquiry by emailing ${data.email}
  `.trim();

  return sendEmail({
    to: infoEmail,
    subject: `[Website Contact] Message from ${data.name}${data.company ? ` (${data.company})` : ''}`,
    html,
    text,
  });
}
