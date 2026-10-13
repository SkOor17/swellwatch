import { Waves, Wind } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useSpotForecast } from '../api/useSpotForecast';
import type { Spot } from '../types';
import { getLevelInfo, getScoreBadgeClass } from '../utils/scoring';
import { formatShortTime } from '../utils/time';
import { DirectionIndicator } from './DirectionIndicator';
import { HourlyForecastTable } from './HourlyForecastTable';

export interface SpotForecastDrawerProps {
  spot: Spot | null;
  open: boolean;
  onClose: () => void;
}

export function SpotForecastDrawer({
  spot,
  open,
  onClose,
}: SpotForecastDrawerProps) {
  const {
    data: forecast,
    isLoading,
    isError,
  } = useSpotForecast(spot?.id ?? null);

  if (!spot) {
    return null;
  }

  const liveConditions = spot.current_forecast;
  const levelInfo = liveConditions ? getLevelInfo(liveConditions.level) : null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg md:max-w-xl bg-slate-900 border-l border-slate-800 text-slate-100 p-6 space-y-6"
      >
        <SheetHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <SheetTitle className="text-2xl font-bold text-white">
              {spot.name}
            </SheetTitle>
            {liveConditions ? (
              <Badge variant="success">En direct</Badge>
            ) : (
              <Badge variant="secondary">Indisponible</Badge>
            )}
          </div>
          <SheetDescription className="text-slate-400">
            Coordonnées : {spot.latitude.toFixed(3)}° N,{' '}
            {Math.abs(spot.longitude).toFixed(3)}° O
            {spot.seabed_type && ` • Fond : ${spot.seabed_type}`}
          </SheetDescription>
        </SheetHeader>

        {/* Live Score & Skill Level banner */}
        {liveConditions && levelInfo && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-800/80 p-3.5 border border-slate-700/60 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">
                Score de qualité :
              </span>
              {liveConditions.score !== undefined ? (
                <span
                  className={`inline-flex items-center justify-center font-bold text-xs px-2.5 py-0.5 rounded-md border ${getScoreBadgeClass(
                    liveConditions.score
                  )}`}
                >
                  {liveConditions.score}/10
                </span>
              ) : (
                <span className="text-xs text-slate-400">N/A</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">
                Niveau :
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${levelInfo.badgeClass}`}
              >
                {levelInfo.label}
              </span>
            </div>
          </div>
        )}

        {/* Live Swell & Wind Cards */}
        {liveConditions && (
          <div className="grid grid-cols-2 gap-3">
            {/* Marine / Swell Block */}
            <div className="rounded-xl bg-sky-950/40 p-3.5 border border-sky-800/50">
              <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-xs mb-1.5">
                <Waves className="h-4 w-4" />
                <span>Houle</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-white">
                  {liveConditions.wave_height}m
                </span>
                <span className="text-xs text-sky-300 font-medium">
                  {liveConditions.wave_period}s
                </span>
              </div>
              <div className="mt-2.5">
                <DirectionIndicator
                  degrees={
                    liveConditions.swell_wave_direction ||
                    liveConditions.wave_direction
                  }
                />
              </div>
            </div>

            {/* Wind Block */}
            <div className="rounded-xl bg-slate-800/40 p-3.5 border border-slate-700/50">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs mb-1.5">
                <Wind className="h-4 w-4 text-slate-400" />
                <span>Vent</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-white">
                  {liveConditions.wind_speed} kn
                </span>
                <span className="text-xs text-amber-400 font-medium">
                  (raf. {liveConditions.wind_gusts} kn)
                </span>
              </div>
              <div className="mt-2.5">
                <DirectionIndicator degrees={liveConditions.wind_direction} />
              </div>
            </div>
          </div>
        )}

        {/* Forecast Timeline / Loading / Error */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Chronologie horaire (24h)
            </h3>
            {liveConditions?.last_updated_at && (
              <span className="text-[11px] text-slate-400">
                Mis à jour à {formatShortTime(liveConditions.last_updated_at)}
              </span>
            )}
          </div>

          {isLoading && (
            <div
              className="space-y-3 py-2"
              data-testid="forecast-loading-skeleton"
            >
              <Skeleton className="h-8 w-full bg-slate-800" />
              <Skeleton className="h-12 w-full bg-slate-800" />
              <Skeleton className="h-12 w-full bg-slate-800" />
            </div>
          )}

          {isError && (
            <div className="rounded-lg bg-red-950/40 p-4 text-sm text-red-400 border border-red-800/60">
              Impossible de charger les prévisions détaillées pour le moment.
            </div>
          )}

          {forecast && (
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/50">
              <HourlyForecastTable hourly={forecast.hourly} />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
