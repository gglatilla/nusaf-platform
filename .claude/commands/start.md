# Project Start Command

Begin a new work session by loading all project context.

## Instructions

1. **Read CLAUDE.md** (quick reference file) to understand the current project state.

2. **Read the most recent session log** from `docs/sessions/` to understand what was done last time and what should be done next.

3. **Read PROJECT-VISION.md** if it exists and has content, to understand the overall project goals.

4. **Check today's date** and determine if a session log exists for today:
   - If today's session log exists, read it to continue where we left off
   - If not, create a new session log file at `docs/sessions/YYYY-MM-DD.md` with the following template:

```markdown
# Session: [Full Date]

## Goals for Today
- [To be filled in based on previous session's "Next Session Should" items]

## What We Actually Did
- [To be updated during the session]

## Decisions Made
- [To be recorded as they happen]

## Code Changes
**Created files:**
- [List files]

**Modified files:**
- [List files]

**Purpose:** [Brief description]

## Problems/Blockers
- [Note any issues]

## Next Session Should
1. [Continue with...]
2. [Start...]

## Notes for Future Me
- [Important reminders]
```

5. **Summarize for the user:**
   - Current project phase
   - What was done in the last session
   - What is planned for this session
   - Any blockers or issues to be aware of

## Expected Output

A clear summary of where we are and what we should work on, so we can start immediately without context-gathering.
