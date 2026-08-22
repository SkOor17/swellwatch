# SwellWatch Architecture & Technical Stack

## 1. Global Tech Stack

| Component                 | Technology                         | Role & Justification                                                               |
| :------------------------ | :--------------------------------- | :--------------------------------------------------------------------------------- |
| **Backend API**           | Go 1.22+ (Chi or Gin router)       | High performance, low memory footprint, native concurrent handling.                |
| **Database**              | PostgreSQL 16 (`pgx/v5` or `SQLC`) | Robust relational storage for spots, GPS coordinates, and metadata.                |
| **Forecast Cache**        | Redis 7 (or memory cache)          | Caching Open-Meteo responses to keep latency < 20ms and respect API quotas.        |
| **Frontend Web**          | React 18 / Vite / TypeScript       | Fast rendering, strict static typing.                                              |
| **State & Data Fetching** | TanStack Query v5 + Zustand        | Smart client cache, deduplication, map state sync.                                 |
| **UI & Styling**          | Tailwind CSS + Shadcn UI           | Accessible, responsive, and customizable components.                               |
| **Map Engine**            | HTML5 Canvas 2D                    | 60 FPS fluid animation of swell trains and coastlines without heavy tile services. |

## 2. PostgreSQL Data Model (Spots)

```sql
CREATE TABLE regions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country_code VARCHAR(2) DEFAULT 'FR'
);

CREATE TABLE spots (
    id VARCHAR(50) PRIMARY KEY,
    region_id VARCHAR(50) REFERENCES regions(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    beach_orientation INT,
    seabed_type VARCHAR(50) DEFAULT 'unknown',
    optimal_tide VARCHAR(50),
    ideal_wind_direction INT,
    difficulty_level VARCHAR(50) DEFAULT 'unknown',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 3. REST API Contracts (Go)

### `GET /api/v1/spots`

Returns the static metadata list of surf spots.

### `GET /api/v1/spots/{slug}/forecast`

Returns the 7-day hourly/3-hourly forecast calculated and scored for a given spot.
Response includes tide extremes and hourly objects (wave height/period/direction, secondary swell, wind speed/direction, score, recommended level).

### `GET /api/v1/coastline/wave-vectors`

Returns global swell vectors (Atlantic, Channel, Bay of Biscay, Med) to power the Canvas 2D map engine.

## 4. Cache & Open-Meteo Strategy

- **Redis Cache Key**: `forecast:{spot_id}:{date_hour}`
- **TTL**: 60 minutes. NOAA and ECMWF update every 6 hours, so a 1h TTL ensures freshness while limiting API calls.
- **Resilience**: On external API failure, return the last cached forecast with a `X-Cache-Fallback: true` header.

## 5. Lazy-Loading Ingestion (OpenStreetMap)

The spot table is populated via lazy-loading:

- A shared memory variable `lastCheck` tracks the last Overpass API query.
- Protected by a `sync.RWMutex`.
- If a spot list query comes in and the TTL (24h) is expired, the read lock is dropped, an exclusive write lock is acquired, one worker hits Overpass, runs an `UPSERT` on the DB, updates `lastCheck`, and unlocks.
