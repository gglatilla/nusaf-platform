# Nusaf Platform - System Blueprint

> **Generated**: February 2026
> **Purpose**: Comprehensive system documentation for developers and stakeholders

---

## 1. Executive Summary

**Nusaf Platform** is a B2B web application for Nusaf Dynamic Technologies, a South African distributor of conveyor components, power transmission equipment, and industrial supplies.

### What It Does
- **Product Catalog**: Browse 1000s of products from European suppliers (Chiaravalli, Regina, Tecom) with tier-based pricing
- **Quote System**: Customers build quotes, submit for review, accept/reject
- **Order Fulfillment**: Internal operations for picking, manufacturing, transfers between warehouses
- **Inventory Management**: Stock tracking across JHB and CT warehouses with adjustments and reservations

### Who Uses It
| Role | Access |
|------|--------|
| **Customer** | Browse products, create quotes, view orders |
| **Sales** | All of above + view inventory, operations |
| **Manager** | All of above + approve adjustments, manage settings |
| **Admin** | Full access including pricing rules, imports |

### Locations
| Code | Name | Warehouse | Manufacturing | Sales |
|------|------|-----------|---------------|-------|
| JHB | Johannesburg | Main | Yes | Yes |
| CT | Cape Town | Finished goods only | No | Yes |
| MBB | Mbombela | No | No | Yes |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  Vercel (Next.js 14 + TypeScript + Tailwind + React Query)      │
│  22 pages, 72 components                                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────────┐
│                         BACKEND                                  │
│  Railway (Node.js + Express + Prisma)                           │
│  118 API endpoints                                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                        DATABASE                                  │
│  Railway PostgreSQL (29 models, 25 enums)                       │
└─────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                        STORAGE                                   │
│  Cloudflare R2 (documents, future: images)                      │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query, Zustand
- **Backend**: Node.js, Express, Prisma ORM, Zod validation
- **Database**: PostgreSQL
- **Storage**: Cloudflare R2
- **Deployment**: Vercel (frontend), Railway (backend + database)

---

## 3. Database Schema

### 29 Models by Domain

#### Core (5 models)
| Model | Purpose | Key Relations |
|-------|---------|---------------|
| `User` | System users with roles | → Company, Sessions |
| `Session` | Auth sessions with refresh tokens | → User |
| `Company` | Customer companies with tiers | → Users, Addresses, Quotes, Orders |
| `CompanyAddress` | Billing/shipping addresses | → Company |
| `CompanyContact` | Company contact people | → Company |

#### Product Catalog (6 models)
| Model | Purpose | Key Relations |
|-------|---------|---------------|
| `Supplier` | Chiaravalli, Regina, Tecom, Local | → Products, PricingRules |
| `Category` | Top-level product categories | → SubCategories, Products |
| `SubCategory` | Second-level categories | → Products |
| `Product` | SKUs with pricing and inventory defaults | → StockLevels, Movements |
| `CompetitorCrossReference` | Cross-reference to competitor SKUs | → Product |
| `SkuMapping` | Supplier SKU → Nusaf SKU mapping | → Supplier |

#### Import (2 models)
| Model | Purpose |
|-------|---------|
| `ImportBatch` | Tracks price list imports |
| `ImportRow` | Individual rows in import with status |

#### Pricing (2 models)
| Model | Purpose |
|-------|---------|
| `GlobalSettings` | EUR/ZAR exchange rate |
| `PricingRule` | Discount/freight/margin per supplier/category |

#### Quotes (4 models)
| Model | Purpose |
|-------|---------|
| `Quote` | Quote header with status workflow |
| `QuoteItem` | Line items in quote |
| `QuoteRequest` | Guest quote requests (pre-registration) |
| `QuoteCounter` | Auto-increment for QUO-YYYY-NNNNN |

#### Orders (3 models)
| Model | Purpose |
|-------|---------|
| `SalesOrder` | Order header from accepted quote |
| `SalesOrderLine` | Line items with pick/ship tracking |
| `SalesOrderCounter` | Auto-increment for ORD-YYYY-NNNNN |

#### Fulfillment (8 models)
| Model | Purpose |
|-------|---------|
| `PickingSlip` | Warehouse picking document |
| `PickingSlipLine` | Items to pick with qty tracking |
| `JobCard` | Manufacturing/assembly job |
| `TransferRequest` | Inter-warehouse transfer (JHB → CT) |
| `TransferRequestLine` | Items in transfer |
| `PickingSlipCounter` | Auto-increment |
| `JobCardCounter` | Auto-increment |
| `TransferRequestCounter` | Auto-increment |

