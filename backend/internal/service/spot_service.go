package service

import (
	"context"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/swellwatch/backend/internal/domain"
	"github.com/swellwatch/backend/internal/osm"
	"github.com/swellwatch/backend/internal/repository"
)

type SpotService struct {
	repo            repository.SpotRepository
	osmClient       osm.Client
	refreshInterval time.Duration
	staticSpots     []domain.Spot

	mu           sync.RWMutex
	lastCheck    time.Time
	isRefreshing bool
}

func DefaultStaticSpots() []domain.Spot {
	return []domain.Spot{
		{ID: "hossegor", Name: "Hossegor", Latitude: 43.668, Longitude: -1.439, SeabedType: domain.SeabedSand},
		{ID: "biarritz", Name: "Biarritz", Latitude: 43.483, Longitude: -1.558, SeabedType: domain.SeabedSand},
		{ID: "lacanau", Name: "Lacanau-Océan", Latitude: 45.001, Longitude: -1.2, SeabedType: domain.SeabedSand},
	}
}

func NewDefaultSpotService() *SpotService {
	return NewSpotService(nil, nil, 0)
}

func NewSpotService(repo repository.SpotRepository, osmClient osm.Client, refreshInterval time.Duration) *SpotService {
	if repo == nil {
		repo = repository.NewMemorySpotRepository()
	}
	if refreshInterval <= 0 {
		refreshInterval = 24 * time.Hour
	}

	return &SpotService{
		repo:            repo,
		osmClient:       osmClient,
		refreshInterval: refreshInterval,
		staticSpots:     DefaultStaticSpots(),
	}
}

func (s *SpotService) GetAllSpots(ctx context.Context) []domain.Spot {
	s.checkAndTriggerRefresh()

	spots, err := s.repo.GetAll(ctx)
	if err != nil || len(spots) == 0 {
		return s.getStaticSpotsCopy()
	}

	return spots
}

func (s *SpotService) GetSpotByID(ctx context.Context, id string) (*domain.Spot, bool) {
	if spot, found, err := s.repo.GetByID(ctx, id); err == nil && found {
		return spot, true
	}

	for _, sp := range s.staticSpots {
		if strings.EqualFold(sp.ID, id) {
			res := sp
			return &res, true
		}
	}

	return nil, false
}

func (s *SpotService) RefreshSpots(ctx context.Context) error {
	if s.osmClient == nil {
		return nil
	}

	osmSpots, err := s.osmClient.FetchSurfingSpots(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch surfing spots from OSM: %w", err)
	}

	merged := s.mergeSpots(osmSpots)
	if err := s.repo.SaveAll(ctx, merged); err != nil {
		return fmt.Errorf("failed to save spots into repository: %w", err)
	}

	s.mu.Lock()
	s.lastCheck = time.Now()
	s.mu.Unlock()

	return nil
}

func (s *SpotService) checkAndTriggerRefresh() {
	if s.osmClient == nil {
		return
	}

	s.mu.Lock()
	if s.isRefreshing {
		s.mu.Unlock()
		return
	}
	if !s.lastCheck.IsZero() && time.Since(s.lastCheck) < s.refreshInterval {
		s.mu.Unlock()
		return
	}
	s.isRefreshing = true
	s.mu.Unlock()

	go func() {
		defer func() {
			s.mu.Lock()
			s.isRefreshing = false
			s.mu.Unlock()
		}()

		bgCtx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()

		if err := s.RefreshSpots(bgCtx); err != nil {
			log.Printf("Warning: background refresh of spots failed: %v", err)
			s.mu.Lock()
			s.lastCheck = time.Now().Add(-s.refreshInterval + 5*time.Minute)
			s.mu.Unlock()
		}
	}()
}

func (s *SpotService) mergeSpots(osmSpots []domain.Spot) []domain.Spot {
	merged := make([]domain.Spot, 0, len(s.staticSpots)+len(osmSpots))
	merged = append(merged, s.staticSpots...)

	seenIDs := make(map[string]struct{}, len(s.staticSpots))
	for _, sp := range s.staticSpots {
		seenIDs[strings.ToLower(sp.ID)] = struct{}{}
	}

	for _, sp := range osmSpots {
		idLower := strings.ToLower(sp.ID)
		if _, exists := seenIDs[idLower]; !exists {
			merged = append(merged, sp)
			seenIDs[idLower] = struct{}{}
		}
	}

	return merged
}

func (s *SpotService) getStaticSpotsCopy() []domain.Spot {
	spotsCopy := make([]domain.Spot, len(s.staticSpots))
	copy(spotsCopy, s.staticSpots)
	return spotsCopy
}
