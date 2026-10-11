package scoring_test

import (
	"testing"

	"github.com/swellwatch/backend/internal/scoring"
)

func TestCalculateSwellScore(t *testing.T) {
	tests := []struct {
		name     string
		height   float64
		period   float64
		minScore float64
		maxScore float64
	}{
		{
			name:     "Flat ocean (height 0.1m, period 5s)",
			height:   0.1,
			period:   5.0,
			minScore: 0.0,
			maxScore: 0.5,
		},
		{
			name:     "Very small wave (height 0.3m, period 7s)",
			height:   0.3,
			period:   7.0,
			minScore: 0.5,
			maxScore: 2.0,
		},
		{
			name:     "Beginner mellow wave (height 0.7m, period 8s)",
			height:   0.7,
			period:   8.0,
			minScore: 2.5,
			maxScore: 4.5,
		},
		{
			name:     "Good intermediate wave (height 1.2m, period 10s)",
			height:   1.2,
			period:   10.0,
			minScore: 6.0,
			maxScore: 8.0,
		},
		{
			name:     "Optimal overhead groundswell (height 1.6m, period 13s)",
			height:   1.6,
			period:   13.0,
			minScore: 8.5,
			maxScore: 10.0,
		},
		{
			name:     "Huge heavy swell (height 4.5m, period 15s)",
			height:   4.5,
			period:   15.0,
			minScore: 5.0,
			maxScore: 8.5,
		},
		{
			name:     "Zero or negative values guard",
			height:   0.0,
			period:   0.0,
			minScore: 0.0,
			maxScore: 0.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			score := scoring.CalculateSwellScore(tt.height, tt.period)
			if score < tt.minScore || score > tt.maxScore {
				t.Errorf("CalculateSwellScore(%v, %v) = %v; want between %v and %v",
					tt.height, tt.period, score, tt.minScore, tt.maxScore)
			}
		})
	}
}
