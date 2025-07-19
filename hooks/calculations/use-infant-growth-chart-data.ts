// hooks/useInfantGrowthChartData.ts
import { useQuery } from "@tanstack/react-query";
import { calculateInfantGrowthChartData, GrowthData, InfantGrowthChartResult } from "@/lib/charts/calculations/infantGrowthCalculations";

// Import your CDC infant data
import cdcInfantWeightData from "@/app/data/cdc-data-infant-weight.json";
import cdcInfantHeightData from "@/app/data/cdc-data-infant-height.json";

const fetchInfantGrowthChartDataClient = (searchParams: URLSearchParams): InfantGrowthChartResult => {
  const weightData = searchParams.get("weightData");
  const heightData = searchParams.get("heightData");
  const calculationId = searchParams.get("calculationId");

  if (!weightData || !heightData) {
    throw new Error("Weight and height data are required");
  }

  // Parse the URL parameters
  const parsedWeightData: GrowthData = JSON.parse(decodeURIComponent(weightData));
  const parsedHeightData: GrowthData = JSON.parse(decodeURIComponent(heightData));

  // Calculate everything on the client - NO API calls, NO patient data
  return calculateInfantGrowthChartData(
    parsedWeightData,
    parsedHeightData,
    cdcInfantWeightData as any,
    cdcInfantHeightData as any,
    [],
  );
};

// Custom hook for using the client-side calculation
export const useInfantGrowthChartData = (searchParams: URLSearchParams) => {
  return useQuery({
    queryKey: ["infantGrowthChartData", searchParams.toString()],
    queryFn: () => fetchInfantGrowthChartDataClient(searchParams),
    enabled: typeof window !== "undefined",
  });
};