# Project Security Check Command

Perform a security and compliance scan of the project.

## Instructions

1. **Check for exposed secrets**:
   - Search for common patterns: API keys, passwords, tokens
   - Check `.env` files are in `.gitignore`
   - Look for hardcoded credentials in source files
   - Patterns to search: `password`, `secret`, `api_key`, `token`, `credential`

2. **Review .gitignore**:
   - Ensure `.env` files are ignored
   - Ensure `node_modules` (or equivalent) is ignored
   - Ensure IDE/editor files are ignored
   - Flag any missing common exclusions

3. **Check POPIA compliance status**:
   - Read `docs/POPIA-COMPLIANCE.md`
   - List incomplete compliance items
   - Check if `docs/DATA-INVENTORY.md` is up to date

4. **Review security patterns in code** (if source code exists):
   - Check for SQL concatenation (SQL injection risk)
   - Check for unsanitized user input
   - Check for eval() usage
   - Check for HTTP (not HTTPS) URLs
   - Check password handling (should be hashed, never plain text)

5. **Check dependencies** (if package.json or requirements.txt exists):
   - Note any packages that might need security review
   - Suggest running security audit tools if available

6. **Generate security report**:

```
SECURITY & COMPLIANCE REPORT
============================
Date: [Today's date]

SECRETS CHECK
-------------
Status: [PASS/WARN/FAIL]
- [Findings]

GITIGNORE CHECK
---------------
Status: [PASS/WARN]
- [Findings]

POPIA COMPLIANCE
----------------
Status: [X of Y items complete]
Outstanding items:
- [ ] [Item 1]
- [ ] [Item 2]

CODE SECURITY (if applicable)
-----------------------------
Status: [PASS/WARN/FAIL]
- [Findings]

DEPENDENCY SECURITY (if applicable)
-----------------------------------
Status: [PASS/WARN/UNKNOWN]
- [Findings]

RECOMMENDATIONS
---------------
1. [High priority item]
2. [Medium priority item]
3. [Low priority item]

NEXT SECURITY REVIEW
--------------------
Recommended: [Date, typically 2-4 weeks]
```

7. **Update session log** with security review results.

## Expected Output

A security report highlighting any issues found and recommendations for improvement. This should be run periodically and before any major deployments.
