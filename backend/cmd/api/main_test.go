package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/swellwatch/backend/internal/cache"
	"github.com/swellwatch/backend/internal/domain"
	"github.com/swellwatch/backend/internal/service"
	apihttp "github.com/swellwatch/backend/internal/transport/http"
)

type mockOpenMeteoClient struct{}

func (m *mockOpenMeteoClient) FetchSpotForecast(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error) {
	return &domain.SpotForecast{
		SpotID: spotID,
		Current: domain.CurrentConditions{
			WaveHeight: 1.8,
			WindSpeed:  12.0,
		},
		Hourly: []domain.HourlyForecast{
			{
				WaveHeight: 1.8,
				WindSpeed:  12.0,
			},
		},
	}, nil
}

func setupTestRouter() http.Handler {
	spotSvc := service.NewDefaultSpotService()
	memCache := cache.NewMemoryCache[domain.SpotForecast]()
	forecastSvc := service.NewForecastService(&mockOpenMeteoClient{}, memCache, time.Hour)
	return apihttp.SetupRouterWithServices(spotSvc, forecastSvc)
}

func executeRequest(handler http.Handler, method, target string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, target, nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	return rr
}

func TestHealthCheck(t *testing.T) {
	router := apihttp.SetupRouter()

	req, err := http.NewRequest(http.MethodGet, "/", nil)
	assert.NoError(t, err)

	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, "SwellWatch API is running", rr.Body.String())
}

func TestGetSpots_WithForecast(t *testing.T) {
	router := setupTestRouter()
	rr := executeRequest(router, http.MethodGet, "/api/v1/spots")

	require.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))
	assert.Contains(t, rr.Body.String(), `"wave_height":1.8`)
}

func TestGetSpotForecast_Endpoint(t *testing.T) {
	router := setupTestRouter()
	rr := executeRequest(router, http.MethodGet, "/api/v1/spots/hossegor/forecast")

	require.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))
	assert.Contains(t, rr.Body.String(), `"spot_id":"hossegor"`)
}
