import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as useSpotForecastModule from '../api/useSpotForecast';
import type { Spot, SpotForecast } from '../types';
import { SpotForecastModal } from './SpotForecastModal';

vi.mock('../api/useSpotForecast', () => ({
  useSpotForecast: vi.fn(),
}));

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('SpotForecastModal', () => {
  const sampleSpot: Spot = {
    id: 'hossegor',
    name: 'Hossegor',
    latitude: 43.668,
    longitude: -1.439,
  };

  beforeEach(() => {
    vi.spyOn(useSpotForecastModule, 'useSpotForecast').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: false,
      status: 'idle',
      fetchStatus: 'idle',
    } as unknown as UseQueryResult<SpotForecast, Error>);
  });

  it('renders nothing when spot is null', () => {
    const handleClose = vi.fn();
    const { container } = renderWithClient(
      <SpotForecastModal spot={null} onClose={handleClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders hourly forecast data when loaded', () => {
    vi.spyOn(useSpotForecastModule, 'useSpotForecast').mockReturnValue({
      data: {
        spot_id: 'hossegor',
        current: {
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
        hourly: [
          {
            time: '2026-08-22T14:00:00Z',
            wave_height: 1.7,
            wave_period: 11,
            wave_direction: 280,
            swell_wave_height: 1.5,
            swell_wave_period: 12,
            swell_wave_direction: 285,
            wind_speed: 13,
            wind_gusts: 19,
            wind_direction: 290,
          },
        ],
        last_updated_at: '2026-08-22T15:00:00Z',
      },
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as unknown as UseQueryResult<SpotForecast, Error>);

    const handleClose = vi.fn();
    renderWithClient(
      <SpotForecastModal spot={sampleSpot} onClose={handleClose} />
    );

    expect(screen.getByText('Hossegor')).toBeInTheDocument();
    expect(screen.getByText('Prévisions du jour')).toBeInTheDocument();
    expect(screen.getByText('1.7m')).toBeInTheDocument();
    expect(screen.getByText('13 kn')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /fermer/i });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalled();
  });
});
