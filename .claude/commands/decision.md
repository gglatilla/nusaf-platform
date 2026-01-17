# Project Decision Command

Create an Architecture Decision Record (ADR) for an important project decision.

## Arguments

This command accepts an optional argument: the decision topic.
Example: `/project:decision database choice`

## Instructions

1. **Determine the decision topic**:
   - Use the provided argument if given
   - Otherwise, ask the user what decision needs to be documented

2. **Find the next decision number**:
   - List existing files in `docs/decisions/`
   - Determine the next number (001, 002, etc.)

3. **Create the decision record** at `docs/decisions/NNN-decision-topic.md`:

```markdown
# Decision: [Decision Title]

## Decision Number
[NNN]

## Date
[Today's date]

## Status
PROPOSED | DECIDED | SUPERSEDED

## Context
[What situation or problem led to this decision being needed?]

## Options Considered

### Option 1: [Name]
**Description:** [What is this option?]

**Pros:**
- [Advantage 1]
- [Advantage 2]

**Cons:**
- [Disadvantage 1]
- [Disadvantage 2]

### Option 2: [Name]
**Description:** [What is this option?]

**Pros:**
- [Advantage 1]
- [Advantage 2]

**Cons:**
- [Disadvantage 1]
- [Disadvantage 2]

### Option 3: [Name] (if applicable)
[Same format]

## Decision
[Which option was chosen]

## Reasoning
[Detailed explanation of why this option was selected over others]

## Consequences
[What are the implications of this decision? What becomes easier or harder?]

## Related Decisions
- [Links to related ADRs if any]

## Implementation Notes
[Any notes about how to implement this decision]
```

4. **Update the session log** to reference this decision.

5. **Confirm creation** with file path and summary.

## Expected Output

A new decision record file created, with a summary of what was documented and where it's stored.
