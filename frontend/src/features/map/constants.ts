import type { BoundingBox, MapColors, ViewportTransform } from './types';

/**
 * Geographic bounding box encompassing metropolitan France and Corsica.
 * Longitude: [-5.5°, +9.8°]
 * Latitude: [41.2°, 51.2°]
 */
export const FRANCE_BOUNDING_BOX: BoundingBox = {
  lonMin: -5.5,
  lonMax: 9.8,
  latMin: 41.2,
  latMax: 51.2,
};

/**
 * Theme colors for the Canvas 2D engine.
 */
export const MAP_COLORS: MapColors = {
  ocean: '#0B132B',
  landmass: '#1C2541',
  coastline: '#38BDF8',
};

/**
 * Default padding in CSS pixels around the projected landmass.
 */
export const DEFAULT_MAP_PADDING = 20;

/**
 * Minimum and maximum zoom levels.
 */
export const MIN_ZOOM = 1.0;
export const MAX_ZOOM = 8.0;
export const ZOOM_STEP = 1.3;

/**
 * Default initial viewport centered with no zoom.
 */
export const DEFAULT_VIEWPORT: ViewportTransform = {
  zoom: 1.0,
  panX: 0,
  panY: 0,
};

/**
 * Screen space cluster proximity radius in CSS pixels.
 */
export const CLUSTER_RADIUS_PX = 50;

/**
 * Visual radii for markers and clusters.
 */
export const SPOT_MARKER_RADIUS = 7;
export const SPOT_HIT_RADIUS = 14;
export const CLUSTER_HIT_RADIUS = 18;

/**
 * Minimum zoom level at which spot labels are automatically rendered.
 */
export const LABEL_MIN_ZOOM = 3.0;

/**
 * Score color mapping for markers and clusters.
 */
export const SCORE_COLORS = {
  excellent: '#10B981', // >= 7.5
  medium: '#F59E0B', // 5.0 - 7.4
  poor: '#EF4444', // < 5.0
  unrated: '#94A3B8', // undefined / N/A
} as const;
