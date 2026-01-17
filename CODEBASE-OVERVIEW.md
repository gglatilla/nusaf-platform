# Codebase Overview

> **This file tracks what has been built in the NUSAF Platform.**
> Update this file whenever features are added, modified, or removed.
> Claude reads this at startup to understand the current state of the codebase.

---

## Build Status

| Component | Status |
|-----------|--------|
| Project Foundation | ✅ Complete |
| Documentation Structure | ✅ Complete |
| Workflow System | ✅ Complete (v2.2) |
| Source Code | ⏳ Not Started |
| Tests | ⏳ Not Started |

---

## Technology Stack

**Status:** NOT YET CHOSEN

See `docs/TECH-STACK.md` for options being considered.

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | TBD | Pending Decision |
| Backend | TBD | Pending Decision |
| Database | TBD | Pending Decision |
| Hosting | TBD | Pending Decision |

---

## Implemented Features

### Feature List

| Feature | Status | Location | Feature Spec |
|---------|--------|----------|--------------|
| _No features implemented yet_ | - | - | - |

### Feature Details

_As features are implemented, add detailed sections here:_

```
### [Feature Name]
**Status:** Planning / In Progress / Complete
**Implemented:** YYYY-MM-DD
**Spec:** docs/features/[feature-name].md

**What it does:**
[Brief description]

**Key files:**
- `src/path/to/file.ts` - [Purpose]
- `src/path/to/other.ts` - [Purpose]

**Database tables:**
- `table_name` - [Purpose]

**API endpoints:**
- `POST /api/endpoint` - [Purpose]

**Dependencies:**
- [Other features this depends on]

**POPIA considerations:**
- [Data handling notes]
```

---

## Directory Structure

```
src/
└── (empty - no code yet)

tests/
└── (empty - no tests yet)
```

_Update this section as the codebase grows._

---

## Database Schema

**Status:** Not yet designed

_Add database tables here as they are created:_

| Table | Purpose | Created | Modified |
|-------|---------|---------|----------|
| _No tables yet_ | - | - | - |

---

## API Endpoints

**Status:** None implemented

_Add endpoints here as they are created:_

| Method | Endpoint | Purpose | Auth Required | Added |
|--------|----------|---------|---------------|-------|
| _No endpoints yet_ | - | - | - | - |

---

## External Integrations

**Status:** None implemented

| Integration | Purpose | Status | Config Location |
|-------------|---------|--------|-----------------|
| _No integrations yet_ | - | - | - |

---

## Shared Components / Utilities

_Document reusable code here so Claude knows what already exists:_

| Component/Utility | Purpose | Location |
|-------------------|---------|----------|
| _No shared components yet_ | - | - |

---

## Known Technical Debt

_Track technical debt so it doesn't get forgotten:_

| Issue | Severity | Added | Notes |
|-------|----------|-------|-------|
| _No technical debt yet_ | - | - | - |

---

## Architecture Patterns in Use

_Document architectural patterns so Claude maintains consistency:_

| Pattern | Where Used | Notes |
|---------|------------|-------|
| _No patterns established yet_ | - | - |

---

## Environment & Configuration

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| _No env vars yet_ | - | - |

### Configuration Files

| File | Purpose |
|------|---------|
| `.gitignore` | Files excluded from git |
| _No other config yet_ | - |

---

## How to Run

**Status:** No runnable application yet

_Instructions will be added once development begins:_

```bash
# Install dependencies
# [command TBD]

# Run development server
# [command TBD]

# Run tests
# [command TBD]

# Build for production
# [command TBD]
```

---

## Recent Changes

| Date | Change | Files Affected |
|------|--------|----------------|
| 2026-01-17 | Initial project setup | All documentation files |
| 2026-01-17 | Workflow v2.0 (natural language) | CLAUDE.md, CURRENT-WORK.md, CODEBASE-OVERVIEW.md |
| 2026-01-17 | Workflow v2.1 (specific commands) | CLAUDE.md, CURRENT-WORK.md, session log |
| 2026-01-17 | Workflow v2.2 (test-as-you-go) | CLAUDE.md, CURRENT-WORK.md, session log |

---

*Last updated: 2026-01-17*
