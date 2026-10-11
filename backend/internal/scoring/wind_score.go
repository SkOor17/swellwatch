package scoring

import "math"

// CalculateWindPenalty calculates the penalty in points to subtract from the wave score,
// based on wind speed in knots. Stronger wind deteriorates surf wave quality.
func CalculateWindPenalty(speedKnots float64) float64 {
	if speedKnots <= 8.0 {
		return 0.0
	}

	if speedKnots <= 14.0 {
		// Moderate wind (8 to 14 kn): 0 to 1.5 pt penalty
		return (speedKnots - 8.0) * (1.5 / 6.0)
	}

	if speedKnots <= 22.0 {
		// Fresh breeze (14 to 22 kn): 1.5 to 4.0 pt penalty
		return 1.5 + (speedKnots-14.0)*(2.5/8.0)
	}

	if speedKnots <= 30.0 {
		// Strong wind (22 to 30 kn): 4.0 to 6.5 pt penalty
		return 4.0 + (speedKnots-22.0)*(2.5/8.0)
	}

	// Storm / Gale (> 30 kn): up to 8.5 pt penalty
	return math.Min(6.5+(speedKnots-30.0)*0.2, 8.5)
}
