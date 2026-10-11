package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/swellwatch/backend/internal/domain"
)

func TestSpotService_GetAllSpots(t *testing.T) {
	svc := NewSpotService()
	spots := svc.GetAllSpots()

	assert.Len(t, spots, 3)
	assert.Equal(t, "hossegor", spots[0].ID)
	assert.Equal(t, domain.SeabedSand, spots[0].SeabedType)
	assert.Equal(t, "biarritz", spots[1].ID)
	assert.Equal(t, "lacanau", spots[2].ID)
}

func TestSpotService_GetSpotByID(t *testing.T) {
	svc := NewSpotService()

	spot, found := svc.GetSpotByID("hossegor")
	assert.True(t, found)
	assert.Equal(t, "Hossegor", spot.Name)
	assert.Equal(t, 43.668, spot.Latitude)
	assert.Equal(t, domain.SeabedSand, spot.SeabedType)

	_, found = svc.GetSpotByID("unknown")
	assert.False(t, found)
}
