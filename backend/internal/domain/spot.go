package domain

type SeabedType string

const (
	SeabedSand  SeabedType = "sand"
	SeabedReef  SeabedType = "reef"
	SeabedRock  SeabedType = "rock"
	SeabedPoint SeabedType = "point"
	SeabedSlab  SeabedType = "slab"
)

type Spot struct {
	ID              string             `json:"id"`
	Name            string             `json:"name"`
	Latitude        float64            `json:"latitude"`
	Longitude       float64            `json:"longitude"`
	SeabedType      SeabedType         `json:"seabed_type,omitempty"`
	CurrentForecast *CurrentConditions `json:"current_forecast,omitempty"`
}
