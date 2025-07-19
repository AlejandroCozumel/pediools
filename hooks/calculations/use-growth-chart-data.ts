// hooks/useGrowthChartData.ts
import { useQuery } from "@tanstack/react-query";
import { calculateGrowthChartData, GrowthData, GrowthChartResult } from "@/lib/charts/calculations/growthCalculations";

// Import your CDC data
import cdcWeightData from "@/app/data/cdc-data-weight.json";
import cdcHeightData from "@/app/data/cdc-data-height.json";

// Optional: API call for patient data only (if needed)
const fetchPatientData = async (patientId: string) => {
  const response = await fetch(`/api/patients/${patientId}/measurements`);
  if (!response.ok) {
    throw new Error('Failed to fetch patient data');
  }
  return response.json();
};

const fetchGrowthChartDataClient = async (searchParams: URLSearchParams): Promise<GrowthChartResult> => {
  const weightData = searchParams.get("weightData");
  const heightData = searchParams.get("heightData");
  const patientId = searchParams.get("patientId");
  const calculationId = searchParams.get("calculationId");

  if (!weightData || !heightData) {
    throw new Error("Weight and height data are required");
  }

  // Parse the URL parameters
  const parsedWeightData: GrowthData = JSON.parse(decodeURIComponent(weightData));
  const parsedHeightData: GrowthData = JSON.parse(decodeURIComponent(heightData));

  // If we have a patientId, fetch patient measurements from API
  let patientMeasurements: any[] = [];
  let patientDetails = null;

  if (patientId) {
    try {
      const patientData = await fetchPatientData(patientId);
      patientMeasurements = patientData.measurements || [];
      patientDetails = patientData.patientDetails || null;
    } catch (error) {
      console.error("Error fetching patient data:", error);
      // Continue without patient data
    }
  }

  // Calculate everything on the client
  const result = calculateGrowthChartData(
    parsedWeightData,
    parsedHeightData,
    cdcWeightData as any,
    cdcHeightData as any,
    patientMeasurements,
    calculationId || undefined
  );

  // Add patient details if available
  if (patientDetails) {
    result.patientDetails = patientDetails;
  }

  return result;
};

// Custom hook for using the client-side calculation
export const useGrowthChartData = (searchParams: URLSearchParams) => {
  return useQuery({
    queryKey: ["growthChartData", searchParams.toString()],
    queryFn: () => fetchGrowthChartDataClient(searchParams),
    enabled: typeof window !== "undefined",
  });
};

// Alternative: Pure client-side function without patient data fetching
export const fetchGrowthChartDataPure = (searchParams: URLSearchParams): GrowthChartResult => {
  const weightData = searchParams.get("weightData");
  const heightData = searchParams.get("heightData");
  const calculationId = searchParams.get("calculationId");

  if (!weightData || !heightData) {
    throw new Error("Weight and height data are required");
  }

  // Parse the URL parameters
  const parsedWeightData: GrowthData = JSON.parse(decodeURIComponent(weightData));
  const parsedHeightData: GrowthData = JSON.parse(decodeURIComponent(heightData));

  // Calculate everything on the client without any API calls
  return calculateGrowthChartData(
    parsedWeightData,
    parsedHeightData,
    cdcWeightData as any,
    cdcHeightData as any,
    [], // No patient measurements
    calculationId || undefined
  );
};