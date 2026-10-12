export type GeoPoint = [longitude: number, latitude: number];

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface BoundingBox {
  lonMin: number;
  lonMax: number;
  latMin: number;
  latMax: number;
}

export type LinearRing = GeoPoint[];
export type PolygonCoordinates = LinearRing[];
export type MultiPolygonCoordinates = PolygonCoordinates[];

export interface CoastlineGeometry {
  type: 'MultiPolygon';
  coordinates: MultiPolygonCoordinates;
}

export interface CoastlineFeature {
  type: 'Feature';
  geometry: CoastlineGeometry;
  properties?: Record<string, unknown>;
}

export interface ProjectionConfig {
  width: number;
  height: number;
  padding?: number;
  bbox?: BoundingBox;
}

export interface ProjectionResult {
  project: (point: GeoPoint) => ScreenPoint;
  unproject: (point: ScreenPoint) => GeoPoint;
  scale: number;
  offsetX: number;
  offsetY: number;
  renderWidth: number;
  renderHeight: number;
}

export interface MapColors {
  ocean: string;
  landmass: string;
  coastline: string;
}

export interface ViewportTransform {
  zoom: number;
  panX: number;
  panY: number;
}
