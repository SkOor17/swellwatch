# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- feat(map): Add dynamic spot clustering, 60 FPS Canvas 2D pulsing markers colored by surf score, interactive hit testing, cluster zoom navigation, and sliding forecast drawer (US6).
- feat(map): Implement coastal Canvas 2D map rendering engine with Retina DPR support, local Mercator projection preserving aspect ratio, sub-40KB bundled France vector dataset, 60 FPS animation loop, interactive pan & zoom navigation with wheel/drag gestures and floating controls, and Dashboard view switcher (US5).

- feat(api): Add dynamic French coastal surf spot ingestion from OpenStreetMap Overpass API with in-memory repository, lazy-loading 24h background refresh, and static fallback resilience (US4).
- feat(scoring): Implement basic mode surf score calculation (0 to 10) based on swell energy and wind penalty (US3).
- feat(scoring): Implement dynamic skill level matrix evaluating conditions and seabed type (US3).
- feat(ui): Display condition score badge and recommended skill level badge on spot cards and hourly forecasts (US3).
- chore(backend): Add Air live-reload watcher configuration and dev Docker stage for automatic rebuilds on code changes.
- feat(api): Integrate Open-Meteo Marine & Forecast API with in-memory caching and stale fallback resilience (US2).
- feat(api): Add spot forecast detail endpoint (`GET /api/v1/spots/{id}/forecast`) and enrich spot catalog (`GET /api/v1/spots`) with current conditions (US2).
- feat(ui): Display live forecast cards with wave height, period, wind speed/gusts in knots, and directional indicators with cardinal bearing (US2).
- feat(ui): Add daily hourly forecast breakdown modal and Shadcn UI components (US2).
- feat(api): Add static spots endpoint for MVP (US1).
- feat(ui): Display static spots list using React Query for MVP (US1).
- Initialized documentation, agent rules, and repository structure.
- Initialized Go backend with Chi router, pgx, go-redis, Dockerfile, and golangci-lint configuration.
- Initialized React/Vite/TypeScript frontend with Tailwind CSS, Shadcn UI setup, Zustand, TanStack Query, Dockerfile, and Prettier configuration.
- Added Docker Compose configuration for PostgreSQL, Redis, backend, and frontend services.
- Added Makefile with commands for Docker, testing, linting, formatting, and pre-commit checks.
- Added unit tests for backend API routes and frontend React components (Vitest + Testing Library).
- Added pre-commit configuration and GitHub Actions CI workflow for pull requests.
