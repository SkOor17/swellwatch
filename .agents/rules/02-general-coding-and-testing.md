---
description: >-
  General coding standards for readability, structure, and unit testing practices.
  Applies to all code generation and testing across both Go and TypeScript.
trigger: always_on
---

# General Coding & Testing Rules

## 1. Code Readability and Structure
- Prioritize human-readable, clear code over clever but obscure one-liners.
- Use explicit, descriptive names for functions, variables, and constants.
- **Early Returns**: Use early returns (guard clauses) to avoid deep nesting.
- **Shallow Nesting**: Avoid excessive nesting of `if` statements and loops. Break down complex logic into smaller, well-named helper functions.

## 2. Unit Testing Principles
- Unit tests must be readable and easily understandable by a human.
- The primary goal of testing is to test **business rules** and cover a maximum of **edge cases**.
- Do NOT test private/internal methods directly. Test them through the public API of the module or class.
- Name tests clearly to describe the behavior being tested (e.g., `returns_404_when_spot_not_found`).
