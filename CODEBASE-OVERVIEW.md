# Codebase Overview

> **This file tracks what has been built in the NUSAF Platform.**
> Update this file whenever features are added, modified, or removed.
> Claude reads this at startup to understand the current state of the codebase.

---

## Build Status

| Component | Status |
|-----------|--------|
| Project Foundation | ✅ Complete |
| Database Schema | ✅ Complete |
| Pricing Engine | ✅ Complete |
| Staff Authentication | ✅ Complete |
| Customer Authentication | ✅ Complete |
| Login System (unified) | ✅ Complete |
| Internal Dashboard | ✅ Complete |
| Marketing Website | ⏳ Phase 2 |
| B2B Portal | ⏳ Phase 3 |
| Tests | ✅ Login tests (9 passing) |

---

## Technology Stack

| Layer | Technology | Status |
|-------|------------|--------|
| Framework | Next.js 14 (App Router) | ✅ Implemented |
| Language | TypeScript | ✅ Implemented |
| UI | Tailwind CSS v3 + Custom Components | ✅ Implemented |
| Database | PostgreSQL | ✅ Schema Ready |
| ORM | Prisma v5 | ✅ Implemented |
| Auth | NextAuth.js (Credentials) | ✅ Implemented |
| Icons | Lucide React | ✅ Implemented |

---

## Implemented Features

### Feature List

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Unified Login System | ✅ Complete | `src/app/login/page.tsx` | Staff + customer login |
| Customer Authentication | ✅ Complete | `src/lib/auth.ts` | CustomerUser model |
| Password Reset Flow | ✅ Complete | `src/app/forgot-password/` | Token-based reset |
| Account Request | ✅ Complete | `src/app/request-account/` | Customer registration |
| Admin Approval Queue | ✅ Complete | `src/app/(internal)/internal/account-requests/` | Approve/reject requests |
| Rate Limiting | ✅ Complete | `src/lib/auth.ts` | LoginAttempt tracking |
| Device Tracking | ✅ Complete | `src/lib/device-tracking.ts` | New device alerts |
| Session Timeout | ✅ Complete | `src/components/session-timeout-warning.tsx` | Warning modal |
| Cookie Consent | ✅ Complete | `src/components/cookie-consent.tsx` | POPIA compliance |
| Password Validation | ✅ Complete | `src/lib/password-validation.ts` | Strength checker |
| Login Behavior Tests | ✅ Complete | `src/__tests__/auth/login.test.tsx` | 9 tests |
| Staff Authentication | ✅ Complete | `src/lib/auth.ts` | JWT sessions, role-based |
| Pricing Engine | ✅ Complete | `src/lib/pricing/` | Full calculation logic |
| Price List Import | ✅ Complete | `src/lib/import/` | Excel/CSV with SKU conversion |
| Internal Dashboard | ✅ Complete | `src/app/(internal)/` | All management pages |
| UI Components | ✅ Complete | `src/components/ui/` | shadcn/ui style |
| Database Schema | ✅ Complete | `prisma/schema.prisma` | 26+ models |
| Seed Script | ✅ Complete | `prisma/seed.ts` | Initial data |

### Feature Details

#### Unified Login System
**Status:** Complete
**Implemented:** 2026-01-18

**What it does:**
- Single login page for both staff and customer users
- Password visibility toggle
- Remember me checkbox (extends session duration)
- Role-based routing: staff→/internal, customers→/portal
- Force password change on first login
- Rate limiting (5 attempts per 15 minutes)
- Account status messages (locked, pending, disabled)

**Key files:**
- `src/app/login/page.tsx` - Unified login page
- `src/lib/auth.ts` - Auth configuration with dual user support
- `src/components/ui/password-input.tsx` - Password field with toggle
- `src/components/ui/checkbox.tsx` - Remember me checkbox
- `src/__tests__/auth/login.test.tsx` - 9 behavior tests

**Flows:**
- Staff login → /internal dashboard
- Customer login → /portal dashboard
- mustChangePassword → /change-password

---

#### Customer Account Request
**Status:** Complete
**Implemented:** 2026-01-18

**What it does:**
- Public form for new customers to request accounts
- Captures company info, contact details, POPIA consent
- Creates AccountRequest record with PENDING status
- Admin approval queue at /internal/account-requests

