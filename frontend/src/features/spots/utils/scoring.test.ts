import { describe, expect, it } from 'vitest';
import { getLevelInfo, getScoreBadgeClass } from './scoring';

describe('scoring utils', () => {
  describe('getLevelInfo', () => {
    it('returns French label and styling for standard levels', () => {
      expect(getLevelInfo('flat').label).toBe('Non praticable');
      expect(getLevelInfo('beginner').label).toBe('Débutant');
      expect(getLevelInfo('intermediate').label).toBe('Intermédiaire');
      expect(getLevelInfo('advanced').label).toBe('Avancé');
      expect(getLevelInfo('expert').label).toBe('Expert');
    });

    it('handles uppercase or whitespace variations', () => {
      expect(getLevelInfo('BEGINNER').label).toBe('Débutant');
      expect(getLevelInfo('Intermediate').label).toBe('Intermédiaire');
    });

    it('falls back gracefully when level is undefined or unknown', () => {
      expect(getLevelInfo(undefined).label).toBe('Non défini');
      expect(getLevelInfo('custom').label).toBe('custom');
    });
  });

  describe('getScoreBadgeClass', () => {
    it('returns emerald styling for excellent scores (>= 7.5)', () => {
      expect(getScoreBadgeClass(8.5)).toContain('bg-emerald');
      expect(getScoreBadgeClass(7.5)).toContain('bg-emerald');
    });

    it('returns amber styling for medium scores (5.0 to 7.4)', () => {
      expect(getScoreBadgeClass(6.0)).toContain('bg-amber');
      expect(getScoreBadgeClass(5.0)).toContain('bg-amber');
    });

    it('returns orange styling for fair/low scores (3.0 to 4.9)', () => {
      expect(getScoreBadgeClass(4.0)).toContain('bg-orange');
      expect(getScoreBadgeClass(3.0)).toContain('bg-orange');
    });

    it('returns rose styling for very poor scores (< 3.0)', () => {
      expect(getScoreBadgeClass(1.5)).toContain('bg-rose');
    });

    it('returns neutral slate styling when score is missing', () => {
      expect(getScoreBadgeClass(undefined)).toContain('bg-slate');
    });
  });
});
