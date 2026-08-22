---
description: >-
  Specific guidelines for TypeScript and React frontend development.
  Applies when writing, modifying, or testing frontend code.
trigger:
  path_match: "**/*.{ts,tsx,js,jsx}"
---

# TypeScript & React Guidelines

## 1. TypeScript Best Practices

- **No `any`**: Never use `any`. Use `unknown` if the type is truly not known ahead of time.
- **Immutability**: Use `const` by default. Only use `let` if there is absolutely no other solution.
- **Functional Arrays**: Use lambda expressions and array methods (`.map()`, `.filter()`, `.reduce()`) instead of traditional `for`/`while` loops.
- **Keep Lambdas Simple**: Do not write overly complex lambda expressions. If it's hard to read, extract it into a named function.
- **Testing**: Use Vitest (the Vite-compatible equivalent to Jest/JUnit) for testing.

## 2. React Best Practices

- **Feature-Driven Architecture**: The frontend strictly follows a feature-oriented architecture.
  - `src/pages/` (or `routes/`): Contains the top-level page components that assemble features.
  - `src/components/ui/`: Reserved for base Shadcn UI components.
  - `src/components/shared/`: For generic components shared across multiple features.
  - `src/features/<feature-name>/`: A folder per feature, containing its own `types.ts`, `constants.ts`, `utils/`, `components/` (feature-specific UI), `api/` (React Query hooks), and `store/` (Zustand).
  - Use the `scaffold-frontend-feature` skill when creating a new feature.
- **Shadcn UI First**: Before writing a raw HTML element (like a plain `<div>`, `<button>`, or `<input>`), always check if a Shadcn UI component can be used instead. If the component is missing from the project, install it first using the Shadcn CLI.
- **File Naming**: Maintain strict consistency with PascalCase for React components and camelCase/kebab-case for utilities, depending on project conventions.
