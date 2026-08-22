---
description: >-
  Rules for Git commits, feature workflow, TDD, and documentation updates.
  Applies to all tasks involving feature creation, git operations, or documentation.
trigger: always_on
---

# Workflow and Git Rules

## 1. Feature Workflow (Grill Me & Planning)

- When starting a **new feature** (not necessary for simple bug fixes or styling tweaks), you MUST follow this sequence before writing any code:
  1. Trigger the `/grill-me` skill/command to interview the developer and clarify all intentions and edge cases.
  2. Write a detailed `implementation_plan.md` artifact presenting the technical design.
  3. Wait for the user's explicit approval of the plan.

## 2. Test-Driven Development (TDD) Workflow

You must strictly follow this order when implementing functionality:

1. **Understand Requirements**: Ensure the functional requirement is 100% clear.
2. **Write Unit Tests**: Write the unit tests covering the business logic and edge cases _before_ implementing the solution.
3. **Write Code**: Implement the solution to pass the tests.
4. **Verify**: Run the tests and ensure the build and linter pass successfully.

## 3. Git Commits

- When a feature is completely implemented and verified, propose a commit message to the user.
- **Do not output bash commands** (like `git commit -m ...`). Instead, use the `draft-git-commit` skill to format the message and output it as a plain text block so the user can easily copy and paste it into their own git client.
- Use **Conventional Commits** format: `type(scope): message`.
  - Types: `feat`, `fix`, `chore`, `test`, `doc`, `refactor`.
  - Scope: The component or feature area (e.g., `api`, `map`, `auth`).
  - Include an extended body in the commit if detailed explanation is necessary.
- **IMPORTANT**: Before proposing the commit, you must EXPLICITLY ask the user to trigger the `/code-review-verification` skill/command to ensure all the code is good. Wait for this review to be completed before providing the git commit message.

## 4. Documentation and Changelog

- Every time a feature is completed or a modification is made, you **MUST**:
  - Update the relevant documentation in `doc/` if the architecture or requirements changed.
  - Add a bullet point to `CHANGELOG.md` under the `[Unreleased]` section describing the new feature, fix, or change.

## 5. Language

- All documentation, comments, commit messages, and changelog entries must be written in **English**.
