package scoring_test

import (
	"testing"

	"github.com/swellwatch/backend/internal/domain"
	"github.com/swellwatch/backend/internal/scoring"
)

func TestEvaluateConditions(t *testing.T) {
	tests := []struct {
		name          string
		height        float64
		period        float64
		windSpeed     float64
		seabed        domain.SeabedType
		expectedLevel domain.SkillLevel
		minScore      float64
		maxScore      float64
	}{
		{
			name:          "Flat calm day",
			height:        0.2,
			period:        5.0,
			windSpeed:     4.0,
			seabed:        domain.SeabedSand,
			expectedLevel: scoring.LevelFlat,
			minScore:      0.0,
			maxScore:      1.5,
		},
		{
			name:          "Perfect mellow beginner session",
			height:        0.7,
			period:        9.0,
			windSpeed:     6.0,
			seabed:        domain.SeabedSand,
			expectedLevel: scoring.LevelBeginner,
			minScore:      3.0,
			maxScore:      5.0,
		},
		{
			name:          "Epic overhead groundswell with glassy wind",
			height:        1.6,
			period:        13.0,
			windSpeed:     5.0,
			seabed:        domain.SeabedSand,
			expectedLevel: scoring.LevelAdvanced,
			minScore:      8.5,
			maxScore:      10.0,
		},
		{
			name:          "Good swell destroyed by gale force onshore wind",
			height:        1.5,
			period:        11.0,
			windSpeed:     32.0,
			seabed:        domain.SeabedSand,
			expectedLevel: scoring.LevelIntermediate,
			minScore:      0.0,
			maxScore:      3.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			score, level := scoring.EvaluateConditions(tt.height, tt.period, tt.windSpeed, tt.seabed)

			if level != tt.expectedLevel {
				t.Errorf("EvaluateConditions() level = %q; want %q", level, tt.expectedLevel)
			}
			if score < tt.minScore || score > tt.maxScore {
				t.Errorf("EvaluateConditions() score = %v; want between %v and %v",
					score, tt.minScore, tt.maxScore)
			}
			if score < 0.0 || score > 10.0 {
				t.Errorf("EvaluateConditions() score = %v; must be bounded within [0, 10]", score)
			}
		})
	}
}
