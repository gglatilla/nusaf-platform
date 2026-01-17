# Current Work in Progress

> **This file captures the EXACT state of active work so Claude can resume without losing any context.**
> Update this file frequently during work, and always before ending a session.

---

## Status

**IDLE** - No active task. Ready for next work.

---

## Active Task

None currently.

---

## What We're Working On

No active task. Workflow system v2.3 is complete and ready to use.

---

## Current State

### Last Completed Work
- **Task:** Workflow update v2.3 - Code simplicity guidelines
- **Completed:** 2026-01-17
- **What was done:**
  - Added code simplicity guidelines to rule #11 in CLAUDE.md
  - Guidelines cover: solve today's problem, simplest solution, rule of three, validate at boundaries, readable over clever, delete don't comment, measure before optimizing, security not optional
  - Added "before adding complexity" checklist

### Files Modified in Last Session
| File | What Changed |
|------|--------------|
| `CLAUDE.md` | Added code simplicity guidelines (v2.3) |

---

## Context & Decisions Made

### Workflow v2.2 Decisions
| Decision | Reasoning |
|----------|-----------|
| Specific commands over natural language | Less ambiguity, easier to remember, consistent triggering |
| `nusaf` prefix | Includes project name, works from any directory, clear intent |
| Mandatory startup checklist | Ensures Claude always gets full context before working |
| Separate CURRENT-WORK.md | Different purpose from session logs: live state vs. historical record |
| CODEBASE-OVERVIEW.md | Quick reference for what's built, prevents re-implementing |
| Test-as-you-go workflow | Run tests after each logical unit, not just at commit time. Catches bugs early without being too slow. |
| Code simplicity guidelines | Balanced rules for keeping code simple without cutting corners on security/validation. |

---

## Problems & Debugging

No active problems.

---

## Immediate Next Steps

**When starting next session (`nusaf start`):**

1. Fill in `docs/PROJECT-VISION.md` with actual business requirements
2. Make technology stack decision (see `docs/TECH-STACK.md`)
3. Create first feature spec: `nusaf feature user-auth`
4. Begin implementation

---

## Files Claude Should Review When Resuming

### Always Read (part of `nusaf start`)
- `CLAUDE.md` - Commands and rules
- `CURRENT-WORK.md` - This file
- Latest `docs/sessions/*.md`
- `docs/PROJECT-VISION.md`
- `docs/TECH-STACK.md`
- `docs/ARCHITECTURE.md`
- `CODEBASE-OVERVIEW.md`
- `docs/POPIA-COMPLIANCE.md`
- `docs/DATA-INVENTORY.md`

---

## Code Snippets / Implementation Notes

No code implementation yet - project is in planning phase.

---

## Questions to Resolve

None currently.

---

## Reminders for Next Session

- Use `nusaf start` to begin
- Use `nusaf save` when done
- PROJECT-VISION.md needs business requirements before tech stack decision
- POPIA compliance must be considered for all features handling personal data
- Use `nusaf decision [topic]` for important choices
- Use `nusaf feature [name]` before implementing features

---

*Last updated: 2026-01-17*
*Status: IDLE - Workflow v2.3 complete*
