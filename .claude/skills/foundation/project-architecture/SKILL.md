---
name: project-architecture
description: Project architecture patterns for B2B web applications with separated frontend (Vercel) and backend (Railway) deployments. Use when making decisions about folder structure, code organization, service boundaries, or how components connect.
---

# Project Architecture for B2B Web Applications

## Architecture Overview

This project uses a **separated deployment architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE                               │
│              (CDN, Images, PDFs, CAD files, Catalogs)           │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌───────────────────┐                       ┌───────────────────┐
│      VERCEL       │                       │      VERCEL       │
│  Public Website   │                       │   Web Application │
│  (Marketing/SEO)  │                       │  (Customer Portal)│
│    Next.js SSG    │                       │    Next.js SSR    │
└───────────────────┘                       └───────────────────┘
        │                                               │
        └───────────────────────┬───────────────────────┘
                                ▼
                    ┌───────────────────┐
                    │      RAILWAY      │
                    │   Backend API     │
                    │   (Node.js/Python)│
                    │   + PostgreSQL    │
                    │  (Source of Truth)│
                    └───────────────────┘
                                │
                                ▼ (Future, when needed)
                    ┌───────────────────┐
                    │  Xero / QuickBooks │
                    │   (Accounting)     │
                    └───────────────────┘
```

## Core Principles

### 1. Separation of Concerns

| Layer | Responsibility | Location |
|-------|---------------|----------|
| Presentation | UI rendering, user interaction | Vercel (Next.js) |
| API Gateway | Request handling, auth, validation | Railway |
| Business Logic | Pricing, configuration, workflows | Railway |
| Data Access | Database queries | Railway |
| External Systems | Cloudflare, future accounting | External |

### 2. Data Ownership Rules

**Your system is the source of truth.** You own everything:

| Data | Owner | Notes |
|------|-------|-------|
| Customers | Your System | Full control |
| Products | Your System | Catalog, pricing, configurations |
| Supplier Prices | Your System | Raw import data |
| Pricing Rules | Your System | Calculation logic |
| Quotes | Your System | Full lifecycle |
| Orders | Your System | Full lifecycle |
| Invoices | Your System | Generate PDFs, track payment |
| Inventory | Your System | Basic tracking |
| Users | Your System | Auth, permissions |

**Future Integration (Accounting):**
When revenue justifies, add Xero/QuickBooks for:
- Official accounting ledger
- Tax compliance
- Bank reconciliation

Your system remains source of truth; accounting software receives data.

### 3. Stateless Backend Design

- Backend API must be stateless for Railway scaling
- Session data in Redis or JWT tokens
- No local file storage (use Cloudflare R2)
- Database connections pooled properly

## Folder Structure

### Backend (Railway)

```
/backend
├── src/
│   ├── api/                    # API route handlers
│   │   ├── v1/                 # API version 1
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── pricing/
│   │   │   ├── quotes/
│   │   │   ├── orders/
│   │   │   ├── invoices/
│   │   │   ├── customers/
│   │   │   └── inventory/
│   │   └── webhooks/           # Payment webhooks, etc.
│   │
│   ├── services/               # Business logic layer
│   │   ├── pricing/
│   │   │   ├── calculator.ts
│   │   │   ├── rules-engine.ts
│   │   │   └── fx-rates.ts
│   │   ├── configurator/
│   │   │   ├── chain-builder.ts
│   │   │   └── validation.ts
│   │   ├── import/
│   │   │   ├── excel-parser.ts
│   │   │   └── supplier-mapper.ts
│   │   ├── orders/
│   │   │   ├── order-service.ts
│   │   │   └── invoice-generator.ts
│   │   └── pdf/
│   │       ├── quote-pdf.ts
│   │       └── invoice-pdf.ts
│   │
│   ├── models/                 # Database models/entities
│   │   ├── product.ts
│   │   ├── supplier.ts
│   │   ├── customer.ts
│   │   ├── price-list.ts
│   │   ├── price-rule.ts
│   │   ├── quote.ts
│   │   ├── order.ts
│   │   ├── invoice.ts
│   │   └── user.ts
│   │
│   ├── repositories/           # Data access layer
│   │   ├── product.repo.ts
│   │   ├── customer.repo.ts
│   │   ├── pricing.repo.ts
│   │   ├── quote.repo.ts
│   │   ├── order.repo.ts
│   │   └── invoice.repo.ts
│   │
│   ├── integrations/           # External system clients (future)
│   │   ├── cloudflare/
│   │   │   └── r2-client.ts
│   │   └── accounting/         # Future: Xero/QuickBooks
│   │       └── README.md
│   │
│   ├── middleware/             # Express/Fastify middleware
│   │   ├── auth.ts
│   │   ├── rate-limit.ts
│   │   ├── validation.ts
│   │   └── error-handler.ts
│   │
│   ├── utils/                  # Shared utilities
│   │   ├── logger.ts
│   │   ├── currency.ts
│   │   └── validation.ts
│   │
│   ├── types/                  # TypeScript type definitions
│   │   ├── api.ts
│   │   └── domain.ts
│   │
│   ├── config/                 # Configuration management
│   │   ├── index.ts
│   │   └── database.ts
│   │
│   └── index.ts                # Application entry point
│
├── prisma/                     # Database schema & migrations
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── scripts/                    # Utility scripts
│   └── seed.ts
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

### Frontend - Web Application (Vercel)

