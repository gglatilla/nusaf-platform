---
name: error-handling-logging
description: Error handling patterns and structured logging for B2B applications. Use when implementing error handling, logging infrastructure, monitoring, or debugging production issues.
---

# Error Handling & Logging for B2B Applications

## Why This Matters

B2B applications have complex failure modes:
- **Excel import errors** → Pricing data corrupted
- **Calculation errors** → Financial impact
- **PDF generation failures** → Delayed quotes/invoices
- **Payment recording issues** → Accounting discrepancies

Good error handling and logging enables:
- Quick diagnosis of production issues
- Audit trails for compliance
- Proactive monitoring and alerting

---

## Error Types

### Application Error Hierarchy

```typescript
// Base error class
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation errors (400)
export class ValidationError extends AppError {
  constructor(message: string, details?: ValidationDetail[]) {
    super(message, 'VALIDATION_ERROR', 400, true, details);
  }
}

// Authentication errors (401)
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401, true);
  }
}

// Authorization errors (403)
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN', 403, true);
  }
}

// Not found errors (404)
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with ID ${id} not found` : `${resource} not found`,
      'NOT_FOUND',
      404,
      true
    );
  }
}

// Conflict errors (409)
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409, true);
  }
}

// Business rule violations (422)
export class BusinessRuleError extends AppError {
  constructor(message: string, code: string = 'BUSINESS_RULE_VIOLATION') {
    super(message, code, 422, true);
  }
}

// Integration errors (502/503)
export class IntegrationError extends AppError {
  constructor(
    system: string,
    message: string,
    public retryable: boolean = true
  ) {
    super(
      `${system} integration error: ${message}`,
      `${system.toUpperCase()}_ERROR`,
      502,
      true
    );
  }
}

// Internal errors (500)
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 'INTERNAL_ERROR', 500, false);
  }
}
```

### Business-Specific Errors

```typescript
// Pricing errors
export class PriceCalculationError extends BusinessRuleError {
  constructor(message: string, public calculation?: PriceBreakdown) {
    super(message, 'PRICE_CALCULATION_ERROR');
  }
}

// Quote errors
export class QuoteExpiredError extends BusinessRuleError {
  constructor(quoteId: string) {
    super(`Quote ${quoteId} has expired`, 'QUOTE_EXPIRED');
  }
}

// Invoice errors
export class InvoiceAlreadyPaidError extends BusinessRuleError {
  constructor(invoiceId: string) {
    super(`Invoice ${invoiceId} has already been paid`, 'INVOICE_ALREADY_PAID');
  }
}

// PDF generation errors
export class PdfGenerationError extends AppError {
  constructor(documentType: string, message: string) {
    super(`Failed to generate ${documentType} PDF: ${message}`, 'PDF_GENERATION_ERROR', 500, true);
  }
}

// Import errors
export class ImportError extends AppError {
  constructor(
    message: string,
    public row?: number,
    public field?: string
  ) {
    super(message, 'IMPORT_ERROR', 400, true, { row, field });
  }
}
```

---

## Error Handling Middleware

### Express Global Error Handler

```typescript
// middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/errors';
import { logger } from '@/utils/logger';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  const logContext = {
    requestId: req.headers['x-request-id'],
    method: req.method,
    path: req.path,
    userId: (req as any).user?.id,
    ip: req.ip,
  };

  if (error instanceof AppError) {
    // Operational error - log as warning
    logger.warn('Operational error', {
      ...logContext,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
      },
    });

    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        ...(error instanceof IntegrationError && {
          retryable: error.retryable,
        }),
      },
      meta: {
        requestId: req.headers['x-request-id'],
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Unexpected error - log as error
  logger.error('Unexpected error', {
    ...logContext,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  });

  // Don't leak internal details in production
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message,
    },
    meta: {
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString(),
    },
  });
}
```

### Async Error Wrapper

```typescript
// utils/async-handler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export function asyncHandler(handler: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

