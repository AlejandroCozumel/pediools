import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export function useCalculations(patientId?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: patientId ? ["patientCalculations", patientId] : ["calculations"],
    queryFn: async () => {
      const url = patientId
        ? `/api/dashboard/calculations/${patientId}`
        : "/api/dashboard/calculations";
      const { data } = await axios.get(url);
      return data;
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

  return { calculations: data, isLoading, error, deleteCalculation };
}
