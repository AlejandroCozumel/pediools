// hooks/useSearchPatients.ts
import { useQuery } from '@tanstack/react-query';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
}

async function searchPatients(search: string): Promise<Patient[]> {
  if (!search || search.length < 1) return [];

  try {
    const response = await fetch('/api/dashboard/patients/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search })
    });

    if (!response.ok) {
      console.error('Search failed');
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Search error', error);
    return [];
  }
}

export function useSearchPatients(search: string) {
  const query = useQuery<Patient[]>({
    queryKey: ['patients', 'search', search],
    queryFn: () => searchPatients(search),
    enabled: search.length >= 1,
    staleTime: 1000 * 60,
    placeholderData: [],
  });

  return {
    ...query,
    isLoading: query.isLoading || query.isFetching
  };
}