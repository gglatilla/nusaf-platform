---
name: api-design-patterns
description: RESTful API design patterns for B2B applications with versioning, consistent responses, pagination, and filtering. Use when designing API endpoints, request/response structures, or integration interfaces.
---

# API Design Patterns for B2B Applications

## Core Principles

1. **Version from day one** - Breaking changes happen, plan for them
2. **Consistency is king** - Same patterns everywhere
3. **Explicit over implicit** - Clear contracts, no surprises
4. **Respect integration boundaries** - Clean separation from external systems

---

## URL Structure

### Base Pattern

```
https://api.example.com/v1/{resource}
https://api.example.com/v1/{resource}/{id}
https://api.example.com/v1/{resource}/{id}/{sub-resource}
```

### Examples

```
GET    /v1/products                    # List products
GET    /v1/products/123                # Get product
POST   /v1/products                    # Create product
PATCH  /v1/products/123                # Update product
DELETE /v1/products/123                # Delete product

GET    /v1/products/123/prices         # Get product prices
GET    /v1/quotes/456/items            # Get quote items
POST   /v1/quotes/456/submit           # Action on quote
```

### Naming Conventions

| Do | Don't |
|----|-------|
| `/products` | `/product`, `/getProducts` |
| `/price-lists` | `/priceLists`, `/price_lists` |
| `/quotes/123/items` | `/quotes/123/getItems` |
| `POST /quotes/123/submit` | `POST /quotes/123/doSubmit` |

---

## HTTP Methods

| Method | Purpose | Idempotent | Request Body | Response |
|--------|---------|------------|--------------|----------|
| GET | Retrieve | Yes | No | Resource(s) |
| POST | Create | No | Yes | Created resource |
| PATCH | Partial update | Yes | Yes | Updated resource |
| PUT | Full replace | Yes | Yes | Replaced resource |
| DELETE | Remove | Yes | No | Empty or confirmation |

### When to Use PUT vs PATCH

```typescript
// PATCH - partial update (preferred for most cases)
PATCH /v1/products/123
{ "price": 99.99 }

// PUT - full replacement (use sparingly)
PUT /v1/products/123
{ "name": "...", "sku": "...", "price": 99.99, ... }  // ALL fields required
```

---

## Request Format

### Headers

```http
Content-Type: application/json
Authorization: Bearer <token>
Accept: application/json
X-Request-ID: <uuid>           # For tracing
X-Company-ID: <company-id>     # For multi-tenant context
```

### Request Body Conventions

```typescript
// Create - POST /v1/products
{
  "sku": "CHAIN-001",
  "name": "Modular Chain 100mm",
  "categoryId": "cat-123",
  "prices": {
    "cost": 45.00,
    "list": 89.99
  }
}

// Update - PATCH /v1/products/123
{
  "prices": {
    "list": 94.99
  }
}
```

---

## Response Format

### Standard Envelope

```typescript
// Success response
{
  "success": true,
  "data": { ... },            // The actual payload
  "meta": {                   // Optional metadata
    "timestamp": "2024-01-24T10:30:00Z",
    "requestId": "req-123"
  }
}

// List response with pagination
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 156,
    "totalPages": 8,
    "hasMore": true
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "sku", "message": "SKU is required" },
      { "field": "price", "message": "Price must be positive" }
    ]
  },
  "meta": {
    "timestamp": "2024-01-24T10:30:00Z",
    "requestId": "req-123"
  }
}
```

### HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PATCH, PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Missing or invalid auth |
| 403 | Forbidden | Valid auth, insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate, version conflict |
| 422 | Unprocessable | Business rule violation |
| 429 | Too Many Requests | Rate limited |
| 500 | Server Error | Unexpected error |

---

## Pagination

### Offset-Based (Simple)

```
GET /v1/products?page=2&pageSize=20
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "pageSize": 20,
    "totalItems": 156,
    "totalPages": 8
  }
}
```

