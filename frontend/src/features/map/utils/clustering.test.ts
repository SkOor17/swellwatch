import { describe, expect, it } from 'vitest';
import type { Spot } from '../../spots/types';
import type { ProjectionResult, ViewportTransform } from '../types';
import { clusterSpots, findHitTarget, getScoreColor } from './clustering';

// Mock projection: simple linear mapping
const mockProjection: ProjectionResult = {
  project: ([lon, lat]) => ({
    x: (lon + 5) * 50,
    y: (50 - lat) * 50,
  }),
  unproject: ({ x, y }) => [x / 50 - 5, 50 - y / 50],
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  renderWidth: 800,
  renderHeight: 600,
};

const defaultViewport: ViewportTransform = {
  zoom: 1,
  panX: 0,
  panY: 0,
};

const createMockSpot = (
  id: string,
  name: string,
  lon: number,
  lat: number,
  score?: number
): Spot => ({
  id,
  name,
  longitude: lon,
  latitude: lat,
  current_forecast:
    score !== undefined
      ? {
          score,
          wave_height: 1.5,
          wave_period: 10,
          wave_direction: 270,
          swell_wave_height: 1.5,
          swell_wave_period: 10,
          swell_wave_direction: 270,
          wind_speed: 12,
          wind_gusts: 18,
          wind_direction: 90,
          last_updated_at: '2026-10-12T12:00:00Z',
        }
      : null,
});

