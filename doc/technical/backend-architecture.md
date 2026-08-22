# Go Backend Architecture — SwellWatch

## 1. Source Code Structure (Clean Architecture)

The Go backend project adopts a decoupled layered architecture to ensure testability, extensibility, and robustness:

```text
backend-go/
├── cmd/
│   └── api/
│       └── main.go              # Application entry point, dependency injection
├── internal/
│   ├── domain/                  # Pure business models (Spot, Forecast, SurfScore, Level)
│   │   ├── spot.go
│   │   └── forecast.go
│   ├── service/                 # Business logic and orchestration
│   │   ├── forecast_service.go  # Score calculation and forecast assembly
│   │   └── spot_service.go      # Spot catalog management
│   ├── repository/              # Data persistence access (PostgreSQL)
│   │   ├── postgres_spot_repo.go
│   │   └── schema.sql
│   ├── openmeteo/               # External HTTP client for Open-Meteo Marine API
│   │   ├── client.go
│   │   └── models.go
│   ├── cache/                   # Cache abstraction layer (Redis / In-Memory)
│   │   ├── redis_cache.go
│   │   └── memory_cache.go
│   ├── scoring/                 # Wave and wind evaluation engine
│   │   ├── wind_score.go
│   │   ├── swell_score.go
│   │   └── level_estimator.go
│   └── transport/
│       └── http/                # REST controllers, Chi routes, and middlewares
│           ├── handler.go
│           ├── spot_handler.go
│           ├── forecast_handler.go
│           └── middleware.go
└── config/
    └── config.go                # Environment variables loading (.env)
```

---

## 2. Concurrent Weather Data Ingestion Pipeline

When a user or the dashboard requests forecasts for an entire region containing dozens of spots:

1. The Go service first queries the Redis cache layer via pipeline (`MGET`).
2. For spots where the cache has expired, the service launches concurrent ingestion requests using **goroutines** with a `sync.WaitGroup` and a bounded worker pool (`semaphore` of size 10) to avoid saturating the network connection.
3. Each HTTP call to Open-Meteo is wrapped in a `context.WithTimeout(ctx, 3*time.Second)`.
4. The normalized results are immediately re-injected into Redis with a 3600-second TTL.

---

## 3. Error Handling and Resilience

- **Circuit Breaker & Fallback**: If the external weather API returns an HTTP 5xx error or times out, the system automatically falls back to the last valid forecasts stored in the database or stale cache.
- **HTTP Middlewares**:
  - `Recovery`: Captures any potential panics in handlers to prevent server crashes.
  - `CORS`: Strict configuration for the React frontend.
  - `RateLimiting`: Protection against excessive requests per IP via a token bucket.
  - `Logger`: Structured JSON logging (slog / zerolog).
