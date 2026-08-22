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

### `[ ]` US2: Fetching and Displaying Raw Forecasts

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

### `[ ]` US3: Score Calculation and Recommended Level

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

- `[ ]` **US4: Dynamic spot import via OSM** (Lazy Loading Overpass API).
- `[ ]` **US5: Display the interactive coastal map**.
- `[ ]` **US6: Animate swell trains on the map**.

---

## 🧠 Epic 3: Expert Algorithm & Profiling (To Refine)

**Epic Goal**: Refine scoring by taking into account the tide, beach orientation, and allowing the user to configure their own level.

- `[ ]` **US7: Expert calculation mode** (Filtering out-of-window swells, offshore wind bonus).
- `[ ]` **US8: Tide curve integration** into scoring.

---

## 📦 Archive (Completed Tasks)

_Completed and validated User Stories will be moved here to keep a record of what has been accomplished._

- _(No completed tasks yet)_
