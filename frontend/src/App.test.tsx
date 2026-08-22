import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import * as useSpotsModule from './features/spots/api/useSpots';

// Mock the hook
vi.mock('./features/spots/api/useSpots', () => ({
  useSpots: vi.fn(),
}));

describe('App component', () => {
  it('renders loading state', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      isSuccess: false,
      status: 'pending',
      fetchStatus: 'fetching',
    } as any);

    render(<App />);
    expect(screen.getByText(/Chargement des spots/i)).toBeInTheDocument();
  });

  it('renders spots list', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      data: [
        {
          id: 'hossegor',
          name: 'Hossegor',
          latitude: 43.668,
          longitude: -1.439,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as any);

    render(<App />);
    expect(screen.getByText('SwellWatch')).toBeInTheDocument();
    expect(screen.getByText('Hossegor')).toBeInTheDocument();
    expect(screen.getByText(/Lat: 43.668/i)).toBeInTheDocument();
  });
});
