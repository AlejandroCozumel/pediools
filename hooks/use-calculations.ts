// hooks/use-calculations.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Define types for the enhanced features
export interface CalculationFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface UseCalculationsOptions {
  filters?: CalculationFilters;
  pagination?: PaginationOptions;
  includeCharts?: boolean;
}

export interface Calculation {
  id: string;
  type: string;
  date: string;
  results: {
    calculationType: string;
    weight?: {
      value: number;
      percentiles?: {
        calculatedPercentile: number;
        zScore: number;
      };
    };
    height?: {
      value: number;
      percentiles?: {
        calculatedPercentile: number;
        zScore: number;
      };
    };
  };
  patientId: string;
  notes?: string;
  charts?: {
    pdfUrl?: string;
  }[];
  patient: {
    firstName: string;
    lastName: string;
    gender: "male" | "female";
    dateOfBirth: string;
    email: string | null | undefined;
    guardianEmail: string | null | undefined;
  };
  trends?: {
    weight: string | null;
    height: string | null;
  };
}

export interface CalculationsResponse {
  calculations: Record<string, Calculation[]>;
  pagination: {
    totalCalculations: number;
    totalPages: number;
    currentPage: number;
    calculationsPerPage: number;
  };
}

export function useCalculations(
  patientId?: string,
  options: UseCalculationsOptions = {}
) {
  const {
    filters = {},
    pagination = { page: 1, limit: 20 },
    includeCharts = true
  } = options;

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      patientId ? "patientCalculations" : "calculations",
      patientId,
      pagination,
      filters,
      includeCharts
    ],
    queryFn: async () => {
      const url = patientId
        ? `/api/dashboard/calculations/${patientId}`
        : "/api/dashboard/calculations";

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      params.append('includeCharts', includeCharts.toString());

      if (filters.type) params.append('type', filters.type);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const { data } = await axios.get(`${url}?${params.toString()}`);
      return data as CalculationsResponse;
    },
  });

  const deleteCalculation = useMutation({
    mutationFn: ({
      patientId,
      calculationId,
    }: {
      patientId: string;
      calculationId: string;
    }) =>
      axios.delete(
        `/api/dashboard/calculations/${patientId}?calculationId=${calculationId}`
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["patientCalculations", variables.patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["calculations"],
      });
    },
  });

  const batchDeleteCalculations = useMutation({
    mutationFn: ({
      patientId,
      calculationIds,
    }: {
      patientId: string;
      calculationIds: string[];
    }) =>
      axios.delete(`/api/dashboard/calculations/${patientId}`, {
        data: { calculationIds },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["patientCalculations", variables.patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["calculations"],
      });
    },
  });

  const updateCalculationNotes = useMutation({
    mutationFn: ({
      patientId,
      calculationId,
      notes,
    }: {
      patientId: string;
      calculationId: string;
      notes: string;
    }) =>
      axios.put(`/api/dashboard/calculations/${patientId}`, {
        calculationId,
        notes,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["patientCalculations", variables.patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["calculations"],
      });
    },
  });

  return {
    calculations: data?.calculations,
    pagination: data?.pagination,
    isLoading,
    error,
    refetch,
    deleteCalculation,
    batchDeleteCalculations,
    updateCalculationNotes
  };
}