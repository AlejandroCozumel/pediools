import { NextRequest, NextResponse } from "next/server";
import { differenceInMonths } from "date-fns";
import cdcWeightData from "@/app/data/cdc-data-weight.json";
import cdcHeightData from "@/app/data/cdc-data-height.json";
import prisma from "@/lib/prismadb";

interface CDCDataPoint {
  Sex: number;
  Agemos: number;
  L: number;
  M: number;
  S: number;
  P3: number;
  P5: number;
  P10: number;
  P25: number;
  P50: number;
  P75: number;
  P90: number;
  P95: number;
  P97: number;
}

interface HistoricalMeasurement {
  date: string;
  weight?: number;
  height?: number;
}

interface GrowthData {
  gender: "male" | "female";
  dateOfBirth: string;
  measurements: HistoricalMeasurement[];
  type: "weight" | "height";
}

interface ProgressionData {
  date: string;
  age: string;
  weight: string;
  height: string;
  bmi: string;
}

// Error function implementation
const erf = (x: number): number => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
};

function calculateZScore(value: number, L: number, M: number, S: number) {
  if (L === 0) {
    return Math.log(value / M) / S;
  }
  return (Math.pow(value / M, L) - 1) / (L * S);
}

const zScoreToPercentile = (zScore: number) => {
  return 0.5 * (1 + erf(zScore / Math.sqrt(2))) * 100;
};

function findClosestDataPoint(
  ageInMonths: number,
  gender: "male" | "female",
  cdcData: CDCDataPoint[],
  type: "weight" | "height"
): CDCDataPoint {
  const sex = gender === "male" ? 1 : 2;
  const filteredData = cdcData.filter(
    (point) =>
      point.Sex === sex &&
      (type === "weight"
        ? point.Agemos >= 24 && point.Agemos <= 240
        : point.Agemos >= 24 && point.Agemos <= 240)
  );

  const sortedPoints = filteredData.sort(
    (a, b) =>
      Math.abs(a.Agemos - ageInMonths) - Math.abs(b.Agemos - ageInMonths)
  );

  const point1 = sortedPoints[0];
  const point2 = sortedPoints[1];

  if (point1.Agemos === point2.Agemos || point1.Agemos === ageInMonths) {
    return point1;
  }

  const factor =
    (ageInMonths - point1.Agemos) / (point2.Agemos - point1.Agemos);

  return {
    Sex: point1.Sex,
    Agemos: ageInMonths,
    L: point1.L + (point2.L - point1.L) * factor,
    M: point1.M + (point2.M - point1.M) * factor,
    S: point1.S + (point2.S - point1.S) * factor,
    P3: point1.P3,
    P5: point1.P5,
    P10: point1.P10,
    P25: point1.P25,
    P50: point1.P50,
    P75: point1.P75,
    P90: point1.P90,
    P95: point1.P95,
    P97: point1.P97,
  };
}

function calculatePercentile(value: number, dataPoint: CDCDataPoint): number {
  const zScore = calculateZScore(value, dataPoint.L, dataPoint.M, dataPoint.S);
  return zScoreToPercentile(zScore);
}

function calculateGrowthPercentiles(data: GrowthData, cdcData: CDCDataPoint[]) {
  return data.measurements.map((measurement) => {
    const ageInMonths = differenceInMonths(
      new Date(measurement.date),
      new Date(data.dateOfBirth)
    );

    const dataPoint = findClosestDataPoint(
      ageInMonths,
      data.gender,
      cdcData,
      data.type
    );

    const result = {
      date: measurement.date,
      ageInMonths,
    };

    const measurementValue =
      data.type === "weight" ? measurement.weight : measurement.height;

    if (measurementValue !== undefined) {
      return {
        ...result,
        [data.type]: {
          value: measurementValue,
          percentiles: {
            P3: dataPoint.P3,
            P5: dataPoint.P5,
            P10: dataPoint.P10,
            P25: dataPoint.P25,
            P50: dataPoint.P50,
            P75: dataPoint.P75,
            P90: dataPoint.P90,
            P95: dataPoint.P95,
            P97: dataPoint.P97,
            calculatedPercentile: calculatePercentile(
              measurementValue,
              dataPoint
            ),
          },
        },
      };
    }

    return result;
  });
}

