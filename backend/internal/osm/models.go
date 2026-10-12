package osm

type OverpassElement struct {
	Type   string            `json:"type"`
	ID     int64             `json:"id"`
	Lat    *float64          `json:"lat,omitempty"`
	Lon    *float64          `json:"lon,omitempty"`
	Center *OverpassCenter   `json:"center,omitempty"`
	Tags   map[string]string `json:"tags,omitempty"`
}

type OverpassCenter struct {
	Lat float64 `json:"lat"`
	Lon float64 `json:"lon"`
}

type OverpassResponse struct {
	Elements []OverpassElement `json:"elements"`
}
