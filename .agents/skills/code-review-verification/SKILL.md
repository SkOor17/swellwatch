---
name: code-review-verification
description: >-
  Use this skill automatically at the end of implementing a feature or fixing a bug, BEFORE proposing a Git commit.
---

# Code Review Verification

This skill ensures that code is thoroughly reviewed before being committed to the repository.

## Steps

When you have finished implementing a feature and tests are passing, but before you run `git commit`, perform the following self-review steps:

1. **Check for Code Duplication**: Scan the changes and the broader codebase for identical or highly similar logic.
2. **Check for Dead Code**: Ensure no unused variables, functions, or imports are left behind.
3. **Check for Refactoring Opportunities**: Can the code be simplified? Are there early returns that could be applied? Is the nesting too deep?
4. **Check for Security Vulnerabilities**: Review for common flaws, particularly around user input, SQL queries (avoid injection), or unprotected concurrent access (missing mutexes).

If any of these issues are found:
- Propose the fixes to the user or automatically apply them.
- Re-run tests to ensure the fixes didn't break anything.

If the code passes all checks, proceed to propose the Conventional Commit message.
