package http

import (
	"log"
	"net/http"

	chi "github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func SetupRouter() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		if _, err := w.Write([]byte("SwellWatch API is running")); err != nil {
			log.Printf("Failed to write response: %v", err)
		}
	})

	r.Get("/api/v1/spots", GetSpotsHandler)

	return r
}
