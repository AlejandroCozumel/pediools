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

function calculateHeightPercentileFromData(
  height: number,
  ageInMonths: number,
  gender: "male" | "female",
  cdcChildHeightData?: any[],
  cdcInfantHeightData?: any[]
): { percentile: number; source: string } | null {
  const sexCode = gender === "male" ? 1 : 2;
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

  const ageEntry = data.find(
    (entry) => entry.Sex === sexCode && entry.Agemos === ageInMonths
  );

  if (!ageEntry) {
    const sameGenderEntries = data.filter((entry) => entry.Sex === sexCode);
    if (sameGenderEntries.length === 0) return null;
    const closestEntry = sameGenderEntries.reduce((prev, curr) => {
      return Math.abs(curr.Agemos - ageInMonths) <
        Math.abs(prev.Agemos - ageInMonths)
        ? curr
        : prev;
    });
    if (!closestEntry) return null;
    return calculatePercentileFromEntry(height, closestEntry, source);
  }

  return calculatePercentileFromEntry(height, ageEntry, source);
}

function calculatePercentileFromEntry(
  height: number,
  entry: any,
  source: string
): { percentile: number; source: string } {
  const percentileFields: number[] = [];
  const percentileValues: number[] = [];
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
      percentileFields.push(parseInt(field.substring(1)));
      percentileValues.push(entry[field]);
    }
  }

  if (percentileValues.length < 2) return { percentile: 50, source };

  if (height <= percentileValues[0])
    return { percentile: percentileFields[0], source };
  if (height >= percentileValues[percentileValues.length - 1])
    return {
      percentile: percentileFields[percentileFields.length - 1],
      source,
    };

  for (let i = 0; i < percentileValues.length - 1; i++) {
    if (height >= percentileValues[i] && height <= percentileValues[i + 1]) {
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

  return { percentile: 50, source };
}

function getEstimatedAgesFromHeightData(
  height: number,
  gender: "male" | "female",
  cdcChildHeightData?: any[],
  cdcInfantHeightData?: any[]
): number[] {
  const sexCode = gender === "male" ? 1 : 2;
  const possibleAges: number[] = [];
  const allData = [
    ...(cdcInfantHeightData || []),
    ...(cdcChildHeightData || []),
  ].filter((entry) => entry.Sex === sexCode);

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

  if (possibleAges.length === 0) {
    // Fallback can be implemented here if needed
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
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

  const agesToShow = ageInYears
    ? [ageInYears]
    : getEstimatedAgesFromHeightData(
        height,
        gender,
        cdcChildHeightData,
        cdcInfantHeightData
      );

  let actualHeightPercentile = heightPercentile;
  let heightSource = "";

  if (
    !heightPercentile &&
    ageInYears &&
    (cdcChildHeightData || cdcInfantHeightData)
  ) {
    const ageInMonths = ageInYears * 12.5; // Use 0.5 to better match Agemos
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

  const calculateMilestonesForAge = (age: number) => {
    const screeningValues =
      aapScreeningTable[gender][String(age)] || aapScreeningTable[gender]["17"];
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

  const getPatientBPCategory = (
    patientSys: number,
    patientDia: number,
    milestones: any
  ): "stage2" | "p95" | "p90" | "p50" | "p10" | "p5" | "p3" | null => {
    if (!patientSys || !patientDia) return null;

    // Hypertension checks...
    if (
      patientSys >= milestones.stage2.systolic ||
      patientDia >= milestones.stage2.diastolic
    )
      return "stage2";
    if (
      patientSys >= milestones.p95.systolic ||
      patientDia >= milestones.p95.diastolic
    )
      return "p95";
    if (
      patientSys >= milestones.p90.systolic ||
      patientDia >= milestones.p90.diastolic
    )
      return "p90";

    if (
      patientSys <= milestones.p3.systolic ||
      patientDia <= milestones.p3.diastolic
    )
      return "p3";

    if (
      patientSys <= milestones.p5.systolic ||
      patientDia <= milestones.p5.diastolic
    )
      return "p5";

    if (
      patientSys <= milestones.p10.systolic ||
      patientDia <= milestones.p10.diastolic
    )
      return "p10";

    return "p50";
  };

  const milestonesData = agesToShow.map(calculateMilestonesForAge);
  const isHeightOnlyMode = !ageInYears;

  const patientBPCategory =
    patientSystolic && patientDiastolic
      ? getPatientBPCategory(
          patientSystolic,
          patientDiastolic,
          milestonesData[0]
        )
      : null;

  const handlePrint = () => {
    window.print();
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
      <div className="flex justify-between items-center mb-4 print-hidden">
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
              {t("heightPercentileSource")}: {heightSource}
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
                {agesToShow.length > 1 && ageIndex > 0 && (
                  <tr className="bg-gray-200">
                    <td colSpan={4} className="p-1"></td>
                  </tr>
                )}
                {/* Age Row (if needed) */}
                {agesToShow.length > 1 && (
                  <tr className="bg-gray-100 font-bold text-gray-700">
                    <td colSpan={4} className="p-2 text-center">
                      {milestones.age} {t("years")}
                    </td>
                  </tr>
                )}

                {/* Rows for each milestone */}
                <tr
                  className={cn(
                    "bg-red-100",
                    patientBPCategory === "p3" &&
                      "border-l-4 border-red-700 font-bold"
                  )}
                >
                  <td className="p-3 text-left font-semibold text-red-900">
                    {t("percentile3")}
                  </td>
                  <td className="p-3 text-center font-mono font-black text-red-950">
                    {milestones.p3.systolic}/{milestones.p3.diastolic}
                  </td>
                  <td className="p-3 text-left text-xs text-gray-700">
                    {t("criticalHypotension")}
                  </td>
                </tr>
                <tr
                  className={cn(
                    "bg-red-50",
                    patientBPCategory === "p5" &&
                      "border-l-4 border-red-500 font-bold"
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
                <tr
                  className={cn(
                    "bg-orange-50",
                    patientBPCategory === "p10" &&
                      "border-l-4 border-orange-500 font-bold"
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
                <tr
                  className={cn(
                    "bg-green-50",
                    patientBPCategory === "p50" &&
                      "border-l-4 border-green-700 font-bold"
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
                <tr
                  className={cn(
                    "bg-yellow-50",
                    patientBPCategory === "p90" &&
                      "border-l-4 border-yellow-500 font-bold"
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
                <tr
                  className={cn(
                    "bg-orange-100",
                    patientBPCategory === "p95" &&
                      "border-l-4 border-orange-600 font-bold"
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
                <tr
                  className={cn(
                    "bg-red-100",
                    patientBPCategory === "stage2" &&
                      "border-l-4 border-red-700 font-bold"
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
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={agesToShow.length > 1 ? 4 : 3}
                className="p-3 text-xs text-muted-foreground"
              >
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 text-medical-600 mt-0.5" />
                  <div>
                    <p>{t("footer")}</p>
                    {actualHeightPercentile && (
                      <p className="mt-1 text-blue-600">
                        {t("heightAdjustment", {
                          percentile: actualHeightPercentile.toFixed(1),
                        })}
                      </p>
                    )}
                    <p className="mt-1 text-blue-600">{t("hypotensionNote")}</p>
                    <p className="mt-1 text-gray-500">{t("dataSource")}</p>
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
