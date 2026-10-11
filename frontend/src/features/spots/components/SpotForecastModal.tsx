import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSpotForecast } from '../api/useSpotForecast';
import type { Spot } from '../types';
import { HourlyForecastTable } from './HourlyForecastTable';

interface SpotForecastModalProps {
  spot: Spot | null;
  onClose: () => void;
}

export function SpotForecastModal({ spot, onClose }: SpotForecastModalProps) {
  const {
    data: forecast,
    isLoading,
    isError,
  } = useSpotForecast(spot?.id ?? null);

  if (!spot) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forecast-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="forecast-modal-title"
                className="text-2xl font-bold text-slate-900"
              >
                {spot.name}
              </h2>
              <Badge variant="outline">Prévisions du jour</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Coordonnées : {spot.latitude.toFixed(3)}° N,{' '}
              {Math.abs(spot.longitude).toFixed(3)}° O
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="h-5 w-5 text-slate-500" />
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-3 py-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {isError && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            Impossible de charger les prévisions détaillées pour le moment.
          </div>
        )}

        {forecast && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">
              Chronologie horaire (24h)
            </h3>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <HourlyForecastTable hourly={forecast.hourly} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