**Key files:**
- `src/app/request-account/page.tsx` - Registration form
- `src/app/api/account-requests/route.ts` - Create request API
- `src/app/(internal)/internal/account-requests/page.tsx` - Admin queue
- `src/app/api/account-requests/[id]/approve/route.ts` - Approval API
- `src/app/api/account-requests/[id]/reject/route.ts` - Rejection API

---

#### Password Reset Flow
**Status:** Complete
**Implemented:** 2026-01-18

**What it does:**
- Forgot password page (enter email)
- Generates secure token (1 hour expiry)
- Reset password page (set new password)
- Works for both staff and customer users
- No email enumeration (same message regardless)

**Key files:**
- `src/app/forgot-password/page.tsx` - Enter email
- `src/app/reset-password/page.tsx` - Set new password
- `src/app/api/auth/forgot-password/route.ts` - Generate token
- `src/app/api/auth/reset-password/route.ts` - Reset password

---

#### Security Features
**Status:** Complete
**Implemented:** 2026-01-18

**What it does:**
- Rate limiting via LoginAttempt table (5 per 15 min)
- Password strength validation (12+ chars, mixed case, number, symbol)
- Common password blocking (top 10,000)
- Device tracking for new device alerts
- Session timeout warning (5 min before expiry)
- Cookie consent banner (POPIA compliance)

**Key files:**
- `src/lib/password-validation.ts` - Password strength checker
- `src/lib/device-tracking.ts` - Device fingerprinting
- `src/components/session-timeout-warning.tsx` - Timeout modal
- `src/components/cookie-consent.tsx` - POPIA banner
- `src/app/privacy-policy/page.tsx` - Privacy policy

---

#### Staff Authentication
**Status:** Complete
**Implemented:** 2026-01-18

**What it does:**
- Email/password login for staff members
- Role-based access (Admin, Sales, Machine Shop, Warehouse, Design, Driver)
- JWT session management
- Protected routes via middleware

**Key files:**
- `src/lib/auth.ts` - NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts` - Auth API
- `src/app/login/page.tsx` - Login page
- `src/app/(internal)/layout.tsx` - Protected layout

---

#### Pricing Engine
**Status:** Complete
**Implemented:** 2026-01-18

**What it does:**
- Calculates prices for imported products (EUR → ZAR with freight and margin)
- Calculates prices for manufactured products (materials + machine time + labor)
- Calculates prices for assembled products (BOM + assembly labor)
- Applies tier discounts (End User 30%, OEM 40%, Distributor 50%)

**Key files:**
- `src/lib/pricing/calculator.ts` - Main calculation logic
- `src/lib/pricing/types.ts` - TypeScript interfaces
- `src/lib/pricing/rules.ts` - Rule matching logic

**Calculation Flow (Imported):**
```
Supplier EUR → Dealer Discount → ZAR Conversion → Freight → Margin → List Price → Tier Prices
```

---

#### Price List Import
**Status:** Complete
**Implemented:** 2026-01-18

**What it does:**
- Parses Excel (.xlsx, .xls) and CSV files
- Auto-detects column mapping from headers
- Converts Tecom SKUs to Nusaf SKUs (C020080271 → 1200-80271)
- Reports errors and warnings

**Key files:**
- `src/lib/import/price-list-importer.ts` - Import logic
- `src/lib/utils.ts` - SKU conversion functions

---

#### Internal Dashboard
**Status:** Complete
**Implemented:** 2026-01-18

**Pages:**
| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/internal` | Overview with quick stats |
| Products | `/internal/products` | Product catalog management |
| Pricing | `/internal/pricing` | System config, rules |
| Price Lists | `/internal/price-lists` | Import and manage |
| Quotes | `/internal/quotes` | Quote management |
| Customers | `/internal/customers` | Customer accounts |
| Job Cards | `/internal/job-cards` | Production tracking |
| Settings | `/internal/settings` | Suppliers, rates |

---

## Directory Structure

