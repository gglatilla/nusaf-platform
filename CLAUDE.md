# Nusaf Platform

B2B web application for Nusaf Dynamic Technologies — conveyor components, power transmission, and industrial supplies. South Africa based (Johannesburg HQ, Cape Town, Mbombela).

**Architecture**: Lean system — your platform is the source of truth. No ERP dependency.
- Backend: Railway (Node.js + PostgreSQL)
- Frontend: Vercel (Next.js + TypeScript + Tailwind)
- Storage: Cloudflare R2 (documents, images)

---

## CRITICAL RULES

1. **ONE TASK AT A TIME** — Finish current task before starting next.
2. **READ SKILLS FIRST** — Read `.claude/skills/` for the task type before implementing.
3. **SEARCH BEFORE CREATE** — Search codebase for existing implementations before writing new code.
4. **TEST WITH CODE** — Every micro-task touching business logic must include its test. Minimum: unit tests for services, integration tests for API routes.
5. **AUTO-PUSH ON COMPLETION** — After each micro-task: commit, update SESSION.md, push.
6. **UPDATE SESSION.md** — Keep `.claude/SESSION.md` current. This is your memory between sessions.

---

## Type Safety Rules

### No `any` Types
- No `any` type annotations anywhere
- No `as` type casts except in middleware internals (`auth.ts`, `company-scope.ts`)
- Express request typing uses declaration merging (`backend/src/types/express.d.ts`) — access via `req.user!` not `req as AuthenticatedRequest`
- If TypeScript can't infer a type, define a proper interface

### Explicit Return Types
- **Required on**: named functions, exported functions, class methods, const arrow functions assigned at module or component scope
- **Not required on**: inline callbacks (`.map()`, `.filter()`, event handlers passed directly to JSX props)
- Example: `const handleSubmit = async (): Promise<void> => {` (required), `items.map((item) => item.id)` (not required)

### Zod for Runtime Validation
- All API request bodies validated with Zod schemas
- Zod schemas are the source of truth for request types

---

## Shared Utilities Registry

**BEFORE writing formatting, number generation, or math helpers, check these files:**

| Utility | Location | Exports |
|---------|----------|---------|
| Currency/date formatting | `frontend/src/lib/formatting.ts` | `formatCurrency`, `formatCurrencyPrecise`, `formatDate`, `formatDateLong`, `formatDateCompact`, `formatDateTime`, `formatDateTimeLong`, `formatNumber` |
| Document number generation | `backend/src/utils/number-generation.ts` | `generateOrderNumber`, `generateQuoteNumber`, `generatePONumber`, + 15 more. Also `generateDocumentNumberTx` for use inside `$transaction` blocks |
| Math rounding | `backend/src/utils/math.ts` | `roundTo2`, `roundTo4` |
| URL construction | `frontend/src/lib/urls.ts` | URL builder utilities |

**RULE**: If you need `formatCurrency`, `formatDate`, `roundTo2`, or `generateXxxNumber`, import from these files. Never create local copies.

---

## Workflow: Explore -> Plan -> Code -> Test -> Commit

For every task:
1. **EXPLORE**: Read relevant skills and existing code
2. **PLAN**: Break into micro-tasks (3-5 files each, single focused commit). Confirm plan before implementing.
3. **CODE**: One micro-task at a time
4. **TEST**: Write/run tests for the micro-task
5. **COMMIT**: Auto-push with descriptive message. Update SESSION.md.
6. **REPEAT**: Next micro-task until task complete

**New tasks**: Enter plan mode, explore codebase, create plan, get user approval before any code.

---

## Task Type -> Skills Mapping

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

**Multiple types**: Read skills for ALL matching types. Domain skills are REQUIREMENTS, not suggestions.

---

## Code Quality

### Naming
- Files: kebab-case (`user-service.ts`)
- Components: PascalCase (`LoginForm.tsx`)
- Functions/variables: camelCase (`calculatePrice`)
- Database: snake_case (`created_at`)

### No Redundancy
1. Search codebase for existing implementation
2. Check shared utilities registry above
3. Extend existing code rather than duplicate

---

## Testing Requirements