// Usage
router.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await productService.findById(req.params.id);
    if (!product) {
      throw new NotFoundError('Product', req.params.id);
    }
    res.json({ success: true, data: product });
  })
);
```

---

## Structured Logging

### Logger Setup

```typescript
// utils/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  
  formatters: {
    level: (label) => ({ level: label }),
    bindings: () => ({}),  // Remove pid, hostname
  },
  
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'authorization',
      '*.password',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
  
  // In production, use JSON
  ...(process.env.NODE_ENV === 'production'
    ? {}
    : { transport: { target: 'pino-pretty' } }
  ),
});

export { logger };
```

### Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `error` | Unexpected errors, system failures | Database connection lost |
| `warn` | Handled errors, degraded operation | Odoo sync retry |
| `info` | Business events, state changes | Quote submitted, user login |
| `debug` | Detailed debugging information | Request/response bodies |
| `trace` | Very detailed tracing | Function entry/exit |

### Logging Patterns

```typescript
// Request logging middleware
import { v4 as uuid } from 'uuid';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Add request ID
  req.headers['x-request-id'] = req.headers['x-request-id'] || uuid();
  
  const startTime = Date.now();
  
  // Log request
  logger.info('Request received', {
    requestId: req.headers['x-request-id'],
    method: req.method,
    path: req.path,
    query: req.query,
    userId: (req as any).user?.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('Response sent', {
      requestId: req.headers['x-request-id'],
      statusCode: res.statusCode,
      duration,
    });
  });
  
  next();
}
```

### Business Event Logging

```typescript
// Log significant business events
class QuoteService {
  async submitQuote(quoteId: string, userId: string): Promise<Quote> {
    const quote = await this.quoteRepo.findById(quoteId);
    
    logger.info('Quote submission started', {
      event: 'quote.submit.started',
      quoteId,
      quoteNumber: quote.quoteNumber,
      userId,
      companyId: quote.companyId,
      totalAmount: quote.total,
    });
    
    try {
      // Submit to Odoo
      const odooOrderId = await this.odooClient.createSalesOrder(quote);
      
      // Update quote
      const updated = await this.quoteRepo.update(quoteId, {
        status: 'CONVERTED',
        odooOrderId,
        submittedAt: new Date(),
      });
      
      logger.info('Quote submitted successfully', {
        event: 'quote.submit.success',
        quoteId,
        quoteNumber: quote.quoteNumber,
        odooOrderId,
        userId,
      });
      
      return updated;
      
    } catch (error) {
      logger.error('Quote submission failed', {
        event: 'quote.submit.failed',
        quoteId,
        quoteNumber: quote.quoteNumber,
        userId,
        error: {
          message: error.message,
          code: error instanceof AppError ? error.code : 'UNKNOWN',
        },
      });
      
      throw error;
    }
  }
}
```

---

## Integration Error Handling

### PDF Generation

```typescript
// services/pdf/invoice-pdf.ts
class InvoicePdfService {
  async generatePdf(invoice: Invoice): Promise<Buffer> {
    try {
      logger.info('Generating invoice PDF', {
        event: 'pdf.invoice.started',
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      });
      
      const pdfBuffer = await this.renderPdf(invoice);
      
      logger.info('Invoice PDF generated successfully', {
        event: 'pdf.invoice.success',
        invoiceId: invoice.id,
        sizeBytes: pdfBuffer.length,
      });
      
      return pdfBuffer;
      
    } catch (error) {
      logger.error('Invoice PDF generation failed', {
        event: 'pdf.invoice.failed',
        invoiceId: invoice.id,
        error: error.message,
      });
      
      throw new PdfGenerationError('invoice', error.message);
    }
  }
}
```

### Excel Import Error Handling

```typescript
// services/import/excel-parser.ts
interface ImportResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: ImportError[];
  data?: ParsedRow[];
}

