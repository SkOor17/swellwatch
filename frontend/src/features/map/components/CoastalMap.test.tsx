import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Spot } from '../../spots/types';
import { createProjection } from '../utils/projection';
import { CoastalMap } from './CoastalMap';

describe('CoastalMap component', () => {
  let originalDpr: number;
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cancelRafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalDpr = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 1,
    });

    rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 123);
    cancelRafSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(vi.fn());
  });

  afterEach(() => {
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: originalDpr,
    });
    vi.restoreAllMocks();
  });

  it('renders the canvas element with accessibility labels and custom class', () => {
    render(<CoastalMap className="custom-map-class" />);

    const canvas = screen.getByLabelText(/carte des côtes françaises/i);
    expect(canvas).toBeInTheDocument();
    expect(canvas.parentElement).toHaveClass('custom-map-class');
  });

  it('initializes the 2D context and executes the render pipeline with map theme colors', () => {
    render(<CoastalMap />);

    const canvas = screen.getByLabelText<HTMLCanvasElement>(
      /carte des côtes françaises/i
    );
    const ctx = canvas.getContext('2d');
    expect(ctx).not.toBeNull();

    // Verify ocean fillRect, landmass fill, and coastline stroke are invoked
    expect(ctx?.fillRect).toHaveBeenCalled();
    expect(ctx?.fill).toHaveBeenCalled();
    expect(ctx?.stroke).toHaveBeenCalled();
  });

  it('supports Retina display by scaling canvas buffer with devicePixelRatio', () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 2,
    });

    render(<CoastalMap />);

    const canvas = screen.getByLabelText<HTMLCanvasElement>(
      /carte des côtes françaises/i
    );
    const ctx = canvas.getContext('2d');

    expect(ctx?.scale).toHaveBeenCalledWith(2, 2);
  });

  it('manages the requestAnimationFrame loop and cancels it on unmount', () => {
    const { unmount } = render(<CoastalMap />);

    expect(rafSpy).toHaveBeenCalled();

    unmount();

    expect(cancelRafSpy).toHaveBeenCalledWith(123);
  });

  it('supports custom colors prop', () => {
    const customColors = {
      ocean: '#111111',
      landmass: '#222222',
      coastline: '#333333',
    };

    render(<CoastalMap colors={customColors} />);

    const canvas = screen.getByLabelText<HTMLCanvasElement>(
      /carte des côtes françaises/i
    );
    const ctx = canvas.getContext('2d');
    expect(ctx).not.toBeNull();
    expect(ctx?.fill).toHaveBeenCalled();
  });

  it('renders zoom controls and updates zoom when buttons are clicked', async () => {
    const user = userEvent.setup();
    render(<CoastalMap />);

    const zoomInBtn = screen.getByRole('button', { name: /zoom avant/i });
    const zoomOutBtn = screen.getByRole('button', { name: /zoom arrière/i });
    const recenterBtn = screen.getByRole('button', { name: /recentrer/i });

    expect(zoomInBtn).toBeInTheDocument();
    expect(zoomOutBtn).toBeInTheDocument();
    expect(recenterBtn).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();

    // Click zoom in
    await user.click(zoomInBtn);
    expect(screen.queryByText('100%')).not.toBeInTheDocument();

    // Click recenter
    await user.click(recenterBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('handles mouse wheel zooming', () => {
    render(<CoastalMap />);

    const canvas = screen.getByLabelText(/carte des côtes françaises/i);

    // Wheel zoom in (negative deltaY)
    fireEvent.wheel(canvas, { deltaY: -100, clientX: 400, clientY: 300 });

    // Should not be at 100% anymore
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
  });

  it('handles pointer dragging to pan the map', () => {
    render(<CoastalMap />);

    const canvas = screen.getByLabelText(/carte des côtes françaises/i);

    // First zoom in so pan is permitted
    fireEvent.wheel(canvas, { deltaY: -200, clientX: 400, clientY: 300 });

    // Drag to pan
    fireEvent.pointerDown(canvas, { clientX: 400, clientY: 300, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 450, clientY: 350, pointerId: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });

    const ctx = (canvas as HTMLCanvasElement).getContext('2d');
    expect(ctx?.translate).toHaveBeenCalled();
  });

  it('changes cursor to pointer on hover over a spot marker and triggers onSelectSpot on click', () => {
    const handleSelectSpot = vi.fn();
    const spot: Spot = {
      id: 'hossegor',
      name: 'Hossegor',
      latitude: 43.668,
      longitude: -1.439,
      current_forecast: {
        score: 8.5,
        wave_height: 1.8,
        wave_period: 11,
        wave_direction: 280,
        swell_wave_height: 1.6,
        swell_wave_period: 12,
        swell_wave_direction: 285,
        wind_speed: 12,
        wind_gusts: 18,
        wind_direction: 90,
        last_updated_at: '2026-10-12T12:00:00Z',
      },
    };

    render(<CoastalMap spots={[spot]} onSelectSpot={handleSelectSpot} />);

    const canvas = screen.getByLabelText<HTMLCanvasElement>(
      /carte des côtes françaises/i
    );

    // Calculate screen position of the spot
    const projection = createProjection({
      width: 800,
      height: 600,
      padding: 20,
    });
    const screenPt = projection.project([spot.longitude, spot.latitude]);

    // Hover over the spot
    fireEvent.pointerMove(canvas, {
      clientX: screenPt.x,
      clientY: screenPt.y,
    });
    expect(canvas.style.cursor).toBe('pointer');

    // Click on the spot marker
    fireEvent.pointerDown(canvas, {
      clientX: screenPt.x,
      clientY: screenPt.y,
      pointerId: 1,
    });
    fireEvent.pointerUp(canvas, {
      clientX: screenPt.x,
      clientY: screenPt.y,
      pointerId: 1,
    });

    expect(handleSelectSpot).toHaveBeenCalledTimes(1);
    expect(handleSelectSpot).toHaveBeenCalledWith(spot);
  });

  it('clusters nearby spots and zooms in when clicking the cluster', () => {
    const spot1: Spot = {
      id: 'spot-1',
      name: 'Hossegor Plage Centrale',
      latitude: 43.668,
      longitude: -1.439,
    };
    const spot2: Spot = {
      id: 'spot-2',
      name: 'Capbreton Le Santocha',
      latitude: 43.655,
      longitude: -1.445,
    };

    render(<CoastalMap spots={[spot1, spot2]} />);

    const canvas = screen.getByLabelText<HTMLCanvasElement>(
      /carte des côtes françaises/i
    );

    expect(screen.getByText('100%')).toBeInTheDocument();

    const projection = createProjection({
      width: 800,
      height: 600,
      padding: 20,
    });
    const p1 = projection.project([spot1.longitude, spot1.latitude]);
    const p2 = projection.project([spot2.longitude, spot2.latitude]);
    const clusterX = (p1.x + p2.x) / 2;
    const clusterY = (p1.y + p2.y) / 2;

    // Hover over cluster
    fireEvent.pointerMove(canvas, {
      clientX: clusterX,
      clientY: clusterY,
    });
    expect(canvas.style.cursor).toBe('pointer');

    // Click cluster
    fireEvent.pointerDown(canvas, {
      clientX: clusterX,
      clientY: clusterY,
      pointerId: 1,
    });
    fireEvent.pointerUp(canvas, {
      clientX: clusterX,
      clientY: clusterY,
      pointerId: 1,
    });

    // Zoom should have increased from 100% to 150%
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
  });
});
