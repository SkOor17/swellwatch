package service_test

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/swellwatch/backend/internal/domain"
	"github.com/swellwatch/backend/internal/repository"
	"github.com/swellwatch/backend/internal/service"
)

type mockOSMClient struct {
	mu        sync.Mutex
	spots     []domain.Spot
	err       error
	callCount int
	calledCh  chan struct{}
}

func (m *mockOSMClient) FetchSurfingSpots(ctx context.Context) ([]domain.Spot, error) {
	m.mu.Lock()
	m.callCount++
	calledCh := m.calledCh
	m.mu.Unlock()

	if calledCh != nil {
		select {
		case calledCh <- struct{}{}:
		default:
		}
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	if m.err != nil {
		return nil, m.err
	}
	return m.spots, nil
}

func (m *mockOSMClient) getCallCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.callCount
}

func TestSpotService_FallbackToStaticWhenEmpty(t *testing.T) {
	repo := repository.NewMemorySpotRepository()
	mockClient := &mockOSMClient{}
	svc := service.NewSpotService(repo, mockClient, 24*time.Hour)

	ctx := context.Background()
	spots := svc.GetAllSpots(ctx)

	require.Len(t, spots, 3)
	assert.Equal(t, "hossegor", spots[0].ID)
	assert.Equal(t, "Hossegor", spots[0].Name)
	assert.Equal(t, domain.SeabedSand, spots[0].SeabedType)
	assert.Equal(t, "biarritz", spots[1].ID)
	assert.Equal(t, "lacanau", spots[2].ID)

	// Get by ID fallback
	spot, found := svc.GetSpotByID(ctx, "hossegor")
	assert.True(t, found)
	require.NotNil(t, spot)
	assert.Equal(t, "Hossegor", spot.Name)

	_, found = svc.GetSpotByID(ctx, "nonexistent")
	assert.False(t, found)
}

func TestSpotService_RefreshSpots_Success(t *testing.T) {
	repo := repository.NewMemorySpotRepository()
	mockClient := &mockOSMClient{
		spots: []domain.Spot{
			{ID: "osm-node-101", Name: "La Torche", Latitude: 47.789, Longitude: -3.512, SeabedType: domain.SeabedRock},
			{ID: "osm-node-202", Name: "Quiberon", Latitude: 47.483, Longitude: -3.120, SeabedType: domain.SeabedSand},
		},
	}
	svc := service.NewSpotService(repo, mockClient, 24*time.Hour)

	ctx := context.Background()
	err := svc.RefreshSpots(ctx)
	require.NoError(t, err)

	spots := svc.GetAllSpots(ctx)
	// 3 static spots + 2 OSM spots = 5 spots
	assert.Len(t, spots, 5)

	spot, found := svc.GetSpotByID(ctx, "osm-node-101")
	assert.True(t, found)
	require.NotNil(t, spot)
	assert.Equal(t, "La Torche", spot.Name)
	assert.Equal(t, domain.SeabedRock, spot.SeabedType)
}

func TestSpotService_GetAllSpots_TriggersBackgroundRefresh(t *testing.T) {
	repo := repository.NewMemorySpotRepository()
	calledCh := make(chan struct{}, 1)
	mockClient := &mockOSMClient{
		calledCh: calledCh,
		spots: []domain.Spot{
			{ID: "osm-node-101", Name: "La Torche", Latitude: 47.789, Longitude: -3.512, SeabedType: domain.SeabedRock},
		},
	}
	svc := service.NewSpotService(repo, mockClient, 24*time.Hour)

	ctx := context.Background()

	// Initial call should immediately return static spots and trigger background refresh
	initialSpots := svc.GetAllSpots(ctx)
	assert.Len(t, initialSpots, 3)

	// Wait for background goroutine to execute
	select {
	case <-calledCh:
	case <-time.After(2 * time.Second):
		t.Fatal("Timed out waiting for background refresh")
	}

	// Give a tiny moment for SaveAll to finish
	time.Sleep(50 * time.Millisecond)

	// Next call returns merged spots
	updatedSpots := svc.GetAllSpots(ctx)
	assert.Len(t, updatedSpots, 4)
	assert.Equal(t, 1, mockClient.getCallCount())
}

func TestSpotService_OSMClientError_Resilience(t *testing.T) {
	repo := repository.NewMemorySpotRepository()
	mockClient := &mockOSMClient{
		err: errors.New("overpass service unavailable 504"),
	}
	svc := service.NewSpotService(repo, mockClient, 24*time.Hour)

	ctx := context.Background()
	err := svc.RefreshSpots(ctx)
	assert.Error(t, err)

	// Still safely returns static spots without panic or empty state
	spots := svc.GetAllSpots(ctx)
	assert.Len(t, spots, 3)

	spot, found := svc.GetSpotByID(ctx, "hossegor")
	assert.True(t, found)
	require.NotNil(t, spot)
}

func TestSpotService_ConcurrentAccess(t *testing.T) {
	repo := repository.NewMemorySpotRepository()
	mockClient := &mockOSMClient{
		spots: []domain.Spot{
			{ID: "osm-node-101", Name: "La Torche", Latitude: 47.789, Longitude: -3.512, SeabedType: domain.SeabedRock},
		},
	}
	svc := service.NewSpotService(repo, mockClient, 10*time.Millisecond)

	var wg sync.WaitGroup
	ctx := context.Background()

	for i := 0; i < 30; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			spots := svc.GetAllSpots(ctx)
			assert.NotEmpty(t, spots)
			_, _ = svc.GetSpotByID(ctx, "hossegor")
			_, _ = svc.GetSpotByID(ctx, "osm-node-101")
		}()
	}

	wg.Wait()
}
