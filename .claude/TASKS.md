# Task Queue

## Current
- [TASK-001] Project initialization and setup (NOT_STARTED)

## Up Next
- [TASK-002] Database schema — Core tables (users, companies, products)
- [TASK-003] Authentication system (login, logout, sessions)
- [TASK-004] Customer portal layout (sidebar, header, main content)
- [TASK-005] Product catalog — Display products with categories
- [TASK-006] Pricing engine — Calculate prices per customer tier

## Backlog
- [TASK-010] Supplier price list import
- [TASK-011] Quote creation flow
- [TASK-012] Order management
- [TASK-013] Inventory tracking
- [TASK-014] Modular chain configurator
- [TASK-015] Public website — Homepage
- [TASK-016] Public website — Product pages

## Completed
(none yet)

## Blocked
(none yet)

---

## Task Breakdown Guidelines

Each task above should be broken into micro-tasks when worked on.

**Example breakdown for TASK-003 (Authentication):**
```
Micro-tasks:
- [ ] Create users table migration
- [ ] Create sessions table migration
- [ ] Build password hashing utility
- [ ] Create POST /api/auth/register endpoint
- [ ] Create POST /api/auth/login endpoint
- [ ] Create POST /api/auth/logout endpoint
- [ ] Build LoginForm component
- [ ] Build RegisterForm component
- [ ] Add session middleware
- [ ] Write auth integration tests
```

Break down tasks BEFORE starting implementation.
