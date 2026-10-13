import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as useSpotForecastModule from '../api/useSpotForecast';
import type { Spot, SpotForecast } from '../types';
import { SpotForecastDrawer } from './SpotForecastDrawer';

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

describe('SpotForecastDrawer', () => {
  const sampleSpot: Spot = {
    id: 'hossegor',
    name: 'Hossegor',
    latitude: 43.668,
    longitude: -1.439,
    current_forecast: {
      score: 8.2,
      level: 'intermediate',
      wave_height: 1.8,
      wave_period: 11,
      wave_direction: 280,
      swell_wave_height: 1.6,
      swell_wave_period: 12,
      swell_wave_direction: 285,
      wind_speed: 12,
      wind_gusts: 18,
      wind_direction: 90,
      last_updated_at: '2026-10-12T14:00:00Z',
    },
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

  it('renders nothing when spot is null or open is false', () => {
    const handleClose = vi.fn();
    const { container: c1 } = renderWithClient(
      <SpotForecastDrawer spot={null} open={true} onClose={handleClose} />
    );
    expect(c1.querySelector('[data-testid="sheet-root"]')).toBeNull();

    const { container: c2 } = renderWithClient(
      <SpotForecastDrawer
        spot={sampleSpot}
        open={false}
        onClose={handleClose}
      />
    );
    expect(c2.querySelector('[data-testid="sheet-root"]')).toBeNull();
  });

  it('renders spot header, badges, and current conditions when open', () => {
    const handleClose = vi.fn();
    renderWithClient(
      <SpotForecastDrawer spot={sampleSpot} open={true} onClose={handleClose} />
    );

    expect(screen.getByText('Hossegor')).toBeInTheDocument();
    expect(screen.getByText('8.2/10')).toBeInTheDocument();
    expect(screen.getByText('Intermédiaire')).toBeInTheDocument();
    expect(screen.getByText('1.8m')).toBeInTheDocument();
    expect(screen.getByText('12 kn')).toBeInTheDocument();
  });

  it('renders skeleton indicators during loading', () => {
    vi.spyOn(useSpotForecastModule, 'useSpotForecast').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      isSuccess: false,
      status: 'pending',
      fetchStatus: 'fetching',
    } as unknown as UseQueryResult<SpotForecast, Error>);

    renderWithClient(
      <SpotForecastDrawer spot={sampleSpot} open={true} onClose={vi.fn()} />
    );

    expect(screen.getByTestId('forecast-loading-skeleton')).toBeInTheDocument();
  });

  it('renders error message when forecast fetching fails', () => {
    vi.spyOn(useSpotForecastModule, 'useSpotForecast').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      isSuccess: false,
      status: 'error',
      fetchStatus: 'idle',
    } as unknown as UseQueryResult<SpotForecast, Error>);

    renderWithClient(
      <SpotForecastDrawer spot={sampleSpot} open={true} onClose={vi.fn()} />
    );

    expect(
      screen.getByText(/impossible de charger les prévisions détaillées/i)
    ).toBeInTheDocument();
  });

  it('renders hourly forecast timeline when data arrives', () => {
    vi.spyOn(useSpotForecastModule, 'useSpotForecast').mockReturnValue({
      data: {
        spot_id: 'hossegor',
        current: sampleSpot.current_forecast!,
        hourly: [
          {
            time: '2026-10-12T15:00:00Z',
            wave_height: 2.5,
            wave_period: 12,
            wave_direction: 280,
            swell_wave_height: 2.4,
            swell_wave_period: 12,
            swell_wave_direction: 280,
            wind_speed: 10,
            wind_gusts: 14,
            wind_direction: 90,
          },
        ],
        last_updated_at: '2026-10-12T14:00:00Z',
      },
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as unknown as UseQueryResult<SpotForecast, Error>);

    renderWithClient(
      <SpotForecastDrawer spot={sampleSpot} open={true} onClose={vi.fn()} />
    );

    expect(screen.getByText('Chronologie horaire (24h)')).toBeInTheDocument();
    expect(screen.getByText('2.5m')).toBeInTheDocument();
    expect(screen.getByText('10 kn')).toBeInTheDocument();
  });

  it('triggers onClose when clicking close button or backdrop', () => {
    const handleClose = vi.fn();
    renderWithClient(
      <SpotForecastDrawer spot={sampleSpot} open={true} onClose={handleClose} />
    );

    const closeButton = screen.getByRole('button', { name: /fermer/i });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const backdrop = screen.getByTestId('sheet-backdrop');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
