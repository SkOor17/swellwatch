package openmeteo

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/swellwatch/backend/internal/domain"
)

const (
	DefaultMarineBaseURL  = "https://marine-api.open-meteo.com/v1/marine"
	DefaultWeatherBaseURL = "https://api.open-meteo.com/v1/forecast"
	DefaultTimeout        = 3 * time.Second
)

type Client interface {
	FetchSpotForecast(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error)
}

type HTTPClient struct {
	httpClient     *http.Client
	marineBaseURL  string
	weatherBaseURL string
	timeout        time.Duration
}

type Option func(*HTTPClient)

func WithMarineBaseURL(url string) Option {
	return func(c *HTTPClient) {
		c.marineBaseURL = url
	}
}

func WithWeatherBaseURL(url string) Option {
	return func(c *HTTPClient) {
		c.weatherBaseURL = url
	}
}

func WithTimeout(d time.Duration) Option {
	return func(c *HTTPClient) {
		c.timeout = d
	}
}

func WithHTTPClient(client *http.Client) Option {
	return func(c *HTTPClient) {
		c.httpClient = client
	}
}

func NewClient(opts ...Option) *HTTPClient {
	c := &HTTPClient{
		marineBaseURL:  DefaultMarineBaseURL,
		weatherBaseURL: DefaultWeatherBaseURL,
		timeout:        DefaultTimeout,
		httpClient:     &http.Client{},
	}

	for _, opt := range opts {
		opt(c)
	}

	return c
}

func (c *HTTPClient) FetchSpotForecast(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error) {
	ctx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()

	var marineRes MarineAPIResponse
	var weatherRes WeatherAPIResponse
	errChan := make(chan error, 2)

	go func() {
		errChan <- c.fetchMarine(ctx, lat, lon, &marineRes)
	}()

	go func() {
		errChan <- c.fetchWeather(ctx, lat, lon, &weatherRes)
	}()

	for range 2 {
		if err := <-errChan; err != nil {
			return nil, err
		}
	}

	forecast := &domain.SpotForecast{
		SpotID: spotID,
		Current: domain.CurrentConditions{
			WaveHeight:         marineRes.Current.WaveHeight,
			WavePeriod:         marineRes.Current.WavePeriod,
			WaveDirection:      marineRes.Current.WaveDirection,
			SwellWaveHeight:    marineRes.Current.SwellWaveHeight,
			SwellWavePeriod:    marineRes.Current.SwellWavePeriod,
			SwellWaveDirection: marineRes.Current.SwellWaveDirection,
			WindSpeed:          weatherRes.Current.WindSpeed10m,
			WindGusts:          weatherRes.Current.WindGusts10m,
			WindDirection:      weatherRes.Current.WindDir10m,
			LastUpdatedAt:      time.Now().UTC(),
		},
		Hourly:        buildHourlyForecasts(marineRes.Hourly, weatherRes.Hourly),
		LastUpdatedAt: time.Now().UTC(),
	}

	return forecast, nil
}

func baseParams(lat, lon float64) url.Values {
	params := url.Values{}
	params.Set("latitude", fmt.Sprintf("%f", lat))
	params.Set("longitude", fmt.Sprintf("%f", lon))
	params.Set("timezone", "auto")
	params.Set("forecast_days", "1")
	return params
}

func (c *HTTPClient) fetchMarine(ctx context.Context, lat, lon float64, target *MarineAPIResponse) error {
	params := baseParams(lat, lon)
	params.Set("current", "wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction")
	params.Set("hourly", "wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction")

	reqURL := fmt.Sprintf("%s?%s", c.marineBaseURL, params.Encode())
	return c.getJSON(ctx, reqURL, target)
}

func (c *HTTPClient) fetchWeather(ctx context.Context, lat, lon float64, target *WeatherAPIResponse) error {
	params := baseParams(lat, lon)
	params.Set("current", "wind_speed_10m,wind_direction_10m,wind_gusts_10m")
	params.Set("hourly", "wind_speed_10m,wind_direction_10m,wind_gusts_10m")
	params.Set("wind_speed_unit", "kn")

	reqURL := fmt.Sprintf("%s?%s", c.weatherBaseURL, params.Encode())
	return c.getJSON(ctx, reqURL, target)
}

func (c *HTTPClient) getJSON(ctx context.Context, reqURL string, target any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return fmt.Errorf("create request error: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("http request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("bad status code: %d from %s", resp.StatusCode, reqURL)
	}

	if err := json.NewDecoder(resp.Body).Decode(target); err != nil {
		return fmt.Errorf("json decode error: %w", err)
	}

	return nil
}

func parseTime(tStr string) time.Time {
	if t, err := time.Parse("2006-01-02T15:04", tStr); err == nil {
		return t
	}
	if t, err := time.Parse(time.RFC3339, tStr); err == nil {
		return t
	}
	return time.Time{}
}

func getFloat(slice []float64, i int) float64 {
	if i < len(slice) {
		return slice[i]
	}
	return 0
}

func getInt(slice []int, i int) int {
	if i < len(slice) {
		return slice[i]
	}
	return 0
}

func buildHourlyForecasts(marine MarineHourlyResponse, weather WeatherHourlyResponse) []domain.HourlyForecast {
	count := max(len(weather.Time), len(marine.Time))
	res := make([]domain.HourlyForecast, 0, count)

	for i := range count {
		t := time.Time{}
		if i < len(marine.Time) {
			t = parseTime(marine.Time[i])
		} else if i < len(weather.Time) {
			t = parseTime(weather.Time[i])
		}

		res = append(res, domain.HourlyForecast{
			Time:               t,
			WaveHeight:         getFloat(marine.WaveHeight, i),
			WavePeriod:         getFloat(marine.WavePeriod, i),
			WaveDirection:      getInt(marine.WaveDirection, i),
			SwellWaveHeight:    getFloat(marine.SwellWaveHeight, i),
			SwellWavePeriod:    getFloat(marine.SwellWavePeriod, i),
			SwellWaveDirection: getInt(marine.SwellWaveDirection, i),
			WindSpeed:          getFloat(weather.WindSpeed10m, i),
			WindGusts:          getFloat(weather.WindGusts10m, i),
			WindDirection:      getInt(weather.WindDir10m, i),
		})
	}

	return res
}
