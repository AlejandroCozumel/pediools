import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { getAuth } from "@clerk/nextjs/server";
import { CalculationType, ChartType } from "@prisma/client";
import { differenceInMonths } from "date-fns";

interface Measurement {
  weight: number;
  height: number;
  headCircumference?: number;
  birthDate?: Date;
  measurementDate?: Date;
  gestationalWeeks?: number;
  gestationalDays?: number;
  standard: string;
}

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

const getChartType = (calculatorType: string): ChartType => {
  switch (calculatorType) {
    case "cdc_child":
      return ChartType.GROWTH_CDC;
    case "cdc_infant":
      return ChartType.GROWTH_CDC;
    case "who":
      return ChartType.GROWTH_WHO;
    case "intergrowth":
      return ChartType.GROWTH_INTERGROWTH;
    default:
      throw new Error("Invalid calculator type");
  }
};

async function getDataForStandard(standard: string) {
  switch (standard) {
    case "cdc_child":
      return Promise.all([
        import("@/app/data/cdc-data-weight.json"),
        import("@/app/data/cdc-data-height.json"),
      ]);
    case "cdc_infant":
      return Promise.all([
        import("@/app/data/cdc-data-infant-weight.json"),
        import("@/app/data/cdc-data-infant-height.json"),
        import("@/app/data/cdc-data-infant-head.json"),
      ]);
    case "who":
      return Promise.all([
        import("@/app/data/who-data-weight.json"),
        import("@/app/data/who-data-height.json"),
        import("@/app/data/who-data-head.json"),
      ]);
    case "intergrowth":
      return Promise.all([
        import("@/app/data/intergrowht-weight.json"),
        import("@/app/data/intergrowht-lenght.json"),
        import("@/app/data/intergrowht-head.json"),
      ]);
    default:
      throw new Error("Invalid standard");
  }
}

async function calculateResults(
  measurement: Measurement,
  patient: any,
  standard: string
) {
  const data = await getDataForStandard(standard);

  // Handle different data formats based on standard
  if (standard === "intergrowth") {
    return calculateIntergrowthResults(measurement, patient, data);
  } else if (standard === "who") {
    return calculateWHOResults(measurement, patient, data);
  } else {
    return calculateCDCResults(measurement, patient, data, standard);
  }
}

async function calculateCDCResults(
  measurement: any,
  patient: any,
  data: any[],
  standard: string
) {
  const [weightData, heightData, headData] = data;
  const ageInMonths = differenceInMonths(
    new Date(measurement.measurementDate),
    new Date(measurement.birthDate)
  );

  const ageRangeValid =
    standard === "cdc_child"
      ? ageInMonths >= 24 && ageInMonths <= 240
      : ageInMonths >= 0 && ageInMonths <= 36;

  if (!ageRangeValid) {
    throw new Error(`Age outside valid range for ${standard}`);
  }

  // Calculate percentiles using CDC method
  const weightResults = calculateCDCPercentiles(
    measurement.weight,
    ageInMonths,
    patient.gender,
    weightData.default,
    "weight"
  );

  const heightResults = calculateCDCPercentiles(
    measurement.height,
    ageInMonths,
    patient.gender,
    heightData.default,
    "height"
  );

  let headResults = null;
  if (headData && measurement.headCircumference) {
    headResults = calculateCDCPercentiles(
      measurement.headCircumference,
      ageInMonths,
      patient.gender,
      headData.default,
      "head"
    );
  }

  return { weightResults, heightResults, headResults };
}

