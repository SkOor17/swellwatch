package service

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/swellwatch/backend/internal/cache"
	"github.com/swellwatch/backend/internal/domain"
)

type MockOpenMeteoClient struct {
	mu         sync.Mutex
	callsCount int
	fetchFunc  func(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error)
}

func (m *MockOpenMeteoClient) FetchSpotForecast(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error) {
	m.mu.Lock()
	m.callsCount++
	m.mu.Unlock()
	if m.fetchFunc != nil {
		return m.fetchFunc(ctx, spotID, lat, lon)
	}
	return nil, nil
}

func (m *MockOpenMeteoClient) CallsCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.callsCount
}

func TestForecastService_GetSpotForecast(t *testing.T) {
	testTime := time.Date(2026, 8, 22, 12, 0, 0, 0, time.UTC)
	sampleForecast := &domain.SpotForecast{
		SpotID: "hossegor",
		Current: domain.CurrentConditions{
			WaveHeight:    1.8,
			LastUpdatedAt: testTime,
		},
		LastUpdatedAt: testTime,
	}

	tests := []struct {
		name          string
		spot          domain.Spot
		setupCache    func(c *cache.MemoryCache[domain.SpotForecast])
		setupMock     func(m *MockOpenMeteoClient)
		expected      *domain.SpotForecast
		expectError   bool
		expectedCalls int
	}{
		{
			name: "cache hit returns cached forecast without calling client",
			spot: domain.Spot{ID: "hossegor", Latitude: 43.668, Longitude: -1.439},
			setupCache: func(c *cache.MemoryCache[domain.SpotForecast]) {
				c.Set("hossegor", *sampleForecast, 1*time.Hour)
			},
			setupMock: func(m *MockOpenMeteoClient) {
				m.fetchFunc = func(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error) {
					return nil, errors.New("should not be called")
				}
			},
			expected:      sampleForecast,
			expectError:   false,
			expectedCalls: 0,
		},
		{
			name: "cache miss calls client and stores in cache",
			spot: domain.Spot{ID: "biarritz", Latitude: 43.483, Longitude: -1.558},
			setupCache: func(c *cache.MemoryCache[domain.SpotForecast]) {
				// Empty cache
			},
			setupMock: func(m *MockOpenMeteoClient) {
				m.fetchFunc = func(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error) {
					return &domain.SpotForecast{
						SpotID: "biarritz",
						Current: domain.CurrentConditions{
							WaveHeight: 1.5,
						},
					}, nil
				}
			},
			expected: &domain.SpotForecast{
				SpotID: "biarritz",
				Current: domain.CurrentConditions{
					WaveHeight: 1.5,
				},
			},
			expectError:   false,
			expectedCalls: 1,
		},
		{
			name: "client error falls back to stale cache data",
			spot: domain.Spot{ID: "lacanau", Latitude: 45.001, Longitude: -1.2},
			setupCache: func(c *cache.MemoryCache[domain.SpotForecast]) {
				// Set with already expired TTL
				c.Set("lacanau", *sampleForecast, -1*time.Minute)
			},
			setupMock: func(m *MockOpenMeteoClient) {
				m.fetchFunc = func(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error) {
					return nil, errors.New("open-meteo timeout")
				}
			},
			expected:      sampleForecast,
			expectError:   false,
			expectedCalls: 1,
		},
		{
			name: "client error with no cache returns error",
			spot: domain.Spot{ID: "anglet", Latitude: 43.5, Longitude: -1.5},
			setupCache: func(c *cache.MemoryCache[domain.SpotForecast]) {
				// Empty cache
			},
			setupMock: func(m *MockOpenMeteoClient) {
				m.fetchFunc = func(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error) {
					return nil, errors.New("connection refused")
				}
			},
			expected:      nil,
			expectError:   true,
			expectedCalls: 1,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			memCache := cache.NewMemoryCache[domain.SpotForecast]()
			if tc.setupCache != nil {
				tc.setupCache(memCache)
			}

			mockClient := &MockOpenMeteoClient{}
			if tc.setupMock != nil {
				tc.setupMock(mockClient)
			}

			svc := NewForecastService(mockClient, memCache, 1*time.Hour)
			ctx := context.Background()

			got, err := svc.GetSpotForecast(ctx, tc.spot)

			if tc.expectError {
				assert.Error(t, err)
				assert.Nil(t, got)
			} else {
				require.NoError(t, err)
				require.NotNil(t, got)
				assert.Equal(t, tc.expected.SpotID, got.SpotID)
				assert.Equal(t, tc.expected.Current.WaveHeight, got.Current.WaveHeight)
			}

			assert.Equal(t, tc.expectedCalls, mockClient.CallsCount())
		})
	}
}