#### Inventory (6 models)
| Model | Purpose |
|-------|---------|
| `StockLevel` | On-hand, reserved, on-order per product per warehouse |
| `StockMovement` | Audit trail of every stock change |
| `StockAdjustment` | Pending/approved/rejected adjustments |
| `StockAdjustmentLine` | Items in adjustment |
| `StockReservation` | Soft (quotes) and hard (orders) reservations |
| `StockAdjustmentCounter` | Auto-increment |

#### Issues & Documents (4 models)
| Model | Purpose |
|-------|---------|
| `IssueFlag` | Problems flagged on picking slips/job cards |
| `IssueComment` | Discussion thread on issues |
| `Document` | Uploaded files (PO, delivery notes) |
| `IssueFlagCounter` | Auto-increment |

### Key Enums
| Enum | Values |
|------|--------|
| `UserRole` | ADMIN, MANAGER, SALES, CUSTOMER |
| `CustomerTier` | END_USER, OEM_RESELLER, DISTRIBUTOR |
| `QuoteStatus` | DRAFT, CREATED, ACCEPTED, REJECTED, EXPIRED, CANCELLED, CONVERTED |
| `SalesOrderStatus` | DRAFT, CONFIRMED, PROCESSING, READY_TO_SHIP, SHIPPED, DELIVERED, INVOICED, CLOSED, ON_HOLD, CANCELLED |
| `StockMovementType` | RECEIPT, ISSUE, TRANSFER_OUT, TRANSFER_IN, MANUFACTURE_IN, MANUFACTURE_OUT, ADJUSTMENT_IN, ADJUSTMENT_OUT, SCRAP |
| `Warehouse` | JHB, CT |

---

## 4. API Endpoints (118 total)

### Authentication (`/api/v1/auth`) - 5 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate session |
| GET | `/auth/me` | Get current user |
| GET | `/auth` | Health check |

### Products (`/api/v1/products`) - 13 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/products` | List with filters, search, pagination |
| GET | `/products/:id` | Get product with pricing |
| PATCH | `/products/:id` | Update inventory defaults |
| GET | `/products/:id/price` | Calculate price for tier |
| POST | `/products/recalculate` | Recalculate all list prices |
| GET | `/products/:id/stock` | Get stock levels |
| GET | `/products/:id/stock/movements` | Movement history |
| GET | `/products/:id/stock/reservations` | Active reservations |
| GET | `/products/:id/stock/adjustments` | Related adjustments |
| POST | `/products/:id/stock/adjustments` | Create adjustment |

### Categories (`/api/v1/categories`) - 1 endpoint
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/categories` | List all with subcategories |

### Quotes (`/api/v1/quotes`) - 12 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/quotes` | Create draft or get existing |
| GET | `/quotes` | List with filters |
| GET | `/quotes/active` | Get active draft |
| GET | `/quotes/:id` | Get quote details |
| PATCH | `/quotes/:id` | Update notes |
| DELETE | `/quotes/:id` | Soft delete draft |
| POST | `/quotes/:id/items` | Add item |
| PATCH | `/quotes/:id/items/:itemId` | Update quantity |
| DELETE | `/quotes/:id/items/:itemId` | Remove item |
| POST | `/quotes/:id/finalize` | DRAFT → CREATED |
| POST | `/quotes/:id/accept` | CREATED → ACCEPTED |
| POST | `/quotes/:id/reject` | CREATED → REJECTED |

### Orders (`/api/v1/orders`) - 8 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/orders/from-quote` | Create from accepted quote |
| GET | `/orders` | List with filters |
| GET | `/orders/:id` | Get order details |
| PATCH | `/orders/:id` | Update notes |
| POST | `/orders/:id/confirm` | DRAFT → CONFIRMED |
| POST | `/orders/:id/hold` | Put on hold |
| POST | `/orders/:id/release` | Release from hold |
| POST | `/orders/:id/cancel` | Cancel order |

### Picking Slips (`/api/v1/picking-slips`) - 8 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/picking-slips` | List with filters |
| GET | `/picking-slips/:id` | Get with lines |
| GET | `/picking-slips/order/:orderId` | Get for order |
| POST | `/picking-slips/generate/:orderId` | Generate from order |
| POST | `/picking-slips/:id/assign` | Assign to user |
| POST | `/picking-slips/:id/start` | PENDING → IN_PROGRESS |
| PATCH | `/picking-slips/:id/lines/:lineId` | Update picked qty |
| POST | `/picking-slips/:id/complete` | IN_PROGRESS → COMPLETE |

