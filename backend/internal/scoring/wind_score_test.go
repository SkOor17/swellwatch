package scoring_test

import (
	"testing"

	"github.com/swellwatch/backend/internal/scoring"
)

func TestCalculateWindPenalty(t *testing.T) {
	tests := []struct {
		name       string
		windSpeed  float64
		minPenalty float64
		maxPenalty float64
	}{
		{
			name:       "Calm / glassy (3 knots)",
			windSpeed:  3.0,
			minPenalty: 0.0,
			maxPenalty: 0.0,
		},
		{
			name:       "Light breeze (8 knots)",
			windSpeed:  8.0,
			minPenalty: 0.0,
			maxPenalty: 0.0,
		},
		{
			name:       "Moderate wind (12 knots)",
			windSpeed:  12.0,
			minPenalty: 0.8,
			maxPenalty: 1.5,
		},
		{
			name:       "Fresh breeze (18 knots)",
			windSpeed:  18.0,
			minPenalty: 2.0,
			maxPenalty: 3.5,
		},
		{
			name:       "Strong wind (25 knots)",
			windSpeed:  25.0,
			minPenalty: 4.5,
			maxPenalty: 6.0,
		},
		{
			name:       "Gale / Storm (40 knots)",
			windSpeed:  40.0,
			minPenalty: 7.0,
			maxPenalty: 9.0,
		},
		{
			name:       "Negative wind guard",
			windSpeed:  -5.0,
			minPenalty: 0.0,
			maxPenalty: 0.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			penalty := scoring.CalculateWindPenalty(tt.windSpeed)
			if penalty < tt.minPenalty || penalty > tt.maxPenalty {
				t.Errorf("CalculateWindPenalty(%v) = %v; want between %v and %v",
					tt.windSpeed, penalty, tt.minPenalty, tt.maxPenalty)
			}
		})
	}
}
