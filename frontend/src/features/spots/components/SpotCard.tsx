import { Waves, Wind } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Spot } from '../types';
import { getLevelInfo, getScoreBadgeClass } from '../utils/scoring';
import { formatShortTime } from '../utils/time';
import { DirectionIndicator } from './DirectionIndicator';

interface SpotCardProps {
  spot: Spot;
  onSelect?: (spot: Spot) => void;
  isSelected?: boolean;
}

export function SpotCard({ spot, onSelect, isSelected }: SpotCardProps) {
  const forecast = spot.current_forecast;
  const levelInfo = forecast ? getLevelInfo(forecast.level) : null;

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-600' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{spot.name}</CardTitle>
            <CardDescription>
              {spot.latitude.toFixed(3)}° N,{' '}
              {Math.abs(spot.longitude).toFixed(3)}° O
            </CardDescription>
          </div>
          {forecast ? (
            <Badge variant="success">En direct</Badge>
          ) : (
            <Badge variant="secondary">Prévisions indisponibles</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {forecast && levelInfo ? (
          <>
            <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2.5 border border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500">
                  Qualité :
                </span>
                {forecast.score !== undefined ? (
                  <span
                    className={`inline-flex items-center justify-center font-bold text-xs px-2 py-0.5 rounded-md border ${getScoreBadgeClass(
                      forecast.score
                    )}`}
                  >
                    {forecast.score}/10
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">N/A</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500">
                  Niveau :
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${levelInfo.badgeClass}`}
                >
                  {levelInfo.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Marine / Swell Block */}
              <div className="rounded-lg bg-blue-50/50 p-3 border border-blue-100">
                <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-xs mb-1.5">
                  <Waves className="h-4 w-4 text-blue-600" />
                  <span>Houle</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-900">
                    {forecast.wave_height}m
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {forecast.wave_period}s
                  </span>
                </div>
                <div className="mt-2">
                  <DirectionIndicator
                    degrees={
                      forecast.swell_wave_direction || forecast.wave_direction
                    }
                  />
                </div>
              </div>

              {/* Wind Block */}
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs mb-1.5">
                  <Wind className="h-4 w-4 text-slate-600" />
                  <span>Vent</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-900">
                    {forecast.wind_speed} kn
                  </span>
                  <span className="text-xs text-amber-600 font-medium">
                    (raf. {forecast.wind_gusts} kn)
                  </span>
                </div>
                <div className="mt-2">
                  <DirectionIndicator degrees={forecast.wind_direction} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-4 text-center text-sm text-slate-400">
            Données météo momentanément indisponibles.
          </div>
        )}

        {forecast?.last_updated_at && (
          <div className="text-[11px] text-slate-400 text-right">
            Mis à jour à {formatShortTime(forecast.last_updated_at)}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          className="w-full text-xs font-semibold"
          onClick={() => onSelect?.(spot)}
        >
          Voir les prévisions du jour
        </Button>
      </CardFooter>
    </Card>
  );
}
