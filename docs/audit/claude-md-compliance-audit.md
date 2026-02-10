# CLAUDE.md Compliance Audit Report

**Date**: 2026-02-10
**Scope**: Last 30 commits, ~50 recently modified files, all CLAUDE.md rules
**Auditor**: Claude (self-audit, read-only)
**Codebase Size**: 360 frontend files, 112 backend files, 3 test files

---

## 1. Executive Summary

The codebase is **functionally sound** with no P0 (functionality-breaking) violations found. However, there are **systemic P1 convention violations** across three major areas:

| Category | Severity | Scope |
|----------|----------|-------|
| **Missing explicit return types** | P1 | 28+ functions across 10 frontend files |
| **Unsafe type casting (`as`)** | P1 | 172 occurrences across 28 backend files |
| **Missing tests for business logic** | P1 | 5 of last 15 commits touched business logic without tests |
| **Git workflow non-compliance** | P1 | ~87% of commits violate prescribed format |
| **SESSION.md update batching** | P1 | ~5:1 code-to-session commit ratio (should be 1:1) |
| **Code duplication** | P2 | 2 utility patterns repeated 6+ times each |

**Bottom line**: The code works correctly, but the process guardrails defined in CLAUDE.md are being widely ignored. The most dangerous gap is the missing test coverage for business logic — this is a ticking time bomb.

---

## 2. Full Violation Catalog

### 2.1 TypeScript: Missing Explicit Return Types (P1)

**Rule violated**: "Explicit return types on functions" (CLAUDE.md > Code Quality > TypeScript)

28 violations across 10 files. Every inline arrow function and event handler lacks an explicit return type annotation.

| File | Line(s) | Function(s) |
|------|---------|-------------|
| `frontend/src/components/products/ProductContentEditor.tsx` | 166, 173, 185, 189, 193, 197, 201 | handleChange, handleSubmit, handleImageUpload, handleSetPrimaryImage, handleDeleteImage, handleDocumentUpload, handleDeleteDocument |
| `frontend/src/components/products/ProductEditor.tsx` | 226, 264, 281 | validate, handleSubmit, handleChange |
| `frontend/src/components/orders/OrderActionMenu.tsx` | 63, 76 | handleClickOutside, handleEscape |
| `frontend/src/components/orders/OrderListTable.tsx` | 15, 22, 30 | formatCurrency, formatDate, SkeletonRow |
| `frontend/src/lib/navigation.ts` | 132 | filterNavByRole |
| `frontend/src/components/layout/Sidebar.tsx` | 23, 48 | NavLink, handleLogout |
| `frontend/src/app/(customer)/my/deliveries/page.tsx` | 11 | formatDate |
| `frontend/src/app/(customer)/my/invoices/page.tsx` | 9, 16 | formatCurrency, formatDate |
| `frontend/src/app/(customer)/my/orders/page.tsx` | 49 | updateUrl |

**Pattern**: This is the single most common violation. Every recently-created file has it. The convention is stated but never enforced.

---

### 2.2 TypeScript: `any` Type Usage (P1)

**Rule violated**: "No `any` types" (CLAUDE.md > Code Quality > TypeScript)

| File | Line | Context |
|------|------|---------|
| `frontend/src/app/(portal)/reports/sales/page.tsx` | 348 | `(value: string, entry: any)` — Recharts formatter callback |

**Status**: Only 1 occurrence across the entire codebase. This is excellent compliance.

---

### 2.3 TypeScript: Unsafe Type Casting with `as` (P1)

**Rule violated**: "No `any` types" / "Strict mode enabled" (CLAUDE.md > Code Quality > TypeScript)

While `as` casts are not literally `any`, they bypass TypeScript's type checker in a similar way. There are **172 total occurrences** across the backend:

| Pattern | Count | Files |
|---------|-------|-------|
| `req as unknown as AuthenticatedRequest` (double cast) | 96 | 13 route files |
| `req as AuthenticatedRequest` (single cast) | 76 | 15 route files |
| **Total** | **172** | **28 files** |

