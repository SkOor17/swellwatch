export interface CurrentConditions {
  wave_height: number;
  wave_period: number;
  wave_direction: number;
  swell_wave_height: number;
  swell_wave_period: number;
  swell_wave_direction: number;
  wind_speed: number;
  wind_gusts: number;
  wind_direction: number;
  last_updated_at: string;
}

export interface HourlyForecast {
  time: string;
  wave_height: number;
  wave_period: number;
  wave_direction: number;
  swell_wave_height: number;
  swell_wave_period: number;
  swell_wave_direction: number;
  wind_speed: number;
  wind_gusts: number;
  wind_direction: number;
}

export interface SpotForecast {
  spot_id: string;
  current: CurrentConditions;
  hourly: HourlyForecast[];
  last_updated_at: string;
}

export interface Spot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  current_forecast?: CurrentConditions | null;
}
