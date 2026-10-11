import type { HourlyForecast } from '../types';
import { getLevelInfo, getScoreBadgeClass } from '../utils/scoring';
import { formatHour } from '../utils/time';
import { DirectionIndicator } from './DirectionIndicator';

interface HourlyForecastTableProps {
  hourly: HourlyForecast[];
}

export function HourlyForecastTable({ hourly }: HourlyForecastTableProps) {
  if (!hourly || hourly.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-slate-500">
        Aucune prévision horaire disponible.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
          <tr>
            <th className="py-2 px-3">Heure</th>
            <th className="py-2 px-3">Score</th>
            <th className="py-2 px-3">Niveau</th>
            <th className="py-2 px-3">Houle</th>
            <th className="py-2 px-3">Période</th>
            <th className="py-2 px-3">Dir. Houle</th>
            <th className="py-2 px-3">Vent</th>
            <th className="py-2 px-3">Rafales</th>
            <th className="py-2 px-3">Dir. Vent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {hourly.map((item, index) => {
            const levelInfo = item.level ? getLevelInfo(item.level) : null;
            return (
              <tr
                key={`${item.time}-${index}`}
                className="hover:bg-slate-50/50"
              >
                <td className="py-2 px-3 font-medium text-slate-900">
                  {formatHour(item.time)}
                </td>
                <td className="py-2 px-3">
                  {item.score !== undefined ? (
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold border ${getScoreBadgeClass(
                        item.score
                      )}`}
                    >
                      {item.score}/10
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-2 px-3">
                  {levelInfo ? (
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border ${levelInfo.badgeClass}`}
                    >
                      {levelInfo.label}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-2 px-3 text-blue-600 font-medium">
                  {item.wave_height}m
                </td>
                <td className="py-2 px-3 text-slate-700">
                  {item.wave_period}s
                </td>
                <td className="py-2 px-3">
                  <DirectionIndicator
                    degrees={item.swell_wave_direction || item.wave_direction}
                  />
                </td>
                <td className="py-2 px-3 text-emerald-600 font-medium">
                  {item.wind_speed} kn
                </td>
                <td className="py-2 px-3 text-amber-600">
                  {item.wind_gusts} kn
                </td>
                <td className="py-2 px-3">
                  <DirectionIndicator degrees={item.wind_direction} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
