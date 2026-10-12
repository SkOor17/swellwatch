import {
  DEFAULT_MAP_PADDING,
  FRANCE_BOUNDING_BOX,
  MAX_ZOOM,
  MIN_ZOOM,
} from '../constants';
import type {
  GeoPoint,
  MultiPolygonCoordinates,
  ProjectionConfig,
  ProjectionResult,
  ScreenPoint,
  ViewportTransform,
} from '../types';

/**
 * Creates a local Mercator projection preserving aspect ratio for a given canvas size.
 */
export function createProjection(config: ProjectionConfig): ProjectionResult {
  const {
    width,
    height,
    padding = DEFAULT_MAP_PADDING,
    bbox = FRANCE_BOUNDING_BOX,
  } = config;

  if (width <= 0 || height <= 0) {
    return {
      project: () => ({ x: 0, y: 0 }),
      unproject: () => [bbox.lonMin, bbox.latMin],
      scale: 0,
      offsetX: 0,
      offsetY: 0,
      renderWidth: 0,
      renderHeight: 0,
    };
  }

  const latMean = (bbox.latMin + bbox.latMax) / 2;
  const latMeanRad = (latMean * Math.PI) / 180;
  const cosLatMean = Math.cos(latMeanRad);

  const geoWidth = (bbox.lonMax - bbox.lonMin) * cosLatMean;
  const geoHeight = bbox.latMax - bbox.latMin;

  const availWidth = Math.max(0, width - 2 * padding);
  const availHeight = Math.max(0, height - 2 * padding);

  const scale = Math.min(
    availWidth / (geoWidth || 1),
    availHeight / (geoHeight || 1)
  );

  const renderWidth = geoWidth * scale;
  const renderHeight = geoHeight * scale;

  const offsetX = (width - renderWidth) / 2;
  const offsetY = (height - renderHeight) / 2;

  const project = (point: GeoPoint): ScreenPoint => {
    const [lon, lat] = point;
    const x = offsetX + (lon - bbox.lonMin) * cosLatMean * scale;
    const y = offsetY + (bbox.latMax - lat) * scale;
    return { x, y };
  };

  const unproject = (screen: ScreenPoint): GeoPoint => {
    if (scale <= 0) {
      return [bbox.lonMin, bbox.latMin];
    }
    const lon = bbox.lonMin + (screen.x - offsetX) / (cosLatMean * scale);
    const lat = bbox.latMax - (screen.y - offsetY) / scale;
    return [lon, lat];
  };

  return {
    project,
    unproject,
    scale,
    offsetX,
    offsetY,
    renderWidth,
    renderHeight,
  };
}

/**
 * Converts GeoJSON MultiPolygon coordinates into a single pre-compiled Path2D object.
 */
export function createCoastlinePath2D(
  coordinates: MultiPolygonCoordinates,
  project: (point: GeoPoint) => ScreenPoint
): Path2D {
  const path = new Path2D();

  coordinates.forEach((polygon) => {
    polygon.forEach((ring) => {
      ring.forEach((coord, idx) => {
        const point = project(coord as GeoPoint);
        if (idx === 0) {
          path.moveTo(point.x, point.y);
        } else {
          path.lineTo(point.x, point.y);
        }
      });
      path.closePath();
    });
  });

  return path;
}

/**
 * Clamps viewport zoom and pan to reasonable bounds.
 */
export function clampViewport(
  viewport: ViewportTransform,
  width: number,
  height: number
): ViewportTransform {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewport.zoom));
  if (zoom <= 1.0) {
    return { zoom: 1.0, panX: 0, panY: 0 };
  }

  const maxPanX = ((zoom - 1) * width) / 2 + 50;
  const maxPanY = ((zoom - 1) * height) / 2 + 50;

  const panX = Math.min(maxPanX, Math.max(-maxPanX, viewport.panX));
  const panY = Math.min(maxPanY, Math.max(-maxPanY, viewport.panY));

  return { zoom, panX, panY };
}

/**
 * Maps an unzoomed projected coordinate to current screen space using viewport transform.
 */
export function projectedToScreen(
  projectedPoint: ScreenPoint,
  viewport: ViewportTransform,
  width: number,
  height: number
): ScreenPoint {
  const x =
    (projectedPoint.x - width / 2) * viewport.zoom + width / 2 + viewport.panX;
  const y =
    (projectedPoint.y - height / 2) * viewport.zoom +
    height / 2 +
    viewport.panY;
  return { x, y };
}

/**
 * Maps a screen coordinate back to unzoomed projected space.
 */
export function screenToProjected(
  screenPoint: ScreenPoint,
  viewport: ViewportTransform,
  width: number,
  height: number
): ScreenPoint {
  const x =
    (screenPoint.x - viewport.panX - width / 2) / viewport.zoom + width / 2;
  const y =
    (screenPoint.y - viewport.panY - height / 2) / viewport.zoom + height / 2;
  return { x, y };
}

/**
 * Calculates updated viewport to zoom by factor k centered on a pointer position.
 */
export function zoomAtPoint(
  currentViewport: ViewportTransform,
  zoomMultiplier: number,
  pointer: ScreenPoint,
  width: number,
  height: number
): ViewportTransform {
  const targetZoom = Math.min(
    MAX_ZOOM,
    Math.max(MIN_ZOOM, currentViewport.zoom * zoomMultiplier)
  );
  const effectiveRatio = targetZoom / currentViewport.zoom;

  const panX =
    pointer.x -
    width / 2 -
    effectiveRatio * (pointer.x - width / 2 - currentViewport.panX);
  const panY =
    pointer.y -
    height / 2 -
    effectiveRatio * (pointer.y - height / 2 - currentViewport.panY);

  return clampViewport(
    {
      zoom: targetZoom,
      panX,
      panY,
    },
    width,
    height
  );
}
