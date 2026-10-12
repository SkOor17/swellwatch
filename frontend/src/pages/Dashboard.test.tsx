import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './Dashboard';
import * as useSpotsModule from '../features/spots/api/useSpots';

vi.mock('../features/spots/api/useSpots', () => ({
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

describe('Dashboard page', () => {
  it('renders with view switcher and shows the coastal map by default', () => {
    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as unknown as ReturnType<typeof useSpotsModule.useSpots>);

    renderWithClient(<Dashboard />);

    expect(
      screen.getByRole('button', { name: /^carte$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^liste$/i })
    ).toBeInTheDocument();

    // CoastalMap canvas is visible by default
    expect(
      screen.getByLabelText(/carte des côtes françaises/i)
    ).toBeInTheDocument();
  });

  it('switches between Carte and Liste views when buttons are clicked', async () => {
    const user = userEvent.setup();

    vi.spyOn(useSpotsModule, 'useSpots').mockReturnValue({
      data: [
        {
          id: 'biarritz',
          name: 'Biarritz Grande Plage',
          latitude: 43.483,
          longitude: -1.558,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as unknown as ReturnType<typeof useSpotsModule.useSpots>);

    renderWithClient(<Dashboard />);

    // Initially on map
    expect(
      screen.getByLabelText(/carte des côtes françaises/i)
    ).toBeInTheDocument();
    expect(screen.queryByText('Biarritz Grande Plage')).not.toBeInTheDocument();

    // Click "Liste"
    const listBtn = screen.getByRole('button', { name: /liste/i });
    await user.click(listBtn);

    // Now SpotList is visible
    expect(screen.getByText('Biarritz Grande Plage')).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/carte des côtes françaises/i)
    ).not.toBeInTheDocument();

    // Click "Carte" to return to map
    const mapBtn = screen.getByRole('button', { name: /^carte$/i });
    await user.click(mapBtn);

    expect(
      screen.getByLabelText(/carte des côtes françaises/i)
    ).toBeInTheDocument();
    expect(screen.queryByText('Biarritz Grande Plage')).not.toBeInTheDocument();
  });
});
