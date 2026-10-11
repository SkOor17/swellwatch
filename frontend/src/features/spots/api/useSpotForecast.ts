import { useQuery } from '@tanstack/react-query';
import type { SpotForecast } from '../types';

export const useSpotForecast = (spotId: string | null) => {
  return useQuery({
    queryKey: ['spotForecast', spotId],
    queryFn: async (): Promise<SpotForecast> => {
      if (!spotId) {
        throw new Error('Spot ID is required');
      }
      const response = await fetch(`/api/v1/spots/${spotId}/forecast`);
      if (!response.ok) {
        throw new Error('Failed to fetch spot forecast');
      }
      const data: SpotForecast = await response.json();
      return data;
    },
    enabled: Boolean(spotId),
  });
};
