# NUSAF Platform - Claude Working Document

> **This file is the contract between Guido and Claude for working on this project.**
> Claude MUST follow the instructions in this file precisely.

---

## MANDATORY STARTUP CHECKLIST

**When the user says `nusaf start`, Claude MUST complete ALL of the following steps IN ORDER before doing anything else:**

### Step 1: Read Core Context Files
- [ ] Read this entire file (CLAUDE.md)
- [ ] Read `CURRENT-WORK.md` completely - this tells you exactly where we left off
- [ ] Read the latest session log in `docs/sessions/` (most recent date)

### Step 2: Read Project Understanding Files
- [ ] Read `docs/PROJECT-VISION.md` - understand what we're building and why
- [ ] Read `docs/TECH-STACK.md` - understand technology choices made
- [ ] Read `docs/ARCHITECTURE.md` - understand system design

### Step 3: Read Compliance Requirements
- [ ] Read `docs/POPIA-COMPLIANCE.md` - legal requirements we must follow
- [ ] Read `docs/DATA-INVENTORY.md` - what data we handle

### Step 4: Understand What's Been Built
- [ ] Read `CODEBASE-OVERVIEW.md` - summary of implemented features
- [ ] List files in `src/` directory to see actual code structure
- [ ] Read any feature specs mentioned in CURRENT-WORK.md

### Step 5: Check Recent Decisions
- [ ] List files in `docs/decisions/` and read any from last 7 days
- [ ] Note any decisions that affect current work

### Step 6: Provide Summary to User
After completing steps 1-5, provide a summary that includes:
- Current project phase
- What was being worked on (from CURRENT-WORK.md)
- Exactly where we left off
- Any blockers or issues
- What the next steps are
- Ask if the user wants to continue with the planned work or do something else

**DO NOT skip any steps. DO NOT start working until this checklist is complete.**

---

## COMMANDS

Specific commands for working on this project. Use these exact phrases.

### Core Commands
| Command | What Claude Does |
|---------|------------------|
| `nusaf start` | Run full startup checklist, read all context, provide summary of where we left off |
| `nusaf save` | Update all files (CURRENT-WORK.md, session log, CODEBASE-OVERVIEW.md, CLAUDE.md), commit to git |
| `nusaf status` | Quick overview: project phase, current work, git status, recent commits |

### Development Commands
| Command | What Claude Does |
|---------|------------------|
| `nusaf test` | Detect test framework, run all tests, report results |
| `nusaf security` | Scan for secrets, check POPIA compliance, review vulnerabilities |

### Documentation Commands
| Command | What Claude Does |
|---------|------------------|
| `nusaf decision [topic]` | Create Architecture Decision Record in `docs/decisions/` |
| `nusaf feature [name]` | Create feature specification in `docs/features/` |

### Examples
```
nusaf start                     → Pick up where we left off
nusaf save                      → Save everything and commit
nusaf status                    → Quick project overview
nusaf test                      → Run tests
nusaf security                  → Security/compliance check
nusaf decision database choice  → Create decision record for database choice
nusaf feature user-auth         → Create feature spec for user authentication
```

---

## SAVE PROGRESS CHECKLIST

**When the user says `nusaf save`, Claude MUST:**

### Step 1: Run Tests (if they exist)
- Run appropriate test command based on tech stack
- If tests fail, STOP and report - do not commit broken code

### Step 2: Update CURRENT-WORK.md
- Set status to IDLE if work is complete, or describe exact stopping point
- Update "What We're Working On" with current state
- List specific files modified and their state
- Document any problems being debugged with full context
- Write specific next steps (not vague goals)

### Step 3: Update Today's Session Log
- Create `docs/sessions/YYYY-MM-DD.md` if it doesn't exist
- Add what was done with specific details
- Record decisions made AND the reasoning (WHY not just WHAT)
- Record approaches considered but rejected and WHY
- List problems encountered and solutions
- Note specific next steps

### Step 4: Update CODEBASE-OVERVIEW.md
- Add any new features/modules implemented
- Update status of existing features
- Note any architectural changes

### Step 5: Update CLAUDE.md
- Update "Current Phase" if changed
- Update "Currently Working On"
- Update "Immediate Next Steps"

### Step 6: Git Commit
- Run `git status` to review changes
- Check nothing sensitive is being committed
- Stage changes with `git add .`
- Commit with descriptive message: `[type]: description`
- Types: feat, fix, docs, refactor, test, chore

### Step 7: Confirm to User
- Show what was saved
- Show the commit made
- Summarize where we left off for next session

---

## DEVELOPMENT WORKFLOW (Test-As-You-Go)

**Claude MUST follow this workflow when writing code:**

### The Rule
> **Run tests after completing each logical unit of work. If tests fail, fix immediately before moving on. Never commit code with failing tests.**

### What is a "Logical Unit"?
- Completed implementing a function
- Finished a todo item
- Fixed a bug
- Added a new API endpoint
- Completed a component

### Workflow Steps

```
1. Pick up a task/todo item
2. Write the code
3. Run tests immediately after completing the unit
4. If tests PASS → mark todo complete, move to next item
5. If tests FAIL → STOP and fix before doing anything else
6. Repeat until all work is done
7. Run `nusaf save` (which runs tests again before committing)
```

### Why This Approach
| Approach | Problem |
|----------|---------|
| Test after every line | Too slow, interrupts flow |
| Test only at commit time | Bugs compound, harder to debug |
| **Test after each logical unit** | **Catches bugs early, still efficient** |

