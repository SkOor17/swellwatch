package openmeteo

type MarineCurrentResponse struct {
	Time               string  `json:"time"`
	WaveHeight         float64 `json:"wave_height"`
	WavePeriod         float64 `json:"wave_period"`
	WaveDirection      int     `json:"wave_direction"`
	SwellWaveHeight    float64 `json:"swell_wave_height"`
	SwellWavePeriod    float64 `json:"swell_wave_period"`
	SwellWaveDirection int     `json:"swell_wave_direction"`
}

type MarineHourlyResponse struct {
	Time               []string  `json:"time"`
	WaveHeight         []float64 `json:"wave_height"`
	WavePeriod         []float64 `json:"wave_period"`
	WaveDirection      []int     `json:"wave_direction"`
	SwellWaveHeight    []float64 `json:"swell_wave_height"`
	SwellWavePeriod    []float64 `json:"swell_wave_period"`
	SwellWaveDirection []int     `json:"swell_wave_direction"`
}

type MarineAPIResponse struct {
	Current MarineCurrentResponse `json:"current"`
	Hourly  MarineHourlyResponse  `json:"hourly"`
}

type WeatherCurrentResponse struct {
	Time         string  `json:"time"`
	WindSpeed10m float64 `json:"wind_speed_10m"`
	WindGusts10m float64 `json:"wind_gusts_10m"`
	WindDir10m   int     `json:"wind_direction_10m"`
}

type WeatherHourlyResponse struct {
	Time         []string  `json:"time"`
	WindSpeed10m []float64 `json:"wind_speed_10m"`
	WindGusts10m []float64 `json:"wind_gusts_10m"`
	WindDir10m   []int     `json:"wind_direction_10m"`
}

type WeatherAPIResponse struct {
	Current WeatherCurrentResponse `json:"current"`
	Hourly  WeatherHourlyResponse  `json:"hourly"`
}
