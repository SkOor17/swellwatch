package domain

import "time"

type SkillLevel string

const (
	SkillLevelFlat         SkillLevel = "flat"
	SkillLevelBeginner     SkillLevel = "beginner"
	SkillLevelIntermediate SkillLevel = "intermediate"
	SkillLevelAdvanced     SkillLevel = "advanced"
	SkillLevelExpert       SkillLevel = "expert"
)

type CurrentConditions struct {
	WaveHeight         float64    `json:"wave_height"`          // in meters
	WavePeriod         float64    `json:"wave_period"`          // in seconds
	WaveDirection      int        `json:"wave_direction"`       // in degrees (0-360)
	SwellWaveHeight    float64    `json:"swell_wave_height"`    // in meters
	SwellWavePeriod    float64    `json:"swell_wave_period"`    // in seconds
	SwellWaveDirection int        `json:"swell_wave_direction"` // in degrees (0-360)
	WindSpeed          float64    `json:"wind_speed"`           // in knots
	WindGusts          float64    `json:"wind_gusts"`           // in knots
	WindDirection      int        `json:"wind_direction"`       // in degrees (0-360)
	Score              float64    `json:"score"`                // in 0.0-10.0 scale
	Level              SkillLevel `json:"level"`                // flat, beginner, intermediate, advanced, expert
	LastUpdatedAt      time.Time  `json:"last_updated_at"`
}

type HourlyForecast struct {
	Time               time.Time  `json:"time"`
	WaveHeight         float64    `json:"wave_height"`
	WavePeriod         float64    `json:"wave_period"`
	WaveDirection      int        `json:"wave_direction"`
	SwellWaveHeight    float64    `json:"swell_wave_height"`
	SwellWavePeriod    float64    `json:"swell_wave_period"`
	SwellWaveDirection int        `json:"swell_wave_direction"`
	WindSpeed          float64    `json:"wind_speed"`
	WindGusts          float64    `json:"wind_gusts"`
	WindDirection      int        `json:"wind_direction"`
	Score              float64    `json:"score"`
	Level              SkillLevel `json:"level"`
}

type SpotForecast struct {
	SpotID        string            `json:"spot_id"`
	Current       CurrentConditions `json:"current"`
	Hourly        []HourlyForecast  `json:"hourly"`
	LastUpdatedAt time.Time         `json:"last_updated_at"`
}
