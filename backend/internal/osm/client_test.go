package osm_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/swellwatch/backend/internal/domain"
	"github.com/swellwatch/backend/internal/osm"
)

func TestOverpassClient_FetchSurfingSpots_Success(t *testing.T) {
	mockJSON := `{
		"elements": [
			{
				"type": "node",
				"id": 101,
				"lat": 43.668,
				"lon": -1.439,
				"tags": {
					"name": "La Nord",
					"sport": "surfing",
					"surface": "sand"
				}
			},
			{
				"type": "way",
				"id": 202,
				"center": {
					"lat": 43.483,
					"lon": -1.558
				},
				"tags": {
					"name": "Côte des Basques",
					"sport": "surfing",
					"natural": "reef"
				}
			},
			{
				"type": "node",
				"id": 303,
				"lat": 47.789,
				"lon": -3.512,
				"tags": {
					"name": "La Torche",
					"sport": "surfing",
					"surface": "rock"
				}
			},
			{
				"type": "node",
				"id": 404,
				"lat": 45.001,
				"lon": -1.200,
				"tags": {
					"name": "Lacanau Plage",
					"sport": "surfing"
				}
			},
			{
				"type": "node",
				"id": 505,
				"lat": 43.0,
				"lon": -1.0,
				"tags": {
					"sport": "surfing"
				}
			},
			{
				"type": "node",
				"id": 606,
				"lat": 43.1,
				"lon": -1.1,
				"tags": {
					"name": "",
					"sport": "surfing"
				}
			},
			{
				"type": "node",
				"id": 707,
				"lat": 43.668,
				"lon": -1.382,
				"tags": {
					"name": "Rip Curl Surf Shop",
					"sport": "surfing",
					"shop": "sports"
				}
			},
			{
				"type": "node",
				"id": 808,
				"lat": 43.483,
				"lon": -1.550,
				"tags": {
					"name": "Surf Rental Center",
					"sport": "surfing",
					"rental": "surfboard"
				}
			}
		]
	}`

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, http.MethodPost, r.Method)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, err := w.Write([]byte(mockJSON))
		assert.NoError(t, err)
	}))
	defer server.Close()

	client := osm.NewClient(osm.WithBaseURL(server.URL), osm.WithTimeout(2*time.Second))

	ctx := context.Background()
	spots, err := client.FetchSurfingSpots(ctx)

	require.NoError(t, err)
	require.Len(t, spots, 4, "Unnamed spots or empty names must be filtered out")

	expectedSpots := []domain.Spot{
		{
			ID:         "osm-node-101",
			Name:       "La Nord",
			Latitude:   43.668,
			Longitude:  -1.439,
			SeabedType: domain.SeabedSand,
		},
		{
			ID:         "osm-way-202",
			Name:       "Côte des Basques",
			Latitude:   43.483,
			Longitude:  -1.558,
			SeabedType: domain.SeabedReef,
		},
		{
			ID:         "osm-node-303",
			Name:       "La Torche",
			Latitude:   47.789,
			Longitude:  -3.512,
			SeabedType: domain.SeabedRock,
		},
		{
			ID:         "osm-node-404",
			Name:       "Lacanau Plage",
			Latitude:   45.001,
			Longitude:  -1.200,
			SeabedType: domain.SeabedSand, // default
		},
	}

	assert.Equal(t, expectedSpots, spots)
}

func TestOverpassClient_FetchSurfingSpots_HttpErrors(t *testing.T) {
	tests := []struct {
		name       string
		statusCode int
		body       string
	}{
		{
			name:       "Rate Limited (429)",
			statusCode: http.StatusTooManyRequests,
			body:       "Rate limit exceeded",
		},
		{
			name:       "Internal Server Error (500)",
			statusCode: http.StatusInternalServerError,
			body:       "Overpass error",
		},
		{
			name:       "Gateway Timeout (504)",
			statusCode: http.StatusGatewayTimeout,
			body:       "Gateway timeout",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tt.statusCode)
				_, err := w.Write([]byte(tt.body))
				assert.NoError(t, err)
			}))
			defer server.Close()

			client := osm.NewClient(osm.WithBaseURL(server.URL), osm.WithTimeout(1*time.Second))
			spots, err := client.FetchSurfingSpots(context.Background())

			assert.Error(t, err)
			assert.Nil(t, spots)
			assert.Contains(t, err.Error(), http.StatusText(tt.statusCode))
		})
	}
}

func TestOverpassClient_FetchSurfingSpots_MalformedJSON(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, err := w.Write([]byte("invalid json"))
		assert.NoError(t, err)
	}))
	defer server.Close()

	client := osm.NewClient(osm.WithBaseURL(server.URL))
	spots, err := client.FetchSurfingSpots(context.Background())

	assert.Error(t, err)
	assert.Nil(t, spots)
}

func TestOverpassClient_FetchSurfingSpots_ContextCancelled(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(200 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
		_, err := w.Write([]byte(`{"elements":[]}`))
		assert.NoError(t, err)
	}))
	defer server.Close()

	client := osm.NewClient(osm.WithBaseURL(server.URL))
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
	defer cancel()

	spots, err := client.FetchSurfingSpots(ctx)
	assert.Error(t, err)
	assert.Nil(t, spots)
}

func TestOverpassClient_FetchSurfingSpots_FailoverToNextEndpoint(t *testing.T) {
	// Server 1 fails with 504 Gateway Timeout
	server1 := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusGatewayTimeout)
		_, err := w.Write([]byte("gateway timeout"))
		assert.NoError(t, err)
	}))
	defer server1.Close()

	// Server 2 succeeds
	server2 := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, err := w.Write([]byte(`{"elements":[{"type":"node","id":999,"lat":43.5,"lon":-1.5,"tags":{"name":"Biarritz Grande Plage","sport":"surfing"}}]}`))
		assert.NoError(t, err)
	}))
	defer server2.Close()

	client := osm.NewClient(
		osm.WithEndpoints(server1.URL, server2.URL),
		osm.WithTimeout(1*time.Second),
	)

	spots, err := client.FetchSurfingSpots(context.Background())
	require.NoError(t, err)
	require.Len(t, spots, 1)
	assert.Equal(t, "Biarritz Grande Plage", spots[0].Name)
}