function calculateCDCPercentiles(
  value: number,
  ageInMonths: number,
  gender: string,
  data: any,
  type: string
) {
  const sex = gender.toLowerCase() === "male" ? 1 : 2;

  // Filter data points based on age range and sex
  const filteredData = data.filter(
    (point: any) =>
      point.Sex === sex &&
      (type === "weight" ? point.Agemos >= 0 : point.Agemos >= 0)
  );

  // Find closest age points
  const sortedPoints = filteredData.sort(
    (a: any, b: any) =>
      Math.abs(a.Agemos - ageInMonths) - Math.abs(b.Agemos - ageInMonths)
  );

  const point1 = sortedPoints[0];
  const point2 = sortedPoints[1];

  if (!point1 || !point2) {
    throw new Error("No reference data found for this age");
  }

  // Handle exact match
  if (point1.Agemos === point2.Agemos || point1.Agemos === ageInMonths) {
    const zScore = calculateZScore(value, point1.L, point1.M, point1.S);
    return {
      value,
      percentiles: {
        P3: point1.P3,
        P5: point1.P5,
        P10: point1.P10,
        P25: point1.P25,
        P50: point1.P50,
        P75: point1.P75,
        P90: point1.P90,
        P95: point1.P95,
        P97: point1.P97,
        calculatedPercentile: zScoreToPercentile(zScore),
        zScore,
      },
    };
  }

  // Interpolate between points
  const factor =
    (ageInMonths - point1.Agemos) / (point2.Agemos - point1.Agemos);

  const interpolatedPoint = {
    L: point1.L + (point2.L - point1.L) * factor,
    M: point1.M + (point2.M - point1.M) * factor,
    S: point1.S + (point2.S - point1.S) * factor,
    P3: point1.P3 + (point2.P3 - point1.P3) * factor,
    P5: point1.P5 + (point2.P5 - point1.P5) * factor,
    P10: point1.P10 + (point2.P10 - point1.P10) * factor,
    P25: point1.P25 + (point2.P25 - point1.P25) * factor,
    P50: point1.P50 + (point2.P50 - point1.P50) * factor,
    P75: point1.P75 + (point2.P75 - point1.P75) * factor,
    P90: point1.P90 + (point2.P90 - point1.P90) * factor,
    P95: point1.P95 + (point2.P95 - point1.P95) * factor,
    P97: point1.P97 + (point2.P97 - point1.P97) * factor,
  };

  const zScore = calculateZScore(
    value,
    interpolatedPoint.L,
    interpolatedPoint.M,
    interpolatedPoint.S
  );

  return {
    value,
    percentiles: {
      P3: interpolatedPoint.P3,
      P5: interpolatedPoint.P5,
      P10: interpolatedPoint.P10,
      P25: interpolatedPoint.P25,
      P50: interpolatedPoint.P50,
      P75: interpolatedPoint.P75,
      P90: interpolatedPoint.P90,
      P95: interpolatedPoint.P95,
      P97: interpolatedPoint.P97,
      calculatedPercentile: zScoreToPercentile(zScore),
      zScore,
    },
  };
}

async function calculateWHOResults(
  measurement: any,
  patient: any,
  data: any[]
) {
  const [weightData, heightData, headData] = data;
  const ageInMonths = differenceInMonths(
    new Date(measurement.measurementDate),
    new Date(measurement.birthDate)
  );

  if (ageInMonths < 0 || ageInMonths > 24) {
    throw new Error("Age must be between 0 and 24 months for WHO standards");
  }

  const weightResults = calculateWHOPercentiles(
    measurement.weight,
    ageInMonths,
    patient.gender,
    weightData.default,
    "weight"
  );

  const heightResults = calculateWHOPercentiles(
    measurement.height,
    ageInMonths,
    patient.gender,
    heightData.default,
    "height"
  );

  let headResults = null;
  if (headData && measurement.headCircumference) {
    headResults = calculateWHOPercentiles(
      measurement.headCircumference,
      ageInMonths,
      patient.gender,
      headData.default,
      "head"
    );
  }

  return { weightResults, heightResults, headResults };
}

