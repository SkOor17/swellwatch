package cache

import (
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/swellwatch/backend/internal/domain"
)

func TestMemoryCache_SetAndGet(t *testing.T) {
	c := NewMemoryCache[domain.SpotForecast]()

	forecast := domain.SpotForecast{
		SpotID: "hossegor",
		Current: domain.CurrentConditions{
			WaveHeight: 1.8,
		},
		LastUpdatedAt: time.Now(),
	}

	c.Set("hossegor", forecast, 1*time.Minute)

	got, found := c.Get("hossegor")
	assert.True(t, found)
	assert.Equal(t, "hossegor", got.SpotID)
	assert.Equal(t, 1.8, got.Current.WaveHeight)
}

func TestMemoryCache_Expiration(t *testing.T) {
	c := NewMemoryCache[domain.SpotForecast]()

	forecast := domain.SpotForecast{
		SpotID: "biarritz",
		Current: domain.CurrentConditions{
			WaveHeight: 1.2,
		},
		LastUpdatedAt: time.Now(),
	}

	c.Set("biarritz", forecast, 10*time.Millisecond)

	// Immediately present
	got, found := c.Get("biarritz")
	assert.True(t, found)
	assert.Equal(t, "biarritz", got.SpotID)

	// Wait for TTL expiration
	time.Sleep(20 * time.Millisecond)

	_, found = c.Get("biarritz")
	assert.False(t, found, "Expected key to be expired")
}

func TestMemoryCache_GetStale(t *testing.T) {
	c := NewMemoryCache[domain.SpotForecast]()

	updatedAt := time.Now().Add(-10 * time.Minute)
	forecast := domain.SpotForecast{
		SpotID: "lacanau",
		Current: domain.CurrentConditions{
			WaveHeight: 2.1,
		},
		LastUpdatedAt: updatedAt,
	}

	c.Set("lacanau", forecast, 10*time.Millisecond)
	time.Sleep(20 * time.Millisecond)

	// Regular Get returns false
	_, found := c.Get("lacanau")
	assert.False(t, found)

	// GetStale returns the expired data
	staleGot, staleFound := c.GetStale("lacanau")
	assert.True(t, staleFound)
	assert.Equal(t, "lacanau", staleGot.SpotID)
	assert.Equal(t, 2.1, staleGot.Current.WaveHeight)
	assert.Equal(t, updatedAt, staleGot.LastUpdatedAt)
}

func TestMemoryCache_ConcurrentAccess(t *testing.T) {
	c := NewMemoryCache[domain.SpotForecast]()
	var wg sync.WaitGroup

	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			f := domain.SpotForecast{
				SpotID: "spot",
				Current: domain.CurrentConditions{
					WaveHeight: float64(id),
				},
				LastUpdatedAt: time.Now(),
			}
			c.Set("spot", f, 50*time.Millisecond)
			_, _ = c.Get("spot")
			_, _ = c.GetStale("spot")
		}(i)
	}

	wg.Wait()
}
