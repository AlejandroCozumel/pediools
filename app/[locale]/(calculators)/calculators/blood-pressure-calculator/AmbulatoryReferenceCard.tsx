"use client";
import React, { useState, useMemo } from "react";
import { Ruler, Printer, Sun, Moon, Clock, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import ambulatoryBPData from "@/app/data/ambulatory-bp-reference.json";

interface ReferenceData {
  closestHeight: number;
  day: { [key: string]: string };
  night: { [key: string]: string };
  "24h": { [key: string]: string };
}

export function AmbulatoryReferenceCard() {
  const t = useTranslations("BloodPressureCalculator.ambulatoryReference");
  const genderT = useTranslations("BloodPressureCalculator.gender");
  const [gender, setGender] = useState<"boys" | "girls">("boys");
  const [height, setHeight] = useState<string>("");
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(
    null
  );

  const utils = useMemo(() => {
    const findClosestHeight = (
      targetHeight: number,
      heightData: any
    ): number => {
      const heights = Object.keys(heightData)
        .map(Number)
        .sort((a, b) => a - b);
      return heights.reduce((prev, curr) =>
        Math.abs(curr - targetHeight) < Math.abs(prev - targetHeight)
          ? curr
          : prev
      );
    };

    const getReferenceDataForHeight = (
      h: number,
      g: "boys" | "girls"
    ): ReferenceData | null => {
      const genderData = ambulatoryBPData[g];
      if (!h || !genderData || !genderData.height) return null;
      const closestHeight = findClosestHeight(h, genderData.height);
      const data = (genderData.height as any)[closestHeight.toString()];
      if (!data) return null;
      const formatPercentileData = (periodData: any) => ({
        p5: `${periodData?.systolic.p5 ?? "--"}/${
          periodData?.diastolic.p5 ?? "--"
        }`,
        p50: `${periodData?.systolic.p50 ?? "--"}/${
          periodData?.diastolic.p50 ?? "--"
        }`,
        p90: `${periodData?.systolic.p90 ?? "--"}/${
          periodData?.diastolic.p90 ?? "--"
        }`,
        p95: `${periodData?.systolic.p95 ?? "--"}/${
          periodData?.diastolic.p95 ?? "--"
        }`,
        p99: `${periodData?.systolic.p99 ?? "--"}/${
          periodData?.diastolic.p99 ?? "--"
        }`,
      });
      return {
        closestHeight,
        day: formatPercentileData(data.day),
        night: formatPercentileData(data.night),
        "24h": formatPercentileData(data["24h"]),
      };
    };

    return { getReferenceDataForHeight };
  }, []);

  const handleGenerateCard = () => {
    const heightNum = parseInt(height);
    if (!heightNum) {
      setReferenceData(null);
      return;
    }
    const data = utils.getReferenceDataForHeight(heightNum, gender);
    setReferenceData(data);
  };

  const handlePrint = () => {
    window.print();
  };

  const buttonColorClass =
    gender === "boys"
      ? "bg-gradient-to-r from-medical-600 to-medical-700 hover:from-medical-700 hover:to-medical-800"
      : "bg-gradient-to-r from-medical-pink-600 to-medical-pink-700 hover:from-medical-pink-700 hover:to-medical-pink-800";

  return (
    <div className="w-full mx-auto">
      <div className="mx-auto space-y-4 p-4 border rounded-lg">
        <Tabs
          value={gender}
          onValueChange={(value) => setGender(value as "boys" | "girls")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-transparent border rounded-lg">
            <TabsTrigger
              value="boys"
              className="data-[state=active]:bg-medical-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Baby className="w-5 h-5" /> {genderT("male")}
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="girls"
              className="data-[state=active]:bg-medical-pink-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Baby className="w-5 h-5" /> {genderT("female")}
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          <Label
            htmlFor="height"
            className="flex items-center gap-2 font-semibold"
          >
            <Ruler className="w-4 h-4" /> {t("patientHeight")}
          </Label>
          <Input
            id="height"
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder={t("heightPlaceholder")}
            className="border-medical-100"
          />
        </div>

        <Button
          onClick={handleGenerateCard}
          disabled={!height}
          className={cn("w-full transition-all duration-300", buttonColorClass)}
        >
          {t("generateCard")}
        </Button>
      </div>

      {referenceData && (
        <div className="printable-results mt-6 space-y-4">
          <div className="flex justify-center no-print">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> {t("printCard")}
            </Button>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">
                {t("cardTitle", {
                  gender:
                    gender === "boys" ? genderT("male") : genderT("female"),
                  height: referenceData.closestHeight,
                })}
              </h2>
              <p className="text-sm text-gray-600">{t("source")}</p>
            </div>
            {/* ✨ UPDATED TABLE WITH MATCHING UI ✨ */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr
                      className={cn(
                        "text-white",
                        gender === "boys"
                          ? "bg-medical-600"
                          : "bg-medical-pink-600"
                      )}
                    >
                      <th className="p-3 font-semibold text-left">
                        {t("period")}
                      </th>
                      <th className="p-3 font-semibold text-center">
                        {t("percentile5")}
                      </th>
                      <th className="p-3 font-semibold text-center">
                        {t("percentile50")}
                      </th>
                      <th className="p-3 font-semibold text-center">
                        {t("percentile90")}
                      </th>
                      <th className="p-3 font-semibold text-center">
                        {t("percentile95")}
                      </th>
                      <th className="p-3 font-semibold text-center">
                        {t("percentile99")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-white hover:bg-gray-50">
                      <td className="p-3 text-left font-semibold flex items-center gap-2">
                        <Sun className="w-5 h-5 text-yellow-500" />
                        {t("daytime")}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {referenceData.day.p5}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {referenceData.day.p50}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {referenceData.day.p90}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-orange-600">
                        {referenceData.day.p95}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-red-600">
                        {referenceData.day.p99}
                      </td>
                    </tr>
                    <tr className="bg-white hover:bg-gray-50">
                      <td className="p-3 text-left font-semibold flex items-center gap-2">
                        <Moon className="w-5 h-5 text-blue-500" />
                        {t("nighttime")}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {referenceData.night.p5}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {referenceData.night.p50}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {referenceData.night.p90}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-orange-600">
                        {referenceData.night.p95}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-red-600">
                        {referenceData.night.p99}
                      </td>
                    </tr>
                    <tr className="bg-white hover:bg-gray-50">
                      <td className="p-3 text-left font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-500" />
                        {t("hour24")}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {referenceData["24h"].p5}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {referenceData["24h"].p50}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {referenceData["24h"].p90}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-orange-600">
                        {referenceData["24h"].p95}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-red-600">
                        {referenceData["24h"].p99}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
