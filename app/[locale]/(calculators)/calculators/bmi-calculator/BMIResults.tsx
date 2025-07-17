import React from "react";

interface CdcDataPoint {
  Sex: number | string;
  Agemos: number | string;
  L: number | string;
  M: number | string;
  S: number | string;
  P3: number | string;
  P50: number | string;
  P97: number | string;
}

interface WHODataPoint {
  Sex: number;
  Agemos: number;
  L: number;
  M: number;
  S: number;
  P01: number;
  P1: number;
  P3: number;
  P5: number;
  P10: number;
  P15: number;
  P25: number;
  P50: number;
  P75: number;
  P85: number;
  P90: number;
  P95: number;
  P97: number;
  P99: number;
  P999: number;
}

type BMIResultsProps = {
  weight: string;
  height: string;
  gender: "male" | "female";
  dateOfBirth: Date;
  dateOfMeasurement: Date;
  standard: "who" | "cdc";
  cdcBmiData: CdcDataPoint[];
  whoBmiData: WHODataPoint[];
};

function calculateBMI(weightKg: number, heightCm: number) {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function calculateZScore(value: number, L: number, M: number, S: number) {
  if (L === 0) {
    return Math.log(value / M) / S;
  }
  return (Math.pow(value / M, L) - 1) / (L * S);
}

function zScoreToPercentile(zScore: number) {
  // Standard normal CDF
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
  return 0.5 * (1 + erf(zScore / Math.sqrt(2))) * 100;
}

function getAgeInMonths(birth: Date, measurement: Date) {
  return (
    (measurement.getFullYear() - birth.getFullYear()) * 12 +
    (measurement.getMonth() - birth.getMonth()) +
    (measurement.getDate() >= birth.getDate() ? 0 : -1)
  );
}

export default function BMIResults({
  weight,
  height,
  gender,
  dateOfBirth,
  dateOfMeasurement,
  standard,
  cdcBmiData,
  whoBmiData,
}: BMIResultsProps) {
  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);
  const bmi = calculateBMI(weightNum, heightNum);
  const ageInMonths = getAgeInMonths(new Date(dateOfBirth), new Date(dateOfMeasurement));
  const sex = gender === "male" ? 1 : 2;

  let zScore: number | null = null;
  let percentile: number | null = null;

  if (standard === "cdc") {
    // Find closest CDC data point
    const dataPoint = cdcBmiData.find(
      (d) => Number(d.Sex) === sex && Math.round(Number(d.Agemos)) === Math.round(ageInMonths)
    );
    if (dataPoint) {
      zScore = calculateZScore(
        bmi,
        Number(dataPoint.L),
        Number(dataPoint.M),
        Number(dataPoint.S)
      );
      percentile = zScoreToPercentile(zScore);
    }
  } else if (standard === "who") {
    // Find closest WHO data point
    const dataPoint = whoBmiData.find(
      (d) => Number(d.Sex) === sex && Math.round(Number(d.Agemos)) === Math.round(ageInMonths)
    );
    if (dataPoint) {
      zScore = calculateZScore(
        bmi,
        Number(dataPoint.L),
        Number(dataPoint.M),
        Number(dataPoint.S)
      );
      percentile = zScoreToPercentile(zScore);
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow">
      <div className="text-lg font-semibold mb-2">BMI Results</div>
      <div>BMI: <span className="font-bold">{bmi.toFixed(2)}</span></div>
      {zScore !== null && percentile !== null ? (
        <>
          <div>Percentile: <span className="font-bold">{percentile.toFixed(1)}</span></div>
          <div>Z-Score: <span className="font-bold">{zScore.toFixed(2)}</span></div>
        </>
      ) : (
        <div className="text-red-500">No reference data for this age/sex.</div>
      )}
    </div>
  );
}