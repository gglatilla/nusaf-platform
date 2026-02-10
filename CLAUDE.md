# Nusaf Platform

## Project Overview

B2B web application for Nusaf Dynamic Technologies — conveyor components, power transmission, and industrial supplies. South Africa based (Johannesburg HQ, Cape Town, Mbombela).

**Architecture**: Lean system — your platform is the source of truth. No ERP dependency.
- Backend: Railway (Node.js + PostgreSQL)
- Frontend: Vercel (Next.js + TypeScript + Tailwind)
- Storage: Cloudflare R2 (documents, images)

---

## CRITICAL RULES

**YOU MUST** follow these rules without exception:

1. **ONE TASK AT A TIME** — Never work on multiple tasks simultaneously. Finish current task completely before starting next.

2. **READ SKILLS FIRST** — Before ANY implementation, read the relevant skill files in `.claude/skills/`. Skills contain the business rules and patterns.

3. **SEARCH BEFORE CREATE** — Before creating any new file, component, or function, search the codebase for existing implementations. Build on what exists.

4. **TEST WITH CODE** — Write tests alongside code, not after. Every micro-task that touches business logic must include its test.

5. **AUTO-PUSH ON COMPLETION** — After each micro-task completion: `git add . && git commit -m "..." && git push`

6. **UPDATE SESSION.md** — Keep `.claude/SESSION.md` current at ALL times. This is your memory between sessions.

---

## Workflow: Explore → Plan → Code → Test → Commit

For every task:

```
1. EXPLORE: Read relevant skills and existing code. Understand before coding.
2. PLAN: Break task into micro-tasks. Confirm plan before implementing.
3. CODE: Implement one micro-task at a time.
4. TEST: Write/run tests for the micro-task.
5. COMMIT: Auto-push with descriptive message. Update SESSION.md.
6. REPEAT: Next micro-task until task complete.
```

**IMPORTANT**: If unsure about business rules, CHECK THE SKILLS. If still unsure, ASK — don't guess.

---

## Before Starting Any New Task

Before beginning work on a new task, Claude MUST enter plan mode to:

1. Confirm understanding of the task
2. Ask clarifying questions about any ambiguities
3. Gather information not covered in the skills
4. Present the proposed approach
5. Get user approval before writing any code

**RULE**: Do NOT start coding until the user has answered all questions and approved the plan.

This applies to NEW tasks only, not to continuing micro-tasks within an already-approved task.

---

## Task Type → Skills Mapping

**MANDATORY**: When starting a task, identify its type(s) and read ALL corresponding skills.

| Task Type | Required Skills |
|-----------|-----------------|
| **UI/Frontend** | `domain/ui-ux-webapp`, `foundation/ui-component-system`, `domain/brand-identity` |
| **API/Backend** | `foundation/api-design-patterns`, `foundation/error-handling-logging` |
| **Database** | `foundation/database-design-b2b` |
| **Pricing** | `domain/pricing-product-domain` |
| **Auth/Security** | `foundation/authentication-authorization`, `foundation/security-best-practices` |
| **Orders/Quotes** | `domain/order-fulfillment-operations` |
| **Inventory** | `domain/inventory-management` |
| **Configurator** | `domain/product-configurator` |
| **Public Website** | `domain/website-design`, `domain/brand-identity` |

**Multiple types**: A task like "Product detail modal" is both UI/Frontend AND may touch API, so read skills for BOTH types.

**RULE**: If you haven't read the skills for the task type, you CANNOT start implementation.

---

## Context Compacting Protection

**Problem**: Long Claude Code sessions can trigger "compacting" where context is summarized and details are lost.

**Solution**: We keep state in FILES, not in Claude's memory.

### How We Protect Against Compacting

| Protection | How It Works |
|------------|--------------|
| **SESSION.md** | Current state saved to file after every micro-task |
| **Git commits** | Commit messages carry context ("Next: ...") |
| **Micro-tasks** | Small units = less to lose if compacting happens |
| **Auto-push** | State is in remote Git, not just local |
| **Skills in files** | Business rules don't need to be re-explained |

### Worst Case Scenario

