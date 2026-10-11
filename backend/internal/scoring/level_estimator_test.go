package scoring_test

import (
	"testing"

	"github.com/swellwatch/backend/internal/domain"
	"github.com/swellwatch/backend/internal/scoring"
)

func TestEstimateSkillLevel(t *testing.T) {
	tests := []struct {
		name      string
		height    float64
		period    float64
		windSpeed float64
		seabed    domain.SeabedType
		expected  domain.SkillLevel
	}{
		{
			name:      "Flat ocean (< 0.4m)",
			height:    0.2,
			period:    6.0,
			windSpeed: 5.0,
			seabed:    domain.SeabedSand,
			expected:  scoring.LevelFlat,
		},
		{
			name:      "Beginner ideal conditions (0.6m, 8s, light wind, sand)",
			height:    0.6,
			period:    8.0,
			windSpeed: 8.0,
			seabed:    domain.SeabedSand,
			expected:  scoring.LevelBeginner,
		},
		{
			name:      "Beginner waves but strong wind bumps to intermediate for safety",
			height:    0.7,
			period:    8.0,
			windSpeed: 22.0,
			seabed:    domain.SeabedSand,
			expected:  scoring.LevelIntermediate,
		},
		{
			name:      "Beginner wave size but on dangerous reef seabed",
			height:    0.7,
			period:    8.0,
			windSpeed: 5.0,
			seabed:    domain.SeabedReef,
			expected:  scoring.LevelIntermediate,
		},
		{
			name:      "Intermediate conditions (1.2m, 10s, sand)",
			height:    1.2,
			period:    10.0,
			windSpeed: 10.0,
			seabed:    domain.SeabedSand,
			expected:  scoring.LevelIntermediate,
		},
		{
			name:      "Intermediate wave size on reef",
			height:    1.5,
			period:    11.0,
			windSpeed: 8.0,
			seabed:    domain.SeabedReef,
			expected:  scoring.LevelAdvanced,
		},
		{
			name:      "Advanced powerful swell on sand (1.8m, 13s)",
			height:    1.8,
			period:    13.0,
			windSpeed: 12.0,
			seabed:    domain.SeabedSand,
			expected:  scoring.LevelAdvanced,
		},
		{
			name:      "Expert conditions (2.2m, 14s, reef)",
			height:    2.2,
			period:    14.0,
			windSpeed: 10.0,
			seabed:    domain.SeabedReef,
			expected:  scoring.LevelExpert,
		},
		{
			name:      "Huge wave conditions regardless of seabed (3.2m, 15s)",
			height:    3.2,
			period:    15.0,
			windSpeed: 15.0,
			seabed:    domain.SeabedSand,
			expected:  scoring.LevelExpert,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := scoring.EstimateSkillLevel(tt.height, tt.period, tt.windSpeed, tt.seabed)
			if result != tt.expected {
				t.Errorf("EstimateSkillLevel(%v, %v, %v, %q) = %q; want %q",
					tt.height, tt.period, tt.windSpeed, tt.seabed, result, tt.expected)
			}
		})
	}
}
