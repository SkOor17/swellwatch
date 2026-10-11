import { describe, expect, it } from 'vitest';
import { formatHour, formatShortTime } from './time';

describe('time utilities', () => {
  describe('formatShortTime', () => {
    it('formats ISO date string into HH:mm format', () => {
      const dateStr = '2026-08-22T15:30:00Z';
      const formatted = formatShortTime(dateStr);
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });

    it('returns raw string if parsing fails', () => {
      expect(formatShortTime('invalid-date')).toBe('invalid-date');
    });
  });

  describe('formatHour', () => {
    it('formats time to HH:mm', () => {
      const timeStr = '2026-08-22T08:00:00Z';
      const formatted = formatHour(timeStr);
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });

    it('handles short time slice as fallback', () => {
      expect(formatHour('2026-08-22T14:00')).toMatch(/\d{2}:\d{2}/);
    });
  });
});
