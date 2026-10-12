import { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_MAP_PADDING,
  DEFAULT_VIEWPORT,
  MAP_COLORS,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEP,
} from '../constants';
import { FRANCE_COASTLINE } from '../data/franceCoastline';
import type { MapColors, ProjectionResult, ViewportTransform } from '../types';
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
}

export function CoastalMap({
  className = '',
  padding = DEFAULT_MAP_PADDING,
  colors,
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

  const isDraggingRef = useRef<boolean>(false);
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

      // Re-clamp viewport against new canvas dimensions
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

      // Ocean seabed background
      ctx.fillStyle = resolvedColors.ocean;
      ctx.fillRect(0, 0, width, height);

      // Apply viewport pan and zoom matrix
      ctx.save();
      ctx.translate(width / 2 + vp.panX, height / 2 + vp.panY);
      ctx.scale(vp.zoom, vp.zoom);
      ctx.translate(-width / 2, -height / 2);

      // Vector landmass & coastline
      const path = path2dRef.current;
      if (path) {
        ctx.fillStyle = resolvedColors.landmass;
        ctx.fill(path);

        ctx.strokeStyle = resolvedColors.coastline;
        // Keep coastal stroke width visually crisp at all zoom levels
        ctx.lineWidth = 1.5 / vp.zoom;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke(path);
      }

      ctx.restore();
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

    // Non-passive wheel event listener to enable e.preventDefault()
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const pointer = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

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

  // Pointer drag interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    if (canvas.setPointerCapture) {
      canvas.setPointerCapture(e.pointerId);
    }
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPanX: viewportRef.current.panX,
      initialPanY: viewportRef.current.panY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) {
      return;
    }
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

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
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    if (canvas.releasePointerCapture) {
      canvas.releasePointerCapture(e.pointerId);
    }
    isDraggingRef.current = false;
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const pointer = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
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
