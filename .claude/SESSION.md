# Current Session

## Active Task
ERP Remediation — Phase 5: Missing ERP Documents — **5.2 COMPLETE**

## Status
Phase 5.2 (Proforma Invoice) COMPLETE | Next: 5.3 (Purchase Requisition)

## Completed Micro-tasks (Session 11)
- [x] 5.2.1 — Schema + Validation + Service (Backend)
- [x] 5.2.2 — PDF Generation
- [x] 5.2.3 — API Routes + Backend Registration + Timeline
- [x] 5.2.4 — Frontend Types + API Methods + Hooks
- [x] 5.2.5 — Staff + Customer UI Integration

## Files Created (Session 11)
- `backend/src/utils/validation/proforma-invoices.ts` — Zod schemas
- `backend/src/services/proforma-invoice.service.ts` — full service layer
- `backend/src/api/v1/proforma-invoices/route.ts` — 5 endpoints
- `frontend/src/hooks/useProformaInvoices.ts` — 4 hooks
- `frontend/src/components/orders/order-detail/ProformaInvoicesSection.tsx` — reusable section

## Files Modified (Session 11)
- `backend/prisma/schema.prisma` — added PI models + enum
- `backend/src/index.ts` — registered proforma-invoices route
- `backend/src/services/pdf.service.ts` — added generateProformaInvoicePDF()
- `backend/src/services/order-timeline.service.ts` — added PI event type + query
- `frontend/src/lib/api.ts` — 5 types + 5 API methods
- `frontend/src/lib/constants/reference-routes.ts` — ProformaInvoice entry
- `frontend/src/components/orders/order-detail/index.ts` — exported ProformaInvoicesSection
- `frontend/src/app/(portal)/orders/[id]/page.tsx` — PI button + section
- `frontend/src/app/(customer)/my/orders/[id]/page.tsx` — PI section for customer

## Key Decisions
- Simple static documents — no status lifecycle (just ACTIVE/VOIDED)
- Order integration only — no dedicated list page or nav item
- CONFIRMED orders only — can generate proforma
- Auto-void previous ACTIVE proforma when creating new one for same order
- Banking details as placeholder in PDF template
- Customers only see ACTIVE proformas, no void capability
- UoM resolved from Product table since SalesOrderLine doesn't store it

## Next Steps
1. Phase 5.3 — Purchase Requisition workflow
2. Phase 5.4 — Return Authorization process
3. Phase 5.5 — Packing List generation

## Context for Next Session
- Progress tracker: `.claude/plans/erp-progress.md`
- Phase 5.2 plan: `.claude/plans/reactive-crunching-firefly.md`
- Phase 5.2 (Proforma Invoice) fully complete, ready for commit
- Next: Phase 5.3 (Purchase Requisition) — needs plan mode for design
