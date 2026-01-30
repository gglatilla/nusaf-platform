# Current Session

## Active Task
[TASK-012] Phase 2B: Job Cards for Manufacturing/Assembly

## Status
COMPLETE | 100%

## Plan
Build Job Cards system for manufacturing/assembly tracking:
- Database: JobCard, JobCardCounter models with JobCardStatus and JobType enums
- Backend: job-card.service.ts with CRUD + status transitions (start, hold, resume, complete)
- API: /job-cards routes following picking slip pattern
- Frontend: Job cards list page, detail page, components
- Integration: Create job cards from confirmed orders, show on order detail

## Micro-tasks (Phase 2B - 11 total)

### Phase A: Database
- [x] 1. Add JobCardStatus, JobType enums and JobCard, JobCardCounter models to schema.prisma
- [x] 2. Create migration file

### Phase B: Backend Service
- [x] 3. Create job-card.service.ts with generateNumber, create, list, get functions
- [x] 4. Add status transition functions (assign, start, hold, resume, complete, updateNotes)

### Phase C: Validation & Routes
- [x] 5. Create validation/job-cards.ts Zod schemas
- [x] 6. Create api/v1/job-cards/route.ts endpoints

### Phase D: Frontend Types & API
- [x] 7. Add JobCard types and API methods to lib/api.ts

### Phase E: Frontend Hooks
- [x] 8. Create useJobCards.ts hooks

### Phase F: Frontend Components
- [x] 9. Create JobCardStatusBadge, JobTypeBadge, JobCardListTable, CreateJobCardModal

### Phase G: Frontend Pages
- [x] 10. Create /job-cards list page
- [x] 11. Create /job-cards/[id] detail page

### Phase H: Integration
- [x] 12. Update order detail page with Job Cards section + Create button

## Files Created

### Backend
- `backend/prisma/migrations/20260130000004_add_job_cards/migration.sql`
- `backend/src/services/job-card.service.ts`
- `backend/src/utils/validation/job-cards.ts`
- `backend/src/api/v1/job-cards/route.ts`

### Frontend
- `frontend/src/hooks/useJobCards.ts`
- `frontend/src/components/job-cards/JobCardStatusBadge.tsx`
- `frontend/src/components/job-cards/JobTypeBadge.tsx`
- `frontend/src/components/job-cards/JobCardListTable.tsx`
- `frontend/src/components/job-cards/CreateJobCardModal.tsx`
- `frontend/src/app/(portal)/job-cards/page.tsx`
- `frontend/src/app/(portal)/job-cards/[id]/page.tsx`

## Files Modified
- `backend/prisma/schema.prisma` - Added JobCardStatus, JobType enums, JobCard, JobCardCounter models
- `backend/src/index.ts` - Added job-cards route
- `frontend/src/lib/api.ts` - Added job card types and API methods
- `frontend/src/lib/navigation.ts` - Added Job Cards to sidebar navigation
- `frontend/src/app/(portal)/orders/[id]/page.tsx` - Added Create Job Card button and job cards section

## Skills Read
- domain/order-fulfillment-operations
- foundation/api-design-patterns
- foundation/database-design-b2b
- domain/ui-ux-webapp

## Decisions Made
- Job card number format: JC-YYYY-NNNNN (consistent with order/picking slip pattern)
- Link directly to SalesOrder + SalesOrderLine (not to Picking Slips)
- Created manually from Order detail page (no product flag)
- Always JHB warehouse (only location with manufacturing)
- Status workflow: PENDING → IN_PROGRESS ↔ ON_HOLD → COMPLETE
- ON_HOLD requires holdReason
- Two job types: MACHINING and ASSEMBLY
- Can only create job cards for CONFIRMED or PROCESSING orders
- Company isolation: All queries filter by authenticated user's companyId

## Verification Steps
1. Start backend and frontend servers
2. Navigate to /orders, open a confirmed order
3. Click "Create Job Card"
4. Select an order line, choose job type (Machining or Assembly), add notes
5. Click "Create"
6. Verify job card appears in order detail's Job Cards section
7. Navigate to /job-cards to see the new job card
8. Open job card detail page
9. Test workflow: Assign → Start → Hold (with reason) → Resume → Complete
10. Verify status changes and timestamps update correctly

## Next Task
Ready for:
- [TASK-013] Inventory tracking
- Transfer Requests (JHB→CT shipping)
