import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
});
