package service

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/swellwatch/backend/internal/cache"
	"github.com/swellwatch/backend/internal/domain"
	"github.com/swellwatch/backend/internal/openmeteo"
	"github.com/swellwatch/backend/internal/scoring"
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
		if cached.Current.Level == "" {
			s.enrichForecastWithScoring(spot, &cached)
		}
		return &cached, nil
	}

	forecast, err := s.client.FetchSpotForecast(ctx, spot.ID, spot.Latitude, spot.Longitude)
	if err != nil {
		if stale, found := s.cache.GetStale(spot.ID); found {
			log.Printf("Warning: failed to fetch fresh forecast for %s (%v), returning stale cache", spot.ID, err)
			if stale.Current.Level == "" {
				s.enrichForecastWithScoring(spot, &stale)
			}
			return &stale, nil
		}
		return nil, err
	}

	s.enrichForecastWithScoring(spot, forecast)
	s.cache.Set(spot.ID, *forecast, s.ttl)
	return forecast, nil
}

func (s *ForecastService) enrichForecastWithScoring(spot domain.Spot, forecast *domain.SpotForecast) {
	if forecast == nil {
		return
	}

	seabed := spot.SeabedType
	if seabed == "" {
		seabed = domain.SeabedSand
	}

	currentScore, currentLevel := scoring.EvaluateConditions(
		forecast.Current.WaveHeight,
		forecast.Current.WavePeriod,
		forecast.Current.WindSpeed,
		seabed,
	)
	forecast.Current.Score = currentScore
	forecast.Current.Level = currentLevel

	for i := range forecast.Hourly {
		hScore, hLevel := scoring.EvaluateConditions(
			forecast.Hourly[i].WaveHeight,
			forecast.Hourly[i].WavePeriod,
			forecast.Hourly[i].WindSpeed,
			seabed,
		)
		forecast.Hourly[i].Score = hScore
		forecast.Hourly[i].Level = hLevel
	}
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
