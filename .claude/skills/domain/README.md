# Nusaf Domain Skills

## Overview

These 8 skills provide Claude Code with Nusaf-specific business rules, workflows, and design guidelines. Use alongside the **nusaf-foundation-skills** package.

## Installation

Copy these folders into your Claude Code project:

```
your-project/
├── .claude/
│   ├── CLAUDE.md
│   └── skills/
│       ├── foundation/          ← nusaf-foundation-skills
│       └── domain/              ← Extract here
│           ├── brand-identity/
│           ├── pricing-product-domain/
│           ├── order-fulfillment-operations/
│           ├── inventory-management/
│           ├── multi-tenant-architecture/
│           ├── product-configurator/
│           ├── ui-ux-webapp/
│           └── website-design/
```

---

## Skills Summary

### Brand & Design

| Skill | Purpose | Key Contents |
|-------|---------|--------------|
| **brand-identity** | Visual identity standards | Colours (#2563EB Electric Blue), typography (Inter), spacing, CSS variables, Tailwind config |
| **ui-ux-webapp** | Customer portal UI patterns | Components, layouts, tables, forms, modals, accessibility |
| **website-design** | Public website structure | Page templates, product navigation (8 levels deep), mega menu |

### Business Logic

| Skill | Purpose | Key Contents |
|-------|---------|--------------|
| **pricing-product-domain** | Pricing engine | Formula: Gross/Net → Discount → EUR/ZAR → Freight → Margin → 40% markup. Supplier imports, price publishing |
| **order-fulfillment-operations** | Document workflow | Quote → PO → Sales Order → Picking → Job Card → Invoice → Dispatch. Locations: JHB, CT, Mbombela |
| **inventory-management** | Stock control | Soft/hard reservations, BOM-based material planning, auto-reordering, batch/serial tracking |
| **multi-tenant-architecture** | Customer portal | Tiers: End User (30%), OEM (40%), Distributor (50%). Roles: Viewer, Buyer, Admin |
| **product-configurator** | Chain builder | 2100 series modular chain, SKU generation, BOM calculations, attachment rules |

---

## Key Business Rules

### Pricing Formula (Imported Products)
```
Supplier Price (Gross or Net)
  → IF Gross: Apply discount % = Net Price
  → × EUR/ZAR Exchange Rate = ZAR Value
  → × Freight % = Landed Cost
  → ÷ Margin Divisor = Cost + Margin
  → × 1.40 (always 40%) = List Price
```

### Customer Pricing Tiers
| Tier | Discount off List |
|------|------------------|
| End User | 30% |
| OEM/Reseller | 40% |
| Distributor | 50% |

### Locations
| Location | Warehouse | Manufacturing | Sales |
|----------|-----------|---------------|-------|
| Johannesburg | ✓ (main) | ✓ | ✓ |
| Cape Town | ✓ (finished only) | ✗ | ✓ |
| Mbombela | ✗ | ✗ | ✓ |

### Suppliers
- **Chiaravalli** — Use their SKUs as Nusaf SKUs
- **Regina** — Use their SKUs as Nusaf SKUs  
- **Tecom** — Complex SKU conversion (C/L prefix rules)
- **Local** — Manufacturing, ZAR cost prices

---

## Brand Identity Quick Reference

### Colours
| Name | Hex | Usage |
|------|-----|-------|
| White | #FFFFFF | Primary background |
| Snow | #F8FAFC | Secondary background |
| Electric Blue | #2563EB | Primary actions, links |
| Ink | #0F172A | Headings, dark sidebar |
| Charcoal | #334155 | Body text |
| Steel | #64748B | Secondary text |

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: 700 weight, Ink colour
- **Body**: 400 weight, Charcoal colour

---

## CLAUDE.md Template

Create `.claude/CLAUDE.md` in your project root:

```markdown
# Nusaf Platform

## Project Context
B2B web application for Nusaf Dynamic Technologies.
- Conveyor components, power transmission, industrial supplies
- South Africa based (JHB HQ, Cape Town, Mbombela)
- Suppliers: Chiaravalli, Regina, Tecom (Italy), Local manufacturing

## Skills Location
Skills are in `.claude/skills/`:
- `foundation/` — Engineering best practices (10 skills)
- `domain/` — Business rules and design (8 skills)

## Before Starting Any Task
1. Read relevant skills for the task
2. Follow patterns established in skills
3. Ask if unclear about business rules

## Key Skills by Task

**Database/Schema**: foundation/database-design-b2b
**API Endpoints**: foundation/api-design-patterns
**Authentication**: foundation/authentication-authorization
**Pricing Logic**: domain/pricing-product-domain
**Orders/Quotes**: domain/order-fulfillment-operations
**Stock/Inventory**: domain/inventory-management
**Customer Portal UI**: domain/ui-ux-webapp, domain/brand-identity
**Public Website**: domain/website-design, domain/brand-identity
**Chain Configurator**: domain/product-configurator

## Tech Stack
- Backend: Node.js + PostgreSQL on Railway
- Frontend: Next.js on Vercel
- Storage: Cloudflare R2
- Styling: Tailwind CSS
```

---

## Getting Started

1. Install both skill packages
2. Create `.claude/CLAUDE.md` using template above
3. Reference skills as you build each feature
4. Follow brand-identity for all UI work
