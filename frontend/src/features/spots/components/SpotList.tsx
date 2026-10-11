import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSpots } from '../api/useSpots';
import type { Spot } from '../types';
import { SpotCard } from './SpotCard';
import { SpotForecastModal } from './SpotForecastModal';

export function SpotList() {
  const { data: spots, isLoading, isError, error } = useSpots();
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm"
          >
            <div className="flex justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-24" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-red-600 border border-red-200">
        <h3 className="font-semibold mb-1">Erreur de chargement</h3>
        <p className="text-sm">
          {error?.message || 'Impossible de récupérer les spots.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {spots?.map((spot) => (
          <SpotCard
            key={spot.id}
            spot={spot}
            onSelect={(sp) => setSelectedSpot(sp)}
            isSelected={selectedSpot?.id === spot.id}
          />
        ))}
      </div>

      {selectedSpot && (
        <SpotForecastModal
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
        />
      )}
    </>
  );
}
