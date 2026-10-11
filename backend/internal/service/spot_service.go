package service

import (
	"strings"

	"github.com/swellwatch/backend/internal/domain"
)

type SpotService struct {
	spots []domain.Spot
}

func NewSpotService() *SpotService {
	return &SpotService{
		spots: []domain.Spot{
			{ID: "hossegor", Name: "Hossegor", Latitude: 43.668, Longitude: -1.439, SeabedType: domain.SeabedSand},
			{ID: "biarritz", Name: "Biarritz", Latitude: 43.483, Longitude: -1.558, SeabedType: domain.SeabedSand},
			{ID: "lacanau", Name: "Lacanau-Océan", Latitude: 45.001, Longitude: -1.2, SeabedType: domain.SeabedSand},
		},
	}
}

func (s *SpotService) GetAllSpots() []domain.Spot {
	spotsCopy := make([]domain.Spot, len(s.spots))
	copy(spotsCopy, s.spots)
	return spotsCopy
}

func (s *SpotService) GetSpotByID(id string) (*domain.Spot, bool) {
	for _, sp := range s.spots {
		if strings.EqualFold(sp.ID, id) {
			res := sp
			return &res, true
		}
	}
	return nil, false
}
