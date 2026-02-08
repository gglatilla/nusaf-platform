# Current Session

## Active Task
ERP Remediation — Execution Plan (38 tasks across 6 phases)

## Status
Phase 1A COMPLETE. Phase 1B started — T7 COMPLETE, T8 next.

## Completed This Session
- [x] T1-T5: Phase 1A Quick Wins (prior session)
- [x] T6: Order warehouse auto-selection from company (2026-02-08)
- [x] T7: Payment recording schema + service + API (2026-02-08)

## What Was Done

### T6: Order warehouse auto-selection from company
- Modified `createOrderFromQuote()` in order.service.ts line 288-298
- Added company lookup for `primaryWarehouse` before defaulting to JHB
- Priority chain: `options?.warehouse` → `company.primaryWarehouse` → `'JHB'`
- Minimal change — no UI needed

### T7: Payment recording schema + service + API (LARGE task)
- **Schema** (prisma/schema.prisma):
  - Added `Payment` model (paymentNumber PAY-YYYY-NNNNN, orderId, companyId, amount, method, reference, date, status)
  - Added `PaymentCounter` model for atomic number generation
  - Added `PaymentMethod` enum (EFT, CREDIT_CARD, CASH, CHEQUE, OTHER)
  - Added `PaymentStatus` enum (PENDING, CONFIRMED, VOIDED)
  - Added `OrderPaymentStatus` enum (UNPAID, PARTIALLY_PAID, PAID)
  - Added `paymentStatus` field to SalesOrder (default UNPAID)
  - Added `payments` relation to SalesOrder and Company
- **Service** (backend/src/services/payment.service.ts — NEW):
  - `generatePaymentNumber()` — atomic PAY-YYYY-NNNNN
  - `calculatePaymentStatus()` — sums confirmed payments vs order total
  - `syncOrderPaymentStatus()` — updates cached field on order
  - `recordPayment()` — validates balance, creates payment, syncs status
  - `getPaymentsByOrder()`, `getPaymentById()` — queries
  - `voidPayment()` — voids and recalculates
- **Validation** (backend/src/utils/validation/payments.ts — NEW):
  - `recordPaymentSchema` — amount, method, reference, date, notes
  - `voidPaymentSchema` — reason
- **API Routes** (added to backend/src/api/v1/orders/route.ts):
  - `POST /orders/:id/payments` — ADMIN/MANAGER/SALES
  - `GET /orders/:id/payments` — all auth (customer-safe: strips internal fields)
  - `GET /orders/payments/:paymentId` — detail with company isolation
  - `POST /orders/payments/:paymentId/void` — ADMIN/MANAGER only
- **Fulfillment Gate** (backend/src/services/orchestration.service.ts):
  - `generateFulfillmentPlan()` now blocks if `order.paymentStatus !== 'PAID'`
- **Order API updates** (backend/src/services/order.service.ts):
  - `getOrderById()` now returns `paymentStatus`
  - `getOrders()` list now returns `paymentStatus`
- **Database**: Schema pushed, db reset + re-seeded (dev only)

## Decisions Made
- T7: Payment status defaults to CONFIRMED (not PENDING) since staff are recording already-received payments
- T7: Balance validation prevents overpayment (amount <= balance remaining)
- T7: Fulfillment gate is a HARD block — no plan generation without PAID status
- T7: Customer portal payment list strips voided payments and internal fields (Golden Rule 4)
- Database was reset with `--force-reset` due to pricing_rules constraint conflict, then re-seeded

## Files Modified This Session
- `backend/src/services/order.service.ts` (T6 warehouse lookup, T7 paymentStatus in responses)
- `backend/prisma/schema.prisma` (T7 Payment model, enums, SalesOrder paymentStatus)
- `backend/src/services/payment.service.ts` (T7 — new file)
- `backend/src/utils/validation/payments.ts` (T7 — new file)
- `backend/src/api/v1/orders/route.ts` (T7 payment routes)
- `backend/src/services/orchestration.service.ts` (T7 fulfillment gate)
- `.claude/plans/execution-progress.md` (tracking)

## Next Steps (Exact)
1. Start T8: Payment recording UI + fulfillment gate UX
2. Read execution-plan.md for T8 full prompt
3. Build: payments section on staff order detail, record payment modal, payment status badge, fulfillment button gating, customer portal payment info, React Query hooks

## Context for Next Session
- Execution plan: `.claude/plans/execution-plan.md`
- Progress tracker: `.claude/plans/execution-progress.md`
- Workflow: read progress → find first unchecked → read plan → execute → mark done → commit → push → STOP
- User says "go" to proceed to next task
- Git has NUL file issue — use specific file paths in git add, not -A
- Database was reset this session — if production deployment needed, a proper migration must be created
