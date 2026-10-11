---
name: code-review-verification
description: This skill should be used when completing a feature implementation or bug fix, before proposing a Git commit, to verify code quality, eliminate duplication (DRY), simplify logic (KISS), and run full test/lint pipelines.
---

# Code Review Verification & Refactoring

A comprehensive skill to verify code quality, refactor according to core software craftsmanship principles (DRY, KISS, YAGNI, SOLID), and ensure automated CI/CD checks pass before committing.

## When to Use This Skill

- Automatically at the end of feature implementation or bug fix.
- When the user asks to review, verify, refactor, or simplify newly created code.
- Trigger keywords / commands: `/code-review-verification`, `review code`, `verify feature`, `check quality`, `refactor`.

## What This Skill Does

1. **Initial Pipeline & Diff Inspection**: Runs `make pre-commit` (or `make precommit`) and inspects `git status` and `git diff` for all changes.
2. **Craftsmanship Audit**: Identifies opportunities for DRY factorizations, KISS simplifications (flattening nested conditionals, helper getters), YAGNI dead code removal, and SOLID boundaries.
3. **Mandatory Refactoring Plan**: Creates an `implementation_plan.md` artifact detailing proposed refactorings and waits for explicit user approval before applying changes.
4. **Execution & Full Re-verification**: Applies approved code improvements and re-runs `make pre-commit` ensuring 0 linter warnings, 0 build errors, and 100% passing tests with race detection.
5. **Git Commit Preparation**: Prompts the user or prepares the conventional commit message using `draft-git-commit`.

## How to Use

### Basic Usage

```text
/code-review-verification
```

### Advanced Usage

```text
Please run code review verification on the latest changes, focusing on DRY factorization, simplifying complex loops, and ensuring all tests pass.
```

## Example

### Input

User prompt:

> "Maintenant que tu as développé la feature, vérifie ce que tu as produit (tests, linter, build, git diff). Cherche les opportunités de factorisation et de simplification. Fais un plan d'implémentation avant de modifier."

### Workflow Execution

1. Run `make pre-commit` & `git diff`.
2. Discover linter warnings (`dupl` on test routers, `errcheck` on response writes, duplicate date formatters).
3. Create `implementation_plan.md` outlining shared test helpers, `writeJSON` response utility, and `time.ts` formatting utility.
4. User approves plan.
5. Apply refactorings and run `make pre-commit` until all checks are green (0 warnings, 100% tests passing).
6. Present Conventional Commit message via `draft-git-commit`.

## Tips for Success

- **Plan First**: Never refactor without presenting `implementation_plan.md` and receiving user approval.
- **Race Detector**: In Go projects, always run tests with `-race` (`go test -race ./...`).
- **No Linter Suppression**: Fix root causes instead of disabling linter rules with ignores or `as any`.
- **Atomic Helpers**: Keep extracted helpers focused with clear, descriptive names.
