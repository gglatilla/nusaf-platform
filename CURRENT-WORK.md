# Current Work in Progress

> **This file captures the EXACT state of active work so Claude can resume without losing any context.**
> Update this file frequently during work, and always before ending a session.

---

## Status

**IDLE** - Phase 1 complete. Ready for Phase 2 (Marketing Website).

---

## Active Task

None currently.

---

## What We're Working On

Phase 1: Foundation + Pricing Engine is **COMPLETE**. The platform now has:
- Full Next.js 14 application with TypeScript
- Complete database schema for all business entities
- Pricing engine implementing the full calculation flow
- Staff authentication and internal dashboard
- Price list import functionality

---

## Current State

### Last Completed Work
- **Task:** Implement Phase 1: Foundation + Pricing Engine
- **Completed:** 2026-01-18
- **What was done:**
  - Set up Next.js 14 with TypeScript, Tailwind CSS, shadcn/ui style components
  - Created complete Prisma schema (Users, Suppliers, Products, Categories, Pricing Rules, Customers, Quotes, Orders, Job Cards)
  - Built pricing engine with full calculation logic (imported, manufactured, assembled products)
  - Implemented price list import from Excel/CSV with Tecom→Nusaf SKU conversion
  - Created staff authentication with NextAuth.js
  - Built internal dashboard with all pages (Products, Pricing, Price Lists, Quotes, Customers, Job Cards, Settings)
  - Created database seed script with initial data

### Files Modified/Created in This Session
| File | What Changed |
|------|--------------|
| `package.json` | Project dependencies (Next.js, Prisma, NextAuth, etc.) |
| `prisma/schema.prisma` | Complete database schema |
| `prisma/seed.ts` | Initial data seeding script |
| `src/app/**/*` | All application pages |
| `src/components/**/*` | UI components |
| `src/lib/**/*` | Auth, DB, Pricing engine, Import utilities |
| `tsconfig.json`, `tailwind.config.ts`, etc. | Configuration files |

---

## Context & Decisions Made

### Phase 1 Decisions
| Decision | Reasoning |
|----------|-----------|
| Prisma v5 over v7 | v7 has breaking changes, v5 is more stable for current needs |
| Tailwind CSS v3 over v4 | Better compatibility with Next.js 14 PostCSS setup |
| shadcn/ui style components | Built manually for flexibility, no external dependency |
| JWT sessions over database sessions | Simpler setup, works well for staff auth |
| Single pricing calculator class | Clean separation, easy to test and maintain |

---

## Problems & Debugging

No active problems. Build passes successfully.

---

## Immediate Next Steps

**Phase 2: Marketing Website + Public Quoting**

1. Build public marketing website pages (About, Industries, Capabilities, Contact)
2. Create public product catalog (no prices shown)
3. Implement quote basket functionality
4. Build quote request form (lead capture)
5. Create salesperson review queue
6. Generate PDF quotes

---

## Files Claude Should Review When Resuming

### Always Read (part of `nusaf start`)
- `CLAUDE.md` - Commands and rules
- `CURRENT-WORK.md` - This file
- Latest `docs/sessions/*.md`
- `CODEBASE-OVERVIEW.md`

### For Phase 2 Development
- `src/app/(internal)/internal/pricing/page.tsx` - Reference for pricing UI
- `src/lib/pricing/calculator.ts` - Pricing engine for quote calculations
- `prisma/schema.prisma` - Database schema for quotes

---

## Code Snippets / Implementation Notes

### Key Pricing Calculation Flow
```typescript
// For imported products:
// 1. Supplier Price (EUR) → apply dealer discount if gross
// 2. Convert to ZAR (× exchange rate)
// 3. Add freight (× 1.12 sea or × 1.30 air)
// 4. Apply margin (÷ margin factor, e.g., 0.5)
// 5. Calculate list price (÷ 0.60 for OEM anchor)
// 6. Tier prices: List × (1 - tier discount)
```

### Default Login Credentials (from seed)
- Admin: admin@nusaf.co.za / admin123
- Sales: sales@nusaf.co.za / sales123

---

## Questions to Resolve

None currently.

---

## Reminders for Next Session

- Run `npx prisma db push` then `npm run db:seed` to set up database
- Run `npm run dev` to start development server
- Build passes with `npm run build`
- Tests not yet configured (will add in future phase)

---

*Last updated: 2026-01-18*
*Status: IDLE - Phase 1 complete*
