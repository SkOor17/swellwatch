import { useSpots } from '../api/useSpots';

export function SpotList() {
  const { data: spots, isLoading, isError, error } = useSpots();

  if (isLoading) {
    return <div className="p-4">Chargement des spots...</div>;
  }

  if (isError) {
    return <div className="p-4 text-red-500">Erreur: {error?.message}</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {spots?.map((spot) => (
        <div
          key={spot.id}
          className="bg-white p-6 rounded-lg shadow-sm border border-slate-200"
        >
          <h3 className="font-bold text-lg mb-2">{spot.name}</h3>
          <p className="text-sm text-slate-500">
            Lat: {spot.latitude} <br />
            Lon: {spot.longitude}
          </p>
        </div>
      ))}
    </div>
  );
}
