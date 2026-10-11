export type SeabedType = 'sand' | 'reef' | 'rock' | 'point' | 'slab';

export type SurfSkillLevel =
  'flat' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface LevelInfo {
  label: string;
  badgeClass: string;
}

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
  score?: number;
  level?: SurfSkillLevel;
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
  score?: number;
  level?: SurfSkillLevel;
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
  seabed_type?: SeabedType;
  current_forecast?: CurrentConditions | null;
}