function calculateWHOPercentiles(
  value: number,
  ageInMonths: number,
  gender: string,
  data: any,
  type: string
) {
  const sex = gender.toLowerCase() === "male" ? 1 : 2;

  const filteredData = data.filter(
    (point: any) => point.Sex === sex && point.Agemos >= 0 && point.Agemos <= 24
  );

  const sortedPoints = filteredData.sort(
    (a: any, b: any) =>
      Math.abs(a.Agemos - ageInMonths) - Math.abs(b.Agemos - ageInMonths)
  );

  const point1 = sortedPoints[0];
  const point2 = sortedPoints[1];

  const factor =
    (ageInMonths - point1.Agemos) / (point2.Agemos - point1.Agemos);

  const interpolatedPoint = {
    L: point1.L + (point2.L - point1.L) * factor,
    M: point1.M + (point2.M - point1.M) * factor,
    S: point1.S + (point2.S - point1.S) * factor,
    P3: point1.P3 + (point2.P3 - point1.P3) * factor,
    P5: point1.P5 + (point2.P5 - point1.P5) * factor,
    P10: point1.P10 + (point2.P10 - point1.P10) * factor,
    P25: point1.P25 + (point2.P25 - point1.P25) * factor,
    P50: point1.P50 + (point2.P50 - point1.P50) * factor,
    P75: point1.P75 + (point2.P75 - point1.P75) * factor,
    P90: point1.P90 + (point2.P90 - point1.P90) * factor,
    P95: point1.P95 + (point2.P95 - point1.P95) * factor,
    P97: point1.P97 + (point2.P97 - point1.P97) * factor,
  };

  const zScore = calculateZScore(
    value,
    interpolatedPoint.L,
    interpolatedPoint.M,
    interpolatedPoint.S
  );

  return {
    value,
    percentiles: {
      P3: interpolatedPoint.P3,
      P5: interpolatedPoint.P5,
      P10: interpolatedPoint.P10,
      P25: interpolatedPoint.P25,
      P50: interpolatedPoint.P50,
      P75: interpolatedPoint.P75,
      P90: interpolatedPoint.P90,
      P95: interpolatedPoint.P95,
      P97: interpolatedPoint.P97,
      calculatedPercentile: zScoreToPercentile(zScore),
      zScore,
    },
  };
}

async function calculateIntergrowthResults(
  measurement: any,
  patient: any,
  data: any[]
) {
  const [weightData, lengthData, headData] = data;
  const gestationalAge = measurement.gestationalWeeks;
  const gestationalDays = measurement.gestationalDays;

  if (gestationalAge < 24 || gestationalAge > 42) {
    throw new Error("Gestational age must be between 24 and 42 weeks");
  }

  const weightResults = calculateIntergrowthPercentiles(
    measurement.weight,
    gestationalAge,
    gestationalDays,
    patient.gender,
    weightData.default
  );

  const heightResults = calculateIntergrowthPercentiles(
    measurement.height,
    gestationalAge,
    gestationalDays,
    patient.gender,
    lengthData.default
  );

  let headResults = null;
  if (headData && measurement.headCircumference) {
    headResults = calculateIntergrowthPercentiles(
      measurement.headCircumference,
      gestationalAge,
      gestationalDays,
      patient.gender,
      headData.default
    );
  }

  return { weightResults, heightResults, headResults };
}

