import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import cdcBmiData from "@/app/data/cdc-data-bmi.json";
import whoBmiData from "@/app/data/who-data-bmi.json";
import intergrowthWeightData from "@/app/data/intergrowht-weight.json";
import intergrowthlenghtData from "@/app/data/intergrowht-lenght.json";
import intergrowthHeadData from "@/app/data/intergrowht-head.json";
import { differenceInMonths } from "date-fns";
import { useTranslations } from "next-intl";
import { ClinicalDisclaimer } from "@/components/ClinicalDisclaimer";

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

interface GrowthResultsProps {
  weight: string;
  height: string;
  headCircumference?: string;
  gender: "male" | "female";
  birthDate?: Date;
  measurementDate?: Date;
  selectedStandard: string;
  gestationalWeeks?: string;
  gestationalDays?: string;
  cdcChildWeightData: CdcDataPoint[];
  cdcChildHeightData: CdcDataPoint[];
  cdcInfantWeightData: CdcDataPoint[];
  cdcInfantHeightData: CdcDataPoint[];
  cdcInfantHeightHead?: CdcDataPoint[];
  whoWeightData?: WHODataPoint[];
  whoHeightData?: WHODataPoint[];
  whoHeadData?: WHODataPoint[];
}

interface ResultData {
  value: string;
  percentile: string;
  zScore: string;
}

