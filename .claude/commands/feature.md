# Project Feature Command

Create a feature specification document for a new feature.

## Arguments

This command accepts an optional argument: the feature name.
Example: `/project:feature user authentication`

## Instructions

1. **Determine the feature name**:
   - Use the provided argument if given
   - Otherwise, ask the user what feature to document

2. **Create the feature specification** at `docs/features/[feature-name].md`:

```markdown
# Feature: [Feature Name]

## Status
PLANNED | IN PROGRESS | COMPLETE

## Summary
[One paragraph describing what this feature does and why it's needed]

## User Stories
- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]
- [Add more as needed]

## Requirements

### Functional Requirements
[What the feature must DO]
- [ ] FR1: [Requirement]
- [ ] FR2: [Requirement]
- [ ] FR3: [Requirement]

### Non-Functional Requirements
[How the feature must PERFORM]
- [ ] NFR1: [Performance, security, usability requirement]
- [ ] NFR2: [Requirement]

## User Interface

### Screens/Pages
[Describe or mock up the UI]

1. **[Screen Name]**
   - Purpose: [What this screen does]
   - Elements: [Key UI elements]
   - Actions: [What users can do here]

### User Flow
```
[Step 1] → [Step 2] → [Step 3] → [Outcome]
```

## Technical Design

### Components Involved
| Component | Purpose | New/Modified |
|-----------|---------|--------------|
| [Component] | [Purpose] | New |
| [Component] | [Purpose] | Modified |

### Data Model
[Any new database tables/fields needed]

| Field | Type | Purpose |
|-------|------|---------|
| [field] | [type] | [purpose] |

### API Endpoints
[Any new API endpoints needed]

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/[endpoint] | [Purpose] |

## Files Involved
[List all files that will be created or modified]

**New Files:**
- `src/[path]/[file]` - [Purpose]

**Modified Files:**
- `src/[path]/[file]` - [What changes]

## Dependencies
[What this feature depends on]
- Feature: [Other feature name]
- Package: [Any new packages needed]

## Security Considerations
[Security requirements specific to this feature]
- [ ] [Security requirement 1]
- [ ] [Security requirement 2]

## POPIA Considerations
[Any personal data implications]
- [ ] Data inventory updated
- [ ] Consent mechanisms in place
- [ ] [Other POPIA requirements]

## Testing

### Unit Tests
- [ ] [Test case 1]
- [ ] [Test case 2]

### Integration Tests
- [ ] [Test case 1]

### Manual Testing
- [ ] [Test scenario 1]
- [ ] [Test scenario 2]

## Implementation Checklist
- [ ] Feature spec reviewed
- [ ] Technical design approved
- [ ] Implementation complete
- [ ] Tests written and passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] POPIA compliance verified

## Notes
[Any additional notes or considerations]

---
*Created: [Date]*
*Last Updated: [Date]*
```

3. **Ask clarifying questions** to help fill in key sections:
   - What users will use this feature?
   - What's the core functionality?
   - Any security or compliance concerns?

4. **Update the session log** to note the new feature spec.

5. **Confirm creation** with file path and summary.

## Expected Output

A new feature specification file with a structured template, ready to be filled in as we plan and implement the feature.
