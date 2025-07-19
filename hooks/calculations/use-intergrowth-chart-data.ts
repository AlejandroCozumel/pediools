// hooks/useIntergrowthChartData.ts
import { useQuery } from "@tanstack/react-query";
import intergrowthWeightData from "@/app/data/intergrowht-weight.json";
import intergrowthHeightData from "@/app/data/intergrowht-lenght.json";

interface IntergrowthDataPoint {
  sex: number;
  age: string;
  "3rd": number;
  "5th": number;
  "10th": number;
  "50th": number;
  "90th": number;
  "95th": number;
  "97th": number;
}

interface Measurement {
  date?: string;
  value: number;
  gestationalAge: number;
  gestationalDays: number;
  type?: string;
}

interface GestationalData {
  gender: "male" | "female";
  measurements: Measurement[];
}

interface IntergrowthChartResult {
  success: boolean;
  data: {
    weight: any[];
    height: any[];
  };
  originalInput: {
    weight: GestationalData;
    height: GestationalData;
  };
}

function findClosestDataPoint(
  gestationalAge: number,
  gestationalDays: number,
  gender: "male" | "female",
  data: IntergrowthDataPoint[]
): IntergrowthDataPoint | null {
  const sex = gender === "male" ? 1 : 2;
  const totalDays = gestationalAge * 7 + gestationalDays;
  const ageString = `${gestationalAge}+${gestationalDays}`;

  // First try exact match
  const exactMatch = data.find(
    (point) => point.sex === sex && point.age === ageString
  );
  if (exactMatch) return exactMatch;

  // If no exact match, find closest point
  const filteredData = data.filter((point) => point.sex === sex);
  if (filteredData.length === 0) return null;

  return filteredData.reduce((prev, curr) => {
    const [prevWeeks, prevDays] = prev.age.split("+").map(Number);
    const [currWeeks, currDays] = curr.age.split("+").map(Number);

    const prevTotalDays = prevWeeks * 7 + prevDays;
    const currTotalDays = currWeeks * 7 + currDays;

    const prevDiff = Math.abs(prevTotalDays - totalDays);
    const currDiff = Math.abs(currTotalDays - totalDays);

    return prevDiff < currDiff ? prev : curr;
  });
}

function calculatePercentile(
  value: number,
  dataPoint: IntergrowthDataPoint
): number {
  const percentiles = [
    { percentile: 3, value: dataPoint["3rd"] },
    { percentile: 5, value: dataPoint["5th"] },
    { percentile: 10, value: dataPoint["10th"] },
    { percentile: 50, value: dataPoint["50th"] },
    { percentile: 90, value: dataPoint["90th"] },
    { percentile: 95, value: dataPoint["95th"] },
    { percentile: 97, value: dataPoint["97th"] },
  ];

  // If value is below 3rd percentile
  if (value < percentiles[0].value) return 0;

  // If value is above 97th percentile
  if (value > percentiles[percentiles.length - 1].value) return 100;

  // Find the two closest percentiles
  for (let i = 0; i < percentiles.length - 1; i++) {
    if (value >= percentiles[i].value && value <= percentiles[i + 1].value) {
      const lowerPercentile = percentiles[i];
      const upperPercentile = percentiles[i + 1];

      // Linear interpolation
      return (
        lowerPercentile.percentile +
        ((value - lowerPercentile.value) /
          (upperPercentile.value - lowerPercentile.value)) *
          (upperPercentile.percentile - lowerPercentile.percentile)
      );
    }
  }

  return 50; // Default to median if something goes wrong
}

function validateGestationalData(data: GestationalData): string | null {
  if (!data.gender || !["male", "female"].includes(data.gender)) {
    return "Invalid gender specified";
  }

  if (!data.measurements || data.measurements.length === 0) {
    return "At least one measurement is required";
  }

  for (const measurement of data.measurements) {
    if (
      measurement.gestationalAge === undefined ||
      measurement.gestationalAge === null ||
      typeof measurement.gestationalAge !== "number" ||
      measurement.gestationalAge < 24 ||
      measurement.gestationalAge > 42
    ) {
      return "Gestational age must be between 24 and 42 weeks";
    }

    if (
      measurement.gestationalDays === undefined ||
      measurement.gestationalDays === null ||
      typeof measurement.gestationalDays !== "number" ||
      measurement.gestationalDays < 0 ||
      measurement.gestationalDays > 6
    ) {
      return "Gestational days must be between 0 and 6";
    }

    if (
      measurement.value === undefined ||
      measurement.value === null ||
      typeof measurement.value !== "number" ||
      measurement.value <= 0
    ) {
      return "Invalid measurement value";
    }
  }

  return null;
}

