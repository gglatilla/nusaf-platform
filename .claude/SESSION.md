# Current Session

## Active Task
Fix Railway Deployment (SIGTERM + P1001) — COMPLETE

## Plan
See `.claude/plans/structured-popping-toucan.md`

## Completed Micro-tasks

### Fix: Railway Deployment Crash Loop
- Added graceful shutdown handlers (SIGTERM/SIGINT) — drains requests, disconnects DB, exits cleanly
- Added `unhandledRejection` and `uncaughtException` global error handlers
- Database connection retry: 5 attempts with exponential backoff (1s, 2s, 4s, 8s, 16s)
- Separated `prisma migrate deploy` from `startCommand` — migrations now run manually via `railway run`
- Added Railway health check config: `/api/v1/health` with 120s timeout
- Updated `.env.example` with connection pool parameters
- All 151 tests pass, backend type check clean

## Context for Next Session
- **Migrations**: No longer auto-run on deploy. Run manually: `railway run npx prisma migrate deploy`
- Pending migration: `20260214100000_add_order_received_notification`
- **Railway DB check needed**: If P1001 persists after deploy, the PostgreSQL service itself is down — check Railway dashboard
- Pre-existing test issue: `import.service.test.ts` fails due to missing `@nusaf/shared` module (unrelated)
