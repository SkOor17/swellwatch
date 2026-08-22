import { useQuery } from '@tanstack/react-query';
import type { Spot } from '../types';

interface SpotsResponse {
  spots: Spot[];
}

export const useSpots = () => {
  return useQuery({
    queryKey: ['spots'],
    queryFn: async (): Promise<Spot[]> => {
      const response = await fetch('/api/v1/spots');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data: SpotsResponse = await response.json();
      return data.spots;
    },
  });
};
