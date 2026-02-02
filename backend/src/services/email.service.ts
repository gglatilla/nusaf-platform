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
