package http

import (
	"net/http"

	"github.com/swellwatch/backend/internal/domain"
	"github.com/swellwatch/backend/internal/service"
)

func GetSpotsHandler(spotSvc *service.SpotService, forecastSvc *service.ForecastService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		spots := spotSvc.GetAllSpots(r.Context())
		if forecastSvc != nil {
			spots = forecastSvc.EnrichSpotsWithForecasts(r.Context(), spots)
		}

		writeJSON(w, http.StatusOK, map[string][]domain.Spot{"spots": spots})
	}
}