describe('clustering utils', () => {
  describe('clusterSpots', () => {
    it('returns empty clusters and markers when spot list is empty', () => {
      const result = clusterSpots(
        [],
        mockProjection,
        defaultViewport,
        800,
        600
      );
      expect(result.clusters).toEqual([]);
      expect(result.markers).toEqual([]);
    });

    it('returns a single marker and no clusters for 1 spot', () => {
      const spot = createMockSpot('1', 'Hossegor', -1.4, 43.6, 8.5);
      const result = clusterSpots(
        [spot],
        mockProjection,
        defaultViewport,
        800,
        600
      );

      expect(result.clusters).toHaveLength(0);
      expect(result.markers).toHaveLength(1);
      expect(result.markers[0].spot.id).toBe('1');
    });

    it('keeps spots as separate markers when they are far apart', () => {
      // Hossegor vs Brest: far apart on screen (> 50px)
      const spot1 = createMockSpot('1', 'Hossegor', -1.4, 43.6, 8.0);
      const spot2 = createMockSpot('2', 'Brest', -4.5, 48.3, 6.0);

      const result = clusterSpots(
        [spot1, spot2],
        mockProjection,
        defaultViewport,
        800,
        600
      );

      expect(result.clusters).toHaveLength(0);
      expect(result.markers).toHaveLength(2);
    });

    it('aggregates nearby spots into a single cluster', () => {
      // Hossegor and Capbreton are very close geographically (~0.02 deg apart -> ~1-2px)
      const spot1 = createMockSpot('1', 'Hossegor', -1.43, 43.66, 8.0);
      const spot2 = createMockSpot('2', 'Capbreton', -1.44, 43.64, 7.0);

      const result = clusterSpots(
        [spot1, spot2],
        mockProjection,
        defaultViewport,
        800,
        600,
        50
      );

      expect(result.markers).toHaveLength(0);
      expect(result.clusters).toHaveLength(1);
      expect(result.clusters[0].count).toBe(2);
      expect(result.clusters[0].averageScore).toBe(7.5);
      expect(result.clusters[0].spots).toHaveLength(2);
    });

    it('dissolves clusters into individual markers when zooming in', () => {
      // Spots that are ~30px apart at zoom=1 (so clustered with radius=50)
      // At zoom=3, they will be ~90px apart, so separated!
      // (lon diff 0.6 -> (0.6)*50 = 30px at base scale)
      const spot1 = createMockSpot('1', 'Spot A', 0.0, 45.0, 8.0);
      const spot2 = createMockSpot('2', 'Spot B', 0.6, 45.0, 6.0);

      const atLowZoom = clusterSpots(
        [spot1, spot2],
        mockProjection,
        { zoom: 1, panX: 0, panY: 0 },
        800,
        600,
        50
      );
      expect(atLowZoom.clusters).toHaveLength(1);
      expect(atLowZoom.markers).toHaveLength(0);

      const atHighZoom = clusterSpots(
        [spot1, spot2],
        mockProjection,
        { zoom: 3, panX: 0, panY: 0 },
        800,
        600,
        50
      );
      expect(atHighZoom.clusters).toHaveLength(0);
      expect(atHighZoom.markers).toHaveLength(2);
    });

    it('computes average score correctly when some spots have missing scores', () => {
      const spot1 = createMockSpot('1', 'Spot A', -1.43, 43.66, 9.0);
      const spot2 = createMockSpot('2', 'Spot B', -1.44, 43.64, undefined);
      const spot3 = createMockSpot('3', 'Spot C', -1.45, 43.65, 5.0);

      const result = clusterSpots(
        [spot1, spot2, spot3],
        mockProjection,
        defaultViewport,
        800,
        600,
        50
      );

      expect(result.clusters).toHaveLength(1);
      expect(result.clusters[0].count).toBe(3);
      // Average of 9.0 and 5.0 is 7.0
      expect(result.clusters[0].averageScore).toBe(7.0);
    });

    it('returns undefined averageScore when none of the clustered spots have scores', () => {
      const spot1 = createMockSpot('1', 'Spot A', -1.43, 43.66, undefined);
      const spot2 = createMockSpot('2', 'Spot B', -1.44, 43.64, undefined);

      const result = clusterSpots(
        [spot1, spot2],
        mockProjection,
        defaultViewport,
        800,
        600,
        50
      );

      expect(result.clusters).toHaveLength(1);
      expect(result.clusters[0].averageScore).toBeUndefined();
    });
  });

  describe('getScoreColor', () => {
    it('returns green for scores >= 7.5', () => {
      expect(getScoreColor(7.5)).toBe('#10B981');
      expect(getScoreColor(9.2)).toBe('#10B981');
    });

    it('returns amber for scores between 5.0 and 7.4', () => {
      expect(getScoreColor(5.0)).toBe('#F59E0B');
      expect(getScoreColor(7.4)).toBe('#F59E0B');
    });

    it('returns red for scores < 5.0', () => {
      expect(getScoreColor(4.9)).toBe('#EF4444');
      expect(getScoreColor(1.0)).toBe('#EF4444');
    });

    it('returns slate for undefined or null score', () => {
      expect(getScoreColor(undefined)).toBe('#94A3B8');
    });
  });

  describe('findHitTarget', () => {
    it('returns hit target for a spot marker within hit radius', () => {
      const spot = createMockSpot('1', 'Hossegor', -1.4, 43.6, 8.0);
      const markers = [{ id: '1', spot, screenX: 200, screenY: 300 }];
      const clusters: never[] = [];

      // Pointer at (205, 305) -> distance = sqrt(25 + 25) = ~7.07px <= 14px
      const target = findHitTarget({ x: 205, y: 305 }, clusters, markers);

      expect(target).not.toBeNull();
      expect(target?.type).toBe('spot');
      if (target?.type === 'spot') {
        expect(target.spot.id).toBe('1');
      }
    });

    it('returns hit target for a cluster within hit radius', () => {
      const spot1 = createMockSpot('1', 'Spot A', -1.4, 43.6, 8.0);
      const spot2 = createMockSpot('2', 'Spot B', -1.41, 43.61, 7.0);
      const cluster = {
        id: 'c1',
        screenX: 400,
        screenY: 250,
        count: 2,
        spots: [spot1, spot2],
        averageScore: 7.5,
      };

      // Pointer at (410, 255) -> distance = sqrt(100 + 25) = 11.18px <= 18px
      const target = findHitTarget({ x: 410, y: 255 }, [cluster], []);

      expect(target).not.toBeNull();
      expect(target?.type).toBe('cluster');
      if (target?.type === 'cluster') {
        expect(target.cluster.id).toBe('c1');
        expect(target.cluster.count).toBe(2);
      }
    });

    it('returns null when pointer is outside all targets', () => {
      const spot = createMockSpot('1', 'Hossegor', -1.4, 43.6, 8.0);
      const markers = [{ id: '1', spot, screenX: 200, screenY: 300 }];

      // Pointer far away at (250, 300) -> distance = 50px > 14px
      const target = findHitTarget({ x: 250, y: 300 }, [], markers);

      expect(target).toBeNull();
    });
  });
});
