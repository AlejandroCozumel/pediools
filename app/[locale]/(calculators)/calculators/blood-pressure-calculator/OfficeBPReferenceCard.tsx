"use client";
import React from "react";
import { Printer, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface OfficeBPReferenceCardProps {
  ageInYears?: number;
  gender: "male" | "female";
  height: number;
  heightPercentile?: number | null;
  // Add the JSON data props
  cdcChildHeightData?: any[];
  cdcInfantHeightData?: any[];
  patientSystolic?: number;
  patientDiastolic?: number;
}

export const aapScreeningTable: Record<
  "male" | "female",
  Record<string, { systolic: number; diastolic: number }>
> = {
  male: {
    "1": { systolic: 98, diastolic: 52 },
    "2": { systolic: 100, diastolic: 55 },
    "3": { systolic: 101, diastolic: 58 },
    "4": { systolic: 102, diastolic: 60 },
    "5": { systolic: 103, diastolic: 63 },
    "6": { systolic: 105, diastolic: 66 },
    "7": { systolic: 106, diastolic: 68 },
    "8": { systolic: 107, diastolic: 69 },
    "9": { systolic: 107, diastolic: 70 },
    "10": { systolic: 108, diastolic: 72 },
    "11": { systolic: 110, diastolic: 74 },
    "12": { systolic: 113, diastolic: 75 },
    "13": { systolic: 120, diastolic: 80 },
    "14": { systolic: 120, diastolic: 80 },
    "15": { systolic: 120, diastolic: 80 },
    "16": { systolic: 120, diastolic: 80 },
    "17": { systolic: 120, diastolic: 80 },
  },
  female: {
    "1": { systolic: 98, diastolic: 54 },
    "2": { systolic: 101, diastolic: 58 },
    "3": { systolic: 102, diastolic: 60 },
    "4": { systolic: 103, diastolic: 62 },
    "5": { systolic: 104, diastolic: 64 },
    "6": { systolic: 105, diastolic: 67 },
    "7": { systolic: 106, diastolic: 68 },
    "8": { systolic: 107, diastolic: 69 },
    "9": { systolic: 108, diastolic: 71 },
    "10": { systolic: 109, diastolic: 72 },
    "11": { systolic: 111, diastolic: 74 },
    "12": { systolic: 114, diastolic: 75 },
    "13": { systolic: 120, diastolic: 80 },
    "14": { systolic: 120, diastolic: 80 },
    "15": { systolic: 120, diastolic: 80 },
    "16": { systolic: 120, diastolic: 80 },
    "17": { systolic: 120, diastolic: 80 },
  },
};

// Function to calculate height percentile from actual growth data
function calculateHeightPercentileFromData(
  height: number,
  ageInMonths: number,
  gender: "male" | "female",
  cdcChildHeightData?: any[],
  cdcInfantHeightData?: any[]
): { percentile: number; source: string } | null {
  const sexCode = gender === "male" ? 1 : 2;

  // Determine which dataset to use based on age
  let data: any[] | undefined;
  let source: string;

  if (ageInMonths <= 36 && cdcInfantHeightData) {
    data = cdcInfantHeightData;
    source = "CDC Growth Charts (Infant)";
  } else if (cdcChildHeightData) {
    data = cdcChildHeightData;
    source = "CDC Growth Charts (Child)";
  } else {
    return null;
  }

  // Find the closest age match
  const ageEntry = data.find(
    (entry) => entry.Sex === sexCode && entry.Agemos === ageInMonths
  );

  if (!ageEntry) {
    // If exact age not found, find the closest age
    const sameGenderEntries = data.filter((entry) => entry.Sex === sexCode);
    const closestEntry = sameGenderEntries.reduce((prev, curr) => {
      return Math.abs(curr.Agemos - ageInMonths) <
        Math.abs(prev.Agemos - ageInMonths)
        ? curr
        : prev;
    });

    if (!closestEntry) return null;

    // Use the closest entry for calculation
    return calculatePercentileFromEntry(height, closestEntry, source);
  }

  return calculatePercentileFromEntry(height, ageEntry, source);
}

function calculatePercentileFromEntry(
  height: number,
  entry: any,
  source: string
): { percentile: number; source: string } {
  // Check which percentile fields are available
  const percentileFields = [];
  const percentileValues = [];

  // Common percentile fields across datasets
  const possibleFields = [
    "P3",
    "P5",
    "P10",
    "P15",
    "P25",
    "P50",
    "P75",
    "P85",
    "P90",
    "P95",
    "P97",
    "P99",
  ];

  for (const field of possibleFields) {
    if (entry[field] !== undefined && entry[field] !== null) {
      percentileFields.push(parseInt(field.substring(1))); // Remove 'P' and convert to number
      percentileValues.push(entry[field]);
    }
  }

  // If height is below the lowest percentile
  if (height <= percentileValues[0]) {
    return { percentile: percentileFields[0], source };
  }

  // If height is above the highest percentile
  if (height >= percentileValues[percentileValues.length - 1]) {
    return {
      percentile: percentileFields[percentileFields.length - 1],
      source,
    };
  }

  // Find the percentile range the height falls into
  for (let i = 0; i < percentileValues.length - 1; i++) {
    if (height >= percentileValues[i] && height <= percentileValues[i + 1]) {
      // Linear interpolation between percentiles
      const lowerPercentile = percentileFields[i];
      const upperPercentile = percentileFields[i + 1];
      const lowerValue = percentileValues[i];
      const upperValue = percentileValues[i + 1];

      const ratio = (height - lowerValue) / (upperValue - lowerValue);
      const interpolatedPercentile =
        lowerPercentile + ratio * (upperPercentile - lowerPercentile);

      return {
        percentile: Math.round(interpolatedPercentile * 10) / 10,
        source,
      };
    }
  }

  // Default to 50th percentile if calculation fails
  return { percentile: 50, source };
}

// Function to estimate possible ages based on height using growth data
function getEstimatedAgesFromHeightData(
  height: number,
  gender: "male" | "female",
  cdcChildHeightData?: any[],
  cdcInfantHeightData?: any[]
): number[] {
  const sexCode = gender === "male" ? 1 : 2;
  const possibleAges: number[] = [];

  // Combine all datasets
  const allData = [
    ...(cdcInfantHeightData || []),
    ...(cdcChildHeightData || []),
  ].filter((entry) => entry.Sex === sexCode);

  // Find ages where height falls within reasonable range (P10 to P90)
  for (const entry of allData) {
    const p10 = entry.P10 || entry.P5 || entry.P3;
    const p90 = entry.P90 || entry.P95 || entry.P97;

    if (p10 && p90 && height >= p10 && height <= p90) {
      const ageInYears = Math.floor(entry.Agemos / 12);
      if (
        ageInYears >= 1 &&
        ageInYears <= 17 &&
        !possibleAges.includes(ageInYears)
      ) {
        possibleAges.push(ageInYears);
      }
    }
  }

  // If no matches found, use fallback method
  if (possibleAges.length === 0) {
    return getEstimatedAgesFromHeightFallback(height, gender);
  }

  return possibleAges.sort((a, b) => a - b);
}

// Fallback function using approximate ranges
function getEstimatedAgesFromHeightFallback(
  height: number,
  gender: "male" | "female"
): number[] {
  const heightRanges = {
    male: [
      { age: 1, minHeight: 75, maxHeight: 87 },
      { age: 2, minHeight: 84, maxHeight: 96 },
      { age: 3, minHeight: 90, maxHeight: 105 },
      { age: 4, minHeight: 96, maxHeight: 112 },
      { age: 5, minHeight: 102, maxHeight: 119 },
      { age: 6, minHeight: 108, maxHeight: 125 },
      { age: 7, minHeight: 114, maxHeight: 131 },
      { age: 8, minHeight: 119, maxHeight: 137 },
      { age: 9, minHeight: 124, maxHeight: 143 },
      { age: 10, minHeight: 129, maxHeight: 149 },
      { age: 11, minHeight: 134, maxHeight: 156 },
      { age: 12, minHeight: 139, maxHeight: 164 },
      { age: 13, minHeight: 145, maxHeight: 175 },
      { age: 14, minHeight: 152, maxHeight: 182 },
      { age: 15, minHeight: 159, maxHeight: 186 },
      { age: 16, minHeight: 164, maxHeight: 188 },
      { age: 17, minHeight: 167, maxHeight: 190 },
    ],
    female: [
      { age: 1, minHeight: 74, maxHeight: 86 },
      { age: 2, minHeight: 83, maxHeight: 95 },
      { age: 3, minHeight: 89, maxHeight: 104 },
      { age: 4, minHeight: 95, maxHeight: 111 },
      { age: 5, minHeight: 101, maxHeight: 118 },
      { age: 6, minHeight: 107, maxHeight: 124 },
      { age: 7, minHeight: 112, maxHeight: 130 },
      { age: 8, minHeight: 117, maxHeight: 136 },
      { age: 9, minHeight: 122, maxHeight: 142 },
      { age: 10, minHeight: 127, maxHeight: 148 },
      { age: 11, minHeight: 132, maxHeight: 156 },
      { age: 12, minHeight: 139, maxHeight: 164 },
      { age: 13, minHeight: 145, maxHeight: 170 },
      { age: 14, minHeight: 149, maxHeight: 173 },
      { age: 15, minHeight: 152, maxHeight: 175 },
      { age: 16, minHeight: 153, maxHeight: 176 },
      { age: 17, minHeight: 154, maxHeight: 177 },
    ],
  };

  const ranges = heightRanges[gender];
  const possibleAges: number[] = [];

  for (const range of ranges) {
    if (height >= range.minHeight && height <= range.maxHeight) {
      possibleAges.push(range.age);
    }
  }

  if (possibleAges.length === 0) {
    const closest = ranges.reduce((prev, curr) => {
      const prevDistance = Math.min(
        Math.abs(height - prev.minHeight),
        Math.abs(height - prev.maxHeight)
      );
      const currDistance = Math.min(
        Math.abs(height - curr.minHeight),
        Math.abs(height - curr.maxHeight)
      );
      return currDistance < prevDistance ? curr : prev;
    });
    possibleAges.push(closest.age);
  }

  return possibleAges.sort((a, b) => a - b);
}

export function OfficeBPReferenceCard({
  ageInYears,
  gender,
  height,
  heightPercentile,
  cdcChildHeightData,
  cdcInfantHeightData,
  patientSystolic,
  patientDiastolic,
}: OfficeBPReferenceCardProps) {
  const t = useTranslations("BloodPressureCalculator.officeBPReference");

  // Determine what ages to show
  const agesToShow = ageInYears
    ? [ageInYears]
    : getEstimatedAgesFromHeightData(
        height,
        gender,
        cdcChildHeightData,
        cdcInfantHeightData
      );

  // Calculate actual height percentile if not provided and we have data
  let actualHeightPercentile = heightPercentile;
  let heightSource = "";

  if (
    !heightPercentile &&
    ageInYears &&
    (cdcChildHeightData || cdcInfantHeightData)
  ) {
    const ageInMonths = ageInYears * 12;
    const percentileData = calculateHeightPercentileFromData(
      height,
      ageInMonths,
      gender,
      cdcChildHeightData,
      cdcInfantHeightData
    );

    if (percentileData) {
      actualHeightPercentile = percentileData.percentile;
      heightSource = percentileData.source;
    }
  }

  // Calculate milestones for a specific age
  const calculateMilestonesForAge = (age: number) => {
    const screeningValues =
      aapScreeningTable[gender][String(age)] || aapScreeningTable[gender]["17"];

    // Height adjustment (only if we have height percentile)
    let heightAdjustment = 0;
    if (
      actualHeightPercentile !== null &&
      actualHeightPercentile !== undefined
    ) {
      const clampedHeightPercentile = Math.max(
        1,
        Math.min(99.9, actualHeightPercentile)
      );
      const heightZScore = (clampedHeightPercentile - 50) / 25;
      heightAdjustment = heightZScore * 1.5;
    }

    const p90Systolic = Math.round(screeningValues.systolic + heightAdjustment);
    const p90Diastolic = Math.round(
      screeningValues.diastolic + heightAdjustment
    );

    // Calculate all percentiles
    const p50Systolic = Math.round(p90Systolic - 15);
    const p50Diastolic = Math.round(p90Diastolic - 12);

    const p10Systolic = Math.round(p50Systolic - 12);
    const p10Diastolic = Math.round(p50Diastolic - 8);

    const p5Systolic = Math.round(p50Systolic - 16);
    const p5Diastolic = Math.round(p50Diastolic - 10);

    const p3Systolic = Math.round(p50Systolic - 20);
    const p3Diastolic = Math.round(p50Diastolic - 12);

    const p95Systolic = Math.round(p90Systolic + 8);
    const p95Diastolic = Math.round(p90Diastolic + 6);

    const stage2Systolic = Math.round(p95Systolic + 12);
    const stage2Diastolic = Math.round(p95Diastolic + 12);

    return {
      age,
      p3: { systolic: p3Systolic, diastolic: p3Diastolic },
      p5: { systolic: p5Systolic, diastolic: p5Diastolic },
      p10: { systolic: p10Systolic, diastolic: p10Diastolic },
      p50: { systolic: p50Systolic, diastolic: p50Diastolic },
      p90: { systolic: p90Systolic, diastolic: p90Diastolic },
      p95: { systolic: p95Systolic, diastolic: p95Diastolic },
      stage2: { systolic: stage2Systolic, diastolic: stage2Diastolic },
    };
  };

  // Function to determine which percentile range the patient's BP falls into
  const getPatientBPCategory = (
      patientSys: number,
      patientDia: number,
      milestones: any
    ): "stage2" | "p95" | "p90" | "p50" | "p10" | "p5" | "p3" | null => {
      if (!patientSys || !patientDia) return null;

      // Find the appropriate percentile range where patient falls
      // Use the higher classification from either systolic or diastolic

      // Check if above stage 2 threshold
      if (
        patientSys >= milestones.stage2.systolic ||
        patientDia >= milestones.stage2.diastolic
      ) {
        return "stage2";
      }

      // Check if above p95 threshold
      if (
        patientSys >= milestones.p95.systolic ||
        patientDia >= milestones.p95.diastolic
      ) {
        return "p95";
      }

      // Check if above p90 threshold (EXACTLY at 90th percentile = elevated)
      if (
        patientSys >= milestones.p90.systolic ||
        patientDia >= milestones.p90.diastolic
      ) {
        return "p90";
      }

      // Check if above p10 threshold but below p90 (normal range)
      if (
        patientSys >= milestones.p10.systolic &&
        patientDia >= milestones.p10.diastolic &&
        patientSys < milestones.p90.systolic &&
        patientDia < milestones.p90.diastolic
      ) {
        return "p50"; // Normal range
      }

      // Check if above p5 threshold but below p10
      if (
        patientSys >= milestones.p5.systolic ||
        patientDia >= milestones.p5.diastolic
      ) {
        return "p5";
      }

      // Below p5 threshold
      return "p3";
    };

  const milestonesData = agesToShow.map(calculateMilestonesForAge);
  const isHeightOnlyMode = !ageInYears;

  // Get patient's BP category for highlighting (use first age if multiple)
  const patientBPCategory =
    patientSystolic && patientDiastolic
      ? getPatientBPCategory(
          patientSystolic,
          patientDiastolic,
          milestonesData[0]
        )
      : null;

  const handlePrint = () => {
    const printContent = document.getElementById("office-bp-reference-card");
    if (printContent) {
      const newWindow = window.open("", "_blank", "height=600,width=800");
      newWindow?.document.write(
        "<html><head><title>Print Reference Card</title>"
      );

      const styles = Array.from(document.styleSheets)
        .map((styleSheet) =>
          styleSheet.href
            ? `<link rel="stylesheet" href="${styleSheet.href}">`
            : ""
        )
        .join("");
      newWindow?.document.write(styles);
      newWindow?.document.write(
        "<style>@media print { body { -webkit-print-color-adjust: exact; } .print-hidden { display: none !important; } }</style>"
      );
      newWindow?.document.write('</head><body class="p-4">');
      newWindow?.document.write(printContent.innerHTML);
      newWindow?.document.write("</body></html>");
      newWindow?.document.close();
      newWindow?.focus();
      setTimeout(() => {
        newWindow?.print();
      }, 500);
    }
  };

  const subtitleText = ageInYears
    ? t("subtitle", {
        gender: gender === "male" ? "boy" : "girl",
        age: ageInYears,
        height,
        percentile: actualHeightPercentile?.toFixed(1) || "unknown",
      })
    : t("subtitleHeightOnly", {
        gender: gender === "male" ? "boy" : "girl",
        height,
        ageRange:
          agesToShow.length > 1
            ? `${agesToShow[0]}-${agesToShow[agesToShow.length - 1]}`
            : agesToShow[0].toString(),
      });

  return (
    <div className="mt-6" id="office-bp-reference-card">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-xs text-muted-foreground">{subtitleText}</p>
          {isHeightOnlyMode && (
            <div className="flex items-center gap-2 mt-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <p className="text-xs text-amber-600">{t("heightOnlyWarning")}</p>
            </div>
          )}
          {heightSource && (
            <p className="text-xs text-blue-600 mt-1">
              {t("heightPercentileSource") ||
                "Height percentile calculated from"}
              : {heightSource}
            </p>
          )}
        </div>
        <Button
          onClick={handlePrint}
          size="sm"
          variant="outline"
          className="print-hidden"
        >
          <Printer className="w-4 h-4 mr-2" />
          {t("print")}
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr
              className={cn(
                "text-white",
                gender === "male" ? "bg-medical-600" : "bg-medical-pink-600"
              )}
            >
              {agesToShow.length > 1 && (
                <th className="p-3 font-semibold text-left">{t("age")}</th>
              )}
              <th className="p-3 font-semibold text-left">{t("milestone")}</th>
              <th className="p-3 font-semibold text-center">{t("bpValue")}</th>
              <th className="p-3 font-semibold text-left">
                {t("clinicalMeaning")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {milestonesData.map((milestones, ageIndex) => (
              <React.Fragment key={milestones.age}>
                {/* 3rd Percentile - Critical Hypotension */}
                <tr
                  className={cn(
                    "bg-red-100",
                    patientBPCategory === "p3" && "border-l-4 border-l-red-700"
                  )}
                >
                  {agesToShow.length > 1 && (
                    <td
                      className="p-3 text-center font-semibold text-gray-700"
                      rowSpan={7}
                    >
                      {milestones.age} {t("years")}
                    </td>
                  )}
                  <td className="p-3 text-left font-semibold text-red-900">
                    {t("percentile3") || "3rd Percentile"}
                  </td>
                  <td className="p-3 text-center font-mono font-black text-red-950">
                    {milestones.p3.systolic}/{milestones.p3.diastolic}
                  </td>
                  <td className="p-3 text-left text-xs text-gray-700">
                    {t("criticalHypotension") || "Critical hypotension"}
                  </td>
                </tr>

                {/* 5th Percentile - Severe Hypotension */}
                <tr
                  className={cn(
                    "bg-red-50",
                    patientBPCategory === "p5" && "border-l-4 border-l-red-500"
                  )}
                >
                  <td className="p-3 text-left font-semibold text-red-800">
                    {t("percentile5")}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-red-900">
                    {milestones.p5.systolic}/{milestones.p5.diastolic}
                  </td>
                  <td className="p-3 text-left text-xs text-gray-700">
                    {t("severeHypotension")}
                  </td>
                </tr>

                {/* 10th Percentile - Mild Hypotension */}
                <tr
                  className={cn(
                    "bg-orange-50",
                    patientBPCategory === "p10" &&
                      "border-l-4 border-l-orange-500"
                  )}
                >
                  <td className="p-3 text-left font-semibold text-orange-800">
                    {t("percentile10")}
                  </td>
                  <td className="p-3 text-center font-mono font-semibold text-orange-900">
                    {milestones.p10.systolic}/{milestones.p10.diastolic}
                  </td>
                  <td className="p-3 text-left text-xs text-gray-700">
                    {t("mildHypotension")}
                  </td>
                </tr>

                {/* 50th Percentile - Normal */}
                <tr
                  className={cn(
                    "bg-green-50",
                    patientBPCategory === "p50" &&
                      "border-l-4 border-l-green-700"
                  )}
                >
                  <td className="p-3 text-left font-semibold text-green-800">
                    {t("percentile50")}
                  </td>
                  <td className="p-3 text-center font-mono text-green-900">
                    {milestones.p50.systolic}/{milestones.p50.diastolic}
                  </td>
                  <td className="p-3 text-left text-xs text-gray-700">
                    {t("averageBP")}
                  </td>
                </tr>

                {/* 90th Percentile - Elevated */}
                <tr
                  className={cn(
                    "bg-yellow-50",
                    patientBPCategory === "p90" &&
                      "border-l-4 border-l-yellow-500"
                  )}
                >
                  <td className="p-3 text-left font-semibold text-yellow-800">
                    {t("percentile90")}
                  </td>
                  <td className="p-3 text-center font-mono font-semibold text-yellow-900">
                    {milestones.p90.systolic}/{milestones.p90.diastolic}
                  </td>
                  <td className="p-3 text-left text-xs text-gray-700">
                    {t("elevatedBP")}
                  </td>
                </tr>

                {/* 95th Percentile - Stage 1 Hypertension */}
                <tr
                  className={cn(
                    "bg-orange-50",
                    patientBPCategory === "p95" &&
                      "border-l-4 border-l-orange-500"
                  )}
                >
                  <td className="p-3 text-left font-semibold text-orange-800">
                    {t("percentile95")}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-orange-900">
                    {milestones.p95.systolic}/{milestones.p95.diastolic}
                  </td>
                  <td className="p-3 text-left text-xs text-gray-700">
                    {t("stage1Hypertension")}
                  </td>
                </tr>

                {/* Stage 2 Hypertension */}
                <tr
                  className={cn(
                    "bg-red-100",
                    patientBPCategory === "stage2" &&
                      "border-l-4 border-l-red-700"
                  )}
                >
                  <td className="p-3 text-left font-semibold text-red-900">
                    {t("stage2Threshold")}
                  </td>
                  <td className="p-3 text-center font-mono font-black text-red-950">
                    {milestones.stage2.systolic}/{milestones.stage2.diastolic}
                  </td>
                  <td className="p-3 text-left text-xs text-gray-700">
                    {t("stage2Hypertension")}
                  </td>
                </tr>

                {/* Add spacing between different ages */}
                {ageIndex < milestonesData.length - 1 && (
                  <tr className="bg-gray-100">
                    <td
                      colSpan={agesToShow.length > 1 ? 4 : 3}
                      className="p-1"
                    ></td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={agesToShow.length > 1 ? 4 : 3}
                className="p-3 text-xs text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 text-medical-600" />
                  <div>
                    <p>{t("footer")}</p>
                    {actualHeightPercentile && (
                      <p className="mt-1 text-blue-600">
                        {t("heightAdjustment", {
                          percentile: actualHeightPercentile.toFixed(1),
                        })}
                        {heightSource && ` (${heightSource})`}
                      </p>
                    )}
                    {isHeightOnlyMode && (
                      <p className="mt-1 text-amber-600">
                        {t("heightOnlyDisclaimer")}
                      </p>
                    )}
                    <p className="mt-1 text-blue-600">{t("hypotensionNote")}</p>
                    <p className="mt-1 text-gray-500">
                      {t("dataSource") ||
                        "Height percentiles calculated using CDC growth standards when available."}
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}