package scoring

import "math"

// CalculateSwellScore calculates the base surf condition score from wave height (meters)
// and wave period (seconds). The score ranges from 0.0 to 10.0.
func CalculateSwellScore(height, period float64) float64 {
	if height <= 0.0 || period <= 0.0 {
		return 0.0
	}

	var heightFactor float64
	switch {
	case height < 0.4:
		// Micro wave / flat conditions
		heightFactor = (height / 0.4) * 2.0
	case height <= 1.6:
		// Progression from small surf to optimal conditions
		heightFactor = 2.0 + (height-0.4)*(7.0/1.2)
	case height <= 2.5:
		// High quality surf window
		heightFactor = 9.0 + (height-1.6)*(0.5/0.9)
	default:
		// Beyond 2.5m conditions become heavy and increasingly difficult for average sessions
		heightFactor = math.Max(9.5-(height-2.5)*1.5, 5.0)
	}

	var periodFactor float64
	switch {
	case period <= 5.0:
		periodFactor = 0.5
	case period < 10.0:
		periodFactor = 0.5 + 0.5*((period-5.0)/5.0)
	case period <= 16.0:
		periodFactor = 1.0 + 0.1*math.Min((period-10.0)/4.0, 1.0)
	default:
		periodFactor = 1.1
	}

	rawScore := heightFactor * periodFactor
	if rawScore > 10.0 {
		return 10.0
	}
	return rawScore
}
