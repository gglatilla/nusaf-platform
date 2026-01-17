# NUSAF Platform - Quick Reference

## Current Phase
Phase 1: Foundation Setup (COMPLETE)

## Currently Working On
- Project foundation has been established
- Ready to begin development

## Immediate Next Steps
1. Define detailed project vision and requirements
2. Choose technology stack
3. Plan first feature (likely user authentication)

## Project Overview
NUSAF Platform is a business management system for Guido's company. The exact scope and features will be documented in `docs/PROJECT-VISION.md` as we define them together.

## Key Documents
- Vision: `docs/PROJECT-VISION.md`
- Architecture: `docs/ARCHITECTURE.md`
- Tech Stack: `docs/TECH-STACK.md`
- POPIA Compliance: `docs/POPIA-COMPLIANCE.md`
- Data Inventory: `docs/DATA-INVENTORY.md`
- Latest Session: `docs/sessions/2026-01-17.md`

## Custom Commands Available
- `/project:start` - Begin a session (reads context, creates session log)
- `/project:save` - Save progress (runs tests, updates docs, commits)
- `/project:status` - Quick project overview
- `/project:decision` - Create a decision record
- `/project:feature` - Create a feature specification
- `/project:security-check` - Scan for security/compliance issues
- `/project:test` - Run all tests

## Folder Structure
```
nusaf-platform/
├── CLAUDE.md              <-- This file (quick reference)
├── README.md              <-- Project info for humans
├── .gitignore             <-- Files Git ignores
├── docs/
│   ├── PROJECT-VISION.md  <-- What the project is
│   ├── ARCHITECTURE.md    <-- System structure
│   ├── TECH-STACK.md      <-- Technology choices
│   ├── POPIA-COMPLIANCE.md<-- Legal compliance
│   ├── DATA-INVENTORY.md  <-- Data we collect
│   ├── sessions/          <-- Daily session logs
│   ├── decisions/         <-- Decision records (ADRs)
│   └── features/          <-- Feature specifications
├── src/                   <-- Source code (future)
└── tests/                 <-- Test files (future)
```

## Important Notes
- Always run `/project:start` at the beginning of each session
- Always run `/project:save` before ending a session
- Check `docs/sessions/` for detailed session history
- Check `docs/decisions/` for why important choices were made