### Job Cards (`/api/v1/job-cards`) - 10 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/job-cards` | List with filters |
| GET | `/job-cards/:id` | Get details |
| GET | `/job-cards/order/:orderId` | Get for order |
| POST | `/job-cards` | Create for order line |
| POST | `/job-cards/:id/assign` | Assign to user |
| POST | `/job-cards/:id/start` | PENDING → IN_PROGRESS |
| POST | `/job-cards/:id/hold` | IN_PROGRESS → ON_HOLD |
| POST | `/job-cards/:id/resume` | ON_HOLD → IN_PROGRESS |
| POST | `/job-cards/:id/complete` | IN_PROGRESS → COMPLETE |
| PATCH | `/job-cards/:id/notes` | Update notes |

### Transfer Requests (`/api/v1/transfer-requests`) - 9 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/transfer-requests` | List with filters |
| GET | `/transfer-requests/:id` | Get details |
| GET | `/transfer-requests/order/:orderId` | Get for order |
| POST | `/transfer-requests/generate/:orderId` | Create from order |
| POST | `/transfer-requests` | Create standalone |
| POST | `/transfer-requests/:id/ship` | PENDING → IN_TRANSIT |
| PATCH | `/transfer-requests/:id/lines/:lineId` | Update received qty |
| POST | `/transfer-requests/:id/receive` | IN_TRANSIT → RECEIVED |
| PATCH | `/transfer-requests/:id/notes` | Update notes |

### Inventory (`/api/v1/inventory`) - 20 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/inventory/summary` | Dashboard counts |
| GET | `/inventory/stock` | List stock levels |
| GET | `/inventory/stock/low` | Low stock products |
| GET | `/inventory/stock/:productId` | Stock for product |
| PATCH | `/inventory/stock/:productId` | Update reorder settings |
| GET | `/inventory/movements` | Movement history |
| GET | `/inventory/movements/:productId` | Movements for product |
| POST | `/inventory/adjustments` | Create adjustment |
| GET | `/inventory/adjustments` | List adjustments |
| GET | `/inventory/adjustments/:id` | Get adjustment |
| POST | `/inventory/adjustments/:id/approve` | Approve adjustment |
| POST | `/inventory/adjustments/:id/reject` | Reject adjustment |
| GET | `/inventory/reservations` | List reservations |
| GET | `/inventory/reservations/:productId` | Reservations for product |
| POST | `/inventory/reservations/:id/release` | Release reservation |
| POST | `/inventory/reservations/cleanup-expired` | Cleanup expired |

### Issues (`/api/v1/issues`) - 10 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/issues` | List with filters |
| GET | `/issues/stats` | Dashboard stats |
| GET | `/issues/picking-slip/:id` | Issues for picking slip |
| GET | `/issues/job-card/:id` | Issues for job card |
| GET | `/issues/:id` | Get issue details |
| POST | `/issues` | Create issue |
| PATCH | `/issues/:id` | Update status |
| POST | `/issues/:id/comments` | Add comment |
| POST | `/issues/:id/resolve` | Resolve issue |
| POST | `/issues/:id/close` | Close issue |

### Documents (`/api/v1/documents`) - 5 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/documents` | List documents |
| GET | `/documents/order/:orderId` | Documents for order |
| GET | `/documents/:id/download` | Get download URL |
| POST | `/documents/upload` | Upload document |
| DELETE | `/documents/:id` | Delete document |

### Admin (`/api/v1/admin`) - 17 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/settings` | Get global settings |
| PATCH | `/admin/settings` | Update EUR/ZAR rate |
| GET | `/admin/pricing-rules` | List pricing rules |
| GET | `/admin/pricing-rules/:id` | Get pricing rule |
| POST | `/admin/pricing-rules` | Create pricing rule |
| PATCH | `/admin/pricing-rules/:id` | Update pricing rule |
| DELETE | `/admin/pricing-rules/:id` | Delete pricing rule |
| POST | `/admin/imports/upload` | Upload price list |
| POST | `/admin/imports/validate` | Validate import |
| POST | `/admin/imports/execute` | Execute import |
| GET | `/admin/imports/suppliers` | List suppliers |
| GET | `/admin/imports/history` | Import history |
| GET | `/admin/imports/categories` | Debug categories |
| GET | `/admin/diagnostics/pricing-check` | Diagnose pricing |

---

## 5. Frontend Pages (22 pages)

### Public Pages
| Route | Page | Purpose |
|-------|------|---------|
| `/` | Home | Landing page with hero, features |
| `/login` | Login | Email/password authentication |

