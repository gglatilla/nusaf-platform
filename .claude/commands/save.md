# Project Save Command

Save current progress, update documentation, and create a git commit.

## Instructions

1. **Run all tests** (if tests exist):
   - Look for test files in `tests/` directory
   - Run the appropriate test command based on the tech stack
   - **If tests fail, STOP and report failures - do not commit broken code**

2. **Update today's session log** (`docs/sessions/YYYY-MM-DD.md`):
   - Add/update "What We Actually Did" section with completed work
   - Add any decisions made to "Decisions Made" section
   - Update "Code Changes" with files created/modified
   - Add any blockers to "Problems/Blockers"
   - Ensure "Next Session Should" has actionable items

3. **Update CLAUDE.md**:
   - Update "Currently Working On" to reflect actual current state
   - Update "Immediate Next Steps" based on progress
   - Update "Current Phase" if phase changed

4. **Check for uncommitted changes**:
   - Run `git status` to see what has changed
   - Review the changes to ensure nothing sensitive is being committed

5. **Create git commit**:
   - Stage all relevant changes with `git add .`
   - Create commit with descriptive message summarizing the work done
   - Format: `[type]: brief description`
   - Types: feat, fix, docs, refactor, test, chore

6. **Confirm success**:
   - Show git log for the new commit
   - Confirm documentation is updated
   - Report any issues encountered

## Expected Output

Confirmation that:
- Tests passed (or no tests exist yet)
- Session log updated
- CLAUDE.md updated
- Git commit created with summary of changes
