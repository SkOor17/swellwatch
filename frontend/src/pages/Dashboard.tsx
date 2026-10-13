import { useState } from 'react';
import { List, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CoastalMap } from '../features/map/components/CoastalMap';
import { useSpots } from '../features/spots/api/useSpots';
import { SpotForecastDrawer } from '../features/spots/components/SpotForecastDrawer';
import { SpotList } from '../features/spots/components/SpotList';
import type { Spot } from '../features/spots/types';

type ViewMode = 'map' | 'list';

export function Dashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const { data: spots } = useSpots();

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            SwellWatch
          </h1>
          <p className="text-sm text-slate-400">
            Conditions de surf côtières en temps réel
          </p>
        </div>

        <nav
          aria-label="Modes de vue"
          className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800"
        >
          <Button
            variant={viewMode === 'map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('map')}
            className={
              viewMode === 'map'
                ? 'bg-sky-600 hover:bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white'
            }
          >
            <MapIcon className="w-4 h-4 mr-1.5" />
            Carte
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={
              viewMode === 'list'
                ? 'bg-sky-600 hover:bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white'
            }
          >
            <List className="w-4 h-4 mr-1.5" />
            Liste
          </Button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col w-full">
        {viewMode === 'map' ? (
          <div className="flex-1 w-full min-h-[500px] h-[calc(100vh-140px)] rounded-xl border border-slate-800 bg-[#0B132B] overflow-hidden shadow-2xl">
            <CoastalMap
              className="w-full h-full"
              spots={spots}
              onSelectSpot={(spot) => setSelectedSpot(spot)}
            />
          </div>
        ) : (
          <div className="w-full">
            <h2 className="text-xl font-semibold mb-4 text-white">
              Spots disponibles
            </h2>
            <SpotList />
          </div>
        )}
      </main>

      <SpotForecastDrawer
        spot={selectedSpot}
        open={Boolean(selectedSpot)}
        onClose={() => setSelectedSpot(null)}
      />
    </div>
  );
}
