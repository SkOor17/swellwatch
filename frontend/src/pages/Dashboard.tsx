import { SpotList } from '../features/spots/components/SpotList';

export function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">SwellWatch</h1>
        <p className="text-slate-500">Conditions de surf en temps réel</p>
      </header>

      <main>
        <h2 className="text-xl font-semibold mb-4">Spots disponibles</h2>
        <SpotList />
      </main>
    </div>
  );
}
