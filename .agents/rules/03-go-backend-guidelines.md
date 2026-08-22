---
description: >-
  Specific guidelines for the Go backend.
  Applies when writing, modifying, or testing Go code.
trigger:
  path_match: "**/*.go"
---

# Go Backend Guidelines

## 1. Style and Best Practices
- Strictly adhere to the [Google Go Style Guide](https://google.github.io/styleguide/go/decisions.html).
- Prioritize clear, idiomatic Go code.
- Always protect global variables or shared states (like the `lastCheck` for the lazy-loading cache) with `sync.Mutex` or `sync.RWMutex`.

## 2. Testing in Go
- **Table-Driven Tests**: Use table-driven tests extensively for testing multiple scenarios and edge cases efficiently.
- **Mocks**: 
  - Use mocks when necessary to isolate business logic from external dependencies (e.g., Database, Open-Meteo API).
  - Do NOT write mocks by hand. Generate them automatically using `mockery`.
- **Race Detector**: Always run tests with the race condition flag enabled: `go test -race ./...`.
