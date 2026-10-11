package scoring

import (
	"strings"

	"github.com/swellwatch/backend/internal/domain"
)

const (
	LevelFlat         = domain.SkillLevelFlat
	LevelBeginner     = domain.SkillLevelBeginner
	LevelIntermediate = domain.SkillLevelIntermediate
	LevelAdvanced     = domain.SkillLevelAdvanced
	LevelExpert       = domain.SkillLevelExpert
)

// EstimateSkillLevel estimates the recommended surfer skill level dynamically based on
// wave height, wave period, wind speed, and seabed composition.
func EstimateSkillLevel(height, period, windSpeed float64, seabed domain.SeabedType) domain.SkillLevel {
	if height < 0.4 {
		return domain.SkillLevelFlat
	}

	if isExpertCondition(height, period) {
		return domain.SkillLevelExpert
	}

	if isReefOrRock(seabed) {
		return estimateReefLevel(height)
	}

	return estimateSandLevel(height, period, windSpeed)
}

func isExpertCondition(height, period float64) bool {
	return height > 2.5 || (height > 2.0 && period > 13.0)
}

func isReefOrRock(seabed domain.SeabedType) bool {
	normalized := strings.ToLower(strings.TrimSpace(string(seabed)))
	return normalized == string(domain.SeabedReef) ||
		normalized == string(domain.SeabedRock) ||
		normalized == string(domain.SeabedSlab)
}

func estimateReefLevel(height float64) domain.SkillLevel {
	if height <= 1.2 {
		return domain.SkillLevelIntermediate
	}
	if height <= 2.2 {
		return domain.SkillLevelAdvanced
	}
	return domain.SkillLevelExpert
}

func estimateSandLevel(height, period, windSpeed float64) domain.SkillLevel {
	if height <= 0.9 && period <= 10.0 && windSpeed <= 18.0 {
		return domain.SkillLevelBeginner
	}
	if height <= 1.5 && period <= 13.0 {
		return domain.SkillLevelIntermediate
	}
	if height <= 2.2 {
		return domain.SkillLevelAdvanced
	}
	return domain.SkillLevelExpert
}
