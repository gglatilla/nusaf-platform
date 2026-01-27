# Current Session

## Active Task
[TASK-004] Customer Portal Layout

## Status
COMPLETED | 100% complete

## Completed Micro-tasks
### Phase 1: Navigation Config
- [x] Create lib/navigation.ts with main/secondary nav items

### Phase 2: Layout Components
- [x] Create Sidebar.tsx (dark theme, responsive, collapsed state)
- [x] Create Header.tsx (mobile hamburger, logo)
- [x] Create PageHeader.tsx (title, description, actions)
- [x] Create MainLayout.tsx (combines all, handles state)
- [x] Create index.ts barrel export

### Phase 3: Portal Layout
- [x] Create app/(portal)/layout.tsx with AuthGuard wrapper
- [x] Update dashboard page to use new layout

## Files Modified
**New files:**
- frontend/src/lib/navigation.ts
- frontend/src/components/layout/Sidebar.tsx
- frontend/src/components/layout/Header.tsx
- frontend/src/components/layout/PageHeader.tsx
- frontend/src/components/layout/MainLayout.tsx
- frontend/src/components/layout/index.ts
- frontend/src/app/(portal)/layout.tsx

**Modified:**
- frontend/src/app/(portal)/dashboard/page.tsx

## Decisions Made
- Built components from scratch (no shadcn/ui) to keep it lean
- Sidebar: 240px full, 64px collapsed, drawer for mobile
- Using Zustand auth store in Sidebar for user info and logout
- Portal layout wraps all (portal) routes with AuthGuard + MainLayout

## Layout Architecture
```
┌─────────────────────────────────────────────────────────────┐
│  Dark Sidebar (240px)  │  Main Content Area (fluid)        │
│  - Logo                │  ┌─────────────────────────────┐  │
│  - Navigation          │  │  Header (mobile only)       │  │
│  - User Menu           │  ├─────────────────────────────┤  │
│                        │  │  PageHeader (per page)      │  │
│                        │  ├─────────────────────────────┤  │
│                        │  │  Page Content               │  │
│                        │  │  (Snow #F8FAFC background)  │  │
│                        │  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Test Credentials
- Customer: test@example.com / password123
- Admin: admin@nusaf.co.za / admin123

## Quick Fix Applied
**Domain Routing for app.nusaf.net** (2026-01-27)

Modified `frontend/src/middleware.ts`:
- Added `portalDomains` array: `['app.nusaf.net', 'app.nusaf.co.za']`
- Detects hostname from request headers
- Redirects `/` to `/login` on portal domains
- `www.nusaf.net` continues to show landing page (no redirect)

Commit: `e9a8ad2` - pushed to trigger Vercel deployment

## Verification Steps
1. Visit `https://app.nusaf.net/` → Should redirect to `/login`
2. Visit `https://app.nusaf.net/login` → Should show login form
3. Visit `https://www.nusaf.net/` → Should show landing page
4. Login with test credentials → Should go to `/dashboard`

## Test Credentials
- Customer: test@example.com / password123
- Admin: admin@nusaf.co.za / admin123

## Context for Next Session
- TASK-004 (Customer Portal Layout) is complete
- Domain routing fix deployed - `app.nusaf.net` now redirects `/` to `/login`
- Ready for next task