If compacting happens mid-session:
- **Lost**: Current micro-task in progress (small)
- **Safe**: All completed micro-tasks (in Git)
- **Recovery**: User says `RELOAD`, Claude reads SESSION.md

### Signs That Compacting May Have Happened

- Claude asks about something that was already decided
- Claude seems to have forgotten the current task
- Claude's responses become more generic

**If you notice these signs**, immediately say:
```
RELOAD
```

---

## Session Management

### `.claude/SESSION.md` — Your Memory

This file MUST be kept updated. Structure:

```markdown
# Current Session

## Active Task
[TASK-XXX] Brief description

## Status
IN_PROGRESS | 40% complete

## Completed Micro-tasks
- [x] Created database migration for X
- [x] Built API endpoint for Y
- [ ] Build UI component for Z
- [ ] Write integration test

## Files Modified
- src/db/migrations/001_users.sql (created)
- src/api/users/route.ts (created)

## Decisions Made
- Using bcrypt with 12 rounds for password hashing
- Sessions stored in database, not JWT

## Next Steps (Exact)
1. Open src/components/auth/LoginForm.tsx
2. Create form with email/password fields
3. Add validation using Zod schema from src/lib/validations
4. Connect to /api/auth/login endpoint

## Context for Next Session
[Any important context that would be lost]
```

**RULE**: Before ending any session, SESSION.md must be fully updated with exact continuation instructions.

### `.claude/TASKS.md` — Task Queue

```markdown
# Task Queue

## Current
- [TASK-001] Description (IN_PROGRESS)

## Up Next
- [TASK-002] Description
- [TASK-003] Description

## Completed
- [TASK-000] Description ✓

## Blocked
- [TASK-010] Description (waiting on: TASK-005)
```

**RULE**: Only ONE task in "Current" at any time.

---

## Micro-task Definition

A micro-task is the smallest verifiable unit of work. Examples:

**Good micro-tasks:**
- Create database migration for users table
- Build LoginForm component with validation
- Add POST /api/auth/login endpoint
- Write unit test for price calculator

**Bad micro-tasks (too big):**
- Build authentication system
- Create customer portal
- Implement pricing engine

**RULE**: If a micro-task takes more than 30 minutes, it should be broken down further.

---

## Git Workflow

### Commit Message Format

```
TASK-XXX: Brief description of micro-task

- Bullet point of what was done
- Another bullet point

Next: What comes next
```

### After EVERY Micro-task (Mandatory)

This sequence happens after EVERY completed micro-task, no exceptions:

```bash
# 1. Commit the code
git add .
git commit -m "TASK-XXX: Description of what was done"

# 2. Update SESSION.md (mark micro-task complete, update next steps)
# Then commit it
git add .claude/SESSION.md
git commit -m "TASK-XXX: Update session state"

# 3. Push everything
git push
```

**IMPORTANT**: This is not optional. This is how we protect against losing work if context compacts.

### Why This Matters

If context compacts mid-session:
- ❌ Without this: All progress since session start is lost
- ✅ With this: Only the current micro-task in progress is lost (everything completed is in Git)

The SESSION.md in Git becomes the source of truth, not Claude's memory.

---

## Skills Reference

Skills are in `.claude/skills/`. **Read the skill BEFORE implementing.**

### Foundation Skills (Engineering)
| Skill | Use When |
|-------|----------|
| `foundation/project-architecture` | Setting up structure, deciding where code goes |
| `foundation/database-design-b2b` | Creating schemas, migrations, audit trails |
| `foundation/authentication-authorization` | Login, permissions, role-based access |
| `foundation/api-design-patterns` | Designing endpoints, request/response |
| `foundation/ui-component-system` | Building UI components |
| `foundation/testing-strategy` | Writing tests (CRITICAL for pricing/config) |
| `foundation/security-best-practices` | Security, POPIA compliance |
| `foundation/error-handling-logging` | Error handling, logging |
| `foundation/performance-optimization` | Optimizing slow code |
| `foundation/code-quality-standards` | Code style, naming |

