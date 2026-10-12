package osm

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/swellwatch/backend/internal/domain"
)

const (
	// DefaultFrenchOSMEndpoint is the dedicated OpenStreetMap France Overpass instance.
	DefaultFrenchOSMEndpoint = "https://overpass.openstreetmap.fr/api/interpreter"
	// DefaultGlobalOSMEndpoint is the main global OpenStreetMap Overpass instance.
	DefaultGlobalOSMEndpoint = "https://overpass-api.de/api/interpreter"
	DefaultTimeout           = 30 * time.Second

	// Metropolitan France bounding box: [min_lat, min_lon, max_lat, max_lon]
	FranceBoundingBox = "41.2,-5.5,51.2,9.8"
)

type Client interface {
	FetchSurfingSpots(ctx context.Context) ([]domain.Spot, error)
}

type OverpassClient struct {
	httpClient *http.Client
	endpoints  []string
	query      string
}

type Option func(*OverpassClient)

func WithBaseURL(baseURL string) Option {
	return func(c *OverpassClient) {
		c.endpoints = []string{baseURL}
	}
}

func WithEndpoints(endpoints ...string) Option {
	return func(c *OverpassClient) {
		c.endpoints = endpoints
	}
}

func WithHTTPClient(client *http.Client) Option {
	return func(c *OverpassClient) {
		c.httpClient = client
	}
}

func WithTimeout(d time.Duration) Option {
	return func(c *OverpassClient) {
		c.httpClient.Timeout = d
	}
}

func WithQuery(query string) Option {
	return func(c *OverpassClient) {
		c.query = query
	}
}

func defaultOverpassQuery() string {
	return fmt.Sprintf(`[out:json][timeout:30];
(
  node["sport"="surfing"](%s);
  way["sport"="surfing"](%s);
);
out center tags;`, FranceBoundingBox, FranceBoundingBox)
}

const (
	tagReef  = "reef"
	tagRock  = "rock"
	tagBeach = "beach"
	tagSand  = "sand"
)

func NewClient(opts ...Option) *OverpassClient {
	endpoints := []string{DefaultFrenchOSMEndpoint, DefaultGlobalOSMEndpoint}
	if envURL := strings.TrimSpace(os.Getenv("OVERPASS_URL")); envURL != "" {
		endpoints = []string{envURL}
	}

	c := &OverpassClient{
		httpClient: &http.Client{
			Timeout: DefaultTimeout,
		},
		endpoints: endpoints,
		query:     defaultOverpassQuery(),
	}

	for _, opt := range opts {
		opt(c)
	}

	return c
}

func (c *OverpassClient) FetchSurfingSpots(ctx context.Context) ([]domain.Spot, error) {
	if len(c.endpoints) == 0 {
		return nil, fmt.Errorf("no overpass endpoints configured")
	}

	var lastErr error
	for _, endpoint := range c.endpoints {
		spots, err := c.fetchFromEndpoint(ctx, endpoint)
		if err == nil {
			return spots, nil
		}
		lastErr = err
		log.Printf("Warning: Overpass endpoint %s failed: %v (trying next endpoint if available)", endpoint, err)
	}

	return nil, fmt.Errorf("all overpass endpoints failed: %w", lastErr)
}

func (c *OverpassClient) fetchFromEndpoint(ctx context.Context, endpoint string) ([]domain.Spot, error) {
	reqData := url.Values{}
	reqData.Set("data", c.query)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(reqData.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to create overpass request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("User-Agent", "SwellWatch/1.0 (surf-forecast)")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("overpass request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, readErr := io.ReadAll(io.LimitReader(resp.Body, 1024))
		if readErr != nil {
			return nil, fmt.Errorf("overpass request returned status %s", resp.Status)
		}
		return nil, fmt.Errorf("overpass request returned status %s: %s", resp.Status, string(bodyBytes))
	}

	var overpassResp OverpassResponse
	if err := json.NewDecoder(resp.Body).Decode(&overpassResp); err != nil {
		return nil, fmt.Errorf("failed to decode overpass response: %w", err)
	}

	spots := make([]domain.Spot, 0, len(overpassResp.Elements))
	for _, el := range overpassResp.Elements {
		spot, ok := mapElementToSpot(el)
		if ok {
			spots = append(spots, spot)
		}
	}

	return spots, nil
}

func mapElementToSpot(el OverpassElement) (domain.Spot, bool) {
	name := strings.TrimSpace(el.Tags["name"])
	if name == "" {
		return domain.Spot{}, false
	}

	// Exclude commercial shops or equipment rentals tagged with sport=surfing
	if el.Tags["shop"] != "" || el.Tags["rental"] != "" {
		return domain.Spot{}, false
	}

	lat, lon, ok := extractCoordinates(el)
	if !ok {
		return domain.Spot{}, false
	}

	seabed := mapSeabed(el.Tags)
	spotID := fmt.Sprintf("osm-%s-%d", el.Type, el.ID)

	return domain.Spot{
		ID:         spotID,
		Name:       name,
		Latitude:   lat,
		Longitude:  lon,
		SeabedType: seabed,
	}, true
}

func extractCoordinates(el OverpassElement) (float64, float64, bool) {
	switch {
	case el.Lat != nil && el.Lon != nil:
		return *el.Lat, *el.Lon, true
	case el.Center != nil:
		return el.Center.Lat, el.Center.Lon, true
	default:
		return 0, 0, false
	}
}

func mapSeabed(tags map[string]string) domain.SeabedType {
	surface := strings.ToLower(tags["surface"])
	natural := strings.ToLower(tags["natural"])

	switch {
	case natural == tagReef || surface == tagReef:
		return domain.SeabedReef
	case natural == tagRock || surface == tagRock:
		return domain.SeabedRock
	case natural == tagBeach || surface == tagSand:
		return domain.SeabedSand
	default:
		return domain.SeabedSand
	}
}
