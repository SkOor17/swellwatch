package http

import (
	"log"
	"net/http"
	"time"

	chi "github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/swellwatch/backend/internal/cache"
	"github.com/swellwatch/backend/internal/domain"
	"github.com/swellwatch/backend/internal/openmeteo"
	"github.com/swellwatch/backend/internal/osm"
	"github.com/swellwatch/backend/internal/repository"
	"github.com/swellwatch/backend/internal/service"
)

func SetupRouter() http.Handler {
	repo := repository.NewMemorySpotRepository()
	osmClient := osm.NewClient()
	spotSvc := service.NewSpotService(repo, osmClient, 24*time.Hour)
	openMeteoClient := openmeteo.NewClient()
	memCache := cache.NewMemoryCache[domain.SpotForecast]()
	forecastSvc := service.NewForecastService(openMeteoClient, memCache, 1*time.Hour)

	return SetupRouterWithServices(spotSvc, forecastSvc)
}

func SetupRouterWithServices(spotSvc *service.SpotService, forecastSvc *service.ForecastService) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		if _, err := w.Write([]byte("SwellWatch API is running")); err != nil {
			log.Printf("Failed to write response: %v", err)
		}
	})

	r.Route("/api/v1/spots", func(r chi.Router) {
		r.Get("/", GetSpotsHandler(spotSvc, forecastSvc))
		r.Get("/{id}/forecast", GetSpotForecastHandler(spotSvc, forecastSvc))
	})

	return r
}