function calculateIntergrowthPercentiles(
  value: number,
  gestationalWeeks: number,
  gestationalDays: number,
  gender: string,
  data: any
) {
  const sex = gender.toLowerCase() === "male" ? 1 : 2;
  const ageString = `${gestationalWeeks}+${gestationalDays}`;

  // Try exact match first
  const exactMatch = data.find(
    (point: any) => point.sex === sex && point.age === ageString
  );

  if (exactMatch) {
    return {
      value,
      percentiles: {
        P3: exactMatch["3rd"],
        P5: exactMatch["5th"],
        P10: exactMatch["10th"],
        P50: exactMatch["50th"],
        P90: exactMatch["90th"],
        P95: exactMatch["95th"],
        P97: exactMatch["97th"],
        calculatedPercentile: calculateIntergrowthPercentile(value, exactMatch),
      },
    };
  }

  // Find closest points and interpolate
  const totalDays = gestationalWeeks * 7 + gestationalDays;
  const filteredData = data.filter((point: any) => point.sex === sex);
  const sortedPoints = filteredData.sort((a: any, b: any) => {
    const aDays =
      parseInt(a.age.split("+")[0]) * 7 + parseInt(a.age.split("+")[1]);
    const bDays =
      parseInt(b.age.split("+")[0]) * 7 + parseInt(b.age.split("+")[1]);
    return Math.abs(aDays - totalDays) - Math.abs(bDays - totalDays);
  });

  const point1 = sortedPoints[0];
  const point2 = sortedPoints[1];

  const days1 =
    parseInt(point1.age.split("+")[0]) * 7 + parseInt(point1.age.split("+")[1]);
  const days2 =
    parseInt(point2.age.split("+")[0]) * 7 + parseInt(point2.age.split("+")[1]);

  const factor = (totalDays - days1) / (days2 - days1);

  const interpolatedPoint = {
    "3rd": point1["3rd"] + (point2["3rd"] - point1["3rd"]) * factor,
    "5th": point1["5th"] + (point2["5th"] - point1["5th"]) * factor,
    "10th": point1["10th"] + (point2["10th"] - point1["10th"]) * factor,
    "50th": point1["50th"] + (point2["50th"] - point1["50th"]) * factor,
    "90th": point1["90th"] + (point2["90th"] - point1["90th"]) * factor,
    "95th": point1["95th"] + (point2["95th"] - point1["95th"]) * factor,
    "97th": point1["97th"] + (point2["97th"] - point1["97th"]) * factor,
  };

  return {
    value,
    percentiles: {
      P3: interpolatedPoint["3rd"],
      P5: interpolatedPoint["5th"],
      P10: interpolatedPoint["10th"],
      P50: interpolatedPoint["50th"],
      P90: interpolatedPoint["90th"],
      P95: interpolatedPoint["95th"],
      P97: interpolatedPoint["97th"],
      calculatedPercentile: calculateIntergrowthPercentile(
        value,
        interpolatedPoint
      ),
    },
  };
}

function calculateIntergrowthPercentile(value: number, dataPoint: any): number {
  const percentiles = [
    { percentile: 3, value: dataPoint["3rd"] },
    { percentile: 5, value: dataPoint["5th"] },
    { percentile: 10, value: dataPoint["10th"] },
    { percentile: 50, value: dataPoint["50th"] },
    { percentile: 90, value: dataPoint["90th"] },
    { percentile: 95, value: dataPoint["95th"] },
    { percentile: 97, value: dataPoint["97th"] },
  ];

  if (value < percentiles[0].value) return 0;
  if (value > percentiles[percentiles.length - 1].value) return 100;

  for (let i = 0; i < percentiles.length - 1; i++) {
    if (value >= percentiles[i].value && value <= percentiles[i + 1].value) {
      const lower = percentiles[i];
      const upper = percentiles[i + 1];

      return (
        lower.percentile +
        ((value - lower.value) / (upper.value - lower.value)) *
          (upper.percentile - lower.percentile)
      );
    }
  }

  return 50;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const data = await req.json();
    const { patientId, calculatorType, measurement } = data;

    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        doctorId: doctor.id,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Calculate results based on standard
    const results = await calculateResults(
      measurement,
      patient,
      calculatorType
    );

    // Create calculation record
    const calculation = await prisma.calculation.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        type: CalculationType.GROWTH_PERCENTILE,
        inputData: {
          weight: measurement.weight,
          height: measurement.height,
          headCircumference: measurement.headCircumference,
          standard: calculatorType,
          birthDate: measurement.birthDate,
          measurementDate: measurement.measurementDate,
          gestationalWeeks: measurement.gestationalWeeks,
          gestationalDays: measurement.gestationalDays,
        },
        results: {
          weight: results.weightResults,
          height: results.heightResults,
          headCircumference: results.headResults,
          calculationType: calculatorType,
        },
      },
    });

    const chartType = getChartType(calculatorType);

    // Create associated chart
    const chart = await prisma.chart.create({
      data: {
        patientId: patient.id,
        calculationId: calculation.id,
        type: chartType,
      },
    });

    return NextResponse.json({
      success: true,
      data: { calculation, chart },
    });
  } catch (error) {
    console.error("Error saving measurements:", error);
    return NextResponse.json(
      { error: "Error saving measurements" },
      { status: 500 }
    );
  }
}
