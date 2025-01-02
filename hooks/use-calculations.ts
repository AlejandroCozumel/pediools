import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useCalculations() {
  const { data: calculations, isLoading, error } = useQuery({
    queryKey: ['calculations'],
    queryFn: async () => {
      const { data } = await axios.get('/api/dashboard/calculations');
      return data;
    },
  });

  return { calculations, isLoading, error };
}