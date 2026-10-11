package scoring

import (
	"math"

	"github.com/swellwatch/backend/internal/domain"
)

// EvaluateConditions combines swell characteristics and atmospheric wind into
// a final score (bounded between 0.0 and 10.0, rounded to 1 decimal place) and a recommended skill level.
func EvaluateConditions(height, period, windSpeed float64, seabed domain.SeabedType) (float64, domain.SkillLevel) {
	level := EstimateSkillLevel(height, period, windSpeed, seabed)

	rawSwellScore := CalculateSwellScore(height, period)
	windPenalty := CalculateWindPenalty(windSpeed)

	score := rawSwellScore - windPenalty
	if score < 0.0 {
		score = 0.0
	}
	if score > 10.0 {
		score = 10.0
	}

	roundedScore := math.Round(score*10.0) / 10.0
	return roundedScore, level
}
