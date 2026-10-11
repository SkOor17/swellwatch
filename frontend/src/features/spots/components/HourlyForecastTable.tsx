import type { HourlyForecast } from '../types';
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
            <th className="py-2 px-3">Houle</th>
            <th className="py-2 px-3">Période</th>
            <th className="py-2 px-3">Dir. Houle</th>
            <th className="py-2 px-3">Vent</th>
            <th className="py-2 px-3">Rafales</th>
            <th className="py-2 px-3">Dir. Vent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {hourly.map((item, index) => (
            <tr key={`${item.time}-${index}`} className="hover:bg-slate-50/50">
              <td className="py-2 px-3 font-medium text-slate-900">
                {formatHour(item.time)}
              </td>
              <td className="py-2 px-3 text-blue-600 font-medium">
                {item.wave_height}m
              </td>
              <td className="py-2 px-3 text-slate-700">{item.wave_period}s</td>
              <td className="py-2 px-3">
                <DirectionIndicator
                  degrees={item.swell_wave_direction || item.wave_direction}
                />
              </td>
              <td className="py-2 px-3 text-emerald-600 font-medium">
                {item.wind_speed} kn
              </td>
              <td className="py-2 px-3 text-amber-600">{item.wind_gusts} kn</td>
              <td className="py-2 px-3">
                <DirectionIndicator degrees={item.wind_direction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