### Domain Skills (Business Rules)
| Skill | Use When |
|-------|----------|
| `domain/pricing-product-domain` | Pricing formulas, supplier imports, EUR→ZAR |
| `domain/order-fulfillment-operations` | Quotes, orders, invoices, document flow |
| `domain/inventory-management` | Stock, reservations, reordering |
| `domain/multi-tenant-architecture` | Customer tiers, portal features, roles |
| `domain/product-configurator` | Modular chain configuration, SKUs, BOMs |
| `domain/brand-identity` | Colours, typography, design tokens |
| `domain/ui-ux-webapp` | Portal components, layouts, patterns |
| `domain/website-design` | Public site, product navigation |

**IMPORTANT**: Domain skills contain BUSINESS RULES. They are not suggestions — they are requirements.

---

## Security Requirements

**Non-negotiable. Check BEFORE every push:**

- [ ] No secrets/API keys in code (use environment variables)
- [ ] All user input validated server-side
- [ ] SQL queries parameterized (no string concatenation)
- [ ] Authentication required on protected routes
- [ ] Company isolation enforced (users only see their data)
- [ ] Passwords hashed with bcrypt (12+ rounds)
- [ ] HTTPS only
- [ ] POPIA compliant (see security skill)

**RULE**: If any checkbox fails, DO NOT push. Fix first.

---

## Performance Requirements

| Metric | Target | Maximum |
|--------|--------|---------|
| Page load (initial) | < 2s | < 4s |
| Page navigation | < 500ms | < 1s |
| API response (simple) | < 100ms | < 500ms |
| API response (complex) | < 500ms | < 2s |
| Pricing calculation | < 100ms | < 500ms |

**RULE**: If something feels slow, it IS slow. Investigate immediately.

### Performance Practices
- Use database indexes (see database skill)
- Avoid N+1 queries (use includes/joins)
- Paginate lists (default 20 items)
- Lazy load images
- Select only needed fields

---

## Code Quality

### TypeScript
- Strict mode enabled
- No `any` types
- Explicit return types on functions
- Zod for runtime validation

### Naming
- Files: kebab-case (`user-service.ts`)
- Components: PascalCase (`LoginForm.tsx`)
- Functions/variables: camelCase (`calculatePrice`)
- Database: snake_case (`created_at`)

### No Redundancy
**BEFORE creating anything new:**
1. Search codebase for existing implementation
2. Check if a utility/component already exists
3. Extend existing code rather than duplicate

**RULE**: If you find yourself writing similar code twice, abstract it.

---

## Testing Requirements

### What MUST Be Tested
- Pricing calculations (unit tests)
- Configurator rules (unit tests)
- API endpoints (integration tests)
- Authentication/authorization (integration tests)
- Critical user flows (E2E tests for major features only)

### What Doesn't Need Tests
- Simple UI components (visual review is fine)
- Database migrations (migration itself is the test)
- Static pages

### Test Location
```
/tests
├── unit/           # Business logic
├── integration/    # API, database
└── e2e/            # Critical flows only
```

---

## Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run typecheck    # Run TypeScript check

# Testing
npm run test         # Run all tests
npm run test:unit    # Unit tests only
npm run test:watch   # Watch mode

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed test data
npm run db:studio    # Open Prisma Studio

# Code Quality
npm run lint         # Run linter
npm run format       # Format code
```

---

## Domain Knowledge

### Suppliers
- **Chiaravalli** (Italy) — Power transmission, uses their SKUs
- **Regina** (Italy) — Conveyor chain, uses their SKUs
- **Tecom** (Italy) — Components, complex SKU conversion required
- **Local** — Manufacturing in JHB, ZAR pricing

### Customer Tiers
| Tier | Discount off List |
|------|------------------|
| End User | 30% |
| OEM/Reseller | 40% |
| Distributor | 50% |

### Locations
| Location | Warehouse | Manufacturing | Sales |
|----------|-----------|---------------|-------|
| Johannesburg | ✓ Main | ✓ | ✓ |
| Cape Town | ✓ Finished only | ✗ | ✓ |
| Mbombela | ✗ | ✗ | ✓ |

### Pricing Formula (Imported)
```
Supplier Price (Gross/Net)
→ Apply discount if Gross
→ × EUR/ZAR rate
→ × Freight %
→ ÷ Margin divisor
→ × 1.40 (always)
= List Price
```

See `domain/pricing-product-domain` for full details.

---

## Session Commands

### Starting a New Session (User says "lets begin")

When user says `lets begin` or `let's begin`:

