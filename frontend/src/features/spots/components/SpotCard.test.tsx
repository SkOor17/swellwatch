import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Spot } from '../types';
import { SpotCard } from './SpotCard';

describe('SpotCard', () => {
  const spotWithForecast: Spot = {
    id: 'hossegor',
    name: 'Hossegor',
    latitude: 43.668,
    longitude: -1.439,
    current_forecast: {
      wave_height: 1.8,
      wave_period: 11,
      wave_direction: 280,
      swell_wave_height: 1.6,
      swell_wave_period: 12,
      swell_wave_direction: 285,
      wind_speed: 14,
      wind_gusts: 20,
      wind_direction: 290,
      last_updated_at: '2026-08-22T15:00:00Z',
    },
  };

  const spotWithoutForecast: Spot = {
    id: 'biarritz',
    name: 'Biarritz',
    latitude: 43.483,
    longitude: -1.558,
    current_forecast: null,
  };

  it('renders spot name and coordinates', () => {
    render(<SpotCard spot={spotWithForecast} />);

    expect(screen.getByText('Hossegor')).toBeInTheDocument();
    expect(screen.getByText(/43.668/)).toBeInTheDocument();
  });

  it('renders forecast metrics when current forecast is available', () => {
    render(<SpotCard spot={spotWithForecast} />);

    expect(screen.getByText('1.8m')).toBeInTheDocument();
    expect(screen.getByText('11s')).toBeInTheDocument();
    expect(screen.getByText(/14 kn/)).toBeInTheDocument();
    expect(screen.getByText(/20 kn/)).toBeInTheDocument();
    expect(screen.getByText('285° WNW')).toBeInTheDocument();
    expect(screen.getByText('290° WNW')).toBeInTheDocument();
  });

  it('renders fallback state when forecast is not available', () => {
    render(<SpotCard spot={spotWithoutForecast} />);

    expect(screen.getByText('Biarritz')).toBeInTheDocument();
    expect(screen.getByText('Prévisions indisponibles')).toBeInTheDocument();
  });

  it('calls onSelect when clicking the forecast button', () => {
    const handleSelect = vi.fn();
    render(<SpotCard spot={spotWithForecast} onSelect={handleSelect} />);

    const button = screen.getByRole('button', {
      name: /prévisions du jour/i,
    });
    fireEvent.click(button);

    expect(handleSelect).toHaveBeenCalledWith(spotWithForecast);
  });
});
