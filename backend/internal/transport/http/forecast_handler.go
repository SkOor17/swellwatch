package http

import (
	"log"
	"net/http"

	chi "github.com/go-chi/chi/v5"
	"github.com/swellwatch/backend/internal/service"
)

func GetSpotForecastHandler(spotSvc *service.SpotService, forecastSvc *service.ForecastService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		spotID := chi.URLParam(r, "id")
		if spotID == "" {
			writeJSONError(w, http.StatusBadRequest, "spot id is required")
			return
		}

		spot, found := spotSvc.GetSpotByID(spotID)
		if !found {
			writeJSONError(w, http.StatusNotFound, "spot not found")
			return
		}

		forecast, err := forecastSvc.GetSpotForecast(r.Context(), *spot)
		if err != nil {
			log.Printf("Error fetching forecast for spot %s: %v", spotID, err)
			writeJSONError(w, http.StatusBadGateway, "failed to fetch forecast")
			return
		}

		writeJSON(w, http.StatusOK, forecast)
	}
}
