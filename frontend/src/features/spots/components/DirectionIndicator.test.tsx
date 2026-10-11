import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DirectionIndicator } from './DirectionIndicator';

describe('DirectionIndicator', () => {
  it('renders degree and cardinal label', () => {
    render(<DirectionIndicator degrees={285} />);

    expect(screen.getByText('285° WNW')).toBeInTheDocument();
  });

  it('renders with custom label prefix if provided', () => {
    render(<DirectionIndicator degrees={90} label="Vent" />);

    expect(screen.getByText('Vent :')).toBeInTheDocument();
    expect(screen.getByText('90° E')).toBeInTheDocument();
  });

  it('applies rotation transform based on degrees', () => {
    render(<DirectionIndicator degrees={180} />);

    const icon = screen.getByTestId('direction-arrow');
    expect(icon).toHaveStyle({ transform: 'rotate(180deg)' });
  });
});
