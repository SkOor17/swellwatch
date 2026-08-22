# React Frontend Architecture — SwellWatch

## 1. Source Code Structure (Feature-Driven Architecture)

The frontend project strictly adopts a Feature-Driven architecture. This ensures that as the application grows, code remains modular, cohesive, and easy to locate.

```text
frontend/
├── src/
│   ├── assets/              # Static assets like images and global CSS
│   ├── components/
│   │   ├── ui/              # Base UI components (Shadcn UI)
│   │   └── shared/          # Generic components shared across multiple features
│   ├── features/            # Feature modules
│   │   └── spots/           # Example: The "spots" feature
│   │       ├── api/         # React Query hooks (e.g., useSpots.ts)
│   │       ├── components/  # UI components specific to this feature (e.g., SpotList.tsx)
│   │       ├── store/       # Zustand stores for this feature
│   │       ├── utils/       # Helper functions
│   │       ├── constants.ts # Feature-level constants
│   │       └── types.ts     # TypeScript interfaces and types
│   ├── lib/                 # Core utilities and configurations (e.g., Axios client, Shadcn utils)
│   ├── pages/               # Top-level page components that assemble features (e.g., Dashboard.tsx)
│   ├── App.tsx              # Main application router and context providers
│   └── main.tsx             # React entry point
```

## 2. Core Principles

- **Cohesion over Coupling**: Everything related to a specific feature (API calls, types, local state, UI components) must reside within its `src/features/<feature-name>/` directory.
- **Pages as Assemblers**: The `src/pages/` directory is reserved for components that act as "views" or "routes". They should remain as thin as possible, importing and orchestrating feature components.
- **Shadcn UI Strategy**: Always prefer generating a base component via Shadcn UI (into `src/components/ui/`) rather than creating raw HTML/Tailwind components from scratch.
- **State Management**:
  - Server State: `@tanstack/react-query` (located in `api/`).
  - Client State: `zustand` (located in `store/`).