### Cursor-Based (For Large Datasets)

```
GET /v1/products?cursor=eyJpZCI6MTIzfQ&limit=20
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "nextCursor": "eyJpZCI6MTQzfQ",
    "hasMore": true
  }
}
```

---

## Filtering & Sorting

### Query Parameters

```
GET /v1/products?category=chains&supplier=tecom&status=active
GET /v1/products?minPrice=100&maxPrice=500
GET /v1/products?search=modular+chain
GET /v1/products?sort=name:asc,createdAt:desc
```

### Filter Operators (Complex Filtering)

```
GET /v1/products?filter[price][gte]=100&filter[price][lte]=500
GET /v1/products?filter[status][in]=active,pending
GET /v1/products?filter[name][contains]=chain
```

### TypeScript Filter Types

```typescript
interface ProductFilters {
  category?: string;
  supplier?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

interface ListOptions {
  filters?: ProductFilters;
  sort?: SortOption[];
  page?: number;
  pageSize?: number;
}
```

---

## Error Handling

### Error Codes

```typescript
enum ApiErrorCode {
  // Client errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Business errors
  QUOTE_EXPIRED = 'QUOTE_EXPIRED',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  PRICE_CHANGED = 'PRICE_CHANGED',
  ORDER_NOT_CANCELLABLE = 'ORDER_NOT_CANCELLABLE',
  
  // Integration errors
  ODOO_SYNC_FAILED = 'ODOO_SYNC_FAILED',
  ODOO_UNAVAILABLE = 'ODOO_UNAVAILABLE',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

### Error Response Structure

```typescript
interface ApiError {
  code: ApiErrorCode;
  message: string;                    // Human-readable
  details?: ValidationError[];        // Field-level errors
  retryable?: boolean;               // Can client retry?
  retryAfter?: number;               // Seconds until retry
}

interface ValidationError {
  field: string;
  message: string;
  code?: string;                     // e.g., 'required', 'min', 'pattern'
}
```

---

## Resource Design

### Product Resource

```typescript
// GET /v1/products/123
interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  
  category: {
    id: string;
    name: string;
    path: string[];              // ['Chains', 'Modular Chains']
  };
  
  supplier: {
    id: string;
    name: string;
    code: string;
  };
  
  pricing: {
    cost: Money;
    list: Money;
    currency: string;
  };
  
  status: 'active' | 'inactive' | 'discontinued';
  
  // Metadata
  odooId: number | null;
  createdAt: string;             // ISO 8601
  updatedAt: string;
}

interface Money {
  amount: number;
  formatted: string;             // "R 1,234.56"
}
```

### Quote Resource

```typescript
// GET /v1/quotes/456
interface Quote {
  id: string;
  quoteNumber: string;           // "QUO-2024-00123"
  
  customer: {
    id: string;
    name: string;
    email: string;
  } | null;
  
  company: {
    id: string;
    name: string;
  } | null;
  
  items: QuoteItem[];
  
  totals: {
    subtotal: Money;
    vat: Money;
    total: Money;
    currency: string;
  };
  
  status: QuoteStatus;
  validUntil: string;
  
  // Integration
  odooOrderId: number | null;
  submittedAt: string | null;
  