function validateGrowthData(data: GrowthData): string | null {
  if (!data.gender || !["male", "female"].includes(data.gender)) {
    return "Invalid gender specified";
  }

  if (!data.dateOfBirth) {
    return "Date of birth is required";
  }

  if (!data.measurements || data.measurements.length === 0) {
    return "At least one measurement is required";
  }

  for (const measurement of data.measurements) {
    if (!measurement.date) {
      return "Measurement date is required";
    }

    const birthDate = new Date(data.dateOfBirth);
    const measurementDate = new Date(measurement.date);

    const ageInMonths = differenceInMonths(measurementDate, birthDate);

    if (ageInMonths < 24 || ageInMonths > 240) {
      return "Age must be between 2 and 20 years";
    }

    const measurementValue =
      data.type === "weight" ? measurement.weight : measurement.height;

    if (
      measurementValue !== undefined &&
      (measurementValue <= 0 ||
        (data.type === "weight" && measurementValue > 300) ||
        (data.type === "height" && measurementValue > 250))
    ) {
      return `Invalid ${data.type} measurement`;
    }
  }

  return null;
}

async function getPatientMeasurements(patientId: string) {
  return prisma.calculation.findMany({
    where: {
      patientId: patientId,
    },
    orderBy: {
      date: "asc",
    },
    include: {
      patient: {
        select: {
          dateOfBirth: true,
        },
      },
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const encodedWeightData = searchParams.get("weightData");
    const encodedHeightData = searchParams.get("heightData");
    const patientId = searchParams.get("patientId");

    if (!encodedWeightData || !encodedHeightData) {
      return NextResponse.json(
        { error: "Weight and height data are required" },
        { status: 400 }
      );
    }

    const weightData: GrowthData = JSON.parse(
      decodeURIComponent(encodedWeightData)
    );
    const heightData: GrowthData = JSON.parse(
      decodeURIComponent(encodedHeightData)
    );

    const weightValidationError = validateGrowthData(weightData);
    const heightValidationError = validateGrowthData(heightData);

    if (weightValidationError) {
      return NextResponse.json(
        { error: weightValidationError },
        { status: 400 }
      );
    }

    if (heightValidationError) {
      return NextResponse.json(
        { error: heightValidationError },
        { status: 400 }
      );
    }

    const weightPercentileResults = calculateGrowthPercentiles(
      weightData,
      cdcWeightData
    );
    const heightPercentileResults = calculateGrowthPercentiles(
      heightData,
      cdcHeightData
    );

    let progressionData: ProgressionData[] = [];
    if (patientId) {
      const patientMeasurements = await getPatientMeasurements(patientId);
      progressionData = patientMeasurements
        .filter((measurement) => measurement.results != null)
        .map((measurement) => {
          const ageInMonths = differenceInMonths(
            new Date(measurement.date),
            new Date(measurement.patient.dateOfBirth)
          );
          const ageInYears = ageInMonths / 12;

          const results = measurement.results as {
            weight: { value: number };
            height: { value: number };
          };
          const bmi =
            results.weight.value / Math.pow(results.height.value / 100, 2);

          return {
            date: measurement.date.toISOString(),
            age: ageInYears.toFixed(2),
            weight: results.weight.value.toFixed(2),
            height: results.height.value.toFixed(2),
            bmi: bmi.toFixed(2),
          };
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        weight: weightPercentileResults,
        height: heightPercentileResults,
      },
      originalInput: {
        weight: weightData,
        height: heightData,
      },
      progressionData: progressionData,
    });
  } catch (error) {
    console.error("Growth chart calculation error:", error);
    return NextResponse.json(
      {
        error: "Error processing growth chart data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