### Portal Pages (Authenticated)
| Route | Page | Roles |
|-------|------|-------|
| `/dashboard` | Dashboard | All - welcome, stats, recent activity |
| `/products` | Product Catalog | All - browse, filter, search |
| `/products/[id]` | Product Detail | All - full details, inventory tab |
| `/quotes` | Quote List | All - view/manage quotes |
| `/quotes/[id]` | Quote Detail | All - items, totals, actions |
| `/orders` | Order List | All - view orders |
| `/orders/[id]` | Order Detail | All - lines, status, documents |
| `/inventory` | Inventory Dashboard | Internal only - stock, adjustments |
| `/picking-slips` | Picking Slip List | Internal only |
| `/picking-slips/[id]` | Picking Slip Detail | Internal only - lines, progress |
| `/job-cards` | Job Card List | Internal only |
| `/job-cards/[id]` | Job Card Detail | Internal only |
| `/transfer-requests` | Transfer List | Internal only |
| `/transfer-requests/[id]` | Transfer Detail | Internal only |
| `/issues` | Issue List | All - view issues |
| `/issues/[id]` | Issue Detail | All - comments, resolution |
| `/documents` | Document List | All - uploaded files |
| `/admin/settings` | Admin Settings | Admin only - pricing, exchange rate |
| `/imports` | Import Dashboard | Admin only |
| `/imports/new` | New Import | Admin only - upload, map, execute |

### Role Access Matrix
| Page Group | Customer | Sales | Manager | Admin |
|------------|----------|-------|---------|-------|
| Products/Quotes | Yes | Yes | Yes | Yes |
| Orders | Yes | Yes | Yes | Yes |
| Inventory | No | View | Full | Full |
| Picking/Jobs/Transfers | No | View | Full | Full |
| Issues/Documents | Yes | Yes | Yes | Yes |
| Admin/Imports | No | No | No | Yes |

---

## 6. User Flows

### Flow 1: Customer - Browse to Order

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browse    │────▶│  Add to     │────▶│  Finalize   │
│  Products   │     │   Quote     │     │   Quote     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
┌─────────────┐     ┌─────────────┐     ┌──────▼──────┐
│   Track     │◀────│   Order     │◀────│   Accept    │
│   Order     │     │  Created    │     │   Quote     │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. **Browse Products** → Filter by category, search, view stock status
2. **Add to Quote** → Select quantity, builds cart
3. **Finalize Quote** → Submit for review (DRAFT → CREATED)
4. **Accept Quote** → Agree to terms (CREATED → ACCEPTED)
5. **Order Created** → Sales order auto-generated
6. **Track Order** → View status updates

### Flow 2: Sales/Operations - Order Fulfillment

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Confirm   │────▶│  Generate   │────▶│    Pick     │
│   Order     │     │Picking Slips│     │   Items     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
       ┌───────────────────────────────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Job Cards  │────▶│  Transfer   │────▶│   Invoice   │