### What MUST Be Tested
- Pricing calculations (unit tests)
- Service functions with business logic (unit tests)
- Configurator rules (unit tests)
- API endpoints (integration tests)
- Authentication/authorization (integration tests)

### What Doesn't Need Tests
- Simple UI components (visual review)
- Database migrations
- Static pages

### Test Framework
- **Vitest** with globals (`tests/**/*.test.ts`)
- Mocking pattern: `vi.hoisted()` + `vi.mock()` (see `tests/unit/services/pricing.service.test.ts`)
- Test location: `tests/unit/` (business logic), `tests/integration/` (API/database), `tests/e2e/` (critical flows)

---

## Security Requirements

Non-negotiable — check before every push:
- No secrets/API keys in code (use environment variables)
- All user input validated server-side (Zod)
- SQL queries parameterized (Prisma handles this)
- Authentication required on protected routes
- Company isolation enforced (users only see their data)
- Passwords hashed with bcrypt (12+ rounds)
- POPIA compliant (see security skill)

---

## Performance Requirements

| Metric | Target | Maximum |
|--------|--------|---------|
| Page load (initial) | < 2s | < 4s |
| Page navigation | < 500ms | < 1s |
| API response (simple) | < 100ms | < 500ms |
| API response (complex) | < 500ms | < 2s |

Practices: database indexes, avoid N+1 queries, paginate lists (default 20), lazy load images, select only needed fields.

---

## Session Management

### SESSION.md Structure
```markdown
## Active Task
[TASK-XXX] Brief description — IN_PROGRESS | X% complete

## Completed Micro-tasks
- [x] Done item
- [ ] Pending item

## Next Steps (Exact)
1. What to do next
2. Step 2

## Context for Next Session
[Key decisions, blockers, important notes]
```

### Session Commands
- **`lets begin`**: Read SESSION.md + TASKS.md + relevant skills. Summarize state. New task -> plan mode. Continuing -> wait for "go".
- **`please save`**: Stop work, update SESSION.md fully, commit all, push, confirm saved.
- **`RELOAD`**: Re-read SESSION.md, TASKS.md, and skills. Report where we are.

### Git Workflow
```
TASK-XXX: Brief description
```
After every micro-task: `git add . && git commit && git push`. SESSION.md update can be in same commit during sprint mode.

---

## Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production

# Testing
npx vitest run           # Run all tests
npx vitest run --watch   # Watch mode

# Typecheck
cd frontend && npx tsc --noEmit    # Frontend
cd backend && npx tsc --noEmit     # Backend

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed test data
npm run db:studio        # Open Prisma Studio
```

---

## Domain Knowledge

See `docs/reference/domain-knowledge.md` for: suppliers, customer tiers, locations, pricing formula, fulfillment flows.

Quick reference:
- **Pricing**: EUR cost -> x rate -> x freight -> / margin -> x 1.40 = List Price
- **Tiers**: End User 30%, OEM 40%, Distributor 50% off list
- **Warehouses**: JHB (main + manufacturing), CT (finished goods), MBB (sales only)

---

## File Structure

```
/
+-- CLAUDE.md                   # This file
+-- .claude/
|   +-- SESSION.md              # Current session state
|   +-- TASKS.md                # Task queue (lean)
|   +-- skills/                 # Business rules + engineering patterns
+-- frontend/src/
|   +-- app/                    # Next.js app router
|   +-- components/             # React components
|   +-- lib/                    # Utilities (formatting.ts, urls.ts, etc.)
|   +-- hooks/                  # React hooks
+-- backend/src/
|   +-- api/v1/                 # API routes
|   +-- services/               # Business logic
|   +-- utils/                  # Shared utilities (number-generation.ts, math.ts)
|   +-- types/                  # Type augmentations (express.d.ts)
|   +-- middleware/              # Auth, company scope
+-- tests/
|   +-- unit/                   # Business logic tests
|   +-- integration/            # API + database tests
|   +-- e2e/                    # Critical flow tests
+-- docs/
|   +-- reference/              # Domain knowledge, fulfillment flows
|   +-- specs/                  # Task specifications
|   +-- audit/                  # Audit reports
+-- prisma/
    +-- schema.prisma           # Database schema
```

---

*This file is read at the start of every session. Keep it accurate and concise.*
