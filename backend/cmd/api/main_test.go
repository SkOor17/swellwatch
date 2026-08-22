package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	apihttp "github.com/swellwatch/backend/internal/transport/http"
)

func TestHealthCheck(t *testing.T) {
	router := apihttp.SetupRouter()

	req, err := http.NewRequest(http.MethodGet, "/", nil)
	assert.NoError(t, err)

	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, "SwellWatch API is running", rr.Body.String())
}

func TestGetSpots(t *testing.T) {
	router := apihttp.SetupRouter()

	req, err := http.NewRequest(http.MethodGet, "/api/v1/spots", nil)
	assert.NoError(t, err)

	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))

	expectedJSON := `{
		"spots": [
			{"id": "hossegor", "name": "Hossegor", "latitude": 43.668, "longitude": -1.439},
			{"id": "biarritz", "name": "Biarritz", "latitude": 43.483, "longitude": -1.558},
			{"id": "lacanau", "name": "Lacanau-Océan", "latitude": 45.001, "longitude": -1.2}
		]
	}`
	assert.JSONEq(t, expectedJSON, rr.Body.String())
}
