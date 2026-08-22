# SwellWatch Functional Requirements

## 1. Product Context and Vision

SwellWatch is a modern, high-performance surf forecasting platform initially focused on the metropolitan French coast (Atlantic, English Channel, Mediterranean). The goal is to provide a clean, uncluttered interface that combines:

- **Automated quality scoring** per spot (out of 10) and recommended surfer level.
- An **interactive animated map** showing the French coastline and real-time swell dynamics.
- An **expert multi-model breakdown** (primary swell, secondary swell, 10m wind, gusts, tides, and atmospheric pressure).

## 2. Target Users and Use Cases

- **Beginner Surfer**: Needs to know if conditions are safe (manageable waves, sandy bottom, right tide). Needs clear alerts and a simple score.
- **Intermediate Surfer**: Wants to find the best weekend slot in their region quickly without reading complex charts. Needs regional filters and quick comparisons.
- **Advanced / Expert Surfer**: Requires surgical precision on swell components (period, incidence angle, thermal offshore wind, primary vs secondary swell, tide curves).

## 3. Detailed Functional Scope

### Dashboard and Spot Comparator

- **Automated Spot Repository (OpenStreetMap)**: Geographic data for spots is dynamically sourced from the OpenStreetMap Overpass API (using tags like `sport=surfing` and `natural=beach` / `natural=reef`).
- **Lazy-Loading Ingestion MVP**: Data acquisition happens via on-demand lazy loading to avoid heavy cron jobs. The Go server maintains a thread-safe `lastCheck` timestamp in memory (protected by a RWMutex). If more than 24 hours have passed, it queries the API and updates the DB via `UPSERT`.
- **Spot Details**:
  - Instant metrics: Wave height (Hs), dominant period (Tp), swell direction, wind speed/direction.
  - Tides: Visual tide curve (via XTide) showing high/low extremes.
  - 7-day hourly or 3-hourly forecasts.

### Hybrid Scoring Algorithm (Graceful Degradation)

The global score $S \in [0, 10]$ adapts to the data available for the spot:

1. **Basic Mode (Default)**: Used when beach orientation and optimal tide are unknown. Focuses on raw swell energy (Height × Period) and penalizes strong winds (regardless of direction).
2. **Expert Mode**: Used when spot metadata is available. Rewards offshore winds, filters out swells outside the bay window, and gives a bonus if the tide matches the sandbank's optimal window.

### Dynamic Skill Level Matrix

Level is dynamically attributed based on swell energy ($E \propto H^2 \times T$) and seabed type:

- **Beginner** (0.4m - 0.9m, 6s - 9s, Sand): Soft waves, light wind.
- **Intermediate** (0.8m - 1.5m, 8s - 12s, Sand/Soft point): Formed waves, offshore wind.
- **Advanced** (1.4m - 2.2m, 10s - 15s, Hollow sand/Reef): Powerful, fast, barrelling.
- **Expert** (>2.0m, >13s, Slab/Rock/Violent Shorebreak): Heavy conditions, strong currents.

## 4. Interactive Animated Map

- Vector rendering of French coasts.
- Dynamic wave animations representing swell trains moving towards the coast, with thickness proportional to wave height and speed proportional to period.
- Pulsing markers for spots colored by condition score (Green = Excellent, Yellow = Average, Red = Poor).
- Clicking a marker opens a side drawer with the full forecast.

## 5. Non-Functional Requirements

- **Performance**: 60 FPS animation on the Canvas 2D map.
- **API Latency**: Forecast endpoints must respond in < 50ms using Redis caching.
- **Accessibility**: 100% responsive, installable PWA.
- **No Auth**: Zero mandatory authentication for the MVP.