const fetchIntergrowthChartDataClient = async (
  searchParams: URLSearchParams
): Promise<IntergrowthChartResult> => {
  const rawWeightData = searchParams.get("weightData");
  const rawHeightData = searchParams.get("heightData");

  if (!rawWeightData || !rawHeightData) {
    throw new Error("Weight and height data are required");
  }

  // Parse the URL parameters
  const weightData: GestationalData = JSON.parse(decodeURIComponent(rawWeightData));
  const heightData: GestationalData = JSON.parse(decodeURIComponent(rawHeightData));

  // Validate data
  const weightValidationError = validateGestationalData(weightData);
  const heightValidationError = validateGestationalData(heightData);

  if (weightValidationError) {
    throw new Error(`Weight data validation failed: ${weightValidationError}`);
  }

  if (heightValidationError) {
    throw new Error(`Height data validation failed: ${heightValidationError}`);
  }

  // Process weight measurements
  const weightResults = weightData.measurements.map((measurement: Measurement) => {
    const dataPoint = findClosestDataPoint(
      measurement.gestationalAge,
      measurement.gestationalDays,
      weightData.gender,
      intergrowthWeightData as IntergrowthDataPoint[]
    );

    if (!dataPoint) {
      return {
        date: measurement.date,
        gestationalAge: measurement.gestationalAge,
        gestationalDays: measurement.gestationalDays,
        error: "No reference data found for this gestational age",
      };
    }

    return {
      date: measurement.date,
      gestationalAge: measurement.gestationalAge,
      gestationalDays: measurement.gestationalDays,
      weight: {
        value: measurement.value,
        percentiles: {
          P3: dataPoint["3rd"],
          P5: dataPoint["5th"],
          P10: dataPoint["10th"],
          P50: dataPoint["50th"],
          P90: dataPoint["90th"],
          P95: dataPoint["95th"],
          P97: dataPoint["97th"],
          calculatedPercentile: calculatePercentile(measurement.value, dataPoint),
        },
      },
    };
  });

  // Process height measurements
  const heightResults = heightData.measurements.map((measurement: Measurement) => {
    const dataPoint = findClosestDataPoint(
      measurement.gestationalAge,
      measurement.gestationalDays,
      heightData.gender,
      intergrowthHeightData as IntergrowthDataPoint[]
    );

    if (!dataPoint) {
      return {
        date: measurement.date,
        gestationalAge: measurement.gestationalAge,
        gestationalDays: measurement.gestationalDays,
        error: "No reference data found for this gestational age",
      };
    }

    return {
      date: measurement.date,
      gestationalAge: measurement.gestationalAge,
      gestationalDays: measurement.gestationalDays,
      height: {
        value: measurement.value,
        percentiles: {
          P3: dataPoint["3rd"],
          P5: dataPoint["5th"],
          P10: dataPoint["10th"],
          P50: dataPoint["50th"],
          P90: dataPoint["90th"],
          P95: dataPoint["95th"],
          P97: dataPoint["97th"],
          calculatedPercentile: calculatePercentile(measurement.value, dataPoint),
        },
      },
    };
  });

  return {
    success: true,
    data: {
      weight: weightResults,
      height: heightResults,
    },
    originalInput: {
      weight: weightData,
      height: heightData,
    },
  };
};

// Custom hook for using the client-side calculation
export const useIntergrowthChartData = (searchParams: URLSearchParams) => {
  return useQuery({
    queryKey: ["intergrowthChartData", searchParams.toString()],
    queryFn: () => fetchIntergrowthChartDataClient(searchParams),
    enabled: typeof window !== "undefined",
  });
};