func TestForecastService_EnrichSpotsWithForecasts(t *testing.T) {
	memCache := cache.NewMemoryCache[domain.SpotForecast]()
	mockClient := &MockOpenMeteoClient{
		fetchFunc: func(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error) {
			if spotID == "hossegor" {
				return &domain.SpotForecast{
					SpotID:  "hossegor",
					Current: domain.CurrentConditions{WaveHeight: 2.0},
				}, nil
			}
			if spotID == "biarritz" {
				return &domain.SpotForecast{
					SpotID:  "biarritz",
					Current: domain.CurrentConditions{WaveHeight: 1.3},
				}, nil
			}
			return nil, errors.New("unknown spot")
		},
	}

	spots := []domain.Spot{
		{ID: "hossegor", Name: "Hossegor", Latitude: 43.668, Longitude: -1.439},
		{ID: "biarritz", Name: "Biarritz", Latitude: 43.483, Longitude: -1.558},
	}

	svc := NewForecastService(mockClient, memCache, 1*time.Hour)
	ctx := context.Background()

	enriched := svc.EnrichSpotsWithForecasts(ctx, spots)

	require.Len(t, enriched, 2)
	assert.Equal(t, "hossegor", enriched[0].ID)
	require.NotNil(t, enriched[0].CurrentForecast)
	assert.Equal(t, 2.0, enriched[0].CurrentForecast.WaveHeight)
	assert.NotEmpty(t, enriched[0].CurrentForecast.Level)

	assert.Equal(t, "biarritz", enriched[1].ID)
	require.NotNil(t, enriched[1].CurrentForecast)
	assert.Equal(t, 1.3, enriched[1].CurrentForecast.WaveHeight)
	assert.NotEmpty(t, enriched[1].CurrentForecast.Level)

	assert.Equal(t, 2, mockClient.CallsCount())
}

func TestForecastService_GetSpotForecast_CalculatesScoreAndLevel(t *testing.T) {
	memCache := cache.NewMemoryCache[domain.SpotForecast]()
	mockClient := &MockOpenMeteoClient{
		fetchFunc: func(ctx context.Context, spotID string, lat, lon float64) (*domain.SpotForecast, error) {
			return &domain.SpotForecast{
				SpotID: "hossegor",
				Current: domain.CurrentConditions{
					WaveHeight: 1.5,
					WavePeriod: 12.0,
					WindSpeed:  5.0,
				},
				Hourly: []domain.HourlyForecast{
					{
						Time:       time.Date(2026, 8, 22, 14, 0, 0, 0, time.UTC),
						WaveHeight: 0.2,
						WavePeriod: 6.0,
						WindSpeed:  4.0,
					},
				},
			}, nil
		},
	}

	spot := domain.Spot{
		ID:         "hossegor",
		Name:       "Hossegor",
		Latitude:   43.668,
		Longitude:  -1.439,
		SeabedType: domain.SeabedSand,
	}

	svc := NewForecastService(mockClient, memCache, 1*time.Hour)
	ctx := context.Background()

	forecast, err := svc.GetSpotForecast(ctx, spot)
	require.NoError(t, err)
	require.NotNil(t, forecast)

	// Check Current conditions score & level
	assert.Greater(t, forecast.Current.Score, 7.0)
	assert.Equal(t, domain.SkillLevelIntermediate, forecast.Current.Level)

	// Check Hourly conditions score & level
	require.Len(t, forecast.Hourly, 1)
	assert.Less(t, forecast.Hourly[0].Score, 2.0)
	assert.Equal(t, domain.SkillLevelFlat, forecast.Hourly[0].Level)
}
