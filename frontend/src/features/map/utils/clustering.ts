import type { Spot } from '../../spots/types';
import {
  CLUSTER_HIT_RADIUS,
  CLUSTER_RADIUS_PX,
  SCORE_COLORS,
  SPOT_HIT_RADIUS,
} from '../constants';
import type {
  ClusteringResult,
  HitTarget,
  MapCluster,
  MapSpotMarker,
  ProjectionResult,
  ScreenPoint,
  ViewportTransform,
} from '../types';

interface PositionedSpot {
  spot: Spot;
  screenX: number;
  screenY: number;
}

interface ClusterAccumulator {
  id: string;
  spots: Spot[];
  screenX: number;
  screenY: number;
}

/**
 * Calculates distance between two points in 2D space.
 */
function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Transforms spot geographic coordinates into current canvas screen coordinates.
 */
function getScreenCoordinates(
  spot: Spot,
  projection: ProjectionResult,
  viewport: ViewportTransform,
  width: number,
  height: number
): PositionedSpot {
  const base = projection.project([spot.longitude, spot.latitude]);
  const screenX =
    (base.x - width / 2) * viewport.zoom + width / 2 + viewport.panX;
  const screenY =
    (base.y - height / 2) * viewport.zoom + height / 2 + viewport.panY;

  return { spot, screenX, screenY };
}

/**
 * Computes average score for a collection of spots.
 */
function calculateAverageScore(spots: Spot[]): number | undefined {
  const validScores = spots
    .map((spot) => spot.current_forecast?.score)
    .filter((score): score is number => typeof score === 'number');

  if (validScores.length === 0) {
    return undefined;
  }

  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return Math.round((sum / validScores.length) * 10) / 10;
}

/**
 * Returns hex color code associated with a given surf score.
 */
export function getScoreColor(score?: number): string {
  if (score === undefined || score === null) {
    return SCORE_COLORS.unrated;
  }
  if (score >= 7.5) {
    return SCORE_COLORS.excellent;
  }
  if (score >= 5.0) {
    return SCORE_COLORS.medium;
  }
  return SCORE_COLORS.poor;
}

/**
 * Aggregates spots dynamically based on screen pixel distance into clusters and single markers.
 */
export function clusterSpots(
  spots: Spot[],
  projection: ProjectionResult,
  viewport: ViewportTransform,
  width: number,
  height: number,
  clusterRadiusPx = CLUSTER_RADIUS_PX
): ClusteringResult {
  if (spots.length === 0) {
    return { clusters: [], markers: [] };
  }

  const positionedSpots = spots.map((spot) =>
    getScreenCoordinates(spot, projection, viewport, width, height)
  );

  const clusterGroups: ClusterAccumulator[] = [];

  positionedSpots.forEach((item) => {
    const matchingCluster = clusterGroups.find(
      (group) =>
        getDistance(item.screenX, item.screenY, group.screenX, group.screenY) <=
        clusterRadiusPx
    );

    if (matchingCluster) {
      const newCount = matchingCluster.spots.length + 1;
      matchingCluster.screenX =
        (matchingCluster.screenX * matchingCluster.spots.length +
          item.screenX) /
        newCount;
      matchingCluster.screenY =
        (matchingCluster.screenY * matchingCluster.spots.length +
          item.screenY) /
        newCount;
      matchingCluster.spots.push(item.spot);
    } else {
      clusterGroups.push({
        id: `cluster-${item.spot.id}`,
        spots: [item.spot],
        screenX: item.screenX,
        screenY: item.screenY,
      });
    }
  });

  const clusters: MapCluster[] = [];
  const markers: MapSpotMarker[] = [];

  clusterGroups.forEach((group) => {
    if (group.spots.length === 1) {
      const singleSpot = group.spots[0];
      markers.push({
        id: singleSpot.id,
        spot: singleSpot,
        screenX: group.screenX,
        screenY: group.screenY,
      });
    } else {
      clusters.push({
        id: group.id,
        count: group.spots.length,
        spots: group.spots,
        screenX: group.screenX,
        screenY: group.screenY,
        averageScore: calculateAverageScore(group.spots),
      });
    }
  });

  return { clusters, markers };
}

/**
 * Detects whether a pointer coordinate collides with a cluster or spot marker.
 */
export function findHitTarget(
  pointer: ScreenPoint,
  clusters: MapCluster[],
  markers: MapSpotMarker[],
  spotHitRadius = SPOT_HIT_RADIUS,
  clusterHitRadius = CLUSTER_HIT_RADIUS
): HitTarget | null {
  // Check clusters first
  const clusterMatches = clusters
    .map((cluster) => ({
      cluster,
      distance: getDistance(
        pointer.x,
        pointer.y,
        cluster.screenX,
        cluster.screenY
      ),
    }))
    .filter((item) => item.distance <= clusterHitRadius)
    .sort((a, b) => a.distance - b.distance);

  if (clusterMatches.length > 0) {
    return { type: 'cluster', cluster: clusterMatches[0].cluster };
  }

  // Check individual markers
  const markerMatches = markers
    .map((marker) => ({
      marker,
      distance: getDistance(
        pointer.x,
        pointer.y,
        marker.screenX,
        marker.screenY
      ),
    }))
    .filter((item) => item.distance <= spotHitRadius)
    .sort((a, b) => a.distance - b.distance);

  if (markerMatches.length > 0) {
    const closest = markerMatches[0].marker;
    return { type: 'spot', spot: closest.spot, marker: closest };
  }

  return null;
}
