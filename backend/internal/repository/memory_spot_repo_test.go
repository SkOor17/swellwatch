package repository_test

import (
	"context"
	"fmt"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/swellwatch/backend/internal/domain"
	"github.com/swellwatch/backend/internal/repository"
)

func TestMemorySpotRepository_SaveAndGetAll(t *testing.T) {
	repo := repository.NewMemorySpotRepository()
	ctx := context.Background()

	// Initial state is empty
	spots, err := repo.GetAll(ctx)
	require.NoError(t, err)
	assert.Empty(t, spots)

	// Save spots
	testSpots := []domain.Spot{
		{ID: "hossegor", Name: "Hossegor", Latitude: 43.668, Longitude: -1.439, SeabedType: domain.SeabedSand},
		{ID: "biarritz", Name: "Biarritz", Latitude: 43.483, Longitude: -1.558, SeabedType: domain.SeabedSand},
	}

	err = repo.SaveAll(ctx, testSpots)
	require.NoError(t, err)

	spots, err = repo.GetAll(ctx)
	require.NoError(t, err)
	assert.Len(t, spots, 2)
	assert.ElementsMatch(t, testSpots, spots)
}

func TestMemorySpotRepository_GetByID(t *testing.T) {
	repo := repository.NewMemorySpotRepository()
	ctx := context.Background()

	testSpots := []domain.Spot{
		{ID: "hossegor", Name: "Hossegor", Latitude: 43.668, Longitude: -1.439, SeabedType: domain.SeabedSand},
	}
	require.NoError(t, repo.SaveAll(ctx, testSpots))

	// Found
	spot, found, err := repo.GetByID(ctx, "hossegor")
	require.NoError(t, err)
	assert.True(t, found)
	require.NotNil(t, spot)
	assert.Equal(t, "Hossegor", spot.Name)

	// Case-insensitive found
	spot, found, err = repo.GetByID(ctx, "HOSSEGOR")
	require.NoError(t, err)
	assert.True(t, found)
	require.NotNil(t, spot)
	assert.Equal(t, "Hossegor", spot.Name)

	// Not found
	spot, found, err = repo.GetByID(ctx, "nonexistent")
	require.NoError(t, err)
	assert.False(t, found)
	assert.Nil(t, spot)
}

func TestMemorySpotRepository_ConcurrentAccess(t *testing.T) {
	repo := repository.NewMemorySpotRepository()
	ctx := context.Background()

	var wg sync.WaitGroup
	numWorkers := 20

	// Concurrent writes
	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			spots := []domain.Spot{
				{
					ID:        fmt.Sprintf("spot-%d", workerID),
					Name:      fmt.Sprintf("Spot %d", workerID),
					Latitude:  43.0 + float64(workerID)*0.01,
					Longitude: -1.0 - float64(workerID)*0.01,
				},
			}
			err := repo.SaveAll(ctx, spots)
			assert.NoError(t, err)
		}(i)
	}

	// Concurrent reads
	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			_, err := repo.GetAll(ctx)
			assert.NoError(t, err)
			_, _, err = repo.GetByID(ctx, fmt.Sprintf("spot-%d", workerID))
			assert.NoError(t, err)
		}(i)
	}

	wg.Wait()
}
