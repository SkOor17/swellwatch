package http

import (
	"encoding/json"
	"github.com/swellwatch/backend/internal/domain"
	"log"
	"net/http"
)

func GetSpotsHandler(w http.ResponseWriter, r *http.Request) {
	spots := []domain.Spot{
		{ID: "hossegor", Name: "Hossegor", Latitude: 43.668, Longitude: -1.439},
		{ID: "biarritz", Name: "Biarritz", Latitude: 43.483, Longitude: -1.558},
		{ID: "lacanau", Name: "Lacanau-Océan", Latitude: 45.001, Longitude: -1.2},
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string][]domain.Spot{"spots": spots}); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}
