# SwellWatch - Product Backlog

This file serves as the source of truth for the project management of the SwellWatch application. Pending a potential migration to an external tool via MCP (like Jira), all tasks are grouped here and organized by **Epics**.

User Stories status is tracked via checkboxes:

- `[ ]` : To Do
- `[/]` : In Progress
- `[x]` : Done - _To be moved to the archive once validated._

---

## 🎯 Epic 1: Minimum Viable Product (MVP)

**Epic Goal**: Validate the technical architecture (Go + React) and the core business logic (scoring) using real data (Open-Meteo) on a restricted set of spots.

### `[x]` US1: Initialization and Static Spots Display

- **As a** surfer,
- **I want** to see a list of available surf spots on my dashboard,
- **So that** I can choose which spot to check.

**Goal**: Set up basic communication between the backend and frontend with a static dataset.

**Expected Results**:

- The Go API exposes a `/api/spots` route returning a list of spots (name, coordinates).
- The React frontend displays these spots as a list.

**Technical Details**:

- Hardcode 3 to 5 spots in the backend (e.g., Hossegor, Biarritz, Lacanau).
- Create a simple React component (`SpotList`).

### `[x]` US2: Fetching and Displaying Raw Forecasts

- **As a** surfer,
- **I want** to see the wave height, period, and wind speed/direction for a spot,
- **So that** I know the raw meteorological and marine conditions.

**Goal**: Integrate real forecast data via Open-Meteo.

**Expected Results**:

- The backend queries the Open-Meteo API for each spot's coordinates.
- The frontend displays this data (swell height, period, wind) for the current day on each spot.

**Technical Details**:

- Use the Open-Meteo Marine API and Forecast API.
- Implement a minimal cache (in-memory for now) in Go.

### `[x]` US3: Score Calculation and Recommended Level

- **As a** surfer,
- **I want** to see a score out of 10 and a recommended level (Beginner, Intermediate, etc.) for each spot,
- **So that** I know at a glance if the conditions are good and suited to my level.

**Goal**: Implement SwellWatch's business logic.

**Expected Results**:

- The backend API includes a `0-10` score and a string for the level in its response.
- The frontend visually displays the score (color code) and a level badge.

**Technical Details**:

- `Basic Mode` implementation: Swell energy with wind penalty.
- Level matrix implementation (`Dynamic Skill Level Matrix`).
- Mandatory TDD approach for scoring logic.

---

## 🗺️ Epic 2: Interactive Map & Dynamic Data (To Refine)

**Epic Goal**: Replace the simple list with an interactive map of France and automatically import spots via OpenStreetMap.

### `[x]` US4: Dynamic Spot Ingestion via OpenStreetMap

- **As a** surfer,
- **I want** the platform to automatically discover and list surf spots along the French coast,
- **So that** I have an exhaustive spot catalog without manual database entry.

**Goal**: Ingest spots dynamically from OSM Overpass API.

**Expected Results**:

- Backend client queries Overpass API for French coastal spots (`sport=surfing`, `natural=beach/reef`).
- Lazy-loading mechanism with thread-safe cache / 24h refresh.
- Error resilience and fallback to cached or static spots.

**Technical Details**:

- Go client with bounded timeout and retries.
- Thread-safe `lastCheck` mutex or cache TTL.

### `[x]` US5: Coastal Canvas 2D Map Rendering Engine & Pan/Zoom Navigation

- **As a** surfer,
- **I want** to see a clean, performant map of the French coastline with intuitive pan and zoom capabilities,
- **So that** I have a geographical overview of surf conditions and can navigate seamlessly across coastal regions.

**Goal**: Implement the high-performance Canvas 2D map engine with responsive pan and zoom navigation.

**Expected Results**:

- Cartographic asset: simplified GeoJSON coastline of France (< 150 KB, ~35 KB bundled).
- Local projection (Mercator / equirectangular) scaled to metropolitan France with aspect-ratio preservation.
- Canvas 2D rendering at 60 FPS with Retina `devicePixelRatio` support.
- Dark ocean theme (`#0B132B`), landmass (`#1C2541`), cyan/white coastal contour (`#38BDF8`).
- **Interactive Pan & Zoom Navigation**:
  - Mouse drag / touch drag to pan across the map.
  - Mouse wheel / pinch-to-zoom gestures centered on cursor position.
  - Bounded viewport navigation (min zoom $1.0\times$, max zoom $8.0\times$ or $10.0\times$, bounded pan preventing navigation away from French coasts).
  - Floating UI control buttons (+ / - / recenter on metropolitan France).
