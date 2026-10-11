import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
} from '@tanstack/react-query';
import App from './App';
import * as useSpotsModule from './features/spots/api/useSpots';
import type { Spot } from './features/spots/types';

vi.mock('./features/spots/api/useSpots', () => ({
  useSpots: vi.fn(),
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

describe('App component', () => {
  it('renders loading skeletons', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      isSuccess: false,
      status: 'pending',
      fetchStatus: 'fetching',
    } as unknown as UseQueryResult<Spot[], Error>);

    const { container } = renderWithClient(<App />);
    expect(screen.getByText('SwellWatch')).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0
    );
  });

  it('renders spots list with forecast metrics', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      data: [
        {
          id: 'hossegor',
          name: 'Hossegor',
          latitude: 43.668,
          longitude: -1.439,
          current_forecast: {
            wave_height: 1.9,
            wave_period: 12,
            wave_direction: 280,
            swell_wave_height: 1.7,
            swell_wave_period: 13,
            swell_wave_direction: 285,
            wind_speed: 15,
            wind_gusts: 22,
            wind_direction: 290,
            last_updated_at: '2026-08-22T15:00:00Z',
          },
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as unknown as UseQueryResult<Spot[], Error>);

    renderWithClient(<App />);
    expect(screen.getByText('SwellWatch')).toBeInTheDocument();
    expect(screen.getByText('Hossegor')).toBeInTheDocument();
    expect(screen.getByText('1.9m')).toBeInTheDocument();
    expect(screen.getByText('12s')).toBeInTheDocument();
    expect(screen.getByText(/15 kn/)).toBeInTheDocument();
    expect(screen.getByText(/22 kn/)).toBeInTheDocument();
  });
});
