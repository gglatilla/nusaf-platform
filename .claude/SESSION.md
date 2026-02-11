# Current Session

## Active Task
Phase 4: Notification System — COMPLETE

## Plan
See `.claude/plans/lovely-scribbling-cake.md`

## Completed Micro-tasks

### Phase 4.1: DB Schema + Notification Service (3a89d40)
- Added `NotificationType` enum and `Notification` model to Prisma schema
- Created migration `20260213100000_add_notifications`
- Created `notification.service.ts` with CRUD, recipient resolution, and 10 trigger functions
- 16 unit tests passing

### Phase 4.2: API Routes (621338f)
- Created `/api/v1/notifications` with 5 endpoints (list, unread-count, mark-read, mark-all-read, delete)
- Zod validation for query params, user isolation via req.user

### Phase 4.3: Frontend Hook + NotificationBell + Staff Header (6d0a31b)
- Added notification types + API methods to `api.ts`
- Created `useNotifications.ts` hook (30s polling for unread count)
- Created `NotificationBell.tsx` component (bell icon, dropdown, role-aware navigation)
- Added to staff `Header.tsx`

### Phase 4.4: Customer Header Integration (912a0a2)
- Added `NotificationBell` to `CustomerHeader.tsx`

### Phase 4.5: Email Templates + Trigger Integration (19d5973)
- Added 3 customer email templates (order confirmed, dispatched, ready for collection)
- Wired notification triggers into all 6 fulfillment services
- Customer triggers send both in-app notification + email
- READY_TO_SHIP detection after picking/job-card/transfer completion
- All triggers fire-and-forget (try/catch wrapped)

## Context for Next Session
- Phase 4 (Notification System) is COMPLETE
- Migration pending on Railway: `20260213100000_add_notifications`
- Notifications are polling-based (30s React Query refetch), no WebSocket/SSE
- Bell dropdown in both staff and customer headers
- Email sending requires SMTP config (env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM)
- Pre-existing test issue: `import.service.test.ts` fails due to missing `@nusaf/shared` module (unrelated)
