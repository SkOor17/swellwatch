.PHONY: start stop docker-build test-backend test-frontend test-all lint-backend lint-frontend lint-all format format-markdown format-frontend format-backend pre-commit precommit setup

# --- Docker ---
start:
	docker compose up -d

stop:
	docker compose down

docker-build:
	docker compose build

# --- Build ---
build-backend:
	cd backend && go build -v ./...

build-frontend:
	cd frontend && npm run build

build-all: build-backend build-frontend

# --- Tests ---
test-backend:
	cd backend && go test -race -v ./...

test-frontend:
	cd frontend && npm run test

test-all: test-backend test-frontend

# --- Lint ---
lint-backend:
	cd backend && golangci-lint run

lint-frontend:
	cd frontend && npm run lint

lint-all: lint-backend lint-frontend

# --- Formatting ---
format-frontend:
	cd frontend && npx prettier --write .

format-backend:
	cd backend && go fmt ./...

format-markdown:
	npx --prefix frontend prettier --write "**/*.md"

format: format-frontend format-backend format-markdown

# --- Pre-commit ---
pre-commit: format lint-all build-all test-all
precommit: pre-commit


