import { describe, expect, it } from 'vitest';
import { degreesToCardinal, formatDirection } from './direction';

describe('direction utilities', () => {
  describe('degreesToCardinal', () => {
    it('converts exact cardinal directions correctly', () => {
      expect(degreesToCardinal(0)).toBe('N');
      expect(degreesToCardinal(90)).toBe('E');
      expect(degreesToCardinal(180)).toBe('S');
      expect(degreesToCardinal(270)).toBe('W');
      expect(degreesToCardinal(360)).toBe('N');
    });

    it('converts intermediate points correctly', () => {
      expect(degreesToCardinal(45)).toBe('NE');
      expect(degreesToCardinal(135)).toBe('SE');
      expect(degreesToCardinal(225)).toBe('SW');
      expect(degreesToCardinal(315)).toBe('NW');
      expect(degreesToCardinal(290)).toBe('WNW');
      expect(degreesToCardinal(22.5)).toBe('NNE');
    });

    it('handles negative angles and angles > 360', () => {
      expect(degreesToCardinal(-90)).toBe('W');
      expect(degreesToCardinal(450)).toBe('E');
    });
  });

  describe('formatDirection', () => {
    it('formats degrees with cardinal label', () => {
      expect(formatDirection(290)).toBe('290° WNW');
      expect(formatDirection(0)).toBe('0° N');
    });
  });
});
