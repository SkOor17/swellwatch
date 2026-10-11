package service

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/swellwatch/backend/internal/cache"
	"github.com/swellwatch/backend/internal/domain"
	"github.com/swellwatch/backend/internal/openmeteo"
)

type ForecastService struct {
	client openmeteo.Client
	cache  *cache.MemoryCache[domain.SpotForecast]
	ttl    time.Duration
}

func NewForecastService(client openmeteo.Client, cache *cache.MemoryCache[domain.SpotForecast], ttl time.Duration) *ForecastService {
	return &ForecastService{
		client: client,
		cache:  cache,
		ttl:    ttl,
	}
}

func (s *ForecastService) GetSpotForecast(ctx context.Context, spot domain.Spot) (*domain.SpotForecast, error) {
	if cached, found := s.cache.Get(spot.ID); found {
		return &cached, nil
	}

	forecast, err := s.client.FetchSpotForecast(ctx, spot.ID, spot.Latitude, spot.Longitude)
	if err != nil {
		if stale, found := s.cache.GetStale(spot.ID); found {
			log.Printf("Warning: failed to fetch fresh forecast for %s (%v), returning stale cache", spot.ID, err)
			return &stale, nil
		}
		return nil, err
	}

	s.cache.Set(spot.ID, *forecast, s.ttl)
	return forecast, nil
}

func (s *ForecastService) EnrichSpotsWithForecasts(ctx context.Context, spots []domain.Spot) []domain.Spot {
	enriched := make([]domain.Spot, len(spots))
	copy(enriched, spots)

	var wg sync.WaitGroup
	sem := make(chan struct{}, 10) // Max 10 concurrent requests

	for i := range enriched {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			forecast, err := s.GetSpotForecast(ctx, enriched[idx])
			if err != nil {
				log.Printf("Failed to get forecast for spot %s: %v", enriched[idx].ID, err)
				return
			}
			current := forecast.Current
			enriched[idx].CurrentForecast = &current
		}(i)
	}

	wg.Wait()
	return enriched
}
