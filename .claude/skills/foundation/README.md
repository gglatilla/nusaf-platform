# Nusaf Foundation Skills

## Overview

These 10 skills provide Claude Code with engineering best practices for building the Nusaf B2B platform. They cover universal patterns for a lean, self-contained system.

**Architecture**: Your system is the source of truth. No ERP dependency. Add accounting integrations (Xero/QuickBooks) later when revenue justifies.

## Installation

Copy these folders into your Claude Code project:

```
your-project/
├── .claude/
│   ├── CLAUDE.md
│   └── skills/
│       └── foundation/          ← Extract here
│           ├── project-architecture/
│           ├── database-design-b2b/
│           ├── authentication-authorization/
│           ├── api-design-patterns/
│           ├── ui-component-system/
│           ├── testing-strategy/
│           ├── security-best-practices/
│           ├── error-handling-logging/
│           ├── performance-optimization/
│           └── code-quality-standards/
```

---

## Tier 1: Engineering Foundation

| Skill | Purpose | Use When |
|-------|---------|----------|
| **project-architecture** | Folder structure, Railway+Vercel topology, service boundaries | Setting up projects, deciding where code belongs |
| **database-design-b2b** | Audit trails, soft deletes, versioning, full data ownership | Designing schemas, creating migrations |
| **authentication-authorization** | Multi-user types, company isolation, role-based permissions | Implementing login, permissions, access control |
| **api-design-patterns** | RESTful design, versioning, pagination, error responses | Designing endpoints, request/response structures |
| **ui-component-system** | Design tokens, component architecture, forms, tables | Building UI components, establishing patterns |

## Tier 2: Quality & Reliability

| Skill | Purpose | Use When |
|-------|---------|----------|
| **testing-strategy** | Unit/integration/E2E patterns for pricing & config accuracy | Writing tests, setting up test infrastructure |
| **security-best-practices** | Auth security, data protection, POPIA compliance | Implementing security, handling sensitive data |
| **error-handling-logging** | Error hierarchy, structured logging, monitoring | Handling errors, setting up logging |
| **performance-optimization** | Database queries, caching, frontend optimization | Optimizing slow code, scaling issues |
| **code-quality-standards** | Naming conventions, code organization, review standards | Writing maintainable code, code reviews |

---

## Key Patterns Across All Skills

### Your System is Source of Truth
You own everything: customers, products, pricing, quotes, orders, invoices. No external system dependencies for core operations.

### Audit Everything
All business data includes: `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`

### Never Hard Delete
Use soft deletes for all business data.

### Type Safety
TypeScript strict mode, Zod validation, explicit return types. No `any` types allowed.

### Company Isolation
Customer users can only see their own company's data. Enforced at repository level.

---

## Domain Skills (Separate Package)

Business-specific skills are in the **nusaf-domain-skills** package:

| Skill | Purpose |
|-------|---------|
| **brand-identity** | Colours, typography, spacing, design tokens, CSS variables |
| **pricing-product-domain** | Pricing formulas, supplier price list imports, EUR→ZAR conversion |
| **order-fulfillment-operations** | Document flow, locations (JHB/CT/Mbombela), fulfillment workflows |
| **inventory-management** | Stock tracking, soft/hard reservations, BOM-based material planning |
| **multi-tenant-architecture** | Customer tiers (End User/OEM/Distributor), portal features, roles |
| **product-configurator** | Modular chain configuration, SKU generation, BOM calculations |
| **ui-ux-webapp** | Customer portal components, layouts, accessibility |
| **website-design** | Public site structure, product navigation (up to 8 levels deep) |

Install domain skills in: `.claude/skills/domain/`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Railway (Node.js/Python + PostgreSQL) |
| **Frontend** | Vercel (Next.js) |
| **CDN/Storage** | Cloudflare (R2 for documents) |
| **Auth** | Your choice (Clerk, Auth.js, custom) |

---

## Getting Started

1. Extract foundation skills to `.claude/skills/foundation/`
2. Extract domain skills to `.claude/skills/domain/`
3. Create `.claude/CLAUDE.md` referencing skills
4. Start building!

See domain skills README for CLAUDE.md template.
