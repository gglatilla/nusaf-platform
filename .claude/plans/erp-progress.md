# ERP Remediation Progress Tracker

## Current Phase: Phase 5 — Missing ERP Documents — COMPLETE
## Current Micro-Task: 5.5 — COMPLETE (Packing List)
## Status: Phase 5 COMPLETE. All 5 ERP documents built. Next is Phase 6 (Reports & Analytics)
## Next Micro-Task: 6.1 — Sales reports

---

## Last Session Notes
### Session 14 — Phase 5 Micro-Task 5.5 (2026-02-08)
**Micro-task 5.5 — Packing List Generation (all 5 sub-tasks)**
**Result: COMPLETE — Both backend and frontend compile cleanly**

**What was done:**

**5.5.1 — Schema + Validation + Service (Backend)**
- Added `PackingListStatus` enum (DRAFT, FINALIZED, CANCELLED), `PackageType` enum (BOX, PALLET, CRATE, ENVELOPE, TUBE, OTHER)
- Added `PackingList`, `PackingListLine`, `PackingListPackage`, `PackingListCounter` models to Prisma schema
- Created `validation/packing-lists.ts` with Zod schemas (create with line→package cross-validation refinement, list query)
- Created `packing-list.service.ts` with: generate number (PL-YYYY-NNNNN), create from order, get/list/for-order, update draft, finalize, cancel

**5.5.2 — PDF Generation + API Routes**
- Added `generatePackingListPDF()` to pdf.service.ts (A4, teal branding, package summary table, items grouped by package, weight totals, handling instructions)
- Created 8 endpoints in `packing-lists/route.ts` (GET list, GET for-order, GET pdf, GET detail, POST create, PUT update, POST finalize, POST cancel)
- Customer field stripping on GET /:id (strips notes, createdBy, finalizedBy, handlingInstructions)
- Registered route in `index.ts`
- Added PACKING_LIST_CREATED and PACKING_LIST_FINALIZED timeline events to order-timeline.service.ts

**5.5.3 — Frontend Types + API Methods + Hooks**
- Added ~15 types to api.ts (PackingListStatus, PackageType, PackingList, PackingListLine, PackingListPackage, etc.)
- Added 8 API methods to ApiClient class (including blob download for PDF)
- Created `usePackingLists.ts` with 8 hooks
- Added `PackingList: '/packing-lists'` to reference-routes.ts

