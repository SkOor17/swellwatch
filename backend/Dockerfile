# Development stage with Air live-reloading
FROM golang:1.23-alpine AS dev

WORKDIR /app

# Install curl and Air for live reload
RUN apk add --no-cache curl \
    && curl -sSfL https://raw.githubusercontent.com/air-verse/air/master/install.sh | sh -s -- -b $(go env GOPATH)/bin v1.61.7

COPY go.mod go.sum ./
RUN go mod download

COPY . .

EXPOSE 8080

CMD ["air", "-c", ".air.toml"]

# Production build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /api ./cmd/api/main.go

# Production minimal runtime stage
FROM alpine:latest AS prod

WORKDIR /app

COPY --from=builder /api /api

EXPOSE 8080

CMD ["/api"]
