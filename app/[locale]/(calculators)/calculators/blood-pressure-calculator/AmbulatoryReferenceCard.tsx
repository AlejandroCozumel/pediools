"use client";
import React, { useState, useMemo } from 'react';
import { Ruler, Printer, Sun, Moon } from 'lucide-react';

// UI Components from your project
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Your data import
import ambulatoryBPData from "@/app/data/ambulatory-bp-reference.json";

// Define the structure for the reference data we will display
interface ReferenceData {
  closestHeight: number;
  day: { [key: string]: string };
  night: { [key: string]: string };
  "24h": { [key: string]: string };
}

export function AmbulatoryReferenceCard() {
  const [gender, setGender] = useState<'boys' | 'girls'>('boys');
  const [height, setHeight] = useState<string>('');
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(null);

  // Memoize the utility functions for performance
  const utils = useMemo(() => {
    const findClosestHeight = (targetHeight: number, heightData: any): number => {
      const heights = Object.keys(heightData).map(Number).sort((a, b) => a - b);
      return heights.reduce((prev, curr) =>
        Math.abs(curr - targetHeight) < Math.abs(prev - targetHeight) ? curr : prev
      );
    };

    const getReferenceDataForHeight = (h: number, g: 'boys' | 'girls'): ReferenceData | null => {
      const genderData = ambulatoryBPData[g];
      if (!h || !genderData || !genderData.height) return null;

      const closestHeight = findClosestHeight(h, genderData.height);
      const data = (genderData.height as any)[closestHeight.toString()];

      if (!data) return null;

      const formatPercentileData = (periodData: any) => ({
        p5: `${periodData?.systolic.p5 ?? '--'}/${periodData?.diastolic.p5 ?? '--'}`,
        p50: `${periodData?.systolic.p50 ?? '--'}/${periodData?.diastolic.p50 ?? '--'}`,
        p90: `${periodData?.systolic.p90 ?? '--'}/${periodData?.diastolic.p90 ?? '--'}`,
        p95: `${periodData?.systolic.p95 ?? '--'}/${periodData?.diastolic.p95 ?? '--'}`,
        p99: `${periodData?.systolic.p99 ?? '--'}/${periodData?.diastolic.p99 ?? '--'}`,
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

  // Determine button color based on gender, matching your app's style
  const buttonColorClass = gender === 'boys'
    ? "bg-gradient-to-r from-medical-600 to-medical-700 hover:from-medical-700 hover:to-medical-800"
    : "bg-gradient-to-r from-medical-pink-600 to-medical-pink-700 hover:from-medical-pink-700 hover:to-medical-pink-800";

  return (
    <Card className="w-full mx-auto border-none shadow-none">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-heading text-medical-900">
          Ambulatory BP Quick Reference Card
        </CardTitle>
        <CardDescription>
          Generate a printable reference of ABPM percentiles based on patient height.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="max-w-xl mx-auto space-y-4 p-4 border rounded-lg">
          <Tabs
            value={gender}
            onValueChange={(value) => setGender(value as 'boys' | 'girls')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-transparent border">
              <TabsTrigger value="boys">Boy</TabsTrigger>
              <TabsTrigger value="girls">Girl</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="height" className="flex items-center gap-2 font-semibold">
              <Ruler className="w-4 h-4" /> Patient Height (cm)
            </Label>
            <Input
              id="height"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g., 150"
              className="border-medical-100"
            />
          </div>

          <Button onClick={handleGenerateCard} disabled={!height} className={`w-full transition-all duration-300 ${buttonColorClass}`}>
            Generate Reference Card
          </Button>
        </div>

        {/* Results Display */}
        {referenceData && (
          <div className="space-y-4">
            <div className="flex justify-center print:hidden">
              <Button onClick={handlePrint} className="flex items-center gap-2">
                <Printer className="w-4 h-4" /> Print Card
              </Button>
            </div>

            {/* Printable Card */}
            <div className="print:shadow-none print:border-none">
              <Card className="max-w-2xl mx-auto print:shadow-none print:border-none">
                <CardHeader className="text-center border-b pb-2">
                  <CardTitle className="text-lg font-bold">
                    ABPM Reference for a {gender === 'boys' ? 'Boy' : 'Girl'} of ~{referenceData.closestHeight}cm
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Source: Wühl et al. 2002 | Note: Values ≥95th percentile indicate ambulatory hypertension.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <table className="w-full text-center text-sm border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border p-2 font-semibold">Period</th>
                        <th className="border p-2">5th %ile</th>
                        <th className="border p-2">50th %ile</th>
                        <th className="border p-2">90th %ile</th>
                        <th className="border p-2 font-semibold text-orange-600">95th %ile</th>
                        <th className="border p-2 font-semibold text-red-600">99th %ile</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-yellow-50/50">
                        <td className="border p-2 font-semibold text-yellow-800 flex items-center justify-center gap-2"><Sun className="w-4 h-4"/>Daytime</td>
                        <td className="border p-2">{referenceData.day.p5}</td>
                        <td className="border p-2">{referenceData.day.p50}</td>
                        <td className="border p-2">{referenceData.day.p90}</td>
                        <td className="border p-2 font-bold text-orange-600">{referenceData.day.p95}</td>
                        <td className="border p-2 font-bold text-red-600">{referenceData.day.p99}</td>
                      </tr>
                      <tr className="bg-blue-50/50">
                        <td className="border p-2 font-semibold text-blue-800 flex items-center justify-center gap-2"><Moon className="w-4 h-4"/>Nighttime</td>
                        <td className="border p-2">{referenceData.night.p5}</td>
                        <td className="border p-2">{referenceData.night.p50}</td>
                        <td className="border p-2">{referenceData.night.p90}</td>
                        <td className="border p-2 font-bold text-orange-600">{referenceData.night.p95}</td>
                        <td className="border p-2 font-bold text-red-600">{referenceData.night.p99}</td>
                      </tr>
                       <tr className="bg-gray-50/50">
                        <td className="border p-2 font-semibold text-gray-800">24-Hour</td>
                        <td className="border p-2">{referenceData['24h'].p5}</td>
                        <td className="border p-2">{referenceData['24h'].p50}</td>
                        <td className="border p-2">{referenceData['24h'].p90}</td>
                        <td className="border p-2 font-bold text-orange-600">{referenceData['24h'].p95}</td>
                        <td className="border p-2 font-bold text-red-600">{referenceData['24h'].p99}</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}