1. Read `.claude/SESSION.md` — understand current state
2. Read `.claude/TASKS.md` — understand task queue
3. **Identify the current/next task and look up required skills in the Task Type → Skills mapping**
4. **Read ALL required skill files for that task type**
5. Provide summary to user:
   - What was completed last session
   - Current task and progress
   - Skills that were read
   - Next micro-task to work on
6. **IF this is a NEW task (not continuing micro-tasks):**
   - **ENTER PLAN MODE**
   - Explore codebase for relevant patterns
   - Create plan with micro-tasks
   - Wait for user approval before ANY code
7. **IF continuing an existing task:**
   - Wait for user to say "go" before continuing

Example response (NEW task):
```
## Session Summary

**Current task:** [TASK-008] Product detail modal (NEW)

**Skills read:**
- domain/ui-ux-webapp
- foundation/ui-component-system
- domain/brand-identity

**Status:** Entering plan mode to create implementation plan.

[Claude then explores codebase and creates plan]
```

Example response (CONTINUING task):
```
## Session Summary

**Last session completed:**
- Created ProductDetailModal component
- Added API method for product details

**Current task:** [TASK-008] Product detail modal (60% complete)

**Next micro-task:** Wire up modal open/close in ProductCard

**Skills already loaded:** ui-ux-webapp, ui-component-system

Ready to continue? Say "go" to proceed.
```

### Saving State (User says "please save")

When user types `please save`:

1. Stop current work immediately
2. Update `.claude/SESSION.md` with FULL current state including:
   - Exactly which micro-task was in progress
   - Any decisions made this session
   - Exact next steps
3. Commit all changes: `git add . && git commit -m "SAVE: [current task status]"`
4. Push: `git push`
5. Confirm to user: "State saved. You can safely close this session."

**Note**: Only trigger on "please save" — not just the word "save" in normal conversation.

### Quick Save (After every micro-task — automatic)

After EVERY completed micro-task, Claude MUST automatically:
1. Commit the code: `git add . && git commit -m "TASK-XXX: [description]"`
2. Update SESSION.md with new state
3. Commit SESSION.md: `git add .claude/SESSION.md && git commit -m "TASK-XXX: Update session state"`
4. Push everything: `git push`

**WHY**: This protects against context compacting. If compacting happens, the worst case is losing only the current micro-task in progress — all completed work is safely in Git.

### If Context Gets Compacted (User says "RELOAD")

If Claude seems to have lost context mid-session, user says:

```
RELOAD
```

Claude will:
1. Re-read `.claude/SESSION.md`
2. Re-read `.claude/TASKS.md`
3. Re-read relevant skills for current task
4. Tell user where we are and what's next

---

## When Starting a New Session

1. Wait for user to say "lets begin"
2. Read SESSION.md, TASKS.md, and relevant skills
3. Provide summary of: completed work, current position, next steps
4. Wait for user to say "go" before starting work
5. Do NOT start anything new until current task is complete

---

## When Stuck

1. Re-read the relevant skill file
2. Search codebase for similar implementations
3. Check if it's a business rule question (ask user)
4. If technical, think step-by-step before trying solutions

**NEVER guess on business rules. ASK.**

---

## File Structure

```
/
├── CLAUDE.md               # This file (project root)
├── .claude/
│   ├── SESSION.md          # Current session state
│   ├── TASKS.md            # Task queue
│   └── skills/
│       ├── foundation/     # Engineering skills
│       └── domain/         # Business skills
├── src/
│   ├── app/                # Next.js app router
│   ├── components/         # React components
│   ├── lib/                # Utilities, database
│   └── types/              # TypeScript types
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── prisma/
    └── schema.prisma       # Database schema
```

---

*This file is read at the start of every session. Keep it accurate.*