- Dashboard Integration: View mode switch ("Carte" vs "Liste") taking maximum available space.

**Technical Details**:

- **Architecture**: Module `frontend/src/features/map/` (Feature-Driven structure).
  - `types.ts`: Projection boundaries, viewport transform types (`scale`, `panX`, `panY`), coordinate mapping types.
  - `constants.ts`: Geographic bounding box for metropolitan France, theme colors, zoom constraints (`MIN_ZOOM = 1`, `MAX_ZOOM = 8`).
  - `data/franceCoastline.ts`: Bundled vector dataset (< 40 KB) for instant zero-latency rendering.
  - `utils/projection.ts`: Local Mercator projection with $\cos(\text{lat}_{\text{mean}})$ scaling, letterboxing/padding, viewport transformation utilities (`screenToWorld`, `worldToScreen`).
  - `components/CoastalMap.tsx`: Canvas 2D engine with `devicePixelRatio` scaling, pre-compiled `Path2D`, `ResizeObserver`, pointer event listeners for pan & wheel zoom, floating control buttons (`+`, `-`, `Recentrer`), and `requestAnimationFrame` loop.
- **TDD Test Suite**: Projection and viewport unit tests (`projection.test.ts`), component interaction tests (`CoastalMap.test.tsx`).

### `[x]` US6: Clustered Spot Markers & Forecast Drawer

- **As a** surfer,
- **I want** to see spots grouped into summary clusters at low zoom that expand into pulsing spot markers when zooming in, and click any spot to open a side drawer,
- **So that** I am not overwhelmed by too many markers at national zoom, while accessing detailed spot forecasts at regional and local zoom.

**Goal**: Add zoom-dependent dynamic spot clustering, interactive markers, and details drawer to the map.

**Expected Results**:

- **Dynamic Spot Clustering**:
  - Low zoom level ($Z < Z_{\text{threshold}}$): Nearby spots are aggregated into visual clusters displaying spot count (e.g. `8`) and an average condition score color badge.
  - Regional / High zoom level ($Z \ge Z_{\text{threshold}}$): Clusters smoothly dissolve into individual spot markers with spot names and pulsing score badges.
- Pulsing markers colored by condition score (Green $\ge 7.5$, Yellow $5.0-7.4$, Red $< 5.0$).
- Hit-testing collision detection ($r = 12\text{px}$) for hover cursor and click events.
- Sliding side drawer (Shadcn Sheet) showing spot forecasts on click.

**Technical Details**:

- Cluster calculation utility (`utils/clustering.ts`) aggregating spots based on screen-space proximity at current zoom level.
- Integrate with existing `useSpots` hook.
- Reuse hourly forecasts and score badges in the side drawer.

### `[ ]` US7: Animated Swell Trains on the Map

- **As a** surfer,
- **I want** to see animated wavefronts propagating towards the coast,
- **So that** I can visualize swell direction, energy, and period dynamically.

**Goal**: Simulate swell trains on Canvas using maritime wave vectors.

**Expected Results**:

- Backend endpoint `GET /api/v1/coastline/wave-vectors` providing regional offshore swell vectors (Atlantic, Channel, Bay of Biscay, Med).
- Canvas kinematic wave propagation engine ($\theta, H_s, T_p$) with coastal cosine fade-out.
- 60 FPS fluid rendering loop.

---

## 🧠 Epic 3: Expert Algorithm & Profiling (To Refine)

**Epic Goal**: Refine scoring by taking into account the tide, beach orientation, and allowing the user to configure their own level.

- `[ ]` **US7: Expert calculation mode** (Filtering out-of-window swells, offshore wind bonus).
- `[ ]` **US8: Tide curve integration** into scoring.

---

## 📦 Archive (Completed Tasks)

_Completed and validated User Stories will be moved here to keep a record of what has been accomplished._

- _(No completed tasks yet)_
