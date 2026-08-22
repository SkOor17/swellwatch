# Antigravity Agents Entry Point

Welcome to the SwellWatch project!

This file (`AGENTS.md`) serves as the primary entry point for the Antigravity AI agents working on this repository. As an agent, you must strictly follow the rules defined in the `.agents/rules/` directory and utilize the skills in `.agents/skills/` to ensure high code quality, consistency, and a seamless developer experience.

## Rules
All rules apply hierarchically. When working in this workspace, you must adhere to:

- **[Workflow & Git](.agents/rules/01-workflow-and-git.md)**: Details the TDD workflow, commit formatting, and documentation requirements.
- **[General Coding & Testing](.agents/rules/02-general-coding-and-testing.md)**: Global standards for readability and testing.
- **[Go Backend Guidelines](.agents/rules/03-go-backend-guidelines.md)**: Rules specifically for the Go API.
- **[TypeScript & React Guidelines](.agents/rules/04-typescript-react-guidelines.md)**: Rules specifically for the frontend.

## Skills
- **`code-review-verification`**: Must be invoked at the end of feature implementation before creating a commit.

## Context
SwellWatch is a surf forecasting platform. You can find detailed specifications in the `doc/` folder. The architecture is a Go backend with a React/Vite/TypeScript frontend.
