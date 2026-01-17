# Project Status Command

Show a quick overview of the current project state.

## Instructions

1. **Read CLAUDE.md** to get the current project state.

2. **Check git status** to see if there are uncommitted changes.

3. **List recent commits** (last 3-5) to show recent activity.

4. **Check for any TODO items** in the codebase if the project has started.

5. **Present a summary** in this format:

```
PROJECT STATUS: NUSAF Platform
================================

Phase: [Current phase from CLAUDE.md]
Last Activity: [Date of last session log or commit]

Currently Working On:
- [Items from CLAUDE.md]

Immediate Next Steps:
1. [From CLAUDE.md]
2. [...]
3. [...]

Git Status:
- [Clean / X files modified / etc.]

Recent Commits:
- [commit message 1]
- [commit message 2]
- [commit message 3]

Key Documents:
- Vision: docs/PROJECT-VISION.md
- Latest Session: docs/sessions/[date].md
```

## Expected Output

A quick, scannable overview that tells the user exactly where the project stands without reading multiple files.
