import { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Spot } from '../../spots/types';
import {
  DEFAULT_MAP_PADDING,
  DEFAULT_VIEWPORT,
  LABEL_MIN_ZOOM,
  MAP_COLORS,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEP,
} from '../constants';
import { FRANCE_COASTLINE } from '../data/franceCoastline';
import type {
  HitTarget,
  MapCluster,
  MapColors,
  MapSpotMarker,
  ProjectionResult,
  ScreenPoint,
  ViewportTransform,
} from '../types';
import {
  clusterSpots,
  findHitTarget,
  getScoreColor,
} from '../utils/clustering';
import {
  clampViewport,
  createCoastlinePath2D,
  createProjection,
  zoomAtPoint,
} from '../utils/projection';

export interface CoastalMapProps {
  className?: string;
  padding?: number;
  colors?: Partial<MapColors>;
  spots?: Spot[];
  onSelectSpot?: (spot: Spot) => void;
}

/**
 * Extracts pointer coordinates relative to the canvas bounding box.
 */
function getCanvasPointer(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): ScreenPoint {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

/**
 * Draws spot summary clusters on the 2D canvas.
 */
function renderClusters(ctx: CanvasRenderingContext2D, clusters: MapCluster[]) {
  clusters.forEach((cluster) => {
    const color = getScoreColor(cluster.averageScore);
    const radius = Math.min(15 + Math.floor(cluster.count / 2), 22);

    ctx.beginPath();
    ctx.arc(cluster.screenX, cluster.screenY, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${cluster.count}`, cluster.screenX, cluster.screenY);
  });
}

/**
 * Draws text label for an individual spot.
 */
function renderMarkerLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number
) {
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  const textWidth = ctx.measureText ? ctx.measureText(text).width : 40;
  const labelX = x + 11;
  const labelY = y - 10;
  const paddingX = 6;
  const labelHeight = 18;

  ctx.save();
  ctx.fillStyle = 'rgba(11, 19, 43, 0.9)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(labelX, labelY, textWidth + paddingX * 2, labelHeight, 4);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(labelX, labelY, textWidth + paddingX * 2, labelHeight);
    ctx.strokeRect(labelX, labelY, textWidth + paddingX * 2, labelHeight);
  }

  ctx.fillStyle = '#F8FAFC';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, labelX + paddingX, labelY + labelHeight / 2);
  ctx.restore();
}

/**
 * Draws individual spot markers with pulsing animation and score colors.
 */
function renderSpotMarkers(
  ctx: CanvasRenderingContext2D,
  markers: MapSpotMarker[],
  hoveredTarget: HitTarget | null,
  zoom: number,
  now: number
) {
  const pulseProgress = (now % 1500) / 1500;
  const pulseRadius = 7 + pulseProgress * 9;
  const pulseAlpha = (1 - pulseProgress) * 0.45;

  markers.forEach((marker) => {
    const score = marker.spot.current_forecast?.score;
    const color = getScoreColor(score);
    const isHovered =
      hoveredTarget?.type === 'spot' &&
      hoveredTarget.spot.id === marker.spot.id;

    // Pulsing halo
    ctx.save();
    ctx.beginPath();
    ctx.arc(marker.screenX, marker.screenY, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = pulseAlpha;
    ctx.fill();
    ctx.restore();

    // Center disc
    ctx.beginPath();
    ctx.arc(
      marker.screenX,
      marker.screenY,
      isHovered ? 8.5 : 7,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Label on hover or high zoom
    if (isHovered || zoom >= LABEL_MIN_ZOOM) {
      renderMarkerLabel(ctx, marker.spot.name, marker.screenX, marker.screenY);
    }
  });
}

export function CoastalMap({
  className = '',
  padding = DEFAULT_MAP_PADDING,
  colors,
  spots = [],
  onSelectSpot,
}: CoastalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const path2dRef = useRef<Path2D | null>(null);
  const projectionRef = useRef<ProjectionResult | null>(null);

  const [viewport, setViewport] = useState<ViewportTransform>(DEFAULT_VIEWPORT);
  const viewportRef = useRef<ViewportTransform>(DEFAULT_VIEWPORT);

  const dimensionsRef = useRef<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  const spotsRef = useRef<Spot[]>(spots);
  useEffect(() => {
    spotsRef.current = spots;
  }, [spots]);

  const onSelectSpotRef = useRef(onSelectSpot);
  useEffect(() => {
    onSelectSpotRef.current = onSelectSpot;
  }, [onSelectSpot]);

  const currentClustersRef = useRef<MapCluster[]>([]);
  const currentMarkersRef = useRef<MapSpotMarker[]>([]);
  const hoveredTargetRef = useRef<HitTarget | null>(null);

  const isDraggingRef = useRef<boolean>(false);
  const dragDistanceRef = useRef<number>(0);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    initialPanX: number;
    initialPanY: number;
  }>({
    x: 0,
    y: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  const resolvedColors: MapColors = {
    ocean: colors?.ocean ?? MAP_COLORS.ocean,
    landmass: colors?.landmass ?? MAP_COLORS.landmass,
    coastline: colors?.coastline ?? MAP_COLORS.coastline,
  };

  const updateViewport = useCallback((newVp: ViewportTransform) => {
    viewportRef.current = newVp;
    setViewport(newVp);
  }, []);

  // Zoom button actions
  const handleZoomIn = () => {
    const { width, height } = dimensionsRef.current;
    const center = { x: width / 2, y: height / 2 };
    const next = zoomAtPoint(
      viewportRef.current,
      ZOOM_STEP,
      center,
      width,
      height
    );
    updateViewport(next);
  };

  const handleZoomOut = () => {
    const { width, height } = dimensionsRef.current;
    const center = { x: width / 2, y: height / 2 };
    const next = zoomAtPoint(
      viewportRef.current,
      1 / ZOOM_STEP,
      center,
      width,
      height
    );
    updateViewport(next);
  };

  const handleRecenter = () => {
    updateViewport(DEFAULT_VIEWPORT);
  };

  // Canvas resize and render setup
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const initialWidth = container.clientWidth || 800;
    const initialHeight = container.clientHeight || 600;
    dimensionsRef.current = { width: initialWidth, height: initialHeight };

    const updateGeometry = (width: number, height: number) => {
      dimensionsRef.current = { width, height };

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const projection = createProjection({
        width,
        height,
        padding,
      });

      projectionRef.current = projection;
      path2dRef.current = createCoastlinePath2D(
        FRANCE_COASTLINE.geometry.coordinates,
        projection.project
      );

      const clamped = clampViewport(viewportRef.current, width, height);
      viewportRef.current = clamped;
      setViewport(clamped);
    };

    updateGeometry(initialWidth, initialHeight);

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = dimensionsRef.current;
      const vp = viewportRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Ocean seabed background
      ctx.fillStyle = resolvedColors.ocean;
      ctx.fillRect(0, 0, width, height);

      // 2. Vector landmass & coastline
      ctx.save();
      ctx.translate(width / 2 + vp.panX, height / 2 + vp.panY);
      ctx.scale(vp.zoom, vp.zoom);
      ctx.translate(-width / 2, -height / 2);

      const path = path2dRef.current;
      if (path) {
        ctx.fillStyle = resolvedColors.landmass;
        ctx.fill(path);

        ctx.strokeStyle = resolvedColors.coastline;
        ctx.lineWidth = 1.5 / vp.zoom;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke(path);
      }

      ctx.restore();

      // 3. Dynamic Clusters & Markers in screen coordinates
      if (projectionRef.current && spotsRef.current.length > 0) {
        const clustering = clusterSpots(
          spotsRef.current,
          projectionRef.current,
          vp,
          width,
          height
        );
        currentClustersRef.current = clustering.clusters;
        currentMarkersRef.current = clustering.markers;
      } else {
        currentClustersRef.current = [];
        currentMarkersRef.current = [];
      }

      renderClusters(ctx, currentClustersRef.current);
      renderSpotMarkers(
        ctx,
        currentMarkersRef.current,
        hoveredTargetRef.current,
        vp.zoom,
        performance.now()
      );

      ctx.restore();

      rafIdRef.current = requestAnimationFrame(render);
    };

    render();

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const newWidth =
        Math.floor(entry.contentRect.width) || container.clientWidth || 800;
      const newHeight =
        Math.floor(entry.contentRect.height) || container.clientHeight || 600;

      if (
        newWidth !== dimensionsRef.current.width ||
        newHeight !== dimensionsRef.current.height
      ) {
        updateGeometry(newWidth, newHeight);
      }
    });

    resizeObserver.observe(container);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const pointer = getCanvasPointer(canvas, e.clientX, e.clientY);
      const zoomMultiplier = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const next = zoomAtPoint(
        viewportRef.current,
        zoomMultiplier,
        pointer,
        dimensionsRef.current.width,
        dimensionsRef.current.height
      );
      viewportRef.current = next;
      setViewport(next);
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      canvas.removeEventListener('wheel', onWheel);
      resizeObserver.disconnect();
    };
  }, [
    padding,
    resolvedColors.ocean,
    resolvedColors.landmass,
    resolvedColors.coastline,
  ]);

  // Pointer drag and click interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    if (canvas.setPointerCapture) {
      canvas.setPointerCapture(e.pointerId);
    }
    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPanX: viewportRef.current.panX,
      initialPanY: viewportRef.current.panY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragDistanceRef.current = Math.hypot(dx, dy);

      if (dragDistanceRef.current > 3) {
        const next = clampViewport(
          {
            ...viewportRef.current,
            panX: dragStartRef.current.initialPanX + dx,
            panY: dragStartRef.current.initialPanY + dy,
          },
          dimensionsRef.current.width,
          dimensionsRef.current.height
        );
        updateViewport(next);
      }
      return;
    }

    const pointer = getCanvasPointer(canvas, e.clientX, e.clientY);
    const hit = findHitTarget(
      pointer,
      currentClustersRef.current,
      currentMarkersRef.current
    );
    hoveredTargetRef.current = hit;

    if (hit) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = viewportRef.current.zoom > 1.0 ? 'grab' : 'default';
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    if (canvas.releasePointerCapture) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (dragDistanceRef.current <= 5) {
      const pointer = getCanvasPointer(canvas, e.clientX, e.clientY);
      const hit = findHitTarget(
        pointer,
        currentClustersRef.current,
        currentMarkersRef.current
      );

      if (hit) {
        if (hit.type === 'cluster') {
          const next = zoomAtPoint(
            viewportRef.current,
            1.5,
            { x: hit.cluster.screenX, y: hit.cluster.screenY },
            dimensionsRef.current.width,
            dimensionsRef.current.height
          );
          updateViewport(next);
        } else if (hit.type === 'spot') {
          onSelectSpotRef.current?.(hit.spot);
        }
      }
    }

    isDraggingRef.current = false;
    dragDistanceRef.current = 0;
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const pointer = getCanvasPointer(canvas, e.clientX, e.clientY);
    const next = zoomAtPoint(
      viewportRef.current,
      1.5,
      pointer,
      dimensionsRef.current.width,
      dimensionsRef.current.height
    );
    updateViewport(next);
  };

  const zoomPercentage = Math.round(viewport.zoom * 100);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      data-testid="coastal-map-container"
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Carte des côtes françaises et conditions de surf"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className={`block w-full h-full ${viewport.zoom > 1.0 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
      />

      {/* Floating Zoom & Navigation Controls */}
      <nav
        aria-label="Contrôles de la carte"
        className="absolute bottom-5 right-5 flex flex-col items-center gap-1.5 p-1.5 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/60 shadow-xl pointer-events-auto"
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom avant"
          onClick={handleZoomIn}
          disabled={viewport.zoom >= MAX_ZOOM}
          className="h-8 w-8 text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg"
        >
          <Plus className="w-4 h-4" />
        </Button>

        <span className="text-[11px] font-mono text-slate-400 px-1 select-none">
          {zoomPercentage}%
        </span>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom arrière"
          onClick={handleZoomOut}
          disabled={viewport.zoom <= MIN_ZOOM}
          className="h-8 w-8 text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg"
        >
          <Minus className="w-4 h-4" />
        </Button>

        <div className="w-full h-px bg-slate-700/60 my-0.5" />

        <Button
          variant="ghost"
          size="icon"
          aria-label="Recentrer la carte"
          onClick={handleRecenter}
          title="Recentrer sur la France"
          className="h-8 w-8 text-slate-300 hover:text-sky-400 hover:bg-slate-800/80 rounded-lg"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </nav>
    </div>
  );
}
