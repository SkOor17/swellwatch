package http

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/swellwatch/backend/internal/cache"
	"github.com/swellwatch/backend/internal/domain"
	"github.com/swellwatch/backend/internal/service"
)

type mockClient struct {
	fetchFunc func(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error)
}

func (m *mockClient) FetchSpotForecast(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error) {
	if m.fetchFunc != nil {
		return m.fetchFunc(ctx, spotID, lat, lon)
	}
	return nil, nil
}

func TestGetSpotForecastHandler(t *testing.T) {
	spotSvc := service.NewSpotService()

	t.Run("returns_404_when_spot_not_found", func(t *testing.T) {
		memCache := cache.NewMemoryCache[domain.SpotForecast]()
		client := &mockClient{}
		forecastSvc := service.NewForecastService(client, memCache, time.Hour)
		handler := SetupRouterWithServices(spotSvc, forecastSvc)

		req := httptest.NewRequest(http.MethodGet, "/api/v1/spots/nonexistent/forecast", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
		var res map[string]string
		err := json.NewDecoder(rr.Body).Decode(&res)
		require.NoError(t, err)
		assert.Equal(t, "spot not found", res["error"])
	})

	t.Run("returns_200_with_spot_forecast_details", func(t *testing.T) {
		memCache := cache.NewMemoryCache[domain.SpotForecast]()
		client := &mockClient{
			fetchFunc: func(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error) {
				return &domain.SpotForecast{
					SpotID: "hossegor",
					Current: domain.CurrentConditions{
						WaveHeight:         1.8,
						WavePeriod:         11.0,
						WaveDirection:      280,
						SwellWaveHeight:    1.6,
						SwellWavePeriod:    12.0,
						SwellWaveDirection: 285,
						WindSpeed:          14.0,
						WindGusts:          20.0,
						WindDirection:      290,
						LastUpdatedAt:      time.Date(2026, 8, 22, 15, 0, 0, 0, time.UTC),
					},
					Hourly: []domain.HourlyForecast{
						{
							Time:       time.Date(2026, 8, 22, 15, 0, 0, 0, time.UTC),
							WaveHeight: 1.8,
							WindSpeed:  14.0,
						},
					},
					LastUpdatedAt: time.Date(2026, 8, 22, 15, 0, 0, 0, time.UTC),
				}, nil
			},
		}
		forecastSvc := service.NewForecastService(client, memCache, time.Hour)
		handler := SetupRouterWithServices(spotSvc, forecastSvc)

		req := httptest.NewRequest(http.MethodGet, "/api/v1/spots/hossegor/forecast", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))

		var forecast domain.SpotForecast
		err := json.NewDecoder(rr.Body).Decode(&forecast)
		require.NoError(t, err)
		assert.Equal(t, "hossegor", forecast.SpotID)
		assert.Equal(t, 1.8, forecast.Current.WaveHeight)
		assert.Equal(t, 14.0, forecast.Current.WindSpeed)
		assert.Greater(t, forecast.Current.Score, 0.0)
		assert.NotEmpty(t, forecast.Current.Level)
		assert.Len(t, forecast.Hourly, 1)
		assert.NotEmpty(t, forecast.Hourly[0].Level)
	})

	t.Run("returns_502_when_service_errors", func(t *testing.T) {
		memCache := cache.NewMemoryCache[domain.SpotForecast]()
		client := &mockClient{
			fetchFunc: func(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error) {
				return nil, errors.New("upstream failure")
			},
		}
		forecastSvc := service.NewForecastService(client, memCache, time.Hour)
		handler := SetupRouterWithServices(spotSvc, forecastSvc)

		req := httptest.NewRequest(http.MethodGet, "/api/v1/spots/hossegor/forecast", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadGateway, rr.Code)
	})
}

func TestGetSpotsHandler_WithForecasts(t *testing.T) {
	spotSvc := service.NewSpotService()
	memCache := cache.NewMemoryCache[domain.SpotForecast]()
	client := &mockClient{
		fetchFunc: func(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error) {
			return &domain.SpotForecast{
				SpotID: spotID,
				Current: domain.CurrentConditions{
					WaveHeight: 2.0,
					WavePeriod: 11.0,
					WindSpeed:  10.0,
				},
			}, nil
		},
	}
	forecastSvc := service.NewForecastService(client, memCache, time.Hour)
	handler := SetupRouterWithServices(spotSvc, forecastSvc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/spots", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	var res map[string][]domain.Spot
	err := json.NewDecoder(rr.Body).Decode(&res)
	require.NoError(t, err)
	assert.Len(t, res["spots"], 3)
	assert.NotNil(t, res["spots"][0].CurrentForecast)
	assert.Equal(t, 2.0, res["spots"][0].CurrentForecast.WaveHeight)
	assert.Greater(t, res["spots"][0].CurrentForecast.Score, 0.0)
	assert.NotEmpty(t, res["spots"][0].CurrentForecast.Level)
}
