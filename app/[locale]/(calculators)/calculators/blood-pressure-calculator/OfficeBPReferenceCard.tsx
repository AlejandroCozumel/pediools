"use client";
import React from "react";
import { Printer, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface OfficeBPReferenceCardProps {
  ageInYears: number;
  gender: "male" | "female";
  height: number;
  aapBPData: any;
  patientSystolic?: number;
  patientDiastolic?: number;
}

function getAAPDataByHeight(
  ageInYears: number,
  heightCm: number,
  gender: "male" | "female",
  aapBPData: any
) {
  const genderKey = gender === "male" ? "boys" : "girls";
  const ageData = aapBPData[genderKey]?.[String(ageInYears)];
  if (!ageData) return null;

  const heightPercentileKeys = [
    "5th",
    "10th",
    "25th",
    "50th",
    "75th",
    "90th",
    "95th",
  ];
  const heightPercentileNumeric = [5, 10, 25, 50, 75, 90, 95];

  const heightValues = heightPercentileKeys.map(
    (key) => ageData.heights[key].cm
  );
  const minHeight = Math.min(...heightValues);
  const maxHeight = Math.max(...heightValues);

  let heightStatus:
    | "within_range"
    | "below_range"
    | "above_range"
    | "extrapolated";
  let usedPercentile: number;
  let closestHeightIndex: number;
  let interpolationWarning: string | null = null;

  if (heightCm < minHeight) {
    heightStatus = "below_range";
    usedPercentile = 5;
    closestHeightIndex = 0; // Use 5th percentile data
    interpolationWarning = "extrapolated_to_5th";
  } else if (heightCm > maxHeight) {
    heightStatus = "above_range";
    usedPercentile = 95;
    closestHeightIndex = heightPercentileKeys.length - 1; // Use 95th percentile data
    interpolationWarning = "extrapolated_to_95th";
  } else {
    heightStatus = "within_range";

    let smallestDifference = Infinity;
    closestHeightIndex = 0;

    heightPercentileKeys.forEach((key, index) => {
      const percentileHeightCm = ageData.heights[key].cm;
      const difference = Math.abs(heightCm - percentileHeightCm);
      if (difference < smallestDifference) {
        smallestDifference = difference;
        closestHeightIndex = index;
      }
    });

    usedPercentile = heightPercentileNumeric[closestHeightIndex];

    const exactHeight =
      ageData.heights[heightPercentileKeys[closestHeightIndex]].cm;
    if (Math.abs(heightCm - exactHeight) > 0.5) {
      // More than 0.5cm difference
      interpolationWarning = "interpolated_between_percentiles";
      heightStatus = "extrapolated";
    }
  }

  const bp = ageData.bp;

  return {
    thresholds: {
      p50: {
        systolic: bp["50th"].systolic[closestHeightIndex],
        diastolic: bp["50th"].diastolic[closestHeightIndex],
      },
      p90: {
        systolic: bp["90th"].systolic[closestHeightIndex],
        diastolic: bp["90th"].diastolic[closestHeightIndex],
      },
      p95: {
        systolic: bp["95th"].systolic[closestHeightIndex],
        diastolic: bp["95th"].diastolic[closestHeightIndex],
      },
    },
    heightPercentile: usedPercentile,
    actualHeightCm:
      ageData.heights[heightPercentileKeys[closestHeightIndex]].cm,
    patientHeightCm: heightCm,
    heightStatus,
    interpolationWarning,
    heightRange: {
      min: minHeight,
      max: maxHeight,
      isWithinRange: heightStatus === "within_range",
    },
  };
}

export function OfficeBPReferenceCard({
  ageInYears,
  gender,
  height,
  aapBPData,
  patientSystolic,
  patientDiastolic,
}: OfficeBPReferenceCardProps) {
  const t = useTranslations("BloodPressureCalculator.officeBPReference");

  // Get AAP data for this patient
  const aapData = getAAPDataByHeight(ageInYears, height, gender, aapBPData);

  if (!aapData) {
    return (
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <p className="text-sm text-yellow-800">{t("noDataAvailable")}</p>
        </div>
      </div>
    );
  }

  const getHeightStatusMessage = () => {
    const {
      heightStatus,
      interpolationWarning,
      heightPercentile,
      patientHeightCm,
      actualHeightCm,
      heightRange,
    } = aapData;

    switch (heightStatus) {
      case "below_range":
        return {
          type: "warning",
          message: t("heightStatus.belowRange", {
            defaultValue: `Patient height (${patientHeightCm}cm) is below 5th percentile range. Values extrapolated from 5th percentile data (${actualHeightCm}cm).`,
            patientHeight: patientHeightCm,
            actualHeight: actualHeightCm,
            minHeight: heightRange.min,
          }),
        };

      case "above_range":
        return {
          type: "warning",
          message: t("heightStatus.aboveRange", {
            defaultValue: `Patient height (${patientHeightCm}cm) is above 95th percentile range. Values extrapolated from 95th percentile data (${actualHeightCm}cm).`,
            patientHeight: patientHeightCm,
            actualHeight: actualHeightCm,
            maxHeight: heightRange.max,
          }),
        };

      case "extrapolated":
        return {
          type: "info",
          message: t("heightStatus.interpolated", {
            defaultValue: `Patient height (${patientHeightCm}cm) interpolated to ${heightPercentile}th percentile (${actualHeightCm}cm).`,
            patientHeight: patientHeightCm,
            percentile: heightPercentile,
            actualHeight: actualHeightCm,
          }),
        };

      default:
        return {
          type: "success",
          message: t("heightStatus.exactMatch", {
            defaultValue: `Patient height matches ${heightPercentile}th percentile (${actualHeightCm}cm).`,
            percentile: heightPercentile,
            actualHeight: actualHeightCm,
          }),
        };
    }
  };

  const heightStatusInfo = getHeightStatusMessage();

  const calculateScientificPercentiles = (
    p50: number,
    p90: number,
    p95: number
  ) => {
    // Calculate SD from AAP data
    const sd90 = (p90 - p50) / 1.28;
    const sd95 = (p95 - p50) / 1.645;
    const avgSD = (sd90 + sd95) / 2;

    // Ensure minimum reasonable values
    const p10 = Math.round(p50 - 1.28 * avgSD);
    const p5 = Math.round(p50 - 1.645 * avgSD);
    const p3 = Math.round(p50 - 1.88 * avgSD);

    return { p3, p5, p10 };
  };

  const { thresholds, heightPercentile, actualHeightCm } = aapData;
  const { p50, p90, p95 } = thresholds;

  // Calculate all milestones
  const calculateMilestones = () => {
    // Use scientific calculation instead of hardcoded offsets
    const scientificPercentiles = calculateScientificPercentiles(
      p50.systolic,
      p90.systolic,
      p95.systolic
    );
    const scientificPercentilesDiastolic = calculateScientificPercentiles(
      p50.diastolic,
      p90.diastolic,
      p95.diastolic
    );

    const stage2Systolic = Math.round(p95.systolic + 12);
    const stage2Diastolic = Math.round(p95.diastolic + 12);

    return {
      p3: {
        systolic: scientificPercentiles.p3,
        diastolic: scientificPercentilesDiastolic.p3,
      },
      p5: {
        systolic: scientificPercentiles.p5,
        diastolic: scientificPercentilesDiastolic.p5,
      },
      p10: {
        systolic: scientificPercentiles.p10,
        diastolic: scientificPercentilesDiastolic.p10,
      },
      p50: { systolic: p50.systolic, diastolic: p50.diastolic },
      p90: { systolic: p90.systolic, diastolic: p90.diastolic },
      p95: { systolic: p95.systolic, diastolic: p95.diastolic },
      stage2: { systolic: stage2Systolic, diastolic: stage2Diastolic },
    };
  };

  const milestones = calculateMilestones();

  const getPatientBPCategory = (
    patientSys: number,
    patientDia: number
  ): "stage2" | "p95" | "p90" | "p50" | "p10" | "p5" | "p3" | null => {
    if (!patientSys || !patientDia) return null;

    // Always use percentile-based classification for ages 1-17 (AAP data range)
    // Check highest categories first
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

    // Check hypotension categories (lowest values first)
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

    // If none of the above, patient is in normal range (around 50th percentile)
    return "p50";
  };

  const patientBPCategory =
    patientSystolic && patientDiastolic
      ? getPatientBPCategory(patientSystolic, patientDiastolic)
      : null;

  const handlePrint = () => {
    window.print();
  };

  const subtitleText = t("subtitle", {
    gender: gender === "male" ? "boy" : "girl",
    age: ageInYears,
    height: height,
    percentile: heightPercentile.toFixed(0),
  });

  // Helper function to get row styling
  const getRowStyling = (category: string) => {
    const isHighlighted = patientBPCategory === category;

    switch (category) {
      case "p3":
        return cn(
          "bg-red-100",
          isHighlighted && "border-l-4 border-red-700 font-bold bg-red-200"
        );
      case "p5":
        return cn(
          "bg-red-50",
          isHighlighted && "border-l-4 border-red-500 font-bold bg-red-100"
        );
      case "p10":
        return cn(
          "bg-orange-50",
          isHighlighted &&
            "border-l-4 border-orange-500 font-bold bg-orange-100"
        );
      case "p50":
        return cn(
          "bg-green-50",
          isHighlighted && "border-l-4 border-green-700 font-bold bg-green-100"
        );
      case "p90":
        return cn(
          "bg-yellow-50",
          isHighlighted &&
            "border-l-4 border-yellow-500 font-bold bg-yellow-100"
        );
      case "p95":
        return cn(
          "bg-orange-100",
          isHighlighted &&
            "border-l-4 border-orange-600 font-bold bg-orange-200"
        );
      case "stage2":
        return cn(
          "bg-red-100",
          isHighlighted && "border-l-4 border-red-700 font-bold bg-red-200"
        );
      default:
        return "";
    }
  };

  return (
    <div className="mt-6" id="office-bp-reference-card">
      <div className="w-full justify-between items-center mb-4 print-hidden">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap justify-between gap-2 w-full">
            <h3 className="text-lg font-semibold">
              {t("title", { defaultValue: "BP Reference Values" })}
            </h3>
            <Button
              onClick={handlePrint}
              size="sm"
              variant="outline"
              className="print-hidden"
            >
              <Printer className="w-4 h-4 mr-2" />
              {t("print", { defaultValue: "Print" })}
            </Button>
          </div>
          <div
            className={cn(
              "text-xs mt-2 p-2 rounded",
              heightStatusInfo.type === "warning" &&
                "bg-amber-50 text-amber-800 border border-amber-200",
              heightStatusInfo.type === "info" &&
                "bg-blue-50 text-blue-800 border border-blue-200",
              heightStatusInfo.type === "success" &&
                "bg-green-50 text-green-800 border border-green-200"
            )}
          >
            <div className="flex items-start gap-2">
              {heightStatusInfo.type === "warning" && (
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              )}
              {heightStatusInfo.type === "info" && (
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              )}
              {heightStatusInfo.type === "success" && (
                <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              )}
              <span>{heightStatusInfo.message}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{subtitleText}</p>
          <p className="text-xs text-blue-600 mt-1">
            {t("heightMatch", {
              defaultValue: `Height matched to ${heightPercentile}th percentile (${actualHeightCm} cm) - AAP Guidelines`,
              percentile: heightPercentile,
              heightCm: actualHeightCm,
            })}
          </p>
          {patientSystolic && patientDiastolic && (
            <p className="text-xs text-purple-600 mt-1">
              {t("patientBP", {
                defaultValue: `Patient BP: ${patientSystolic}/${patientDiastolic} mmHg (highlighted below)`,
                systolic: patientSystolic,
                diastolic: patientDiastolic,
              })}
            </p>
          )}
        </div>
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
              <th className="p-3 font-semibold text-left">
                {t("milestone", { defaultValue: "BP Percentile" })}
              </th>
              <th className="p-3 font-semibold text-center">
                {t("bpValue", { defaultValue: "BP Value (mmHg)" })}
              </th>
              <th className="p-3 font-semibold text-left">
                {t("clinicalMeaning", {
                  defaultValue: "Clinical Significance",
                })}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* Estimated Percentiles Section Header */}
            <tr className="bg-amber-50 border-amber-200">
              <td colSpan={3} className="p-2 text-center">
                <div className="flex items-center justify-center gap-2 text-xs">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span className="font-medium text-amber-800">
                    {t("estimatedPercentiles.title", {
                      defaultValue:
                        "Estimated Percentiles (Not Official AAP Data)",
                    })}
                  </span>
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  {t("estimatedPercentiles.description", {
                    defaultValue:
                      "The following percentiles are calculated estimates based on our formula using AAP 50th percentile data.",
                  })}
                </p>
              </td>
            </tr>

            <tr className={getRowStyling("p3")}>
              <td className="p-3 text-left font-semibold text-red-900">
                {t("percentile3", { defaultValue: "3rd Percentile*" })}
              </td>
              <td className="p-3 text-center font-mono font-black text-red-950">
                {milestones.p3.systolic}/{milestones.p3.diastolic}
              </td>
              <td className="p-3 text-left text-xs text-gray-700">
                {t("criticalHypotension", {
                  defaultValue: "Critical hypotension - immediate evaluation",
                })}
              </td>
            </tr>

            <tr className={getRowStyling("p5")}>
              <td className="p-3 text-left font-semibold text-red-800">
                {t("percentile5", { defaultValue: "5th Percentile*" })}
              </td>
              <td className="p-3 text-center font-mono font-bold text-red-900">
                {milestones.p5.systolic}/{milestones.p5.diastolic}
              </td>
              <td className="p-3 text-left text-xs text-gray-700">
                {t("severeHypotension", {
                  defaultValue: "Severe hypotension - needs evaluation",
                })}
              </td>
            </tr>

            <tr className={getRowStyling("p10")}>
              <td className="p-3 text-left font-semibold text-orange-800">
                {t("percentile10", { defaultValue: "10th Percentile*" })}
              </td>
              <td className="p-3 text-center font-mono font-semibold text-orange-900">
                {milestones.p10.systolic}/{milestones.p10.diastolic}
              </td>
              <td className="p-3 text-left text-xs text-gray-700">
                {t("mildHypotension", {
                  defaultValue: "Mild hypotension - monitor",
                })}
              </td>
            </tr>

            {/* Official AAP Data Section Header */}
            <tr className="bg-green-50 border-green-200">
              <td colSpan={3} className="p-2 text-center">
                <div className="flex items-center justify-center gap-2 text-xs">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="font-medium text-green-800">
                    {t("officialAAPData.title", {
                      defaultValue: "Official AAP 2017 Guidelines Data",
                    })}
                  </span>
                </div>
              </td>
            </tr>

            <tr className={getRowStyling("p50")}>
              <td className="p-3 text-left font-semibold text-green-800">
                {t("percentile50", {
                  defaultValue: "50th Percentile (Median)",
                })}
              </td>
              <td className="p-3 text-center font-mono text-green-900">
                {milestones.p50.systolic}/{milestones.p50.diastolic}
              </td>
              <td className="p-3 text-left text-xs text-gray-700">
                {t("averageBP", {
                  defaultValue: "Normal BP - average for age/height",
                })}
              </td>
            </tr>

            <tr className={getRowStyling("p90")}>
              <td className="p-3 text-left font-semibold text-yellow-800">
                {t("percentile90", { defaultValue: "90th Percentile" })}
              </td>
              <td className="p-3 text-center font-mono font-semibold text-yellow-900">
                {milestones.p90.systolic}/{milestones.p90.diastolic}
              </td>
              <td className="p-3 text-left text-xs text-gray-700">
                {t("elevatedBP", {
                  defaultValue: "Elevated BP - lifestyle counseling",
                })}
              </td>
            </tr>

            <tr className={getRowStyling("p95")}>
              <td className="p-3 text-left font-semibold text-orange-800">
                {t("percentile95", { defaultValue: "95th Percentile" })}
              </td>
              <td className="p-3 text-center font-mono font-bold text-orange-900">
                {milestones.p95.systolic}/{milestones.p95.diastolic}
              </td>
              <td className="p-3 text-left text-xs text-gray-700">
                {t("stage1Hypertension", {
                  defaultValue:
                    "Stage 1 Hypertension - confirm on repeat visits",
                })}
              </td>
            </tr>

            <tr className={getRowStyling("stage2")}>
              <td className="p-3 text-left font-semibold text-red-900">
                {t("stage2Threshold", { defaultValue: "Stage 2 Threshold" })}
              </td>
              <td className="p-3 text-center font-mono font-black text-red-950">
                {milestones.stage2.systolic}/{milestones.stage2.diastolic}
              </td>
              <td className="p-3 text-left text-xs text-gray-700">
                {t("stage2Hypertension", {
                  defaultValue: "Stage 2 Hypertension - immediate evaluation",
                })}
              </td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td colSpan={3} className="p-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 text-medical-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-medical-600">
                      {t("footer", {
                        defaultValue:
                          "Based on 2017 AAP Clinical Practice Guidelines. Values calculated for patient's specific age, gender, and height percentile.",
                      })}
                    </p>
                    <p className="mt-1 text-gray-500">
                      {t("hypotensionNote", {
                        defaultValue:
                          "Hypotension thresholds (3rd-10th percentiles) are derived from normal distribution assumptions.",
                      })}
                    </p>
                    {patientSystolic && patientDiastolic && (
                      <p className="mt-1 text-purple-600 font-medium">
                        {t("highlightNote", {
                          defaultValue:
                            "Patient's current BP reading is highlighted above.",
                        })}
                      </p>
                    )}
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