async function parseExcelPriceList(
  file: Buffer,
  supplierId: string
): Promise<ImportResult> {
  const errors: ImportError[] = [];
  const data: ParsedRow[] = [];
  
  const workbook = xlsx.read(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json<RawRow>(sheet);
  
  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;  // Excel rows start at 1, header is row 1
    const row = rows[i];
    
    try {
      // Validate required fields
      if (!row.SKU) {
        errors.push(new ImportError('SKU is required', rowNum, 'SKU'));
        continue;
      }
      
      if (!row.Price || isNaN(Number(row.Price))) {
        errors.push(new ImportError('Invalid price', rowNum, 'Price'));
        continue;
      }
      
      // Transform and validate
      const parsed: ParsedRow = {
        sku: String(row.SKU).trim(),
        description: String(row.Description || '').trim(),
        price: Number(row.Price),
        discount: row.Discount ? Number(row.Discount) : 0,
      };
      
      // Validate discount range
      if (parsed.discount < 0 || parsed.discount > 100) {
        errors.push(new ImportError('Discount must be 0-100', rowNum, 'Discount'));
        continue;
      }
      
      data.push(parsed);
      
    } catch (error) {
      errors.push(new ImportError(
        `Unexpected error: ${error.message}`,
        rowNum
      ));
    }
  }
  
  // Log import result
  logger.info('Excel import completed', {
    event: 'import.excel.completed',
    supplierId,
    totalRows: rows.length,
    processed: data.length,
    failed: errors.length,
  });
  
  if (errors.length > 0) {
    logger.warn('Excel import had errors', {
      event: 'import.excel.errors',
      supplierId,
      errors: errors.slice(0, 10),  // Log first 10 errors
      totalErrors: errors.length,
    });
  }
  
  return {
    success: errors.length === 0,
    processed: data.length,
    failed: errors.length,
    errors,
    data: errors.length === 0 ? data : undefined,
  };
}
```

---

## Frontend Error Handling

### API Error Handling

```typescript
// lib/api-client.ts
class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
  }
}

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new ApiError(
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.message || 'An error occurred',
      response.status,
      data.error?.details
    );
  }
  
  return data.data;
}
```

### React Error Boundary

```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to error reporting service
    logger.error('React error boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 text-center">
          <h2 className="text-lg font-semibold text-red-600">Something went wrong</h2>
          <p className="mt-2 text-gray-600">
            Please refresh the page or contact support if the problem persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### Toast Notifications

```typescript
// hooks/useToast.ts
import { toast } from 'sonner';

export function useApiError() {
  const handleError = (error: unknown) => {
    if (error instanceof ApiError) {
      switch (error.code) {
        case 'VALIDATION_ERROR':
          toast.error('Please check your input', {
            description: error.details?.[0]?.message,
          });
          break;
          
        case 'UNAUTHORIZED':
          toast.error('Session expired', {
            description: 'Please log in again',
          });
          // Redirect to login
          break;
          
        case 'ODOO_ERROR':
          toast.error('Could not sync with system', {
            description: 'Your data has been saved locally. We\'ll retry automatically.',
          });
          break;
          
        default:
          toast.error('An error occurred', {
            description: error.message,
          });
      }
    } else {
      toast.error('An unexpected error occurred');
    }
  };
  
  return { handleError };
}
```

---

## Monitoring & Alerting

### Health Check Endpoint

```typescript
// api/health.ts
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    odoo: await checkOdoo(),
    redis: await checkRedis(),
  };
  
  const healthy = Object.values(checks).every(c => c.status === 'healthy');
  
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  });
});

async function checkDatabase(): Promise<HealthCheck> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

async function checkOdoo(): Promise<HealthCheck> {
  try {
    await odooClient.ping();
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

### Error Tracking Integration

```typescript
// utils/error-tracking.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Filter out operational errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    if (error instanceof AppError && error.isOperational) {
      return null;  // Don't send operational errors
    }
    
    return event;
  },
});

// Usage in error handler
if (!(error instanceof AppError) || !error.isOperational) {
  Sentry.captureException(error, {
    extra: {
      requestId: req.headers['x-request-id'],
      userId: (req as any).user?.id,
    },
  });
}
```

---

## Checklist

### Error Handling
- [ ] Custom error classes for different error types
- [ ] Global error handler middleware
- [ ] Async handler wrapper
- [ ] Proper HTTP status codes
- [ ] Error details not leaked in production

### Logging
- [ ] Structured logging (JSON in production)
- [ ] Request/response logging
- [ ] Business event logging
- [ ] Sensitive data redaction
- [ ] Request ID correlation

### Monitoring
- [ ] Health check endpoint
- [ ] Error tracking integration
- [ ] Log aggregation
- [ ] Alerting on critical errors
