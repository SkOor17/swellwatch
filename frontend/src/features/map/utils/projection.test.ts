import { describe, expect, it } from 'vitest';
import { FRANCE_BOUNDING_BOX, MAX_ZOOM, MIN_ZOOM } from '../constants';
import type {
  GeoPoint,
  MultiPolygonCoordinates,
  ViewportTransform,
} from '../types';
import {
  clampViewport,
  createCoastlinePath2D,
  createProjection,
  projectedToScreen,
  screenToProjected,
  zoomAtPoint,
} from './projection';

describe('projection utilities', () => {
  describe('createProjection', () => {
    it('projects the bounding box corners accurately', () => {
      const width = 800;
      const height = 800;
      const padding = 20;

      const proj = createProjection({
        width,
        height,
        padding,
        bbox: FRANCE_BOUNDING_BOX,
      });

      // Top-left geographic point (lonMin, latMax)
      const topLeft = proj.project([
        FRANCE_BOUNDING_BOX.lonMin,
        FRANCE_BOUNDING_BOX.latMax,
      ]);
      expect(topLeft.x).toBeCloseTo(proj.offsetX, 2);
      expect(topLeft.y).toBeCloseTo(proj.offsetY, 2);

      // Bottom-right geographic point (lonMax, latMin)
      const bottomRight = proj.project([
        FRANCE_BOUNDING_BOX.lonMax,
        FRANCE_BOUNDING_BOX.latMin,
      ]);
      expect(bottomRight.x).toBeCloseTo(proj.offsetX + proj.renderWidth, 2);
      expect(bottomRight.y).toBeCloseTo(proj.offsetY + proj.renderHeight, 2);
    });

    it('centers the geographic bounding box within the canvas', () => {
      const width = 1000;
      const height = 600;

      const proj = createProjection({
        width,
        height,
        padding: 10,
        bbox: FRANCE_BOUNDING_BOX,
      });

      const centerLon =
        (FRANCE_BOUNDING_BOX.lonMin + FRANCE_BOUNDING_BOX.lonMax) / 2;
      const centerLat =
        (FRANCE_BOUNDING_BOX.latMin + FRANCE_BOUNDING_BOX.latMax) / 2;

      const centerScreen = proj.project([centerLon, centerLat]);

      expect(centerScreen.x).toBeCloseTo(width / 2, 2);
      expect(centerScreen.y).toBeCloseTo(height / 2, 2);
    });

    it('preserves aspect ratio with letterboxing when canvas is wide', () => {
      const width = 1400;
      const height = 600;
      const padding = 20;

      const proj = createProjection({
        width,
        height,
        padding,
        bbox: FRANCE_BOUNDING_BOX,
      });

      // Height should be the constraining dimension
      expect(proj.renderHeight).toBeCloseTo(height - 2 * padding, 2);
      expect(proj.offsetY).toBeCloseTo(padding, 2);
      // Width should have extra letterbox padding
      expect(proj.offsetX).toBeGreaterThan(padding);
      expect(proj.renderWidth).toBeLessThan(width - 2 * padding);
    });

    it('preserves aspect ratio with letterboxing when canvas is tall', () => {
      const width = 600;
      const height = 1200;
      const padding = 20;

      const proj = createProjection({
        width,
        height,
        padding,
        bbox: FRANCE_BOUNDING_BOX,
      });

      // Width should be the constraining dimension
      expect(proj.renderWidth).toBeCloseTo(width - 2 * padding, 2);
      expect(proj.offsetX).toBeCloseTo(padding, 2);
      // Height should have extra letterbox padding
      expect(proj.offsetY).toBeGreaterThan(padding);
      expect(proj.renderHeight).toBeLessThan(height - 2 * padding);
    });

    it('accurately inverts projected coordinates back to geographic coordinates', () => {
      const proj = createProjection({
        width: 800,
        height: 600,
        padding: 30,
        bbox: FRANCE_BOUNDING_BOX,
      });

      const testPoints: GeoPoint[] = [
        [-1.5, 43.5], // Biarritz
        [-4.5, 48.4], // Brest
        [2.3, 48.8], // Paris
        [9.1, 41.9], // Corsica (Ajaccio)
        [7.7, 48.6], // Strasbourg
      ];

      testPoints.forEach((point) => {
        const screen = proj.project(point);
        const inverted = proj.unproject(screen);

        expect(inverted[0]).toBeCloseTo(point[0], 4);
        expect(inverted[1]).toBeCloseTo(point[1], 4);
      });
    });

    it('handles zero or negative dimensions safely without NaN', () => {
      const proj = createProjection({
        width: 0,
        height: 0,
        padding: 10,
        bbox: FRANCE_BOUNDING_BOX,
      });

      const pt = proj.project([0, 45]);
      expect(Number.isFinite(pt.x)).toBe(true);
      expect(Number.isFinite(pt.y)).toBe(true);

      const inv = proj.unproject({ x: 0, y: 0 });
      expect(Number.isFinite(inv[0])).toBe(true);
      expect(Number.isFinite(inv[1])).toBe(true);
    });
  });

  describe('createCoastlinePath2D', () => {
    it('creates a valid Path2D instance from multi-polygon coordinates', () => {
      const proj = createProjection({
        width: 500,
        height: 500,
        padding: 10,
        bbox: FRANCE_BOUNDING_BOX,
      });

      const dummyMultiPolygon: MultiPolygonCoordinates = [
        [
          [
            [-1, 44],
            [-1, 46],
            [1, 46],
            [1, 44],
            [-1, 44],
          ],
        ],
      ];

      const path = createCoastlinePath2D(dummyMultiPolygon, proj.project);
      expect(path).toBeInstanceOf(Path2D);
    });
  });

  describe('viewport pan & zoom utilities', () => {
    const width = 800;
    const height = 600;

    it('clamps zoom between MIN_ZOOM and MAX_ZOOM', () => {
      const tooLow = clampViewport(
        { zoom: 0.5, panX: 0, panY: 0 },
        width,
        height
      );
      expect(tooLow.zoom).toBe(MIN_ZOOM);

      const tooHigh = clampViewport(
        { zoom: 15.0, panX: 0, panY: 0 },
        width,
        height
      );
      expect(tooHigh.zoom).toBe(MAX_ZOOM);
    });

    it('resets pan to (0, 0) at zoom 1.0', () => {
      const clamped = clampViewport(
        { zoom: 1.0, panX: 100, panY: -80 },
        width,
        height
      );
      expect(clamped.panX).toBe(0);
      expect(clamped.panY).toBe(0);
    });

    it('clamps pan within reasonable bounds at higher zoom levels', () => {
      const clamped = clampViewport(
        { zoom: 2.0, panX: 5000, panY: -5000 },
        width,
        height
      );
      expect(clamped.panX).toBeLessThan(5000);
      expect(clamped.panY).toBeGreaterThan(-5000);
    });

    it('inverts between screen and projected space correctly', () => {
      const viewport: ViewportTransform = {
        zoom: 2.5,
        panX: 40,
        panY: -30,
      };

      const originalProjected = { x: 350, y: 280 };
      const screenPt = projectedToScreen(
        originalProjected,
        viewport,
        width,
        height
      );
      const backProjected = screenToProjected(
        screenPt,
        viewport,
        width,
        height
      );

      expect(backProjected.x).toBeCloseTo(originalProjected.x, 3);
      expect(backProjected.y).toBeCloseTo(originalProjected.y, 3);
    });

    it('zooms in centered at a specific pointer coordinate without shifting that point', () => {
      const initialViewport: ViewportTransform = {
        zoom: 1.0,
        panX: 0,
        panY: 0,
      };

      const pointer = { x: 250, y: 180 };
      // Projected coordinate at cursor before zoom
      const projectedBefore = screenToProjected(
        pointer,
        initialViewport,
        width,
        height
      );

      // Zoom by 2.0 at pointer
      const newViewport = zoomAtPoint(
        initialViewport,
        2.0,
        pointer,
        width,
        height
      );
      expect(newViewport.zoom).toBe(2.0);

      // Projected coordinate at cursor after zoom should be identical
      const projectedAfter = screenToProjected(
        pointer,
        newViewport,
        width,
        height
      );
      expect(projectedAfter.x).toBeCloseTo(projectedBefore.x, 3);
      expect(projectedAfter.y).toBeCloseTo(projectedBefore.y, 3);
    });
  });
});