### Test Failure Protocol
When tests fail:
1. **Do NOT move to the next task**
2. **Do NOT commit**
3. Analyze the failure
4. Fix the issue
5. Re-run tests
6. Only continue when tests pass

---

## CURRENT PROJECT STATE

### Phase
**Login System Revision Complete** - Ready for Phase 2

### Currently Working On
Nothing active - ready for Phase 2.

### Recently Completed
- Unified login page for staff + customers
- Password reset flow
- Customer account request + admin approval
- Rate limiting and security features
- 9 login behavior tests

### Immediate Next Steps
1. Build public marketing website pages (About, Industries, Capabilities, Contact)
2. Create public product catalog (no prices shown)
3. Implement quote basket functionality
4. Build quote request form (lead capture)
5. Create salesperson review queue
6. Generate PDF quotes

---

## PROJECT OVERVIEW

**NUSAF Platform** is a unified business platform for Nusaf Dynamic Technologies comprising:
- **Marketing Website** (www.nusaf.co.za) - Product catalog, fast quoting, company info
- **B2B Portal** - Customer login, live pricing, quote acceptance, order tracking
- **Internal App** - Staff tools: job cards, PO management, price lists, part numbers

All components share a single backend that integrates with Odoo (ERP going live March 2026).

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, PostgreSQL, Prisma v5, NextAuth.js

---

## KEY DOCUMENTS

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `CURRENT-WORK.md` | Exact state of active work | Every startup |
| `CODEBASE-OVERVIEW.md` | What's been built | Every startup |
| `docs/PROJECT-VISION.md` | What we're building and why | Every startup |
| `docs/TECH-STACK.md` | Technology choices | When making tech decisions |
| `docs/ARCHITECTURE.md` | System design | When designing features |
| `docs/POPIA-COMPLIANCE.md` | Legal requirements | When handling user data |
| `docs/DATA-INVENTORY.md` | What data we collect | When adding data fields |
| `docs/sessions/` | Historical session logs | For context on past work |
| `docs/decisions/` | Why we made choices | Before re-discussing decided topics |
| `docs/features/` | Feature specifications | When implementing features |

---

## FOLDER STRUCTURE

```
nusaf-platform/
├── CLAUDE.md              <-- This file (Claude's working document)
├── CURRENT-WORK.md        <-- Exact state of active work
├── CODEBASE-OVERVIEW.md   <-- What features have been built
├── README.md              <-- Project info for humans
├── .gitignore             <-- Files Git ignores
├── docs/
│   ├── PROJECT-VISION.md  <-- What we're building and why
│   ├── ARCHITECTURE.md    <-- System design
│   ├── TECH-STACK.md      <-- Technology choices
│   ├── POPIA-COMPLIANCE.md<-- Legal compliance requirements
│   ├── DATA-INVENTORY.md  <-- Personal data we handle
│   ├── sessions/          <-- Daily work logs (YYYY-MM-DD.md)
│   ├── decisions/         <-- Architecture Decision Records
│   └── features/          <-- Feature specifications
├── src/                   <-- Source code
└── tests/                 <-- Test files
```

---

## IMPORTANT RULES FOR CLAUDE

1. **Never skip the startup checklist** - Even if the user says "just quickly do X", complete the checklist first to avoid missing context.

2. **Never assume** - If something isn't documented, ask. Don't guess.

3. **Always update CURRENT-WORK.md** - Before stopping for any reason, capture the exact state.

4. **Record the WHY** - When documenting decisions, always explain the reasoning, not just the choice.

5. **Track rejections** - When we consider and reject an approach, document it so we don't revisit it.

6. **Keep CODEBASE-OVERVIEW.md current** - Every feature added must be documented there.

7. **POPIA compliance is mandatory** - Every feature touching personal data must be checked against POPIA-COMPLIANCE.md.

8. **Test as you go** - Run tests after each logical unit of work. Fix failures immediately. Never move on with failing tests. See "DEVELOPMENT WORKFLOW" section.

9. **Be specific, not vague** - "Continue working on auth" is bad. "Implement password validation in src/auth/login.ts starting at the validatePassword function" is good.

10. **Cross-reference** - When a decision affects a feature spec, update both. Keep documents in sync.

11. **Keep it simple** - Follow these code guidelines:

### Code Simplicity Guidelines

| Guideline | Explanation |
|-----------|-------------|
| **Solve today's problem** | Build for current requirements. Don't add features "for later." |
| **Simplest working solution** | If two approaches work, pick the simpler one. |
| **Rule of Three** | Don't create abstractions until you have 3 real use cases. Two similar blocks of code is fine. |
| **Validate at boundaries** | Check user input and external data thoroughly. Trust internal code. |
| **Readable over clever** | Code is read more than written. Clarity beats elegance. |
| **Delete, don't comment** | Remove unused code. Git remembers history. |
| **Measure before optimizing** | Don't guess at performance problems. Optimize when you have evidence. |
| **Security is not optional** | Authentication, input validation, and POPIA compliance are requirements, not extras. |

### Before Adding Complexity, Ask:
1. Am I solving a problem I have **right now**?
2. Is there a simpler way?
3. Will another developer understand this in 6 months?

*These guidelines can be adjusted as project needs become clearer.*

---

*Last updated: 2026-01-18*
*Version: 2.4 - Phase 1 complete*
