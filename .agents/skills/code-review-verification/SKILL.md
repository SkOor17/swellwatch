---
name: code-review-verification
description: >-
  Use this skill automatically at the end of implementing a feature or fixing a bug, BEFORE proposing a Git commit.
---

# Code Review Verification

This skill ensures that code is thoroughly reviewed and that all validation checks and automated pipelines pass before being committed to the repository.

## Steps

When you have finished implementing a feature and unit tests are passing, but before you propose or create a git commit, perform the following verification steps:

1. **Check for Code Duplication**: Scan the changes and the broader codebase for identical or highly similar logic.
2. **Check for Dead Code**: Ensure no unused variables, functions, or imports are left behind.
3. **Check for Refactoring Opportunities**: Can the code be simplified? Are there early returns that could be applied? Is the nesting too deep?
4. **Check for Security Vulnerabilities**: Review for common flaws, particularly around user input, SQL queries (avoid injection), or unprotected concurrent access (missing mutexes).
5. **Run Pre-commit Pipeline**:
   - Execute `make precommit` (or `make pre-commit`) from the workspace root.
   - This command runs formatting, linting (backend & frontend), builds (backend & frontend), and full test suites to ensure the CI pipeline will pass seamlessly.
   - If any step in `make precommit` fails, fix the errors and re-run until all checks pass green.

If any issues are found during the code inspection or the pre-commit execution:

- Propose the fixes to the user or automatically apply them.
- Re-run `make precommit` to ensure everything is resolved.

If the code passes all checks and `make precommit` succeeds, proceed to propose the Conventional Commit message using the `draft-git-commit` skill.
