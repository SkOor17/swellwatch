import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { HourlyForecast } from '../types';
import { HourlyForecastTable } from './HourlyForecastTable';

describe('HourlyForecastTable', () => {
  const sampleHourly: HourlyForecast[] = [
    {
      time: '2026-08-22T08:00:00Z',
      wave_height: 1.5,
      wave_period: 10,
      wave_direction: 280,
      swell_wave_height: 1.3,
      swell_wave_period: 11,
      swell_wave_direction: 285,
      wind_speed: 12,
      wind_gusts: 18,
      wind_direction: 290,
    },
    {
      time: '2026-08-22T09:00:00Z',
      wave_height: 1.7,
      wave_period: 11,
      wave_direction: 280,
      swell_wave_height: 1.5,
      swell_wave_period: 12,
      swell_wave_direction: 285,
      wind_speed: 14,
      wind_gusts: 20,
      wind_direction: 295,
    },
  ];

  it('renders hourly forecast rows correctly', () => {
    render(<HourlyForecastTable hourly={sampleHourly} />);

    expect(screen.getByText('1.5m')).toBeInTheDocument();
    expect(screen.getByText('10s')).toBeInTheDocument();
    expect(screen.getByText('12 kn')).toBeInTheDocument();
    expect(screen.getByText('18 kn')).toBeInTheDocument();

    expect(screen.getByText('1.7m')).toBeInTheDocument();
    expect(screen.getByText('11s')).toBeInTheDocument();
    expect(screen.getByText('14 kn')).toBeInTheDocument();
    expect(screen.getByText('20 kn')).toBeInTheDocument();
  });

  it('renders empty message when hourly data is empty', () => {
    render(<HourlyForecastTable hourly={[]} />);

    expect(
      screen.getByText('Aucune prévision horaire disponible.')
    ).toBeInTheDocument();
  });
});