```
src/
├── app/
│   ├── (internal)/              # Protected staff area
│   │   ├── internal/
│   │   │   ├── page.tsx         # Dashboard
│   │   │   ├── products/        # Product management
│   │   │   ├── pricing/         # Pricing config
│   │   │   ├── price-lists/     # Price list import
│   │   │   ├── quotes/          # Quote management
│   │   │   ├── customers/       # Customer management
│   │   │   ├── job-cards/       # Production tracking
│   │   │   └── settings/        # System settings
│   │   └── layout.tsx           # Auth-protected layout
│   ├── api/
│   │   └── auth/[...nextauth]/  # Auth API
│   ├── login/                   # Login page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Public homepage
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   └── index.ts
│   ├── internal-nav.tsx         # Internal navigation
│   └── providers.tsx            # Context providers
└── lib/
    ├── auth.ts                  # NextAuth config
    ├── db.ts                    # Prisma client
    ├── utils.ts                 # Utilities + SKU conversion
    ├── pricing/
    │   ├── calculator.ts        # Pricing calculations
    │   ├── types.ts             # Type definitions
    │   ├── rules.ts             # Rule matching
    │   └── index.ts
    └── import/
        ├── price-list-importer.ts
        └── index.ts

prisma/
├── schema.prisma                # Database schema
└── seed.ts                      # Seed script
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| users | Staff authentication |
| customer_users | Customer user accounts (multiple per customer) |
| password_reset_tokens | Password reset tokens |
| account_requests | Pending customer registrations |
| login_attempts | Rate limiting tracking |
| known_devices | Device fingerprints for alerts |
| suppliers | Tecom, Regina, Chiaravalli |
| price_lists | Supplier price lists |
| price_list_items | Individual price list entries |
| price_list_approvals | Approval workflow |
| categories | Product categories |
| products | Product catalog |
| boms | Bill of materials |
| bom_items | BOM components |
| pricing_rules | Category/brand margins |
| machine_rates | Machine/labor rates |
| system_config | Global settings |
| customers | B2B customers |
| customer_addresses | Customer addresses |
| quotes | Quote headers |
| quote_items | Quote line items |
| orders | Orders (synced to Odoo) |
| job_cards | Production job cards |
| job_card_items | Job card line items |
| job_card_bom_picking | BOM picking tracking |
| job_card_operations | Machine operations |
| custom_parts | Custom machined parts |

---

## API Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/auth/signin` | Staff/customer login | No |
| POST | `/api/auth/signout` | Logout | Yes |
| GET | `/api/auth/session` | Get session | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |
| POST | `/api/auth/change-password` | Change password (logged in) | Yes |
| POST | `/api/account-requests` | Create account request | No |
| GET | `/api/account-requests` | List account requests | Admin |
| POST | `/api/account-requests/[id]/approve` | Approve request | Admin |
| POST | `/api/account-requests/[id]/reject` | Reject request | Admin |

*More API endpoints to be added in Phase 2+*

---

## Shared Components / Utilities

| Component/Utility | Purpose | Location |
|-------------------|---------|----------|
| Button | Primary UI button | `src/components/ui/button.tsx` |
| Input | Form input field | `src/components/ui/input.tsx` |
| Card | Content container | `src/components/ui/card.tsx` |
| Table | Data tables | `src/components/ui/table.tsx` |
| Badge | Status indicators | `src/components/ui/badge.tsx` |
| cn() | Tailwind class merge | `src/lib/utils.ts` |
| formatCurrency() | Currency formatting | `src/lib/utils.ts` |
| tecomToNusafSku() | SKU conversion | `src/lib/utils.ts` |
| PricingCalculator | Price calculations | `src/lib/pricing/calculator.ts` |

---

## Environment & Configuration

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| NEXTAUTH_SECRET | Session encryption key | Yes |
| NEXTAUTH_URL | App URL for auth callbacks | Yes |
| NODE_ENV | Environment (development/production) | No |

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `next.config.js` | Next.js configuration |
| `postcss.config.js` | PostCSS plugins |
| `prisma/schema.prisma` | Database schema |
| `.env` | Environment variables (not committed) |
| `.env.example` | Example environment file |

---

## How to Run

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Set up database (requires PostgreSQL running)
npx prisma db push

# Seed initial data
npm run db:seed

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Default Credentials (from seed)
- **Admin:** admin@nusaf.co.za / admin123
- **Sales:** sales@nusaf.co.za / sales123

---

## Recent Changes

| Date | Change | Files Affected |
|------|--------|----------------|
| 2026-01-18 | Login System Revision | 20+ files (auth, tests, components) |
| 2026-01-18 | Phase 1: Foundation + Pricing Engine | All source files |
| 2026-01-17 | Workflow v2.3 (code simplicity) | CLAUDE.md |
| 2026-01-17 | Initial project setup | Documentation files |

---

*Last updated: 2026-01-18*
