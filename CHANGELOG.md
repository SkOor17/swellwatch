# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- feat(api): Add static spots endpoint for MVP (US1).
- feat(ui): Display static spots list using React Query for MVP (US1).
- Initialized documentation, agent rules, and repository structure.
- Initialized Go backend with Chi router, pgx, go-redis, Dockerfile, and golangci-lint configuration.
- Initialized React/Vite/TypeScript frontend with Tailwind CSS, Shadcn UI setup, Zustand, TanStack Query, Dockerfile, and Prettier configuration.
- Added Docker Compose configuration for PostgreSQL, Redis, backend, and frontend services.
- Added Makefile with commands for Docker, testing, linting, formatting, and pre-commit checks.
- Added unit tests for backend API routes and frontend React components (Vitest + Testing Library).
- Added pre-commit configuration and GitHub Actions CI workflow for pull requests.
