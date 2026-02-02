# Current Session

## Active Task
[TASK-015] Public Website Homepage

## Status
IN_PROGRESS | 0% complete

## Overview
Build a public marketing website for Nusaf Dynamic Technologies at `www.nusaf.net` with a guest quote basket system. The homepage showcases products, establishes credibility, and generates leads through quote requests.

## Micro-tasks
### Phase 1: Foundation
- [ ] MT-1: Create (website) route group
- [ ] MT-2: Update middleware for website routing
- [ ] MT-3: Create website layout components

### Phase 2: Homepage Sections
- [ ] MT-4: Create HeroSection
- [ ] MT-5: Create ValuePropsSection
- [ ] MT-6: Create ProductCategoriesSection
- [ ] MT-7: Create TrustedBySection
- [ ] MT-8: Create CTABannerSection

### Phase 3: Guest Quote Basket
- [ ] MT-9: Create GuestQuoteStore
- [ ] MT-10: Create GuestQuoteBasket header widget
- [ ] MT-11: Create QuoteRequestModal
- [ ] MT-12: Create QuoteRequest API endpoint
- [ ] MT-13: Wire up guest quote basket to header

### Phase 4: Integration & Polish
- [ ] MT-14: Compose homepage with all sections
- [ ] MT-15: Create shared UI components (Button, Container)
- [ ] MT-16: Responsive polish and testing

## Files Created
(none yet)

## Files Modified
(none yet)

## Decisions Made
- Architecture: (website) route group in existing frontend app
- Hostname routing via middleware (www.nusaf.net → website, app.nusaf.net → portal)
- Guest quote basket uses localStorage + Zustand
- Products shown WITHOUT prices on public site
- QuoteRequest model already exists in schema

## Next Steps
1. MT-1: Create frontend/src/app/(website)/layout.tsx
2. MT-1: Create frontend/src/app/(website)/page.tsx with placeholder content

## Context for Next Session
- Plan approved and saved at: C:\Users\Guido\.claude\plans\velvety-hopping-sifakis.md
- Skills read: domain/website-design, domain/brand-identity
- QuoteRequest model exists at schema.prisma:736-759
- Middleware at frontend/src/middleware.ts handles hostname routing
