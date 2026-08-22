# SwellWatch 🌊

SwellWatch is a modern, high-performance surf forecasting platform for the French coast. It features an automated spot quality score, a dynamic surfer level recommendation system, and a 60 FPS interactive Canvas 2D map showing animated swell trains.

## Project Architecture
This is a monorepo consisting of:
- **`/backend`**: Go REST API (Chi/Gin) connected to PostgreSQL and Redis.
- **`/frontend`**: React 18 SPA built with Vite, TypeScript, TanStack Query, Tailwind CSS, and Shadcn UI.

## Prerequisites
To develop and run the application locally, ensure you have the following installed:
- **Go** (1.22+)
- **Node.js** (v20+)
- **PostgreSQL** (v16+)
- **Redis** (v7+)

## Quickstart

### Backend Setup
1. `cd backend`
2. Configure your PostgreSQL database and Redis connection in `.env`.
3. `go mod tidy`
4. `go run cmd/api/main.go` (Runs on `http://localhost:8080`)

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev` (Runs on `http://localhost:5173`)

## Contributing
Please refer to the `AGENTS.md` and the `.agents/rules/` directory for our strict coding standards, TDD workflow, and Git commit conventions. All changes must be documented and noted in the `CHANGELOG.md`.