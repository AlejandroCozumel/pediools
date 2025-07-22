"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

interface ETTReferenceCardProps {
  ageInYears: number;
  gender: "male" | "female";
  showTitle?: boolean;
}

// ETT calculation functions (unchanged)
function calculateETTSize(ageInYears: number): { cuffed: number; uncuffed: number } {
  const uncuffed = ageInYears / 4 + 4;
  const cuffed = ageInYears / 4 + 3.5;
  return {
    cuffed: Math.round(cuffed * 2) / 2,
    uncuffed: Math.round(uncuffed * 2) / 2,
  };
}

function calculateETTLength(ageInYears: number): { oral: number; nasal: number } {
  const oral = ageInYears / 2 + 12;
  const nasal = ageInYears / 2 + 15;
  return {
    oral: Math.round(oral),
    nasal: Math.round(nasal),
  };
}

function getRecommendedETTType(ageInYears: number): 'cuffed' | 'uncuffed' {
  // Per PALS guidelines, cuffed tubes are generally preferred for > 2 years
  return ageInYears >= 2 ? 'cuffed' : 'uncuffed';
}

export function ETTReferenceCard({
  ageInYears,
  gender,
  showTitle = true,
}: ETTReferenceCardProps) {
  const t = useTranslations("BloodPressureCalculator");

  const ettSize = calculateETTSize(ageInYears);
  const ettLength = calculateETTLength(ageInYears);
  const recommendedType = getRecommendedETTType(ageInYears);

  // A single, compact row component for this design
  const CompactInfoRow = ({
    label,
    formula,
    value,
    isRecommended = false,
  }: {
    label: string;
    formula: string;
    value: string;
    isRecommended?: boolean;
  }) => (
    <div className="flex justify-between items-center py-2">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 font-mono">{formula}</p>
      </div>
      <div className="text-right flex flex-col items-end">
        <p className="text-sm font-bold text-gray-900">{value}</p>
        {isRecommended && (
          <span className="mt-0.5 text-xs font-medium text-green-700">Recomendado</span>
        )}
      </div>
    </div>
  );

  return (
    <Card className={cn("mt-4 border-gray-200")}>
      <CardContent className="p-4">
        {showTitle && (
          <>
            <h3 className="text-base font-semibold text-gray-900">
              {t("endotrachealTube.title")}
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              {t("endotrachealTube.subtitle", { age: ageInYears })}
            </p>
          </>
        )}

        <div className="space-y-0 divide-y divide-gray-100">
          <CompactInfoRow
            label={`${t("endotrachealTube.tubeSize")} (${t("endotrachealTube.uncuffed")})`}
            formula={t("endotrachealTube.tubeSizeFormula")}
            value={`${ettSize.uncuffed} mm`}
            isRecommended={recommendedType === 'uncuffed'}
          />
          <CompactInfoRow
            label={`${t("endotrachealTube.tubeSize")} (${t("endotrachealTube.cuffed")})`}
            formula="Edad/4 + 3.5"
            value={`${ettSize.cuffed} mm`}
            isRecommended={recommendedType === 'cuffed'}
          />
          <CompactInfoRow
            label={t("endotrachealTube.oralLength")}
            formula={t("endotrachealTube.oralLengthFormula")}
            value={`${ettLength.oral} cm`}
          />
          <CompactInfoRow
            label={t("endotrachealTube.nasalLength")}
            formula={t("endotrachealTube.nasalLengthFormula")}
            value={`${ettLength.nasal} cm`}
          />
        </div>

        {/* Compact Note Section */}
        <div className="mt-4 flex items-start space-x-2 rounded-md bg-blue-50 p-2.5">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
          <p className="text-xs text-blue-800">
            <strong>{t("endotrachealTube.noteTitle")}:</strong> {t("endotrachealTube.note")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}