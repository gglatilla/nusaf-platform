# Project Test Command

Run all tests and report results.

## Instructions

1. **Detect the testing framework**:
   - Check for `package.json` → look for test scripts (jest, mocha, vitest, etc.)
   - Check for `pytest.ini` or `tests/` with Python files → pytest
   - Check for other test configuration files

2. **If no tests exist yet**:
   - Report that no tests are configured
   - Suggest setting up a testing framework based on the tech stack
   - List any `tests/` directory contents

3. **If tests exist, run them**:
   - Execute the appropriate test command
   - Capture all output

4. **Parse and report results**:

```
TEST RESULTS
============
Date: [Today's date]
Framework: [jest/pytest/etc.]

SUMMARY
-------
Total Tests: [N]
Passed: [N] ✓
Failed: [N] ✗
Skipped: [N] ○

FAILED TESTS (if any)
---------------------
1. [Test name]
   File: [file path]
   Error: [error message]

2. [Test name]
   File: [file path]
   Error: [error message]

COVERAGE (if available)
-----------------------
Overall: [X]%
- [file]: [X]%
- [file]: [X]%

RECOMMENDATIONS
---------------
- [Any recommendations based on results]
```

5. **If tests fail**:
   - List all failures clearly
   - Offer to help fix the issues
   - DO NOT proceed with commits until tests pass

6. **Update session log** with test results if significant.

## Expected Output

A clear test report showing what passed, what failed, and any recommendations. This command is automatically called by `/project:save` before committing.

## Notes

- Tests should pass before committing code
- If tests are consistently slow, suggest optimization
- Missing test coverage should be flagged