**Root cause**: The Express middleware types the `req` parameter as `Request`, but the auth middleware adds `.user` to it. Rather than typing the middleware properly, every single route handler casts `req` to `AuthenticatedRequest`.

**Additional casts found in backend services:**
- `backend/src/api/v1/products/route.ts`: `as Record<string, unknown>` (lines 290, 306, 323)
- `backend/src/services/job-card.service.ts`: `as Prisma.InputJsonValue` (line 551)

---

### 2.4 Test Coverage (P1 — CRITICAL)

**Rule violated**: "TEST WITH CODE — Write tests alongside code, not after. Every micro-task that touches business logic must include its test." (CLAUDE.md > CRITICAL RULES > #4)

**Also**: "API endpoints (integration tests)" and "Pricing calculations (unit tests)" — MUST be tested (CLAUDE.md > Testing Requirements)

**Total test files in project: 3**
- `tests/unit/services/pricing.service.test.ts` (14KB)
- `tests/unit/services/import.service.test.ts` (6.7KB)
- `tests/integration/stock-flows.test.ts` (26KB)

**Recent commits with business logic but NO tests:**

| Commit | Description | Business Logic | Severity |
|--------|-------------|----------------|----------|
| `4af5e2f` | Product completeness scoring utility | Weighted scoring algorithm, canPublish flag | CRITICAL |
| `3a065ce` | Add marketing fields to GET /products/:id | API contract change, new response fields | CRITICAL |
| `4621853` | T39: Prepay payment triggers fulfillment | Auto-fulfillment on payment, revenue-impacting | CRITICAL |
| `36b95a7` | T38: Job card reservation release | Inventory release on job completion | CRITICAL |
| `313919a` | Phase 3: Redesign order detail actions | Backend service changes to order flow | HIGH |

**Coverage gap analysis:**

| Area | CLAUDE.md Requirement | Existing Tests | Gap |
|------|----------------------|----------------|-----|
| Pricing calculations | Unit tests (MUST) | pricing.service.test.ts | Covered |
| Import logic | Unit tests | import.service.test.ts | Covered |
| Stock operations | Integration tests | stock-flows.test.ts | Covered |
| API endpoints (13+ route files) | Integration tests (MUST) | NONE | **MASSIVE GAP** |
| Authentication/authorization | Integration tests (MUST) | NONE | **MASSIVE GAP** |
| Product completeness scoring | Unit tests | NONE | GAP |
| Payment/fulfillment logic | Integration tests | NONE | GAP |
| Job card lifecycle | Unit tests | NONE | GAP |
| Order service (750+ lines) | Integration tests | NONE | GAP |
| Quote service (975+ lines) | Integration tests | NONE | GAP |

**Conclusion**: Testing is the most severely violated rule in CLAUDE.md. The 3 existing test files cover only pricing, imports, and stock flows. Every other service and API endpoint is untested.

---

### 2.5 Git Commit Message Format (P1)

**Rule violated**: Commit messages should follow `TASK-XXX: Brief description` with bullet points and `Next:` line (CLAUDE.md > Git Workflow > Commit Message Format)

**Analysis of last 30 commits:**

| Category | Count | Compliance |
|----------|-------|------------|
| Fully compliant (TASK-XXX: + bullets + Next:) | 4 | 13% |
| Partial (TASK-XXX: prefix only, no body) | 0 | — |
| Wrong prefix (`Phase N:`, `UI-AUDIT Phase N:`) | 7 | 0% |
| Wrong prefix (`TNN:` instead of `TASK-XXX:`) | 13 | 0% |
| SAVE commits (separate format) | 6 | N/A |
| **Total compliant** | **4/24** | **17%** |

**Specific violations in T-series commits (13 commits):**
1. Use `TNN:` instead of `TASK-XXX:` prefix
2. Have completely empty commit bodies (no bullet points)
3. Have no `Next:` line

**Specific violations in UI-AUDIT commits (7 commits):**
1. Use `Phase N:` instead of `TASK-XXX:` prefix
2. Missing `Next:` line (though they do have bullet bodies)

---

### 2.6 Git Workflow: SESSION.md Update Frequency (P1)

**Rule violated**: "After EVERY completed micro-task" there should be a separate SESSION.md commit (CLAUDE.md > Git Workflow > After EVERY Micro-task)

**Expected pattern:**
```
code commit → SESSION.md commit → code commit → SESSION.md commit
```

**Actual pattern:**
```
code commit → code commit → code commit → code commit → code commit → SAVE commit
```

| Session | Code Commits | Session Commits | Ratio (should be 1:1) |
|---------|-------------|-----------------|----------------------|
| TASK-023 (recent) | 5 | 1 | 5:1 |
| UI-AUDIT phases | 7 | 1 | 7:1 |
| ERP T-series (T28-T40) | 13 | 4 | ~3:1 |

**Impact**: If context compacting occurs between code commits, all un-documented micro-tasks would be lost. This directly undermines the stated protection strategy.

---

### 2.7 SESSION.md Structure (P1)

**Rule violated**: SESSION.md must contain all 8 required sections (CLAUDE.md > Session Management)

| Required Section | Present? | Notes |
|-----------------|----------|-------|
| `# Current Session` | Yes | |
| `## Active Task` | Yes | |
| `## Status` | Yes | |
| `## Completed Micro-tasks` | **Renamed** | Uses "## Completed This Session" with phase subsections |
| `## Files Modified` | **Missing** | Has "## Key Files Created" instead (only new files, not all modified) |
| `## Decisions Made` | **Missing** | Not present at all |
| `## Next Steps (Exact)` | **Renamed** | Uses "## Next Steps" (missing "(Exact)") |
| `## Context for Next Session` | Yes | |

**Compliance**: 5/8 sections present (62%), with naming variations on 2 more.

---

### 2.8 Code Duplication (P2)

**Rule violated**: "If you find yourself writing similar code twice, abstract it." (CLAUDE.md > Code Quality > No Redundancy)

**Pattern 1: Number Generation (6 occurrences)**

The same `generateXXXNumber()` pattern exists in:
1. `backend/src/services/order.service.ts` — `generateOrderNumber()`
2. `backend/src/services/payment.service.ts` — `generatePaymentNumber()`
3. `backend/src/services/job-card.service.ts` — `generateJobCardNumber()`
4. `backend/src/services/purchase-order.service.ts` — `generatePONumber()`
5. `backend/src/services/grv.service.ts` — `generateGRVNumber()`
6. `backend/src/services/cycle-count.service.ts` — `generateCycleCountNumber()`

All follow the same logic: query counter table, increment, format with prefix + zero-padding.

**Pattern 2: `roundTo2()` utility (6 occurrences)**

```typescript
const roundTo2 = (value: number): number => Math.round(value * 100) / 100;
```

Duplicated in: order.service.ts, payment.service.ts, job-card.service.ts, purchase-order.service.ts, quote.service.ts, and at least one more.

**Pattern 3: `formatCurrency()` / `formatDate()` in frontend (4+ occurrences)**

Defined locally in OrderListTable.tsx, invoices/page.tsx, deliveries/page.tsx, and others. Each file has its own copy.

---

### 2.9 Remaining `window.confirm()` Calls (P2)

**Rule context**: A ConfirmDialog component was created in Phase 8 of the UI audit, but only applied to one page.

**23 remaining `window.confirm()` calls across 10 files:**

| File | Count |
|------|-------|
| `(portal)/orders/[id]/page.tsx` | 6 |
| `(portal)/purchase-orders/[id]/page.tsx` | 4 |
| `(portal)/job-cards/[id]/page.tsx` | 3 |
| `(portal)/picking-slips/[id]/page.tsx` | 2 |
| `(portal)/delivery-notes/[id]/page.tsx` | 2 |
| `(portal)/transfer-requests/[id]/page.tsx` | 2 |
| `(portal)/inventory/adjustments/[id]/page.tsx` | 1 |
| `(portal)/packing-lists/[id]/page.tsx` | 1 |
| `(customer)/my/returns/[id]/page.tsx` | 1 |
| `components/inventory/AdjustmentApproveModal.tsx` | 1 |

---

### 2.10 Inline Type Definitions (P2)

**Rule violated**: Prefer shared interfaces over inline types (CLAUDE.md > Code Quality > No Redundancy)

| File | Line | Context |
|------|------|---------|
| `ProductEditor.tsx` | 468 | `sub: { id: string; code: string; name: string }` — inline type in map callback |
| `invoices/page.tsx` | 24 | `Record<string, { label: string; className: string }>` — hardcoded keys not validated against status enum |

---

## 3. Top 10 Most-Violated Rules

| Rank | Rule | Violations | Category |
|------|------|-----------|----------|
| **1** | "TEST WITH CODE — Every micro-task that touches business logic must include its test" | 5 recent commits + massive gaps across all services | P1 |
| **2** | "Explicit return types on functions" | 28+ functions across 10 files | P1 |
| **3** | `TASK-XXX:` commit message format with bullets + `Next:` | 20 of 24 non-SAVE commits | P1 |
| **4** | "After EVERY micro-task: separate SESSION.md commit" | ~5:1 batching ratio | P1 |
| **5** | "No `any` types" (extended to unsafe `as` casts) | 172 backend type casts | P1 |
| **6** | "If you find yourself writing similar code twice, abstract it" | 12+ duplicated utility functions | P2 |
| **7** | SESSION.md must contain all 8 required sections | 3 missing/renamed sections | P1 |
| **8** | "API endpoints (integration tests)" — MUST be tested | 0 of 13+ route files tested | P1 |
| **9** | "Authentication/authorization (integration tests)" — MUST be tested | No auth tests exist | P1 |
| **10** | Consistent commit prefix format | 3 different formats (TASK-XXX, TNN, Phase N) | P2 |

---

## 4. Pattern Analysis

### 4.1 Clustered Violations

**Cluster 1: "Speed over process"**
The T-series commits (ERP execution sprint, T28-T40) show a clear pattern of speed prioritization: short commit messages, no tests, batched SESSION.md updates. This was likely a conscious trade-off during a large execution sprint, but it created the biggest compliance gap.

**Cluster 2: "Frontend handler pattern"**
Every React component follows the same anti-pattern: event handlers defined as arrow functions without explicit return types. This is so consistent it suggests the developer (or Claude) has an ingrained habit of writing `const handleX = () => {` without `: void =>`.

**Cluster 3: "Backend middleware workaround"**
The 172 `as AuthenticatedRequest` casts are all caused by the same root issue: Express middleware doesn't properly type the augmented request object. This is a single fix that would eliminate 172 violations.

### 4.2 Ambiguous or Contradictory Rules in CLAUDE.md

| Issue | Location | Problem |
|-------|----------|---------|
| **"No `any` types" scope is unclear** | Code Quality > TypeScript | Does this include `as` casts? `as unknown as X`? The rule says "no `any`" but the real issue is broader unsafe typing. |
| **Commit format for non-TASK work** | Git Workflow | CLAUDE.md only defines `TASK-XXX:` format. What about UI-AUDIT, ERP execution sprints, or ad-hoc fixes? No guidance exists. |
| **SAVE commit format** | Session Commands | `"SAVE: [current task status]"` is prescribed, but should it also have bullets/Next:? Not specified. |
| **"Explicit return types" scope** | Code Quality | Does this apply to inline arrow functions in JSX? Event handler callbacks? React component functions? The rule doesn't specify scope. |
| **Micro-task size** | Micro-task Definition | "If a micro-task takes more than 30 minutes, break it down" — but Phase 4 (breadcrumbs on 21 pages) was done as one commit. Is that one micro-task or 21? |
| **Test exemption scope** | Testing Requirements | "Simple UI components (visual review is fine)" — what counts as "simple"? A 200-line component with business logic in `useMemo`? |

### 4.3 Rules Missing from CLAUDE.md

| Missing Rule | Why It's Needed | Evidence |
|-------------|-----------------|---------|
| **Shared utility extraction threshold** | When to extract duplicate code into a shared utility | 6x number generation, 6x roundTo2, 4x formatCurrency |
| **Type casting policy** | When `as` casts are acceptable vs. when to fix the root type | 172 backend casts |
| **Non-TASK commit format** | How to format commits for audits, sprints, ad-hoc work | 20 non-conforming commits |
| **Frontend formatting utilities** | Central location for formatCurrency, formatDate, etc. | Duplicated in 4+ files |
| **Middleware typing standard** | How to properly type Express req with auth context | Root cause of 172 casts |
| **React component return type convention** | Whether components need explicit JSX.Element return types | Inconsistent across codebase |
| **Test coverage targets** | Minimum % coverage or which services MUST have tests | Only 3 test files for 112 backend files |

---

## 5. CLAUDE.md Quality Review

### 5.1 Structural Issues

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| **Critical rules buried in prose** | "Explicit return types" is in a table cell mid-page, easy to miss | Promote to CRITICAL RULES section |
| **Testing rule says "TEST WITH CODE" but details are far below** | Gap between rule #4 and the Testing Requirements section | Add test examples directly in CRITICAL RULES |
| **File is 576 lines** | Information overload; easy to miss rules after line ~200 | Split into CLAUDE.md (rules only) + CLAUDE-REFERENCE.md (domain knowledge, task specs) |
| **TASKS.md is 890 lines** | Contains detailed task specs that belong in `/docs/specs/` | TASKS.md should only be the queue; move specs to docs |
| **Session commands section is at line 430+** | Critical workflow instructions are near the bottom | Move session workflow to top half |

### 5.2 Vague Instructions

| Instruction | Problem | Suggested Rewording |
|------------|---------|---------------------|
| "No `any` types" | Doesn't address `as` casts | "No `any` types. Minimize `as` type assertions — fix root types instead. If `as` is unavoidable, add a `// SAFETY:` comment explaining why." |
| "Explicit return types on functions" | Scope unclear for arrow functions, callbacks | "Explicit return types on ALL named functions, arrow functions assigned to variables, and exported functions. Exception: inline JSX event handlers like `onClick={() => setState(x)}`." |
| "Write tests alongside code" | No minimum coverage target | "Write tests alongside code. Every service function and API endpoint must have at least one happy-path and one error-path test." |
| "If a micro-task takes more than 30 minutes, break it down" | How to measure "30 minutes" for Claude? | "A micro-task should touch no more than 3-5 files and produce a single focused commit." |

### 5.3 Missing Sections

| Section | Purpose |
|---------|---------|
| **Shared Utilities Registry** | List of existing utility functions to prevent duplication |
| **Import Conventions** | Where imports go, how middleware types are handled |
| **Frontend Formatting** | Central `lib/format.ts` for currency, date, percentage |
| **Test Writing Guide** | Quick reference for what to test and where to put it |
| **Non-TASK Workflow** | How to handle audits, sprints, and ad-hoc work |

### 5.4 Conflicting Rules

| Rule A | Rule B | Conflict |
|--------|--------|----------|
| "Commit after EVERY micro-task" + "Separate SESSION.md commit" | Practical sprint pace (T28-T40 did 13 tasks) | The 2-commit-per-micro-task rule is too slow for execution sprints. Need "sprint mode" exception. |
| "TEST WITH CODE" (rule #4) | "Simple UI components (visual review is fine)" | Grey area: a "simple" component with completeness scoring logic — does it need tests? The scoring utility does, but where's the line? |

---

## 6. Recommendations

### 6.1 Immediate Actions (No Code Changes)

1. **Update CLAUDE.md** to clarify the 5 ambiguous rules identified in section 5.2
2. **Add a "Sprint Mode" exception** for commit format when doing execution sprints (allow `TNN:` prefix, batched SESSION.md updates)
3. **Add a "Shared Utilities" section** listing existing utilities to prevent further duplication
4. **Move TASKS.md task specs** to `/docs/specs/` — keep TASKS.md as a lean queue only

### 6.2 High-Priority Code Fixes

1. **Create `backend/src/utils/number-generation.ts`** — extract the 6 duplicated number generators
2. **Create `backend/src/utils/math.ts`** — extract `roundTo2` and similar utilities
3. **Create `frontend/src/lib/format.ts`** — extract `formatCurrency`, `formatDate`
4. **Fix Express middleware typing** — properly type `AuthenticatedRequest` in middleware to eliminate 172 casts
5. **Write tests for `product-completeness.ts`** — pure function, easy to test, high business value

### 6.3 Medium-Priority Improvements

1. **Add explicit return types** to all 28 identified functions
2. **Write integration tests** for the 5 most critical API endpoints (orders, quotes, products, purchase-orders, inventory)
3. **Replace remaining `window.confirm()`** calls (23 remaining) with ConfirmDialog
4. **Standardize commit message format** — decide on a prefix scheme for non-TASK work

### 6.4 Suggested CLAUDE.md Additions

```markdown
## Shared Utilities (DO NOT DUPLICATE)

Before writing any utility function, check these files:
- `backend/src/utils/number-generation.ts` — sequential number generation
- `backend/src/utils/math.ts` — roundTo2, percentage calculations
- `frontend/src/lib/format.ts` — formatCurrency, formatDate, formatPercentage
- `frontend/src/lib/urls.ts` — getWebsiteUrl, getPortalUrl

## Type Safety Rules

- No `any` types anywhere
- Minimize `as` type assertions — fix the root type instead
- If `as` is unavoidable, add `// SAFETY: reason` comment
- Express route handlers: use properly typed middleware (see auth.ts)

## Return Type Requirements

Explicit return types required on:
- All exported functions
- All named functions and arrow functions assigned to variables
- Service methods
- API route handlers

NOT required on:
- Inline JSX callbacks: `onClick={() => setState(x)}`
- Array method callbacks: `.map(item => item.name)`
- React component functions (inferred from JSX)

## Test Requirements (Expanded)

Every service file must have a corresponding test file:
- `backend/src/services/order.service.ts` → `tests/unit/services/order.service.test.ts`
- Minimum: 1 happy-path + 1 error-path test per public function
- API routes: at least 1 integration test per endpoint

## Sprint Mode

When executing a large batch of related tasks (10+ micro-tasks):
- Commit prefix may use shorthand: `T01:`, `T02:`, etc.
- SESSION.md updates may be batched every 3-5 micro-tasks
- Must still push after every code commit
- Must do a full SESSION.md update before ending session
```

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Business logic bug in untested code** | HIGH | HIGH | Write tests for payment, fulfillment, and completeness scoring |
| **Context compacting loses work** | MEDIUM | MEDIUM | Return to 1:1 commit:session ratio |
| **Type error in production from unsafe casts** | LOW | MEDIUM | Fix middleware typing (single fix, 172 violations) |
| **Developer confusion from duplicate utilities** | MEDIUM | LOW | Extract shared utilities |
| **CLAUDE.md rules ignored due to length** | HIGH | MEDIUM | Restructure: rules-only CLAUDE.md + reference docs |

---

*End of audit report. No files were modified during this analysis.*