│ (if needed) │     │  (if CT)    │     │  & Ship     │
└─────────────┘     └─────────────┘     └─────────────┘
```

**JHB Customer Flow**:
1. Confirm Order → Generate JHB Picking Slip
2. Pick Items → Create Job Cards if assembly needed
3. Complete Pick/Jobs → Invoice → Ship from JHB

**CT Customer Flow**:
1. Confirm Order → Check CT stock
2. Generate CT Picking Slip (available) + JHB Picking Slip (remainder)
3. JHB: Pick/Manufacture → Create Transfer Request
4. Transfer JHB → CT
5. CT Receives → Invoice → Ship from CT

### Flow 3: Admin - Product & Pricing Management

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Upload    │────▶│   Validate  │────▶│   Execute   │
│  Price List │     │   Mapping   │     │   Import    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
┌─────────────┐     ┌─────────────┐     ┌──────▼──────┐
│   Verify    │◀────│ Recalculate │◀────│   Update    │
│   Prices    │     │   Prices    │     │   Settings  │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. **Upload Price List** → Excel from supplier
2. **Validate Mapping** → Map columns, handle SKU conversion
3. **Execute Import** → Create/update products
4. **Update Settings** → EUR/ZAR rate, pricing rules
5. **Recalculate Prices** → Apply new rules to all products
6. **Verify Prices** → Spot-check with diagnostics

---

## 7. What's Built vs Planned

### Built (21 Tasks Complete)

| Area | Status | Description |
|------|--------|-------------|
| **Authentication** | COMPLETE | Login, sessions, role-based access |
| **Product Catalog** | COMPLETE | Browse, search, filter, categories |
| **Pricing Engine** | COMPLETE | Tier-based pricing, rules, EUR→ZAR |
| **Price Import** | COMPLETE | Excel upload, validation, execution |
| **Quote System** | COMPLETE | Create, finalize, accept/reject, convert |
| **Order Management** | COMPLETE | Create from quote, status workflow |
| **Picking Slips** | COMPLETE | Generate, assign, pick, complete |
| **Job Cards** | COMPLETE | Create, assign, track, complete |
| **Transfer Requests** | COMPLETE | JHB→CT transfers, ship, receive |
| **Issue Flagging** | COMPLETE | Create, categorize, resolve issues |
| **Document Archive** | COMPLETE | Upload, download, organize by order |
| **Inventory Backend** | COMPLETE | Stock levels, movements, adjustments |
| **Inventory UI** | COMPLETE | Dashboard, approve adjustments, settings |

### Planned (6 Tasks in Backlog)

| Task | Area | Description | Priority |
|------|------|-------------|----------|
| **TASK-012-2E** | Orders | Customer portal order tracking | High |
| **TASK-012-2F** | Analytics | Operations dashboards, KPIs | Medium |
| **TASK-011b** | Quotes | Sales dashboard, quote analytics | Medium |
| **TASK-014** | Products | Modular chain configurator | High |
| **TASK-015** | Public | Website homepage | Low |
| **TASK-016** | Public | Website product pages | Low |

---

## 8. Gap Analysis

### Critical Gaps (Should Build Next)

| Gap | Impact | Notes |
|-----|--------|-------|
| **Customer Order Tracking** | High | Customers can't see fulfillment progress |
| **Product Configurator** | High | Core feature for chain products |
| **Stock Auto-Allocation** | Medium | Manual warehouse selection for picking slips |

### Feature Gaps

| Feature | Current State | Needed |
|---------|---------------|--------|
| Order tracking for customers | Only see status | Need progress %, ETAs |
| Chain configuration | No UI | Build modular configurator |
| Analytics dashboards | None | Order cycle time, pick accuracy |
| Sales performance | None | Quote conversion, revenue |
| Public website | Landing only | Product pages, contact |

### Technical Gaps

| Area | Current State | Improvement |
|------|---------------|-------------|
| Testing | Manual only | Add Jest, Playwright |
| Error monitoring | Console logs | Add Sentry |
| Email notifications | None | Quote/order updates |
| PDF generation | None | Quote PDFs |

---

## 9. Business Rules Reference

### Pricing Formula (Imported Products)
```
Supplier Price (Gross/Net)
→ Apply discount if Gross
→ × EUR/ZAR rate
→ × (1 + Freight %)
→ ÷ Margin divisor
→ × 1.40 (always)
= List Price
```

### Customer Tier Discounts
| Tier | Discount off List |
|------|------------------|
| End User | 30% |
| OEM/Reseller | 40% |
| Distributor | 50% |

### Warehouse Rules
- All manufacturing/assembly: JHB only
- CT carries finished goods only
- Mbombela is sales office only (ships from JHB)
- Invoice before dispatch (B2B standard)

### Document Retention
- Sales Order: Temporary (deleted after invoice)
- Quote: Permanent
- Customer PO: Permanent
- Job Cards: Permanent
- Invoice: Permanent
- Signed Delivery Note: Permanent

### Stock Movement Types
| Type | Direction | When Used |
|------|-----------|-----------|
| RECEIPT | + | Goods received from supplier |
| ISSUE | - | Goods shipped to customer |
| TRANSFER_OUT | - | Sent to another warehouse |
| TRANSFER_IN | + | Received from another warehouse |
| MANUFACTURE_IN | + | Produced in JHB |
| MANUFACTURE_OUT | - | Components used in production |
| ADJUSTMENT_IN | + | Stock correction (found) |
| ADJUSTMENT_OUT | - | Stock correction (lost/damaged) |
| SCRAP | - | Damaged/expired goods |

---

## 10. File Structure

```
nusaf-platform/
├── backend/
│   ├── src/
│   │   ├── api/v1/           # Route handlers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth, validation
│   │   └── lib/              # Utilities
│   └── prisma/
│       └── schema.prisma     # Database schema
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   ├── hooks/            # React Query hooks
│   │   ├── lib/              # API client, utils
│   │   └── stores/           # Zustand stores
│   └── public/               # Static assets
├── .claude/
│   ├── SESSION.md            # Current session state
│   ├── TASKS.md              # Task queue
│   └── skills/               # Domain knowledge
├── CLAUDE.md                 # AI assistant instructions
└── SYSTEM-BLUEPRINT.md       # This document
```

---

## 11. Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | test@example.com | password123 |
| Sales | sales@nusaf.co.za | sales123 |
| Admin | admin@nusaf.co.za | admin123 |

---

*Last updated: February 2026*