interface GrowthResultData {
  weight: ResultData;
  height: ResultData;
  bmi: ResultData;
  headCircumference?: ResultData;
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

const calculateZScore = (value: number, L: number, M: number, S: number) => {
  if (L === 0) {
    return Math.log(value / M) / S;
  }
  return (Math.pow(value / M, L) - 1) / (L * S);
};

const zScoreToPercentile = (zScore: number) => {
  return 0.5 * (1 + erf(zScore / Math.sqrt(2))) * 100;
};

const calculateBMI = (weightKg: number, heightCm: number) => {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

const percentileMap = {
  "3rd": -1.88,
  "5th": -1.645,
  "10th": -1.28,
  "50th": 0,
  "90th": 1.28,
  "95th": 1.645,
  "97th": 1.88,
};

const calculateIntergrowthPercentiles = (
  value: number,
  dataPoints: IntergrowthDataPoint[],
  gestationalWeeks: string,
  gestationalDays: string,
  gender: "male" | "female"
) => {
  const sex = gender === "male" ? 1 : 2;
  const age = `${gestationalWeeks}+${gestationalDays}`;

  const dataPoint = dataPoints.find(
    (point) => point.sex === sex && point.age === age
  );
  if (!dataPoint) return null;

  const percentiles = ["3rd", "5th", "10th", "50th", "90th", "95th", "97th"];
  const values = percentiles.map((p) =>
    Number(dataPoint[p as keyof typeof dataPoint])
  );

  // Find the closest percentiles
  let lowerIndex = 0;
  for (let i = 0; i < values.length; i++) {
    if (value >= values[i]) {
      lowerIndex = i;
    } else {
      break;
    }
  }

  const upperIndex = Math.min(lowerIndex + 1, values.length - 1);
  const lowerPercentile = percentiles[lowerIndex];
  const upperPercentile = percentiles[upperIndex];

  const lowerValue = values[lowerIndex];
  const upperValue = values[upperIndex];
  const lowerZ = percentileMap[lowerPercentile as keyof typeof percentileMap];
  const upperZ = percentileMap[upperPercentile as keyof typeof percentileMap];

  // Linear interpolation
  const zScore =
    lowerZ +
    ((value - lowerValue) * (upperZ - lowerZ)) / (upperValue - lowerValue);
  const percentile = zScoreToPercentile(zScore);

  return {
    percentile: percentile.toFixed(1),
    zScore: zScore.toFixed(2),
  };
};

const interpolateDataPoint = (
  ageInMonths: number,
  dataPoints: CdcDataPoint[]
) => {
  const sortedPoints = dataPoints.sort(
    (a, b) =>
      Math.abs(Number(a.Agemos) - ageInMonths) -
      Math.abs(Number(b.Agemos) - ageInMonths)
  );

  const point1 = sortedPoints[0];
  const point2 = sortedPoints[1];

  if (
    Number(point1.Agemos) === Number(point2.Agemos) ||
    Number(point1.Agemos) === ageInMonths
  ) {
    return {
      Sex: Number(point1.Sex),
      Agemos: Number(point1.Agemos),
      L: Number(point1.L),
      M: Number(point1.M),
      S: Number(point1.S),
    };
  }

  const factor =
    (ageInMonths - Number(point1.Agemos)) /
    (Number(point2.Agemos) - Number(point1.Agemos));

  return {
    Sex: Number(point1.Sex),
    Agemos: ageInMonths,
    L: Number(point1.L) + (Number(point2.L) - Number(point1.L)) * factor,
    M: Number(point1.M) + (Number(point2.M) - Number(point1.M)) * factor,
    S: Number(point1.S) + (Number(point2.S) - Number(point1.S)) * factor,
  };
};

const GrowthResults: React.FC<GrowthResultsProps> = ({
  weight,
  height,
  headCircumference,
  gender,
  birthDate,
  measurementDate,
  selectedStandard,
  gestationalWeeks,
  gestationalDays,
  cdcChildWeightData,
  cdcChildHeightData,
  cdcInfantWeightData,
  cdcInfantHeightData,
  cdcInfantHeightHead,
  whoWeightData,
  whoHeightData,
  whoHeadData,
}) => {
  const t = useTranslations("GrowthForm");
  const results = useMemo<GrowthResultData | null>(() => {
    if (!weight || !height) return null;

    if (
      selectedStandard === "intergrowth" &&
      gestationalWeeks &&
      gestationalDays
    ) {
      const weightVal = parseFloat(weight);
      const heightVal = parseFloat(height);
      const bmi = calculateBMI(weightVal, heightVal);
      const weightResults = calculateIntergrowthPercentiles(
        weightVal,
        intergrowthWeightData,
        gestationalWeeks,
        gestationalDays,
        gender
      );

      const heightResults = calculateIntergrowthPercentiles(
        heightVal,
        intergrowthlenghtData,
        gestationalWeeks,
        gestationalDays,
        gender
      );

      let headResults;
      let headVal;
      if (headCircumference && intergrowthHeadData) {
        headVal = parseFloat(headCircumference);
        const headDataPoint = intergrowthHeadData.find(
          (point) =>
            point.sex === (gender === "male" ? 1 : 2) &&
            point.age === `${gestationalWeeks}+${gestationalDays}`
        );

        if (headDataPoint) {
          headResults = calculateIntergrowthPercentiles(
            headVal,
            [headDataPoint],
            gestationalWeeks,
            gestationalDays,
            gender
          );
        }
      }

      if (!weightResults || !heightResults) return null;

      return {
        weight: {
          value: weightVal.toFixed(2),
          percentile: weightResults.percentile,
          zScore: weightResults.zScore,
        },
        height: {
          value: heightVal.toFixed(1),
          percentile: heightResults.percentile,
          zScore: heightResults.zScore,
        },
        bmi: {
          value: bmi.toFixed(1),
          percentile: "N/A",
          zScore: "N/A",
        },
        ...(headResults
          ? {
              headCircumference: {
                value: headVal?.toFixed(1),
                percentile: headResults.percentile,
                zScore: headResults.zScore,
              },
            }
          : {}),
      };
    } else {
      if (!birthDate || !measurementDate) {
        return null;
      }
    }

    const safeBirthDate = new Date(
      birthDate.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate() || 1
    );
    const safeMeasurementDate = new Date(
      measurementDate.getFullYear(),
      measurementDate.getMonth(),
      measurementDate.getDate() || 1
    );

    const weightVal = parseFloat(weight);
    const heightVal = parseFloat(height);
    const bmi = calculateBMI(weightVal, heightVal);
    const ageInMonths = differenceInMonths(safeMeasurementDate, safeBirthDate);
    const sex = gender === "male" ? 1 : 2;

    let weightData: CdcDataPoint[] | WHODataPoint[];
    let heightData: CdcDataPoint[] | WHODataPoint[];
    let bmiData: CdcDataPoint[] | WHODataPoint[];
    let headCircumferenceData: CdcDataPoint[] | WHODataPoint[] | undefined;

    switch (selectedStandard) {
      case "who":
        weightData = whoWeightData?.filter((point) => point.Sex === sex) || [];
        heightData = whoHeightData?.filter((point) => point.Sex === sex) || [];
        headCircumferenceData = whoHeadData?.filter(
          (point) => point.Sex === sex
        );
        bmiData = whoBmiData.filter((point) => point.Sex === sex);
        break;
      case "cdc_infant":
        weightData = cdcInfantWeightData.filter(
          (point) => Number(point.Sex) === sex
        );
        heightData = cdcInfantHeightData.filter(
          (point) => Number(point.Sex) === sex
        );
        headCircumferenceData = cdcInfantHeightHead?.filter(
          (point) => Number(point.Sex) === sex
        );
        bmiData = cdcBmiData.filter((point) => Number(point.Sex) === sex);
        break;
      case "cdc_child":
      default:
        weightData = cdcChildWeightData.filter(
          (point) => Number(point.Sex) === sex
        );
        heightData = cdcChildHeightData.filter(
          (point) => Number(point.Sex) === sex
        );
        bmiData = cdcBmiData.filter((point) => Number(point.Sex) === sex);
        break;
    }

    const weightDataPoint = interpolateDataPoint(
      ageInMonths,
      weightData as CdcDataPoint[]
    );
    const heightDataPoint = interpolateDataPoint(
      ageInMonths,
      heightData as CdcDataPoint[]
    );
    const bmiDataPoint = interpolateDataPoint(
      ageInMonths,
      bmiData as CdcDataPoint[]
    );

    const weightZScore = calculateZScore(
      weightVal,
      weightDataPoint.L,
      weightDataPoint.M,
      weightDataPoint.S
    );
    const heightZScore = calculateZScore(
      heightVal,
      heightDataPoint.L,
      heightDataPoint.M,
      heightDataPoint.S
    );
    const bmiZScore = calculateZScore(
      bmi,
      bmiDataPoint.L,
      bmiDataPoint.M,
      bmiDataPoint.S
    );

    const result = {
      weight: {
        value: weightVal.toFixed(1),
        percentile: zScoreToPercentile(weightZScore).toFixed(1),
        zScore: weightZScore.toFixed(2),
      },
      height: {
        value: heightVal.toFixed(1),
        percentile: zScoreToPercentile(heightZScore).toFixed(1),
        zScore: heightZScore.toFixed(2),
      },
      bmi: {
        value: bmi.toFixed(1),
        percentile: zScoreToPercentile(bmiZScore).toFixed(1),
        zScore: bmiZScore.toFixed(2),
      },
    };

    if (
      (selectedStandard === "cdc_infant" || selectedStandard === "who") &&
      headCircumferenceData &&
      headCircumference
    ) {
      const headCircumferenceVal = parseFloat(headCircumference);
      const headCircumferenceDataPoint = interpolateDataPoint(
        ageInMonths,
        headCircumferenceData as CdcDataPoint[]
      );
      const headCircumferenceZScore = calculateZScore(
        headCircumferenceVal,
        headCircumferenceDataPoint.L,
        headCircumferenceDataPoint.M,
        headCircumferenceDataPoint.S
      );

      return {
        ...result,
        headCircumference: {
          value: headCircumferenceVal.toFixed(1),
          percentile: zScoreToPercentile(headCircumferenceZScore).toFixed(1),
          zScore: headCircumferenceZScore.toFixed(2),
        },
      };
    }

    return result;
  }, [
    weight,
    height,
    headCircumference,
    gender,
    birthDate,
    measurementDate,
    selectedStandard,
    gestationalWeeks,
    gestationalDays,
    cdcChildWeightData,
    cdcChildHeightData,
    cdcInfantWeightData,
    cdcInfantHeightData,
    cdcInfantHeightHead,
    whoWeightData,
    whoHeightData,
    whoHeadData,
    intergrowthHeadData,
  ]);

  if (!results) return null;

  const reference = selectedStandard === "cdc_child" ? "²" : "¹";

  const getDataSourceText = (standard: string) => {
    switch (standard) {
      case "cdc_child":
        return t("results.dataSources.cdc_child");
      case "cdc_infant":
        return t("results.dataSources.cdc_infant");
      case "who":
        return t("results.dataSources.who");
      case "intergrowth":
        return t("results.dataSources.intergrowth");
      // case "kromeyer":
      //   return "Kromeyer-Hauschild Growth Reference (ages 0 to 18)";
      default:
        return "Growth Data Reference";
    }
  };

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="text-sm">
            <span className="font-medium">
              {t("results.measurements.weight")}:
            </span>{" "}
            {results.weight.value} kg
            <span className="text-medical-600 ml-2">
              ({results.weight.percentile}P, {results.weight.zScore}z)
              {reference}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium">
              {t("results.measurements.height")}:
            </span>{" "}
            {results.height.value} cm
            <span className="text-medical-600 ml-2">
              ({results.height.percentile}P, {results.height.zScore}z)
              {reference}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium">
              {t("results.measurements.bmi")}:
            </span>{" "}
            {results.bmi.value} kg/m²
            <span className="text-medical-600 ml-2">
              ({results.bmi.percentile}P, {results.bmi.zScore}z){reference}
            </span>
          </div>
          {results.headCircumference && (
            <div className="text-sm">
              <span className="font-medium">
                {t("results.measurements.headCircumference")}:
              </span>{" "}
              {results.headCircumference.value} cm
              <span className="text-medical-600 ml-2">
                ({results.headCircumference.percentile}P,{" "}
                {results.headCircumference.zScore}z)
                {reference}
              </span>
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-2">
            {t("results.dataSources.title")}:{" "}
            {getDataSourceText(selectedStandard)}
          </div>
          <ClinicalDisclaimer
            title={t("disclaimer.title")}
            points={[
              t("disclaimer.standardBased", {
                standard: getDataSourceText(selectedStandard),
              }),
              t("disclaimer.trackOverTime"),
              t("disclaimer.individualFactors"),
              t("disclaimer.responsibility"),
            ]}
            variant="medical"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default GrowthResults;