  // Audit
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

type QuoteStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted';
```

---

## Actions & Operations

For operations that don't fit CRUD:

```
POST /v1/quotes/123/submit        # Submit quote to Odoo
POST /v1/quotes/123/duplicate     # Create copy
POST /v1/quotes/123/send          # Email to customer
POST /v1/price-lists/456/publish  # Publish price list
POST /v1/sync/odoo/customers      # Trigger sync
```

### Action Request/Response

```typescript
// POST /v1/quotes/123/submit
// Request
{
  "notes": "Customer requested expedited delivery"
}

// Response
{
  "success": true,
  "data": {
    "quoteId": "123",
    "odooOrderId": 789,
    "status": "converted",
    "submittedAt": "2024-01-24T10:30:00Z"
  }
}
```

---

## Bulk Operations

### Batch Create

```typescript
// POST /v1/products/batch
{
  "items": [
    { "sku": "CHAIN-001", "name": "..." },
    { "sku": "CHAIN-002", "name": "..." }
  ]
}

// Response
{
  "success": true,
  "data": {
    "created": 2,
    "results": [
      { "index": 0, "id": "prod-123", "success": true },
      { "index": 1, "id": "prod-124", "success": true }
    ]
  }
}
```

### Batch with Partial Failures

```typescript
// Response with some failures
{
  "success": false,
  "data": {
    "created": 1,
    "failed": 1,
    "results": [
      { "index": 0, "id": "prod-123", "success": true },
      { 
        "index": 1, 
        "success": false, 
        "error": { 
          "code": "VALIDATION_ERROR",
          "message": "SKU already exists" 
        }
      }
    ]
  }
}
```

---

## Versioning Strategy

### URL Versioning (Recommended)

```
/v1/products
/v2/products
```

### Breaking Changes That Require New Version

- Removing fields from responses
- Changing field types
- Changing required fields in requests
- Changing endpoint paths
- Changing authentication

### Non-Breaking Changes (Same Version)

- Adding optional fields
- Adding new endpoints
- Adding new optional query parameters
- Expanding enum values

### Version Lifecycle

```typescript
// Response headers
X-API-Version: 1.2.3
X-API-Deprecated: true
X-API-Sunset: 2024-06-01
```

---

## Document Generation Endpoints

For PDF generation (quotes, invoices, etc.):

```
POST /v1/quotes/123/generate-pdf     # Generate quote PDF
GET  /v1/quotes/123/pdf              # Download quote PDF
POST /v1/invoices/456/generate-pdf   # Generate invoice PDF
GET  /v1/invoices/456/pdf            # Download invoice PDF
POST /v1/invoices/456/send           # Email invoice to customer
```

### PDF Generation Response

```typescript
// POST /v1/quotes/123/generate-pdf
// Response
{
  "success": true,
  "data": {
    "quoteId": "123",
    "pdfUrl": "https://assets.nusaf.co.za/quotes/123/quote-QUO-2024-00123.pdf",
    "generatedAt": "2024-01-24T10:30:00Z"
  }
}
```

---

## Future Integration Patterns

When adding accounting integration (Xero/QuickBooks):

```
POST /v1/integrations/accounting/connect     # OAuth flow
POST /v1/integrations/accounting/disconnect
POST /v1/invoices/456/push-to-accounting    # Push single invoice
POST /v1/sync/accounting/invoices           # Batch push
GET  /v1/integrations/accounting/status     # Connection status
```

Design principle: Your system remains source of truth. Integrations receive data, not the other way around.

---

## Rate Limiting

### Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1706097600
```

### 429 Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Retry after 60 seconds.",
    "retryAfter": 60
  }
}
```

---

## API Documentation

### OpenAPI Spec Location

```
GET /v1/openapi.json
GET /v1/docs              # Swagger UI
```

### Include in Every Endpoint

- Summary and description
- Request/response schemas
- Example requests and responses
- Error codes specific to endpoint
- Required permissions

---

## Checklist

### Every Endpoint Should Have

- [ ] Versioned URL (/v1/...)
- [ ] Authentication requirement documented
- [ ] Permission requirement documented
- [ ] Request validation
- [ ] Consistent response envelope
- [ ] Proper HTTP status codes
- [ ] Error response with code and message
- [ ] OpenAPI documentation

### List Endpoints Should Have

- [ ] Pagination
- [ ] Filtering options
- [ ] Sorting options
- [ ] Consistent response structure

### Write Endpoints Should Have

- [ ] Input validation
- [ ] Idempotency handling (where appropriate)
- [ ] Audit trail logging
- [ ] Proper conflict handling