```
/webapp
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth-required routes
│   │   │   ├── dashboard/
│   │   │   ├── quotes/
│   │   │   ├── orders/
│   │   │   ├── products/
│   │   │   └── configurator/
│   │   ├── (public)/          # Public routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── api/               # API routes (BFF pattern)
│   │   │   └── [...proxy]/    # Proxy to Railway backend
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/                # Base UI components
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Table/
│   │   │   ├── Modal/
│   │   │   └── index.ts
│   │   ├── forms/             # Form components
│   │   │   ├── PriceListUpload/
│   │   │   └── QuoteBuilder/
│   │   ├── features/          # Feature-specific components
│   │   │   ├── Configurator/
│   │   │   ├── PricingTable/
│   │   │   └── QuoteCart/
│   │   └── layout/            # Layout components
│   │       ├── Header/
│   │       ├── Sidebar/
│   │       └── Footer/
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── usePricing.ts
│   │   └── useQuote.ts
│   │
│   ├── lib/                   # Utilities
│   │   ├── api-client.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   │
│   ├── stores/                # State management (Zustand)
│   │   ├── quote-store.ts
│   │   └── user-store.ts
│   │
│   └── types/
│       └── index.ts
│
├── public/
├── .env.example
├── next.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

### Frontend - Public Website (Vercel)

```
/website
├── src/
│   ├── app/
│   │   ├── page.tsx           # Homepage
│   │   ├── about/
│   │   ├── products/
│   │   │   ├── page.tsx       # Product catalog
│   │   │   ├── [category]/
│   │   │   └── [category]/[product]/
│   │   ├── industries/
│   │   │   ├── food-processing/
│   │   │   ├── bottling/
│   │   │   └── mining/
│   │   ├── brands/
│   │   │   ├── nusaf/
│   │   │   ├── tecom/
│   │   │   ├── chiaravalli/
│   │   │   └── regina/
│   │   ├── resources/
│   │   │   ├── catalogs/
│   │   │   ├── cad-drawings/
│   │   │   └── technical-docs/
│   │   ├── contact/
│   │   └── quote-request/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── marketing/
│   │   ├── products/
│   │   └── layout/
│   │
│   └── lib/
│
├── public/
├── next.config.js
└── package.json
```

## Key Architecture Decisions

### 1. Backend for Frontend (BFF) Pattern

The web application proxies API calls through Next.js API routes:

```
Browser → Vercel (Next.js API Route) → Railway (Backend API)
```

Benefits:
- Hide backend URL from client
- Add caching layer
- Handle auth token refresh
- Aggregate multiple API calls

### 2. Database Strategy

**Your PostgreSQL (Railway)** is the single source of truth:

| Data | Tables |
|------|--------|
| Customers | customers, customer_contacts, customer_addresses |
| Products | products, product_categories, product_images |
| Supplier Data | suppliers, price_lists, price_list_items |
| Pricing | pricing_rules, exchange_rates |
| Configurations | configuration_rules, configured_products |
| Quotes | quotes, quote_items |
| Orders | orders, order_items |
| Invoices | invoices, invoice_items, payments |
| Inventory | inventory_items, stock_movements |
| Users | users, sessions, company_users |
| Audit | audit_logs |

### 3. Document Generation

Generate PDFs for:
- Quotes (customer-facing)
- Orders (internal confirmation)
- Invoices (payment requests)
- Packing slips

Use a library like `@react-pdf/renderer` or `puppeteer` for PDF generation.

### 4. File Storage (Cloudflare R2)

```
/nusaf-assets
├── products/
│   ├── images/
│   │   └── {product-id}/
│   └── cad/
│       └── {product-id}/
├── catalogs/
│   ├── nusaf/
│   ├── tecom/
│   ├── chiaravalli/
│   └── regina/
├── supplier-imports/
│   └── {import-id}/
├── quotes/
│   └── {quote-id}/
└── invoices/
    └── {invoice-id}/
```

### 5. Future Accounting Integration

When needed, integrate with Xero or QuickBooks:

```
Your System (Source of Truth)
         │
         ▼ Push invoices, payments
┌─────────────────┐
│ Xero/QuickBooks │
│  (Accounting)   │
└─────────────────┘
```

Keep integration simple:
- Push invoices when created
- Push payments when recorded
- Pull nothing (your system is source of truth)

## Anti-Patterns to Avoid

| Don't Do This | Do This Instead |
|---------------|-----------------|
| Store files locally on Railway | Use Cloudflare R2 |
| Skip API versioning | Always version: /api/v1/ |
| Mix concerns in files | One responsibility per file |
| Create circular dependencies | Clear dependency direction |
| Store secrets in code | Use environment variables |
| Over-engineer for "future scale" | Build what you need now |
| Add integrations prematurely | Add when revenue justifies |

## Environment Configuration

### Required Environment Variables

**Backend (Railway)**:
```env
# Database
DATABASE_URL=postgresql://...

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY=...
CLOUDFLARE_R2_SECRET_KEY=...
CLOUDFLARE_R2_BUCKET=nusaf-assets

# Auth
JWT_SECRET=...
JWT_EXPIRY=24h

# App
NODE_ENV=production
API_VERSION=v1

# Future: Accounting integration
# XERO_CLIENT_ID=...
# XERO_CLIENT_SECRET=...
```

**Frontend (Vercel)**:
```env
NEXT_PUBLIC_API_URL=https://api.nusaf.co.za
NEXT_PUBLIC_CLOUDFLARE_URL=https://assets.nusaf.co.za
```

## Checklist for New Features

Before implementing any new feature:

- [ ] Which layer does this belong to? (Presentation / API / Business Logic / Data)
- [ ] What data does it need?
- [ ] What API endpoints are needed?
- [ ] Does it need new database tables?
- [ ] What are the security requirements?
- [ ] How will it be tested?
- [ ] Does it need PDF generation?
- [ ] Does it affect future accounting integration?
