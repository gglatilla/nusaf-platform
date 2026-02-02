# Current Session

## Active Task
[TASK-020] Purchase Orders [Procurement, Backend]

## Status
IN_PROGRESS | 80% complete

## Micro-tasks
- [x] MT-1: Add PURCHASER role and PO schema to Prisma
- [x] MT-2: Run migration (via direct SQL)
- [x] MT-3: Create validation schemas
- [x] MT-4: Create purchase order service — Core CRUD
- [x] MT-5: Create purchase order service — Lines
- [x] MT-6: Create purchase order service — Workflow
- [ ] MT-7: Add PDF generation (pdfkit) — DEFERRED
- [ ] MT-8: Add email service (nodemailer) — DEFERRED
- [x] MT-9: Create purchase order service — Send to supplier (status update only)
- [x] MT-10: Create API routes — CRUD
- [x] MT-11: Create API routes — Lines
- [x] MT-12: Create API routes — Workflow
- [x] MT-13: Register routes in index.ts
- [ ] MT-14: Write tests — OPTIONAL

## Files Created
- backend/src/utils/validation/purchase-orders.ts
- backend/src/services/purchase-order.service.ts
- backend/src/api/v1/purchase-orders/route.ts

## Files Modified
- backend/prisma/schema.prisma (PURCHASER role, PO models)
- backend/src/index.ts (registered PO routes)

## Decisions Made
- PO Number Format: PO-2025-00001 (year-based sequential)
- PDF Export: Yes, with "Send to Supplier" email action
- Approval: No approval for ADMIN/MANAGER, PURCHASER needs approval
- Currency: Inherited from supplier

## Context
Plan approved. Starting with MT-1: Add PURCHASER role and PO schema.
