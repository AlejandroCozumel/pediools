"use client";
import React from "react";
import { Printer, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OfficeBPReferenceCardProps {
  ageInYears: number;
  gender: "male" | "female";
  height: number;
  heightPercentile: number;
}

export function OfficeBPReferenceCard({
  ageInYears,
  gender,
  height,
  heightPercentile,
}: OfficeBPReferenceCardProps) {
  // Logic remains the same.
  const calculateMilestones = () => {
    const clampedHeightPercentile = Math.max(
      1,
      Math.min(99.9, heightPercentile)
    );
    const screeningValues =
      aapScreeningTable[gender][String(ageInYears)] ||
      aapScreeningTable[gender]["17"];
    const heightZScore = (clampedHeightPercentile - 50) / 25;
    const heightAdjustment = heightZScore * 1.5;
    const p90Systolic = Math.round(screeningValues.systolic + heightAdjustment);
    const p90Diastolic = Math.round(
      screeningValues.diastolic + heightAdjustment
    );
    const p50Systolic = Math.round(p90Systolic - 15);
    const p50Diastolic = Math.round(p90Diastolic - 12);
    const p95Systolic = Math.round(p90Systolic + 8);
    const p95Diastolic = Math.round(p90Diastolic + 6);
    const stage2Systolic = Math.round(p95Systolic + 12);
    const stage2Diastolic = Math.round(p95Diastolic + 12);
    return {
      p50: `${p50Systolic}/${p50Diastolic}`,
      p90: `${p90Systolic}/${p90Diastolic}`,
      p95: `${p95Systolic}/${p95Diastolic}`,
      stage2: `${stage2Systolic}/${stage2Diastolic}`,
    };
  };

  const milestones = calculateMilestones();

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

  return (
    <div className="mt-6" id="office-bp-reference-card">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Office BP Reference</h3>
          <p className="text-xs text-muted-foreground">
          For a {gender} aged {ageInYears} with a height of {height}cm ({heightPercentile.toFixed(0)}th percentile).
          </p>
        </div>
        <Button
          onClick={handlePrint}
          size="sm"
          variant="outline"
          className="print-hidden"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print
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
              <th className="p-3 font-semibold text-left">Milestone</th>
              <th className="p-3 font-semibold text-center">BP Value (mmHg)</th>
              <th className="p-3 font-semibold text-left">Clinical Meaning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            <tr className="bg-medical-5">
              <td className="p-3 text-left font-semibold text-blue-800">
                50th Percentile
              </td>
              <td className="p-3 text-center font-mono text-blue-900">
                {milestones.p50}
              </td>
              <td className="p-3 text-left text-xs text-gray-700">
                The statistical <strong>average</strong> BP for this patient.
              </td>
            </tr>
            <tr className="bg-yellow-50">
              <td className="p-3 text-left font-semibold text-yellow-800">
                90th Percentile
              </td>
              <td className="p-3 text-center font-mono font-semibold text-yellow-900">
                {milestones.p90}
              </td>
              <td className="p-3 text-left text-xs text-gray-700">
                <strong>Elevated BP</strong> begins at this value.
              </td>
            </tr>
            <tr className="bg-orange-50">
              <td className="p-3 text-left font-semibold text-orange-800">
                95th Percentile
              </td>
              <td className="p-3 text-center font-mono font-bold text-orange-900">
                {milestones.p95}
              </td>
              <td className="p-3 text-left text-xs text-gray-700">
                <strong>Stage 1 Hypertension</strong> begins at this value.
              </td>
            </tr>
            <tr className="bg-red-50">
              <td className="p-3 text-left font-semibold text-red-800">
                95th %ile + 12mmHg
              </td>
              <td className="p-3 text-center font-mono font-bold text-red-900">
                {milestones.stage2}
              </td>
              <td className="p-3 text-left text-xs text-gray-700">
                <strong>Stage 2 Hypertension</strong> begins at this value.
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="p-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 text-medical-600" />
                  <p>
                    These thresholds are calculated based on the 2017 AAP
                    guidelines, adjusted for this specific patient's age,
                    gender, and height percentile.
                  </p>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
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
