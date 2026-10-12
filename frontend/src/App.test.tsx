import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  it('renders the coastal map view by default', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as unknown as UseQueryResult<Spot[], Error>);

    renderWithClient(<App />);
    expect(screen.getByText('SwellWatch')).toBeInTheDocument();
    expect(
      screen.getByLabelText(/carte des côtes françaises/i)
    ).toBeInTheDocument();
  });

  it('renders loading skeletons when switching to list view during loading', async () => {
    const user = userEvent.setup();

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

    const listBtn = screen.getByRole('button', { name: /liste/i });
    await user.click(listBtn);

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0
    );
  });

  it('renders spots list with forecast metrics in list view', async () => {
    const user = userEvent.setup();

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

    const listBtn = screen.getByRole('button', { name: /liste/i });
    await user.click(listBtn);

    expect(screen.getByText('Hossegor')).toBeInTheDocument();
    expect(screen.getByText('1.9m')).toBeInTheDocument();
    expect(screen.getByText('12s')).toBeInTheDocument();
    expect(screen.getByText(/15 kn/)).toBeInTheDocument();
    expect(screen.getByText(/22 kn/)).toBeInTheDocument();
  });
});
