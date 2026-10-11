package openmeteo

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newMockHTTPServer(t *testing.T, statusCode int, body string, validator func(r *http.Request)) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if validator != nil {
			validator(r)
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		_, err := w.Write([]byte(body))
		require.NoError(t, err)
	}))
}

func TestClient_FetchSpotForecast_Success(t *testing.T) {
	marineBody := `{
		"current": {
			"time": "2026-08-22T15:00",
			"wave_height": 1.6,
			"wave_period": 11.2,
			"wave_direction": 280,
			"swell_wave_height": 1.4,
			"swell_wave_period": 12.0,
			"swell_wave_direction": 285
		},
		"hourly": {
			"time": ["2026-08-22T00:00", "2026-08-22T01:00"],
			"wave_height": [1.5, 1.6],
			"wave_period": [11.0, 11.2],
			"wave_direction": [280, 280],
			"swell_wave_height": [1.3, 1.4],
			"swell_wave_period": [11.8, 12.0],
			"swell_wave_direction": [285, 285]
		}
	}`

	weatherBody := `{
		"current": {
			"time": "2026-08-22T15:00",
			"wind_speed_10m": 12.5,
			"wind_gusts_10m": 18.0,
			"wind_direction_10m": 290
		},
		"hourly": {
			"time": ["2026-08-22T00:00", "2026-08-22T01:00"],
			"wind_speed_10m": [10.0, 12.5],
			"wind_gusts_10m": [15.0, 18.0],
			"wind_direction_10m": [285, 290]
		}
	}`

	marineServer := newMockHTTPServer(t, http.StatusOK, marineBody, func(r *http.Request) {
		assert.Equal(t, "43.668000", r.URL.Query().Get("latitude"))
		assert.Equal(t, "-1.439000", r.URL.Query().Get("longitude"))
		assert.NotEmpty(t, r.URL.Query().Get("current"))
	})
	defer marineServer.Close()

	weatherServer := newMockHTTPServer(t, http.StatusOK, weatherBody, func(r *http.Request) {
		assert.Equal(t, "43.668000", r.URL.Query().Get("latitude"))
		assert.Equal(t, "-1.439000", r.URL.Query().Get("longitude"))
		assert.Equal(t, "kn", r.URL.Query().Get("wind_speed_unit"))
	})
	defer weatherServer.Close()

	client := NewClient(
		WithMarineBaseURL(marineServer.URL),
		WithWeatherBaseURL(weatherServer.URL),
	)

	ctx := context.Background()
	forecast, err := client.FetchSpotForecast(ctx, "hossegor", 43.668, -1.439)

	require.NoError(t, err)
	require.NotNil(t, forecast)

	assert.Equal(t, "hossegor", forecast.SpotID)
	assert.Equal(t, 1.6, forecast.Current.WaveHeight)
	assert.Equal(t, 11.2, forecast.Current.WavePeriod)
	assert.Equal(t, 280, forecast.Current.WaveDirection)
	assert.Equal(t, 1.4, forecast.Current.SwellWaveHeight)
	assert.Equal(t, 12.0, forecast.Current.SwellWavePeriod)
	assert.Equal(t, 285, forecast.Current.SwellWaveDirection)
	assert.Equal(t, 12.5, forecast.Current.WindSpeed)
	assert.Equal(t, 18.0, forecast.Current.WindGusts)
	assert.Equal(t, 290, forecast.Current.WindDirection)
	assert.False(t, forecast.LastUpdatedAt.IsZero())

	assert.Len(t, forecast.Hourly, 2)
	assert.Equal(t, 1.5, forecast.Hourly[0].WaveHeight)
	assert.Equal(t, 10.0, forecast.Hourly[0].WindSpeed)
	assert.Equal(t, 1.6, forecast.Hourly[1].WaveHeight)
	assert.Equal(t, 12.5, forecast.Hourly[1].WindSpeed)
}

func TestClient_FetchSpotForecast_MarineError(t *testing.T) {
	marineServer := newMockHTTPServer(t, http.StatusInternalServerError, `{}`, nil)
	defer marineServer.Close()

	weatherServer := newMockHTTPServer(t, http.StatusOK, `{"current":{"wind_speed_10m":10}}`, nil)
	defer weatherServer.Close()

	client := NewClient(
		WithMarineBaseURL(marineServer.URL),
		WithWeatherBaseURL(weatherServer.URL),
	)

	ctx := context.Background()
	_, err := client.FetchSpotForecast(ctx, "hossegor", 43.668, -1.439)

	assert.Error(t, err)
}

func TestClient_FetchSpotForecast_WeatherError(t *testing.T) {
	marineServer := newMockHTTPServer(t, http.StatusOK, `{"current":{"wave_height":1.5}}`, nil)
	defer marineServer.Close()

	weatherServer := newMockHTTPServer(t, http.StatusBadGateway, `{}`, nil)
	defer weatherServer.Close()

	client := NewClient(
		WithMarineBaseURL(marineServer.URL),
		WithWeatherBaseURL(weatherServer.URL),
	)

	ctx := context.Background()
	_, err := client.FetchSpotForecast(ctx, "hossegor", 43.668, -1.439)

	assert.Error(t, err)
}

func TestClient_FetchSpotForecast_Timeout(t *testing.T) {
	marineServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(50 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
	}))
	defer marineServer.Close()

	weatherServer := newMockHTTPServer(t, http.StatusOK, `{}`, nil)
	defer weatherServer.Close()

	client := NewClient(
		WithMarineBaseURL(marineServer.URL),
		WithWeatherBaseURL(weatherServer.URL),
		WithTimeout(10*time.Millisecond),
	)

	ctx := context.Background()
	_, err := client.FetchSpotForecast(ctx, "hossegor", 43.668, -1.439)

	assert.Error(t, err)
}