**5.5.4 — Frontend Staff Pages (List + Detail + Create + Edit)**
- Created `PackingListStatusBadge` component (DRAFT slate, FINALIZED green, CANCELLED red)
- Added "Packing Lists" to `mainNavigation` (Boxes icon, ADMIN/MANAGER/SALES/WAREHOUSE)
- List page: status tabs, location filter, table (PL#, Order#, Customer, Location, Packages, Items, Status, Created)
- Detail page: pipeline steps (Draft→Finalized), shipment info grid, package cards (type/dimensions/weight), items grouped by package, handling instructions (amber), notes, sidebar audit trail, action buttons (Edit/Finalize/Download PDF/Cancel)
- Create page: order selection, package definition (add/remove, type/dimensions/weight), line item assignment (from order, assign to packages), handling instructions, notes, summary sidebar
- Edit page: pre-populated from existing data, same form as create, DRAFT only guard

**5.5.5 — Order Detail Integration + Customer Access**
- Created `PackingListsSection` component with PDF download for FINALIZED packing lists
- Exported from `order-detail/index.ts` barrel
- Staff order detail: added PackingListsSection + "Packing List" button (cyan, Boxes icon) when READY_TO_SHIP/PARTIALLY_SHIPPED/SHIPPED
- Customer order detail: shows only FINALIZED packing lists with PDF download

**Golden Rules Verification:**
- Rule 1: N/A (informational document, no stock changes)
- Rule 2: PASS (orderId + optional deliveryNoteId linked)
- Rule 3: PASS (detail at /[id], create at /new, edit at /[id]/edit)
- Rule 4: PASS (customers only see FINALIZED; notes, createdBy, finalizedBy, handlingInstructions stripped)
- Rule 5: PASS (staff sees all fields, linked docs, packages, weights, audit)
- Rule 6: N/A (no order status change)
- Rule 7: PASS (forms load data, refs clickable, timeline events)
- Rule 8: PASS (warehouse creates, sales views, customer downloads PDF, manager cancels)

**Files created (10):**
- `backend/src/utils/validation/packing-lists.ts`
- `backend/src/services/packing-list.service.ts`
- `backend/src/api/v1/packing-lists/route.ts`
- `frontend/src/hooks/usePackingLists.ts`
- `frontend/src/components/packing-lists/PackingListStatusBadge.tsx`
- `frontend/src/components/orders/order-detail/PackingListsSection.tsx`
- `frontend/src/app/(portal)/packing-lists/page.tsx`
- `frontend/src/app/(portal)/packing-lists/[id]/page.tsx`
- `frontend/src/app/(portal)/packing-lists/new/page.tsx`
- `frontend/src/app/(portal)/packing-lists/[id]/edit/page.tsx`

**Files modified (10):**
- `backend/prisma/schema.prisma` — added 2 enums, 4 models
- `backend/src/index.ts` — registered packing-lists route
- `backend/src/services/pdf.service.ts` — added generatePackingListPDF()
- `backend/src/services/order-timeline.service.ts` — added PL event types + queries
- `frontend/src/lib/api.ts` — added ~15 types + 8 API methods
- `frontend/src/lib/navigation.ts` — added Packing Lists nav item
- `frontend/src/lib/constants/reference-routes.ts` — added PackingList entry
- `frontend/src/components/orders/order-detail/index.ts` — exported PackingListsSection
- `frontend/src/app/(portal)/orders/[id]/page.tsx` — added PL section + "Packing List" button
- `frontend/src/app/(customer)/my/orders/[id]/page.tsx` — added PL section (customer view)

### Session 13 — Phase 5 Micro-Task 5.4 (2026-02-07)
**Micro-task 5.4 — Return Authorization Process (all 5 sub-tasks)**
**Result: COMPLETE — Both backend and frontend compile cleanly**

**What was done:**

**5.4.1 — Schema + Validation + Service (Backend)**
- Added `RETURN` to `StockMovementType` enum
- Added `ReturnAuthorizationStatus`, `ReturnReason`, `ReturnResolution` enums to Prisma schema
- Added `ReturnAuthorization`, `ReturnAuthorizationLine`, `ReturnAuthorizationCounter` models
- Created `validation/return-authorizations.ts` with Zod schemas (create with orderId/dnId refinement, reject, receive items, complete, list query)
- Created `return-authorization.service.ts` with: generate RA number, create (auto-approve for staff), get/list/for-order, approve, reject, receive items, complete (with stock impact), cancel

**5.4.2 — API Routes + Backend Registration**
- Created 9 endpoints in `return-authorizations/route.ts` (GET list, GET for-order, GET detail, POST create, POST approve, POST reject, POST receive-items, POST complete, POST cancel)
- Customer field stripping on GET /:id (strips notes, warehouse, staff names, rejection details)
- Registered route in `index.ts`

**5.4.3 — Frontend Types + API Methods + Hooks**
- Added ~15 types to api.ts (ReturnAuthorizationStatus, ReturnReason, ReturnResolution, ReturnAuthorizationLine, ReturnAuthorization, etc.)
- Added 9 API methods to ApiClient class
- Created `useReturnAuthorizations.ts` with 9 hooks (including cache invalidation for stockLevels/stockMovements on complete)
- Added `ReturnAuthorization: '/return-authorizations'` to reference-routes.ts

**5.4.4 — Frontend Staff Pages (List + Detail + Create)**
- Created `ReturnAuthorizationStatusBadge` component (6 status colors)
- Added "Returns" to `mainNavigation` (RotateCcw icon, ADMIN/MANAGER/SALES/WAREHOUSE)
- List page: status tabs, search, table with RA#/Order#/Customer/Status/Requester/Lines/Qty/Warehouse/Date
- Detail page: pipeline steps (Requested→Approved→Items Received→Completed), status banners, info grid, lines table, sidebar with notes + audit timeline, 3 action modals (reject reason, receive per-line qty, complete per-line resolution)
- Create page: parent document selection (order/DN), auto-populate lines, warehouse selector, per-line qty/reason/notes

**5.4.5 — Customer Portal + Navigation + Integration**
- Customer list page at `/my/returns` with status tabs, simple table
- Customer detail page at `/my/returns/[id]` with status-specific messaging, cancel button
- Customer create page at `/my/returns/new` with delivered order selection, item checkboxes, per-line qty/reason
- Added "Returns" to `customerNavigation` (RotateCcw icon)
- Created `ReturnAuthorizationsSection` component for order detail integration
- Integrated into staff order detail: RA section + "Request Return" button (SHIPPED/DELIVERED)
- Integrated into customer order detail: RA section + "Request Return" button (DELIVERED)
- Exported `ReturnAuthorizationsSection` from order-detail barrel index

**Stock Impact (completeReturnAuthorization):**
- RESTOCK: `updateStockLevel(+onHand)` + `createStockMovement(RETURN)` with referenceType='ReturnAuthorization'
- SCRAP: `createStockMovement(SCRAP)` — audit trail only, no onHand change
- REPLACE: no movement (new DN created separately)

**Golden Rules Verification:**
- Rule 1: PASS (RESTOCK creates RETURN movement, SCRAP creates SCRAP movement)
- Rule 2: PASS (RA links to order and/or delivery note)
- Rule 3: PASS (detail is read-only view, create is separate form at /new)
- Rule 4: PASS (customer sees no internal data — no notes, warehouse, staff names, rejection details)
- Rule 5: PASS (staff sees all fields, linked docs, audit trail)
- Rule 6: N/A (RA completion updates stock but doesn't change order status)
- Rule 7: PASS (data loading, role-based visibility, clickable links, audit trail)
- Rule 8: PASS (customer requests, warehouse receives, manager approves/completes, sales views)

**Files created (12):**
- `backend/src/utils/validation/return-authorizations.ts`
- `backend/src/services/return-authorization.service.ts`
- `backend/src/api/v1/return-authorizations/route.ts`
- `frontend/src/hooks/useReturnAuthorizations.ts`
- `frontend/src/components/return-authorizations/ReturnAuthorizationStatusBadge.tsx`
- `frontend/src/components/orders/order-detail/ReturnAuthorizationsSection.tsx`
- `frontend/src/app/(portal)/return-authorizations/page.tsx`
- `frontend/src/app/(portal)/return-authorizations/[id]/page.tsx`
- `frontend/src/app/(portal)/return-authorizations/new/page.tsx`
- `frontend/src/app/(customer)/my/returns/page.tsx`
- `frontend/src/app/(customer)/my/returns/[id]/page.tsx`
- `frontend/src/app/(customer)/my/returns/new/page.tsx`

**Files modified (9):**
- `backend/prisma/schema.prisma` — added 3 enums, 3 models, RETURN to StockMovementType
- `backend/src/index.ts` — registered return-authorizations route
- `frontend/src/lib/api.ts` — added ~15 types + 9 API methods
- `frontend/src/lib/navigation.ts` — added Returns nav item (staff)
- `frontend/src/lib/customer-navigation.ts` — added Returns nav item (customer)
- `frontend/src/lib/constants/reference-routes.ts` — added ReturnAuthorization entry
- `frontend/src/components/orders/order-detail/index.ts` — exported ReturnAuthorizationsSection
- `frontend/src/app/(portal)/orders/[id]/page.tsx` — added RA section + "Request Return" button
- `frontend/src/app/(customer)/my/orders/[id]/page.tsx` — added RA section + "Request Return" button

### Session 12 — Phase 5 Micro-Task 5.3 (2026-02-07)
**Micro-task 5.3 — Purchase Requisition Workflow (all 5 sub-tasks)**
**Result: COMPLETE — Both backend and frontend compile cleanly**

**What was done:**

**5.3.1 — Schema + Validation + Service (Backend)**
- Added `PurchaseRequisitionStatus` enum, `PurchaseRequisition`, `PurchaseRequisitionLine`, `PurchaseRequisitionCounter` models to Prisma schema
- Created `validation/purchase-requisitions.ts` with Zod schemas (create, reject, list query)
- Created `purchase-requisition.service.ts` with: generate number, create, get/list, approve (auto-creates draft POs grouped by supplier), reject, cancel
- Self-approval prevention: creator cannot approve their own PR
- Cancel restriction: only the original requester can cancel

**5.3.2 — API Routes + Backend Registration**
- Created 6 endpoints in `purchase-requisitions/route.ts` (GET list, GET detail, POST create, POST approve, POST reject, POST cancel)
- All staff roles can create PRs; ADMIN/MANAGER only for approve/reject
- Registered route in `index.ts`

**5.3.3 — Frontend Types + API Methods + Hooks**
- Added 10 types to api.ts (PurchaseRequisition, PurchaseRequisitionLine, PurchaseRequisitionListItem, etc.)
- Added 6 API methods to ApiClient class
- Created `usePurchaseRequisitions.ts` with 6 hooks
- Added `PurchaseRequisition: '/purchase-requisitions'` to reference-routes.ts

**5.3.4 — Frontend Pages (List + Detail + Create)**
- List page: status tabs, urgency filter, PR# links, status/urgency badges, pagination
- Detail page: status banners (PENDING amber, CONVERTED green, REJECTED red, CANCELLED gray), info grid, line items table with clickable product links, estimated total, approval workflow (approve/reject buttons, reject form, self-approval warning), generated POs section with links
- Create page: reason (required), urgency, department, required-by date, notes, product search with auto-fill supplier/cost, editable line items (qty, unit cost, location), estimated total, submit

**5.3.5 — Status Badge + Navigation**
- Created `PurchaseRequisitionStatusBadge` component
- Added "Requisitions" to `procurementNavigation` (FileInput icon, all staff roles)

**Golden Rules Verification:**
- Rule 1: N/A (no stock changes)
- Rule 2: PASS (PR links to PO(s) via generatedPOIds, PO.internalNotes references PR number)
- Rule 3: PASS (detail is read-only view, create is separate form at /new)
- Rule 4: N/A (internal document, customers never see)
- Rule 5: PASS (staff sees requester, urgency, lines, approval, linked POs)
- Rule 6: PASS (approval creates draft PO(s) grouped by supplier)
- Rule 7: PASS (data loading, role-based visibility, clickable links, audit trail)
- Rule 8: PASS (warehouse creates, purchaser creates, manager approves, PO auto-created)

**Files created (8):**
- `backend/src/utils/validation/purchase-requisitions.ts`
- `backend/src/services/purchase-requisition.service.ts`
- `backend/src/api/v1/purchase-requisitions/route.ts`
- `frontend/src/hooks/usePurchaseRequisitions.ts`
- `frontend/src/components/purchase-requisitions/PurchaseRequisitionStatusBadge.tsx`
- `frontend/src/app/(portal)/purchase-requisitions/page.tsx`
- `frontend/src/app/(portal)/purchase-requisitions/[id]/page.tsx`
- `frontend/src/app/(portal)/purchase-requisitions/new/page.tsx`

**Files modified (5):**
- `backend/prisma/schema.prisma` — added PR models + enum + counter
- `backend/src/index.ts` — registered purchase-requisitions route
- `frontend/src/lib/api.ts` — added 10 PR types + 6 API methods
- `frontend/src/lib/navigation.ts` — added Requisitions nav item (FileInput icon)
- `frontend/src/lib/constants/reference-routes.ts` — added PurchaseRequisition entry

### Session 11 — Phase 5 Micro-Task 5.2 (2026-02-07)
**Micro-task 5.2 — Proforma Invoice Generation from Sales Order (all 5 sub-tasks)**
**Result: COMPLETE — Both backend and frontend compile cleanly**

**What was done:**

**5.2.1 — Schema + Validation + Service (Backend)**
- Added `ProformaInvoiceStatus` enum, `ProformaInvoice`, `ProformaInvoiceLine`, `ProformaInvoiceCounter` models to Prisma schema
- Created `validation/proforma-invoices.ts` with Zod schemas (create, void)
- Created `proforma-invoice.service.ts` with generate number, create from order, get/list-for-order, void
- Auto-voids previous ACTIVE proforma when creating new one for same order
- Snapshots order data, lines with pricing, billing address, customer PO

**5.2.2 — PDF Generation**
- Added `generateProformaInvoicePDF()` to `pdf.service.ts`
- Professional A4 PDF: header bar, "PROFORMA INVOICE" title, customer/order info, line items table, totals (subtotal + VAT + total), payment terms, banking details (placeholder), "THIS IS NOT A TAX INVOICE" disclaimer, footer
- Follows existing PO PDF brand styling (Nusaf teal, Helvetica fonts)

**5.2.3 — API Routes + Backend Registration + Timeline**
- Created 5 endpoints in `proforma-invoices/route.ts` (GET for-order, GET detail, GET pdf, POST create, POST void)
- PDF endpoint streams binary PDF with Content-Disposition header
- Customer role gets internal fields stripped (notes, createdBy, voidedBy, voidReason) + only sees ACTIVE proformas
- Registered route in `index.ts`
- Added `PROFORMA_INVOICE_CREATED` timeline event type + proforma invoice query to order-timeline.service.ts

**5.2.4 — Frontend Types + API Methods + Hooks**
- Added 5 types to api.ts (ProformaInvoice, ProformaInvoiceLine, ProformaInvoiceSummary, etc.)
- Added 5 API methods to ApiClient class (including blob download for PDF)
- Created `useProformaInvoices.ts` with 4 hooks (useProformaInvoicesForOrder, useCreateProformaInvoice, useVoidProformaInvoice, useDownloadProformaInvoicePDF)
- Added `ProformaInvoice: '/orders'` to reference-routes.ts

**5.2.5 — Staff + Customer UI Integration**
- Created `ProformaInvoicesSection` component with:
  - List of proformas with status badges (Active green / Voided gray strikethrough)
  - Download PDF button per proforma
  - Void button with confirmation modal (ADMIN/MANAGER only)
- Staff order detail: "Proforma Invoice" button (amber, Receipt icon) when order is CONFIRMED, warns if active PI exists
- Customer order detail: shows only ACTIVE proformas with download button, no void capability

**Golden Rules Verification:**
- Rule 1: N/A (no stock changes)
- Rule 2: PASS (PI links to order via orderId + orderNumber)
- Rule 3: PASS (view only, no edit page)
- Rule 4: PASS (customer sees no internal data, voided PIs hidden)
- Rule 5: PASS (staff sees all proformas, void reasons, audit info)
- Rule 6: N/A (PI doesn't change order status)
- Rule 7: PASS (data loading, role-based visibility, timeline events, audit trail)
- Rule 8: PASS (sales creates, customer downloads, manager voids)

**Files created (4):**
- `backend/src/utils/validation/proforma-invoices.ts`
- `backend/src/services/proforma-invoice.service.ts`
- `backend/src/api/v1/proforma-invoices/route.ts`
- `frontend/src/hooks/useProformaInvoices.ts`
- `frontend/src/components/orders/order-detail/ProformaInvoicesSection.tsx`

**Files modified (8):**
- `backend/prisma/schema.prisma` — added PI models + enum
- `backend/src/index.ts` — registered proforma-invoices route
- `backend/src/services/pdf.service.ts` — added generateProformaInvoicePDF()
- `backend/src/services/order-timeline.service.ts` — added PI event type + query
- `frontend/src/lib/api.ts` — added PI types + 5 API methods
- `frontend/src/lib/constants/reference-routes.ts` — added ProformaInvoice entry
- `frontend/src/components/orders/order-detail/index.ts` — exported ProformaInvoicesSection
- `frontend/src/app/(portal)/orders/[id]/page.tsx` — added PI button + section
- `frontend/src/app/(customer)/my/orders/[id]/page.tsx` — added PI section

### Session 10 — Phase 5 Micro-Task 5.1 (2026-02-07)
**Micro-task 5.1 — Delivery Notes (all 5 sub-tasks)**
**Result: COMPLETE — Both backend and frontend compile cleanly**

**What was done:**

**5.1.1 — Schema + Validation + Service (Backend)**
- Added `DeliveryNoteStatus` enum, `DeliveryNote`, `DeliveryNoteLine`, `DeliveryNoteCounter` models to Prisma schema
- Created `validation/delivery-notes.ts` with Zod schemas (create, confirm delivery, list query)
- Created `delivery-note.service.ts` with generate number, create from order, get/list, dispatch, confirm delivery, cancel
- Status propagation: DISPATCHED → order SHIPPED, DELIVERED → order DELIVERED, cancel reverts if needed

**5.1.2 — API Routes + Backend Registration + Timeline**
- Created 7 endpoints in `delivery-notes/route.ts` (GET list/detail/for-order, POST create/dispatch/confirm/cancel)
- Customer role gets internal fields stripped (notes, createdBy, dispatchedBy)
- Registered route in `index.ts`
- Added 3 timeline event types (DELIVERY_NOTE_CREATED, DISPATCHED, DELIVERED) to order-timeline.service.ts

**5.1.3 — Frontend Types + API Methods + Hooks**
- Added 12 types to api.ts (DeliveryNote, DeliveryNoteLine, DeliveryNoteListItem, etc.)
- Added 7 API methods to ApiClient class
- Created `useDeliveryNotes.ts` with 7 hooks
- Added `DeliveryNote: '/delivery-notes'` to reference-routes.ts

**5.1.4 — Staff Frontend Pages**
- Created DeliveryNoteStatusBadge (gray/blue/green/red)
- Created DeliveryNoteListTable (columns: DN#, Order, Customer, Location, Status, Dispatched, Delivered, Lines)
- Created list page with status tabs, location filter, pagination
- Created detail page with pipeline steps, lines table (ordered/dispatched/received/damaged), damage notes, confirm delivery modal, cancel modal, sidebar details
- Created DeliveryNotesSection for order detail page
- Added "Delivery Notes" to navigation (FileOutput icon)
- Integrated into order detail: delivery notes section + "Create Delivery Note" button (READY_TO_SHIP/PARTIALLY_SHIPPED/SHIPPED)

**5.1.5 — Customer Portal Integration**
- Created customer delivery note detail page at `/my/delivery-notes/[id]`
  - Simplified view: no warehouse codes, no internal notes, no createdBy
  - "Confirm Receipt" button when DISPATCHED with per-line received/damaged quantities
  - Pipeline shows "Preparing" instead of "Draft" for customer-friendly language
  - Back arrow links to order detail
- Updated customer order detail to show linked delivery notes section with status badges, clickable links to `/my/delivery-notes/[id]`

**Golden Rules Verification:**
- Rule 1: N/A (no stock changes)
- Rule 2: PASS (DN links to order, lines link to products)
- Rule 3: PASS (detail is read-only, transitions via buttons)
- Rule 4: PASS (customer sees no internal data)
- Rule 5: PASS (staff sees warehouse, customer, dates, names, damage)
- Rule 6: PASS (DISPATCHED→SHIPPED, DELIVERED→DELIVERED)
- Rule 7: PASS (clickable refs, timeline events)
- Rule 8: PASS (warehouse creates/dispatches, customer confirms receipt)

**Files created (11):**
- `backend/src/utils/validation/delivery-notes.ts`
- `backend/src/services/delivery-note.service.ts`
- `backend/src/api/v1/delivery-notes/route.ts`
- `frontend/src/hooks/useDeliveryNotes.ts`
- `frontend/src/components/delivery-notes/DeliveryNoteStatusBadge.tsx`
- `frontend/src/components/delivery-notes/DeliveryNoteListTable.tsx`
- `frontend/src/components/orders/order-detail/DeliveryNotesSection.tsx`
- `frontend/src/app/(portal)/delivery-notes/page.tsx`
- `frontend/src/app/(portal)/delivery-notes/[id]/page.tsx`
- `frontend/src/app/(customer)/my/delivery-notes/[id]/page.tsx`

**Files modified (8):**
- `backend/prisma/schema.prisma` — added DN models + enum
- `backend/src/index.ts` — registered delivery-notes route
- `backend/src/services/order-timeline.service.ts` — added 3 DN event types
- `frontend/src/lib/api.ts` — added DN types + 7 API methods
- `frontend/src/lib/constants/reference-routes.ts` — added DeliveryNote entry
- `frontend/src/lib/navigation.ts` — added Delivery Notes nav item
- `frontend/src/components/orders/order-detail/index.ts` — exported DeliveryNotesSection
- `frontend/src/app/(portal)/orders/[id]/page.tsx` — added DN section + button
- `frontend/src/app/(customer)/my/orders/[id]/page.tsx` — added DN section

### Session 9 — Phase 4 Micro-Task 4.3 (2026-02-07)
**Micro-task 4.3 — Inventory Dashboard**
**Result: COMPLETE — Both backend and frontend compile cleanly**

**What was done:**
- Created `inventory-dashboard.service.ts` with `getInventoryDashboard()` running 9 parallel Prisma queries
- Added `GET /api/v1/inventory/dashboard` endpoint (all staff roles)
- Added 7 frontend types (`WarehouseStockSummary`, `LowStockAlertItem`, `PendingAdjustmentItem`, `ActiveCycleCountItem`, `RecentMovementItem`, `InventoryDashboardData`) + API method
- Added `useInventoryDashboard()` hook with 30s auto-refresh
- Rewrote `/inventory` page: replaced redundant 4-tab layout with operational dashboard
- Dashboard sections: summary bar (6 cards), warehouse breakdown (JHB/CT), low stock alerts, pending adjustments, active cycle counts, recent movements
- Role-based section ordering: WAREHOUSE sees movements first, PURCHASER sees low stock first, ADMIN/MANAGER sees alerts first
- Updated navigation: "Stock Levels" → "Dashboard", added PURCHASER role, changed icon to LayoutDashboard

**Files created (1):**
- `backend/src/services/inventory-dashboard.service.ts`

**Files modified (5):**
- `backend/src/api/v1/inventory/route.ts` — added dashboard endpoint
- `frontend/src/lib/api.ts` — added dashboard types + API method
- `frontend/src/hooks/useInventory.ts` — added useInventoryDashboard hook
- `frontend/src/app/(portal)/inventory/page.tsx` — complete rewrite (tabs → dashboard)
- `frontend/src/lib/navigation.ts` — renamed nav item, changed icon, added PURCHASER role

**Phase 4 is now COMPLETE.** Next: Phase 5 (Missing ERP Documents).

### Session 8 — Phase 4 Micro-Task 4.5 (2026-02-07)
**Micro-task 4.5 — Cycle Count Workflow**
**Result: COMPLETE — Both backend and frontend compile cleanly**

**What was done:**
- Added `CycleCountStatus` enum, `CycleCountSession`, `CycleCountLine`, `CycleCountCounter` models to Prisma schema
- Created `cycle-count.service.ts` with 7 functions: create, get, list, submitLines, complete, reconcile, cancel
- Added 7 API endpoints to inventory routes (POST/GET/PATCH cycle-counts) with Zod validation
- Added frontend types (CycleCountSession, CycleCountLine, etc.), 7 API methods, 7 React Query hooks
- Built create page at `/inventory/cycle-counts/new` (warehouse selection + product search)
- Built detail/count page at `/inventory/cycle-counts/[id]` with 4 status modes:
  - OPEN/IN_PROGRESS: Blind counting interface (no system qty visible), save progress, complete count
  - COMPLETED: Variance analysis with summary cards, reconcile button (ADMIN/MANAGER only)
  - RECONCILED: Read-only with link to created StockAdjustment
  - CANCELLED: Read-only view
- Built list page at `/inventory/cycle-counts` with status tabs, warehouse filter, progress bars, pagination
- Added "Cycle Counts" nav item (ADMIN, MANAGER, WAREHOUSE)

**Key design decisions:**
- Blind counting: System quantities hidden during OPEN/IN_PROGRESS, revealed at COMPLETED
- Reconciliation creates a StockAdjustment with reason=CYCLE_COUNT (reuses existing approval pipeline)
- WAREHOUSE role can create and count but cannot reconcile (manager approval needed)
- Counter format: CC-YYYY-NNNNN (yearly reset, matching other documents)

**Files created (4):**
- `backend/src/services/cycle-count.service.ts`
- `frontend/src/app/(portal)/inventory/cycle-counts/page.tsx`
- `frontend/src/app/(portal)/inventory/cycle-counts/new/page.tsx`
- `frontend/src/app/(portal)/inventory/cycle-counts/[id]/page.tsx`

**Files modified (6):**
- `backend/prisma/schema.prisma` — added CycleCount models + enum
- `backend/src/api/v1/inventory/route.ts` — added 7 cycle count endpoints
- `backend/src/utils/validation/inventory.ts` — added Zod schemas + types
- `frontend/src/lib/api.ts` — added cycle count types + 7 API methods
- `frontend/src/hooks/useInventory.ts` — added 7 cycle count hooks
- `frontend/src/lib/navigation.ts` — added Cycle Counts nav item

### Session 7 — Phase 4 Micro-Task 4.4 (2026-02-07)
**Micro-task 4.4 — Reorder Report**
**Result: COMPLETE — Both backend and frontend compile cleanly**

**Note:** Phase 4 order changed per user direction — dashboard (4.3) moved to last since it aggregates data from all other features. New order: 4.1→4.2→4.4→4.5→4.3.

**What was done:**
- Enriched `getLowStockProducts()` backend service to include supplier info (id, code, name, currency), costPrice, leadTimeDays, onOrder
- Added PURCHASER and WAREHOUSE roles to `GET /inventory/stock/low` endpoint
- Added `LowStockProduct` type, `LowStockProductsResponse` type, `getLowStockProducts()` API method on frontend
- Added `useLowStockProducts()` hook
- Built Reorder Report page at `/inventory/reorder` with:
  - Summary cards (total below reorder, out of stock, suppliers affected, total shortfall)
  - Filter toolbar (severity tabs, warehouse dropdown, supplier dropdown)
  - Group-by-supplier toggle with collapsible supplier sections
  - Checkbox selection per row and per supplier group
  - Generate Draft PO(s) from selected items — creates PO per supplier with pre-populated lines
  - Clickable links: SKU → item detail, supplier → supplier detail, generated PO → PO detail
- Added "Reorder Report" nav item to inventoryNavigation (ADMIN, MANAGER, PURCHASER)

**Files created (1):**
- `frontend/src/app/(portal)/inventory/reorder/page.tsx`

**Files modified (5):**
- `backend/src/services/inventory.service.ts` — enriched getLowStockProducts() product select + return shape
- `backend/src/api/v1/inventory/route.ts` — added PURCHASER, WAREHOUSE roles to /stock/low
- `frontend/src/lib/api.ts` — added LowStockProduct types + getLowStockProducts() method
- `frontend/src/hooks/useInventory.ts` — added useLowStockProducts() hook
- `frontend/src/lib/navigation.ts` — added Reorder Report nav item

### Session 6 — Phase 4 Micro-Task 4.2 (2026-02-07)
**Micro-task 4.2 — Stock Adjustment Workflow**
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- Added `CreateInventoryAdjustmentData` type + `StockAdjustmentReason` type + `notes` field to `StockAdjustment` interface
- Added `createInventoryAdjustment()` API method (POST /inventory/adjustments)
- Added `useCreateInventoryAdjustment()` hook with invalidation
- Built adjustments list page at `/inventory/adjustments` with status filter tabs (All/Pending/Approved/Rejected), warehouse filter, pagination, linked adjustment numbers
- Built adjustment detail page at `/inventory/adjustments/[id]` with status banners, info grid, line items table with product links, net change summary, approve/reject actions for ADMIN/MANAGER
- Built create adjustment page at `/inventory/adjustments/new` with product search, multi-line form, validation
- Added "Adjustments" nav item to inventoryNavigation (ADMIN, MANAGER only)

**Files created (3):**
- `frontend/src/app/(portal)/inventory/adjustments/page.tsx`
- `frontend/src/app/(portal)/inventory/adjustments/[id]/page.tsx`
- `frontend/src/app/(portal)/inventory/adjustments/new/page.tsx`

**Files modified (3):**
- `frontend/src/lib/api.ts` — added types + createInventoryAdjustment method
- `frontend/src/hooks/useInventory.ts` — added useCreateInventoryAdjustment hook
- `frontend/src/lib/navigation.ts` — added Adjustments nav item

### Session 5 — Phase 4 Micro-Task 4.1 (2026-02-07)
**Micro-task 4.1 — Stock Movements Page**
**Result: COMPLETE — Both frontend and backend compile cleanly**

**What was done:**
- Updated `StockMovementItem` type to match actual backend response (was using wrong field names: `warehouseId`/`type` vs actual `location`/`movementType`)
- Extracted `REFERENCE_TYPE_ROUTES` + `WAREHOUSE_NAMES` to shared constants at `frontend/src/lib/constants/reference-routes.ts`
- Enhanced `MovementLogTable`: added warehouse filter, product SKU/name as clickable links to item detail, reference numbers as clickable links to source documents, updated search to filter on SKU/description/referenceNumber
- Created dedicated `/inventory/movements` page with PageHeader
- Added "Movements" nav item to inventoryNavigation (ADMIN, MANAGER, WAREHOUSE)
- Expanded backend movements endpoint role to include WAREHOUSE

**Files created (2):**
- `frontend/src/lib/constants/reference-routes.ts`
- `frontend/src/app/(portal)/inventory/movements/page.tsx`

**Files modified (5):**
- `frontend/src/lib/api.ts` — updated StockMovementItem interface
- `frontend/src/components/inventory/MovementLogTable.tsx` — complete rewrite
- `frontend/src/components/inventory/product-detail/AuditLogTab.tsx` — shared constant import
- `frontend/src/lib/navigation.ts` — added Movements nav item
- `backend/src/api/v1/inventory/route.ts` — expanded role

### Session 4 — Phase 2 Micro-Task 2.9 (2026-02-07)
**Micro-task 2.9 — Data Leak Audit + Verification**
**Result: COMPLETE — All 11 checks PASS, 4 backend vulnerabilities fixed, TypeScript compiles cleanly**

**Audit scope:** 11 checks across frontend (4), backend/API (4), and auth (3) layers.

**Vulnerabilities found and fixed:**

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | Products LIST API returned `supplier` to CUSTOMER | MEDIUM | Conditional spread `...(isCustomer ? {} : { supplier })` |
| 2 | Products LIST API returned `stockSummary.totalOnHand/totalAvailable` to CUSTOMER | MEDIUM | Customer gets `{ status }` only |
| 3 | Products DETAIL API returned `costPrice`, `landedCost`, `supplierId`, inventory quantities | HIGH | All stripped for CUSTOMER role |
| 4 | Orders DETAIL API returned `internalNotes` to CUSTOMER | HIGH | Set to `undefined` for CUSTOMER |
| 5 | Quotes API global `requireRole('ADMIN','MANAGER','SALES')` blocked CUSTOMER from ALL quote operations | CRITICAL | Removed global role check; company isolation enforced in service layer |

**Files modified (3):**
- `backend/src/api/v1/products/route.ts` — role-based field filtering on LIST and DETAIL endpoints
- `backend/src/api/v1/orders/route.ts` — strip internalNotes + warehouse for CUSTOMER
- `backend/src/api/v1/quotes/route.ts` — removed global requireRole, removed unused import

**Phase 2 is now COMPLETE.** Next phase: Phase 4 (Inventory Module) or Phase 5 (Missing ERP Documents).

### Session 3 — Phase 2 Micro-Task 2.8 (2026-02-07)
**Micro-task 2.8 — Customer Account Page**
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- Added `POST /api/v1/auth/change-password` backend endpoint with validation
- Verifies current password, hashes new one, revokes all sessions for security
- Added `changePassword()` method to frontend API client
- Built customer account page at `/my/account` with profile info, company info, change password form
- After password change, all sessions revoked and user redirected to login

**Files created (1):**
- `frontend/src/app/(customer)/my/account/page.tsx`

**Files modified (3):**
- `backend/src/api/v1/auth/route.ts` — added change-password endpoint
- `backend/src/utils/validation/auth.ts` — added changePasswordSchema
- `frontend/src/lib/api.ts` — added changePassword method

### Session 3 — Phase 2 Micro-Task 2.7 (2026-02-07)
**Micro-task 2.7 — Customer Orders List + Detail Pages**
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- Modified backend orders API to allow CUSTOMER role on GET routes (list, detail, timeline)
- Write operations (create, confirm, hold, release, cancel, fulfillment) remain staff-only via `staffOnly` middleware
- Company isolation already protects cross-company access (all queries filter by `companyId`)
- Built customer orders list at `/my/orders` with status filter tabs (All, Confirmed, In Progress, Shipped, Delivered, Cancelled)
- Built customer order detail at `/my/orders/[id]` with pipeline steps, items, totals, key dates
- Added `linkPrefix` and `quotesHref` props to `OrderListTable` for portal reuse
- Added `hideOperationalColumns` prop to `OrderLineTable` to hide Status and Picked columns
- Customer order detail hides: picking slips, job cards, transfers, internal notes, fulfillment stats, warehouse, company name, hold/cancel reasons (generic messages only)

**Files created (2):**
- `frontend/src/app/(customer)/my/orders/page.tsx`
- `frontend/src/app/(customer)/my/orders/[id]/page.tsx`

**Files modified (3):**
- `backend/src/api/v1/orders/route.ts` — per-route auth instead of global staff-only
- `frontend/src/components/orders/OrderListTable.tsx` — added linkPrefix + quotesHref props
- `frontend/src/components/orders/OrderLineTable.tsx` — added hideOperationalColumns prop

### Session 2 — Phase 2 Micro-Tasks 2.4-2.6 (2026-02-07)
**Micro-task 2.6 — Customer Quotes List + Detail Pages**
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- Built customer quotes list at `/my/quotes` with status filter tabs, active draft banner, pagination
- Built customer quote detail at `/my/quotes/[id]` with items table, totals, validity banner
- Added `linkPrefix` and `browseHref` props to `QuoteListTable` for portal reuse
- Customer can: view quotes, filter by status, edit DRAFT items, submit (finalize), accept/reject CREATED quotes
- No internal data shown: no customer tier, no company name, no Create Order (staff action)

**Files created (2):**
- `frontend/src/app/(customer)/my/quotes/page.tsx`
- `frontend/src/app/(customer)/my/quotes/[id]/page.tsx`

**Files modified (1):**
- `frontend/src/components/quotes/QuoteListTable.tsx` — added linkPrefix + browseHref props

### Session 2 — Phase 2 Micro-Tasks 2.4-2.5 (2026-02-07)
**Micro-task 2.5 — Customer Product Detail Page**
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- Built customer product detail page at `/my/products/[sku]`
- Two-column layout: image gallery (left) + product info (right)
- Dual data source: public API for rich content (images, specs, docs), catalog API for tier pricing + stock badge
- Inline add-to-quote with quantity selector, line total, success confirmation
- Tabbed bottom section: Specifications, Documents, Cross-References (conditional tabs)
- Loading skeleton and error state with back link
- Breadcrumb navigation linking to category filters

**Files created (1):**
- `frontend/src/app/(customer)/my/products/[sku]/page.tsx`

**Key decisions:**
- Inlined image gallery + add-to-quote components to avoid creating separate files for customer-specific variants
- Used `useProducts({ search: sku })` to get authenticated tier pricing (public API has no pricing)
- Cross-references shown to help customers identify replacement parts
- No supplier info, no stock quantities, no internal data (Golden Rule 4)

### Session 2 — Phase 2 Micro-Task 2.4 (2026-02-07)
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- Built customer product catalog page at `/my/products`
- Added `hideSupplier` prop to ProductCard, ProductGrid, ProductDetailModal (Golden Rule 4 compliance)
- Added `detailLinkPrefix` prop to ProductDetailModal for configurable "View Full Details" link
- Customer page: grid-only, published products only, no supplier info, no stock quantities (badges only)
- Full filter support: category sidebar, search, stock status chips, sort dropdown, URL-synced state, pagination

**Files modified (3):**
- `frontend/src/components/products/ProductCard.tsx` — added hideSupplier prop
- `frontend/src/components/products/ProductGrid.tsx` — added hideSupplier passthrough
- `frontend/src/components/products/ProductDetailModal.tsx` — added hideSupplier + detailLinkPrefix props

**Files created (1):**
- `frontend/src/app/(customer)/my/products/page.tsx`

**Key decisions:**
- Reused existing ProductGrid/ProductCard/CategoryFilter/Pagination components with new props
- Customer always sees `isPublished: 'true'` filter (cannot see unpublished products)
- No warehouse selector (customer sees aggregate availability)
- "View Full Details" link points to `/my/products/${sku}` (customer detail page, micro-task 2.5)

### Session 1 — Phase 2 Micro-Tasks 2.1-2.3 (2026-02-07)
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- 2.1: Created `(customer)` route group with layout infrastructure
  - `CustomerAuthGuard` — checks auth + enforces role=CUSTOMER
  - `CustomerHeader` — horizontal top nav (logo, Products/Quotes/Orders/Account, QuoteCart, user menu, mobile hamburger)
  - `CustomerLayout` — header-based layout (no sidebar), max-w-7xl centered content
  - `customer-navigation.ts` — nav items config
  - `(customer)/layout.tsx` — wraps children in CustomerAuthGuard + CustomerLayout

- 2.2: Login redirect + middleware + cross-guards
  - Login page: role-based redirect (CUSTOMER → `/my/dashboard`, staff → `/dashboard`)
  - Middleware: added `/my` to portalRoutes for domain routing
  - AuthGuard: blocks CUSTOMER from ERP routes → redirects to `/my/dashboard`
  - QuoteCart: role-aware links ("Browse Products" → `/my/products` for CUSTOMER, `/catalog` for staff; "View Quote" → `/my/quotes/[id]` for CUSTOMER)

- 2.3: Customer dashboard at `/my/dashboard`
  - Welcome banner with company/tier
  - Active quote banner with "Continue Shopping" and "View Quote" CTAs
  - Stats cards (total quotes, total orders, company info)
  - Recent quotes (5) with status badges and links to `/my/quotes/[id]`
  - Recent orders (5) with status badges and links to `/my/orders/[id]`
  - Empty states with CTAs

**Files created (7):**
- `frontend/src/lib/customer-navigation.ts`
- `frontend/src/components/auth/CustomerAuthGuard.tsx`
- `frontend/src/components/layout/CustomerHeader.tsx`
- `frontend/src/components/layout/CustomerLayout.tsx`
- `frontend/src/app/(customer)/layout.tsx`
- `frontend/src/app/(customer)/my/dashboard/page.tsx`

**Files modified (4):**
- `frontend/src/app/(auth)/login/page.tsx` — role-based redirect
- `frontend/src/middleware.ts` — added `/my` to portalRoutes
- `frontend/src/components/auth/AuthGuard.tsx` — blocks CUSTOMER from ERP
- `frontend/src/components/quotes/QuoteCart.tsx` — role-aware links

**Next session:** Micro-tasks 2.4-2.8 (products, quotes, orders, account pages)

### Micro-Task 3.9 — Multi-warehouse Fulfillment Orchestration Verification + Fix (2026-02-07)
**Result: COMPLETE — Verified + one gap fixed, TypeScript compiles cleanly, 31 tests pass**

**Verification findings:**
- Multi-warehouse fulfillment orchestration was ALREADY implemented in TASK-022/022A
- Allocation service correctly handles CT-first + JHB spillover for stock products
- Orchestration engine creates per-warehouse picking slips + transfer requests
- Execution creates all documents in a single Prisma transaction with stale-plan protection

**Gap found and fixed:**
- `processAssemblyLine()` did NOT create transfer lines for CT customers ordering assembly products
- After a job card completes at JHB, finished goods would have no planned transfer to CT
- **Fix:** Added `customerWarehouse` and `transferLines` params to `processAssemblyLine()`. When customerWarehouse is CT, assembly finished goods are now added to transfer lines, ensuring a JHB→CT transfer request appears in the plan.

**Files modified:**
- `backend/src/services/orchestration.service.ts` — 3 edits: pass params to processAssemblyLine, add params to signature, add CT transfer logic

**Verification checklist:**
| Check | Result |
|-------|--------|
| CT stock splitting (CT first, JHB spillover) | ✅ PASS |
| JHB customer allocation (JHB only) | ✅ PASS |
| CT assembly products → transfer planned | ✅ PASS (after fix) |
| Backorder → PO generation | ✅ PASS |
| SHIP_COMPLETE policy blocking | ✅ PASS |
| Stale plan detection | ✅ PASS |
| TypeScript compiles | ✅ PASS |
| 31 integration tests pass | ✅ PASS |

### Micro-Task 3.8 — Add Timeline/Activity Log to Sales Order Page (2026-02-07)
**Result: COMPLETE — Both backend and frontend compile cleanly**

**What was done:**
- Created backend service `getOrderTimeline()` that aggregates events from the order itself + all related documents (picking slips, job cards, transfer requests)
- Two-phase query: first fetch all documents in parallel, then resolve user names from collected IDs
- Created `GET /api/v1/orders/:id/timeline` endpoint (staff-only auth)
- Created frontend `TimelineEvent` type + `getOrderTimeline()` API method + `useOrderTimeline()` hook
- Created `OrderTimelineSection` component with vertical timeline UI (colored dots, icons per event type, clickable document links, actor names, relative timestamps)
- Integrated timeline into order detail page sidebar (below Documents section)

**Timeline event sources:**
| Source | Events |
|--------|--------|
| SalesOrder | Created, Confirmed, Shipped, Delivered, On Hold, Cancelled |
| PickingSlip | Created, Started, Completed |
| JobCard | Created, Started, On Hold, Completed |
| TransferRequest | Created, Shipped, Received |

**Files created:**
- `backend/src/services/order-timeline.service.ts`
- `frontend/src/components/orders/order-detail/OrderTimelineSection.tsx`

**Files modified:**
- `backend/src/api/v1/orders/route.ts` — added timeline endpoint
- `frontend/src/lib/api.ts` — added TimelineEvent types + getOrderTimeline()
- `frontend/src/hooks/useOrders.ts` — added useOrderTimeline() hook
- `frontend/src/components/orders/order-detail/index.ts` — exported OrderTimelineSection
- `frontend/src/app/(portal)/orders/[id]/page.tsx` — integrated timeline into sidebar

**Key decisions:**
- Events sorted newest-first for easy scanning
- User names resolved via second query phase (not embedded in documents)
- Sidebar placement keeps main content area for fulfillment documents
- Document references are clickable links to detail pages

### Micro-Task 3.7 — Build Fulfillment Dashboard (2026-02-07)
**Result: COMPLETE — Both backend and frontend compile cleanly**

**What was done:**
- Created backend service with `getFulfillmentDashboard()` running 19 parallel Prisma queries
- Created `GET /api/v1/fulfillment/dashboard` endpoint with auth + role check
- Created 7 dashboard section components + summary bar
- Created `/fulfillment` page with role-based section ordering (warehouse→picking first, purchaser→delivery first, sales→ready-to-ship first, manager→exceptions first)
- Added "Fulfillment" nav item (staff-only, excludes CUSTOMER)
- Hook auto-refreshes every 30 seconds for live operations feel

**Dashboard sections:**
| Section | Shows | Data |
|---------|-------|------|
| Summary Bar | 6 count cards across top | Totals per category |
| Picking Queue | PENDING + IN_PROGRESS picking slips | Top 5, links to detail + order |
| Jobs In Progress | PENDING + IN_PROGRESS + ON_HOLD job cards | Top 5, job type, assigned to |
| Pending Transfers | PENDING + IN_TRANSIT transfers | Top 5, from→to, linked order |
| Awaiting Delivery | SENT + ACKNOWLEDGED + PARTIALLY_RECEIVED POs | Top 5, supplier, overdue flag |
| Ready to Ship | READY_TO_SHIP orders | Top 5, customer, total |
| Exception Alerts | Overdue POs, stalled jobs (48h+), on-hold orders | Count + links |

**Files created:**
- `backend/src/services/fulfillment-dashboard.service.ts`
- `backend/src/api/v1/fulfillment/route.ts`
- `frontend/src/app/(portal)/fulfillment/page.tsx`
- `frontend/src/components/fulfillment/dashboard/FulfillmentSummaryBar.tsx`
- `frontend/src/components/fulfillment/dashboard/PickingQueueSection.tsx`
- `frontend/src/components/fulfillment/dashboard/JobsInProgressSection.tsx`
- `frontend/src/components/fulfillment/dashboard/PendingTransfersSection.tsx`
- `frontend/src/components/fulfillment/dashboard/AwaitingDeliverySection.tsx`
- `frontend/src/components/fulfillment/dashboard/ReadyToShipSection.tsx`
- `frontend/src/components/fulfillment/dashboard/ExceptionAlertsSection.tsx`
- `frontend/src/components/fulfillment/dashboard/index.ts`

**Files modified:**
- `backend/src/index.ts` — registered fulfillment route
- `frontend/src/lib/api.ts` — added FulfillmentDashboardData types + getFulfillmentDashboard()
- `frontend/src/hooks/useFulfillment.ts` — added useFulfillmentDashboard() hook
- `frontend/src/lib/navigation.ts` — added Fulfillment nav item

**Key decisions:**
- POs are not company-scoped (no companyId on PurchaseOrder model) — PO queries don't filter by company
- Schema uses snapshot fields (orderNumber, assignedToName) — no relation joins needed for most queries
- 30s refetchInterval for near-real-time operations dashboard
- Exception thresholds: stalled = ON_HOLD > 48 hours, overdue = expectedDate < now

### Micro-Task 3.6 — Enhance PO Detail Page with GRV History + Linked Orders (2026-02-06)
**Result: COMPLETE — TypeScript compiles cleanly**

**What was done:**
- Created 4 new components in `components/purchase-orders/po-detail/`
- Added PO status pipeline steps (Draft → Approval → Sent → Acknowledged → Receiving → Received)
- Added receiving progress bar with stats (ordered/received/outstanding + rejected warning)
- Enhanced GRV section with per-GRV quantities received/rejected, better layout
- Added sidebar Timeline with full audit trail (created, approved, rejected, sent, received events)
- Enhanced POLineTable: product SKUs are clickable links to `/inventory/items/[sku]`, per-line receiving progress bars, SO linkage indicator
- Integrated `usePurchaseOrderReceivingSummary` hook (existed but was unused)
- Added cancelled status banner

**Files created:**
- `frontend/src/components/purchase-orders/po-detail/POPipelineSteps.tsx`
- `frontend/src/components/purchase-orders/po-detail/POReceivingProgress.tsx`
- `frontend/src/components/purchase-orders/po-detail/GoodsReceiptsSection.tsx`
- `frontend/src/components/purchase-orders/po-detail/PONotesSection.tsx`
- `frontend/src/components/purchase-orders/po-detail/index.ts`

**Files modified:**
- `frontend/src/components/purchase-orders/POLineTable.tsx` — clickable SKU links, per-line progress bars
- `frontend/src/app/(portal)/purchase-orders/[id]/page.tsx` — integrated all new components

### Micro-Task 3.1 — Enhance Sales Order Detail Page with Fulfillment Status Panel (2026-02-06)
**Result: COMPLETE — All changes compile cleanly**

**What was done:**
- Enriched 3 backend summary endpoints (picking slips, job cards, transfer requests) to return richer data: assignee names, dates, locations
- Updated frontend types in both `api/types/orders.ts` and `api.ts`
- Built 3 new fulfillment panel components: `FulfillmentPipelineSteps` (horizontal step indicator), `FulfillmentStatsBar` (picked/shipped/delivered stats), `FulfillmentProgressBar` (stacked line status bar)
- Extracted 4 inline sections into reusable components: `PickingSlipsSection`, `JobCardsSection`, `TransferRequestsSection`, `OrderNotesSection`
- Restructured the order detail page: reduced from 649 lines to ~375 lines, integrated all new components

**Backend enrichments:**
| Service | Added Fields |
|---------|-------------|
| picking-slip.service.ts | assignedToName, createdAt, startedAt, completedAt |
| job-card.service.ts | assignedToName, createdAt, startedAt, completedAt |
| transfer-request.service.ts | fromLocation, toLocation, createdAt, shippedAt, receivedAt |

**Files created:**
- `frontend/src/components/orders/order-detail/FulfillmentPipelineSteps.tsx`
- `frontend/src/components/orders/order-detail/FulfillmentStatsBar.tsx`
- `frontend/src/components/orders/order-detail/FulfillmentProgressBar.tsx`
- `frontend/src/components/orders/order-detail/PickingSlipsSection.tsx`
- `frontend/src/components/orders/order-detail/JobCardsSection.tsx`
- `frontend/src/components/orders/order-detail/TransferRequestsSection.tsx`
- `frontend/src/components/orders/order-detail/OrderNotesSection.tsx`
- `frontend/src/components/orders/order-detail/index.ts`

**Files modified:**
- `backend/src/services/picking-slip.service.ts` — enriched getPickingSlipsForOrder()
- `backend/src/services/job-card.service.ts` — enriched getJobCardsForOrder()
- `backend/src/services/transfer-request.service.ts` — enriched getTransferRequestsForOrder()
- `frontend/src/lib/api/types/orders.ts` — updated summary interfaces
- `frontend/src/lib/api.ts` — updated duplicate summary interfaces
- `frontend/src/app/(portal)/orders/[id]/page.tsx` — restructured with new components

**Note:** Micro-tasks 3.2-3.5 were already completed in Phase 0.8 (backend status propagation logic). Next task is 3.6 (PO detail page).


### Micro-Task 0.1 — Audit GRV → Stock Flow (2026-02-06)
**Result: ALL 6 CHECKS PASS — No fixes needed**

| Check | Result | Location |
|-------|--------|----------|
| (a) StockMovement type=RECEIPT | PASS | grv.service.ts:263 |
| (b) referenceType + referenceId | PASS | grv.service.ts:266-268 (uses 'GoodsReceivedVoucher') |
| (c) StockLevel.onHand increase | PASS | grv.service.ts:246,249-256 |
| (d) StockLevel.onOrder decrease | PASS | grv.service.ts:247,253 (Math.max(0,...) prevents negatives) |
| (e) POLine.quantityReceived update | PASS | grv.service.ts:217-222 |
| (f) PO status propagation | PASS | grv.service.ts:277-300 (RECEIVED/PARTIALLY_RECEIVED) |

**Additional:** All within Prisma $transaction, quantity validation prevents over-receiving, StockLevel auto-created if missing, full audit trail with userId.

**Files examined:** `backend/src/services/grv.service.ts`, `backend/src/api/v1/goods-receipts/route.ts`, `backend/src/utils/validation/goods-receipts.ts`

### Micro-Task 0.2 — Audit Picking Slip → Stock Flow (2026-02-06)
**Result: ALL 5 CHECKS FAIL — completePicking() is status-only, no stock integration**

| Check | Result | Location |
|-------|--------|----------|
| (a) StockMovement type=ISSUE | FAIL | picking-slip.service.ts:409-450 — not implemented |
| (b) referenceType + referenceId | FAIL | not implemented |
| (c) StockLevel.onHand decrease | FAIL | not implemented |
| (d) StockReservation release | FAIL | not implemented |
| (e) SalesOrder status propagation | FAIL | not implemented |

**Root cause:** `completePicking()` only sets `status: 'COMPLETE'` + `completedAt` (lines 441-447). No Prisma transaction, no stock operations, no reservation release, no parent order update.

**Fix needed in 0.8:** Rewrite `completePicking()` with full transaction: create ISSUE movements, decrease onHand, release hardReserved, propagate to SalesOrder.

**Files examined:** `backend/src/services/picking-slip.service.ts`, `backend/prisma/schema.prisma`

### Micro-Task 0.3 — Audit Job Card → Stock Flow (2026-02-06)
**Result: ALL 5 CHECKS FAIL — completeJobCard() is status-only, no stock integration**

| Check | Result | Location |
|-------|--------|----------|
| (a) StockMovement type=MANUFACTURE_IN for finished product | FAIL | job-card.service.ts:453-482 — not implemented |
| (b) StockMovement type=MANUFACTURE_OUT for BOM components | FAIL | not implemented — service has no BomItem awareness |
| (c) StockLevel.onHand increase for finished product | FAIL | not implemented |
| (d) StockLevel.onHand decrease for consumed components | FAIL | not implemented |
| (e) referenceType='JOB_CARD' + referenceId on all movements | FAIL | not implemented |

**Root cause:** `completeJobCard()` only sets `status: 'COMPLETE'` + `completedAt` (lines 473-479). No Prisma transaction, no stock operations, no BOM component lookup, no parent order update. Identical pattern to picking slip (0.2).

**BOM model status:** `BomItem` model exists (schema.prisma:1463) with parentProductId, componentProductId, quantity — data structure is ready for the fix.

**Fix needed in 0.8:** Rewrite `completeJobCard()` with full transaction: lookup BOM via BomItem, create MANUFACTURE_IN for finished product (+onHand), create MANUFACTURE_OUT per component (-onHand scaled by job quantity), propagate to SalesOrder.

**Files examined:** `backend/src/services/job-card.service.ts`, `backend/src/api/v1/job-cards/route.ts`, `backend/src/utils/validation/job-cards.ts`, `backend/prisma/schema.prisma`

### Micro-Task 0.4 — Audit Transfer Request → Stock Flow (2026-02-06)
**Result: 4 of 5 CHECKS FAIL — shipTransfer() and receiveTransfer() are status-only, no stock integration**

| Check | Result | Location |
|-------|--------|----------|
| (a) StockMovement type=TRANSFER_OUT at source on ship | FAIL | transfer-request.service.ts:379-411 — not implemented |
| (b) StockLevel.onHand decrease at source on ship | FAIL | not implemented |
| (c) StockMovement type=TRANSFER_IN at destination on receive | FAIL | transfer-request.service.ts:470-514 — not implemented |
| (d) StockLevel.onHand increase at destination on receive | FAIL | not implemented |
| (e) TransferRequest status update | PASS | transfer-request.service.ts:504 (sets RECEIVED) |

**Root cause:** Both `shipTransfer()` and `receiveTransfer()` only update status fields. Neither creates StockMovement records nor modifies StockLevel. No Prisma $transaction wrapping the updates.

**Note:** `receiveTransfer()` validates receivedQuantity > 0 for all lines (line 495-501) but never uses these quantities for stock updates.

**Fix needed in 0.8:** shipTransfer(): wrap in transaction, create TRANSFER_OUT per line, decrease source onHand. receiveTransfer(): wrap in transaction, create TRANSFER_IN per line (using receivedQuantity), increase destination onHand.

**Files examined:** `backend/src/services/transfer-request.service.ts`

### Micro-Task 0.5 — Audit Stock Adjustment → Stock Flow (2026-02-06)
**Result: ALL 3 CHECKS PASS — No fixes needed**

| Check | Result | Location |
|-------|--------|----------|
| (a) StockMovement type=ADJUSTMENT_IN/OUT | PASS | inventory.service.ts:1124 (delta >= 0 ? ADJUSTMENT_IN : ADJUSTMENT_OUT) |
| (b) StockLevel.onHand updated | PASS | inventory.service.ts:1127-1133 (updateStockLevel with delta) |
| (c) Records who approved and when | PASS | inventory.service.ts:1114-1118 (approvedAt, approvedBy, updatedBy) |

**Additional:** Full Prisma $transaction, per-line processing, referenceType='StockAdjustment' + referenceId + referenceNumber + adjustmentReason on movements, approval/rejection workflow.

**Files examined:** `backend/src/services/inventory.service.ts`

### Micro-Task 0.6 — Audit Quote → Reservation Flow (2026-02-06)
**Result: ALL 3 CHECKS PASS — No fixes needed**

| Check | Result | Location |
|-------|--------|----------|
| (a) StockReservation type=SOFT | PASS | inventory.service.ts:1232 (reservationType: 'SOFT') |
| (b) StockLevel.softReserved increased | PASS | inventory.service.ts:1243-1249 (updateStockLevel with softReserved delta) |
| (c) Linked to quote (referenceType='Quote') | PASS | quote.service.ts:456-458 (referenceType, referenceId, referenceNumber) |

**Additional:** createSoftReservation() within Prisma $transaction, expiresAt set from 30-day validity, rejectQuote() releases reservations via releaseReservationsByReference().

**Minor concern:** Quote status update and reservation creation are separate transactions — potential for orphaned state on partial failure. Not critical.

**Files examined:** `backend/src/services/quote.service.ts`, `backend/src/services/inventory.service.ts`

### Micro-Task 0.7 — Audit Sales Order → Reservation Flow (2026-02-06)
**Result: ALL 3 CHECKS PASS — No fixes needed**

| Check | Result | Location |
|-------|--------|----------|
| (a) Convert SOFT→HARD on order creation | PASS | order.service.ts:342 (release soft) + 345-357 (create hard) |
| (b) Create HARD reservations with referenceType='SalesOrder' | PASS | order.service.ts:351 (referenceType: 'SalesOrder') |
| (c) StockLevel.hardReserved updated | PASS | inventory.service.ts:1319-1325 (updateStockLevel with hardReserved delta) |

**Additional:** createHardReservation() validates available stock, full Prisma $transaction, cancelOrder() releases reservations via releaseReservationsByReference(). Reservation conversion is outside order creation transaction (minor concern, same as 0.6).

**Files examined:** `backend/src/services/order.service.ts`, `backend/src/services/inventory.service.ts`

---

## Phase 0 Audit Summary

| Flow | Result | Fix in 0.8? |
|------|--------|-------------|
| 0.1 GRV → Stock | ✅ ALL PASS | No |
| 0.2 Picking Slip → Stock | ❌ ALL 5 FAIL | YES — rewrite completePicking() |
| 0.3 Job Card → Stock | ❌ ALL 5 FAIL | YES — rewrite completeJobCard() |
| 0.4 Transfer Request → Stock | ❌ 4/5 FAIL | YES — rewrite shipTransfer() + receiveTransfer() |
| 0.5 Stock Adjustment → Stock | ✅ ALL PASS | No |
| 0.6 Quote → Reservation | ✅ ALL PASS | No |
| 0.7 Sales Order → Reservation | ✅ ALL PASS | No |

**3 services need fixes in 0.8:** picking-slip, job-card, transfer-request

### Micro-Task 0.8 — Fix All Broken/Missing Flows (2026-02-06)
**Result: ALL 3 SERVICES FIXED — TypeScript compiles cleanly**

**Approach:** Exported `updateStockLevel` and `createStockMovement` helpers from `inventory.service.ts` and reused them in all 3 services to ensure consistent stock operations within Prisma transactions.

| Service | Function | What was added |
|---------|----------|----------------|
| picking-slip.service.ts | `completePicking()` | ISSUE movements, onHand decrease, hard reservation release, SalesOrder status propagation |
| job-card.service.ts | `completeJobCard()` | MANUFACTURE_IN for finished product (+onHand), MANUFACTURE_OUT per BOM component (-onHand), SalesOrder status propagation. Manufacturing location hardcoded to JHB. |
| transfer-request.service.ts | `shipTransfer()` | TRANSFER_OUT movements, onHand decrease at source |
| transfer-request.service.ts | `receiveTransfer()` | TRANSFER_IN movements, onHand increase at destination (using receivedQuantity) |

**Key decisions:**
- Manufacturing always at JHB (only manufacturing location per business rules)
- BOM component consumption uses `Math.ceil(bomItem.quantity * jobQty)` for fractional BOM quantities
- SalesOrder propagation: CONFIRMED→PROCESSING (partial fulfillment), PROCESSING→READY_TO_SHIP (all picking+jobs complete)
- Reservation release happens per-product per-location, matching HARD reservations linked to the SalesOrder

**Files modified:**
- `backend/src/services/inventory.service.ts` — exported `updateStockLevel` and `createStockMovement`
- `backend/src/services/picking-slip.service.ts` — rewrote `completePicking()` (~90 lines added)
- `backend/src/services/job-card.service.ts` — rewrote `completeJobCard()` (~100 lines added)
- `backend/src/services/transfer-request.service.ts` — rewrote `shipTransfer()` and `receiveTransfer()` (~70 lines each)

### Micro-Task 0.9 — Create Integration Test Script (2026-02-06)
**Result: 31 TESTS ALL PASS**

Created `tests/integration/stock-flows.test.ts` with Vitest mock-based tests:

| Test Group | Tests | What's Verified |
|------------|-------|-----------------|
| Flow 0.2: Picking Slip | 7 | ISSUE movements, onHand decrease, reservation release, READY_TO_SHIP/PROCESSING propagation, validation |
| Flow 0.3: Job Card | 7 | MANUFACTURE_IN/OUT, BOM component consumption, fractional qty ceiling, optional BOM skip, propagation |
| Flow 0.4: Transfer Request | 8 | TRANSFER_OUT at source, TRANSFER_IN at destination (uses receivedQuantity), status validation |
| Flows 0.1, 0.5-0.7 (structural) | 7 | Function exports exist and are callable |
| **Total** | **31** | |

**Mocking approach:** `vi.hoisted()` for mock variables, `vi.mock()` for database and inventory helpers, `vi.importActual()` for structural assertions.

**Files created:**
- `tests/integration/stock-flows.test.ts` (~800 lines)

---

## Phase 0: Integration Audit (Foundation)
- [x] 0.1 — Audit GRV → Stock flow ✅ ALL PASS
- [x] 0.2 — Audit Picking Slip → Stock flow ❌ ALL 5 FAIL
- [x] 0.3 — Audit Job Card → Stock flow ❌ ALL 5 FAIL
- [x] 0.4 — Audit Transfer Request → Stock flow ❌ 4 of 5 FAIL
- [x] 0.5 — Audit Stock Adjustment → Stock flow ✅ ALL PASS
- [x] 0.6 — Audit Quote → Reservation flow ✅ ALL PASS
- [x] 0.7 — Audit Sales Order → Reservation flow ✅ ALL PASS
- [x] 0.8 — Fix all broken/missing flows identified in 0.1-0.7 ✅ ALL 3 SERVICES FIXED
- [x] 0.9 — Create integration test script ✅ 31 TESTS ALL PASS

## Phase 1A: Fix Product Edit Form ✅ COMPLETE
- [x] 1A.1 — Create shared UoM constants + fix UoM enum mismatch in both form pages
- [x] 1A.2 — Add category/subcategory editing + supplierSku to edit page
- [x] 1A.3 — Fix UoM in remaining components (dedup + display labels)
- [x] 1A.4 — TypeScript check + verification (tsc --noEmit clean)

### Phase 1A Session Notes (2026-02-06)

**Root cause found:** Frontend UoM dropdown values (`EACH`, `METER`, `PAIR`, `BOX`) did NOT match backend Prisma enum (`EA`, `MTR`, `PR`, `BX`). This caused Zod validation failures on create/update. `ROL` (Roll) was missing entirely from frontend.

**What was NOT broken (original assumption wrong):** Supplier/category dropdowns correctly used IDs, not text fields. No "text field vs relationship ID disconnect" existed.

**Actual fixes applied:**
| File | What Changed |
|------|-------------|
| `frontend/src/lib/constants/unit-of-measure.ts` | NEW — shared UoM constants, labels, helper |
| `frontend/src/app/(portal)/inventory/items/new/page.tsx` | Fixed UoM default `EACH`→`EA`, replaced hardcoded options |
| `frontend/src/app/(portal)/inventory/items/[sku]/page.tsx` | Fixed UoM default, options, display; added category/subcategory dropdowns; made supplierSku editable |
| `frontend/src/components/products/ProductFormModal.tsx` | Removed local `UOM_OPTIONS`, imported shared, added labels |
| `frontend/src/components/products/ProductEditor.tsx` | Same as ProductFormModal |
| `frontend/src/components/products/ProductDetailModal.tsx` | Added `getUomLabel()` for display |
| `frontend/src/components/quotes/AddToQuoteModal.tsx` | Added `getUomLabel()` for display |
| `frontend/src/components/products/BomTable.tsx` | Added `getUomLabel()` for display |
| `frontend/src/app/(portal)/catalog/[slug]/page.tsx` | Added `getUomLabel()` for display |
| `frontend/src/app/(website)/products/p/[sku]/page.tsx` | Added `getUomLabel()` for display |

**Key decisions:**
- Single source of truth: `@nusaf/shared` `UNIT_OF_MEASURE_LABELS` constant
- Supplier stays read-only on edit page (business rule: changing supplier has cascading pricing effects)
- `InventoryItemForm.tsx` skipped (orphaned component — exported but never imported by any page)

## Phase 1B: Rebuild Product Detail Page (Item Master) ✅ COMPLETE
- [x] 1B.10 — Separate Edit page from View page (different routes) ✅
- [x] 1B.1 — Build product detail header + quick stats bar + tab shell ✅
- [x] 1B.2 — Build Overview tab (description, specs, attributes, images) ✅
- [x] 1B.3 — Build Inventory tab (stock per warehouse, recent movements) ✅
- [x] 1B.4 — Build Pricing tab (staff only — waterfall, tier prices, margins) ✅
- [x] 1B.5 — Build Purchasing tab (staff only — suppliers, open POs, history) ✅ + backend endpoint
- [x] 1B.6 — Build BOM tab (staff only — component tree, reuses ProductBomTab) ✅
- [x] 1B.7 — Build Sales History tab (staff only — orders, customers, summary stats) ✅ + backend endpoint
- [x] 1B.8 — Build Documents tab (images, documents, with upload/delete) ✅
- [x] 1B.9 — Build Audit Log tab (staff only — timeline from stock movements) ✅

### Phase 1B Session Notes (2026-02-06)

**Architecture:**
- View page: `/inventory/items/[sku]` — read-only, 8 tabs, role-based visibility
- Edit page: `/inventory/items/[sku]/edit` — form for ADMIN/MANAGER only
- Components: `frontend/src/components/inventory/product-detail/` (10 component files + barrel index)

**New backend endpoints:**
- `GET /api/v1/products/:productId/purchase-history` — PO lines for product
- `GET /api/v1/products/:productId/sales-history` — SO lines for product with summary stats

**Tab visibility by role:**
| Tab | ADMIN/MANAGER | SALES | WAREHOUSE | PURCHASER | CUSTOMER |
|-----|:---:|:---:|:---:|:---:|:---:|
| Overview | ✓ | ✓ | ✓ | ✓ | redirected |
| Inventory | ✓ | ✓ | ✓ | ✓ | redirected |
| Pricing | ✓ | | | | |
| Purchasing | ✓ | | | ✓ | |
| BOM | ✓ | ✓ | ✓ | ✓ | |
| Sales History | ✓ | ✓ | | | |
| Documents | ✓ | ✓ | ✓ | ✓ | |
| Audit Log | ✓ | | | | |

**Key reuse:** WarehouseStockTable, StockOverviewCards, StockMovementsTable, AdjustStockModal, ProductBomTab, ProductImageGallery, ProductDocumentsList — all existing components composed into tabs.

**Files created:**
- `frontend/src/app/(portal)/inventory/items/[sku]/edit/page.tsx`
- `frontend/src/components/inventory/product-detail/` (10 files)

**Files modified:**
- `frontend/src/app/(portal)/inventory/items/[sku]/page.tsx` — complete rewrite
- `frontend/src/lib/api.ts` — added getProductPurchaseHistory, getProductSalesHistory
- `frontend/src/hooks/useProductInventory.ts` — added useProductPurchaseHistory, useProductSalesHistory
- `backend/src/api/v1/products/route.ts` — added 2 new endpoints

## Phase 3: Document Chain + Status Propagation
- [x] 3.1 — Build Sales Order detail page with fulfillment status panel ✅
- [x] 3.2 — Implement picking slip completion → order status update ✅ (done in Phase 0.8)
- [x] 3.3 — Implement job card completion → stock + order status update ✅ (done in Phase 0.8)
- [x] 3.4 — Implement transfer completion → stock + order status update ✅ (done in Phase 0.8)
- [x] 3.5 — Implement GRV → PO status + stock update propagation ✅ (done in Phase 0.1)
- [x] 3.6 — Build PO detail page with GRV history + linked orders ✅
- [x] 3.7 — Build Fulfillment Dashboard (picking queue, jobs, transfers, alerts) ✅
- [x] 3.8 — Add timeline/activity log to Sales Order page ✅
- [x] 3.9 — Multi-warehouse fulfillment orchestration (verified + fixed assembly→CT transfer gap) ✅

## Phase 2: Route Separation (ERP vs Customer Portal)
- [x] 2.1 — Create (customer) route group + layout infrastructure (CustomerAuthGuard, CustomerHeader, CustomerLayout) ✅
- [x] 2.2 — Login redirect + middleware + cross-guards (AuthGuard blocks CUSTOMER, QuoteCart role-aware) ✅
- [x] 2.3 — Build customer dashboard at /my/dashboard ✅
- [x] 2.4 — Build customer product catalog page (tier pricing, no internals) ✅
- [x] 2.5 — Build customer product detail page ✅
- [x] 2.6 — Build customer quotes list + detail pages ✅
- [x] 2.7 — Build customer orders list + detail pages ✅
- [x] 2.8 — Build customer account page ✅
- [x] 2.9 — Data leak audit + verification ✅

## Phase 4: Inventory Module (reordered: dashboard last)
- [x] 4.1 — Build Stock Movements page (filterable audit log) ✅
- [x] 4.2 — Build Stock Adjustment workflow (create → approve → apply) ✅
- [x] 4.4 — Build Reorder Report (below reorder point, suggested PO quantities) ✅
- [x] 4.5 — Build Cycle Count workflow (create session → count → reconcile) ✅
- [x] 4.3 — Build Inventory Dashboard (multi-warehouse summary, alerts) ✅

## Phase 5: Missing ERP Documents
- [x] 5.1 — Build Delivery Note model + create from order ✅
- [x] 5.2 — Build Proforma Invoice generation from Sales Order ✅
- [x] 5.3 — Build Purchase Requisition workflow ✅
- [x] 5.4 — Build Return Authorization process ✅
- [x] 5.5 — Build Packing List generation ✅

## Phase 6: Reports & Analytics
- [ ] 6.1 — Sales reports (by customer, product, category, conversion rate)
- [ ] 6.2 — Inventory reports (valuation, aging, dead stock, turnover)
- [ ] 6.3 — Purchasing reports (by supplier, open POs, lead time performance)
- [ ] 6.4 — Operations reports (fulfillment rate, picking accuracy, output)
