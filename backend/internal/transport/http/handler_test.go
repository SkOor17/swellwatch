package http

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
)

type routerMockClient struct{}

func (m *routerMockClient) FetchSpotForecast(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error) {
	return &domain.SpotForecast{
		SpotID: spotID,
		Current: domain.CurrentConditions{
			WaveHeight: 1.5,
			WindSpeed:  10.0,
		},
	}, nil
}

func TestRouter_AllRoutes(t *testing.T) {
	spotSvc := service.NewDefaultSpotService()
	memCache := cache.NewMemoryCache[domain.SpotForecast]()
	forecastSvc := service.NewForecastService(&routerMockClient{}, memCache, time.Hour)
	router := SetupRouterWithServices(spotSvc, forecastSvc)

	routes := []struct {
		name         string
		url          string
		expectedCode int
	}{
		{"root", "/", http.StatusOK},
		{"spots list without slash", "/api/v1/spots", http.StatusOK},
		{"spots list with slash", "/api/v1/spots/", http.StatusOK},
		{"hossegor forecast", "/api/v1/spots/hossegor/forecast", http.StatusOK},
		{"biarritz forecast", "/api/v1/spots/biarritz/forecast", http.StatusOK},
		{"lacanau forecast", "/api/v1/spots/lacanau/forecast", http.StatusOK},
		{"case insensitive Hossegor forecast", "/api/v1/spots/Hossegor/forecast", http.StatusOK},
		{"non existent spot forecast", "/api/v1/spots/unknown/forecast", http.StatusNotFound},
	}

	for _, rt := range routes {
		t.Run(rt.name, func(t *testing.T) {
			req, err := http.NewRequest(http.MethodGet, rt.url, nil)
			require.NoError(t, err)

			rr := httptest.NewRecorder()
			router.ServeHTTP(rr, req)

			assert.Equal(t, rt.expectedCode, rr.Code, "URL: %s", rt.url)
		})
	}
}
