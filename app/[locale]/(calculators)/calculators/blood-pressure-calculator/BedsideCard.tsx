import React, { useState } from 'react';
import { Printer, Download, Copy, Sun, Moon, Clock, TrendingDown, User, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ambulatoryBPData from "@/app/data/ambulatory-bp-reference.json";

interface BedsideCardData {
  patient: {
    name: string;
    age: number;
    gender: 'male' | 'female';
    height: number;
    weight?: number;
    studyDate: string;
  };
  measurements: {
    daytime: {
      systolic: number;
      diastolic: number;
      systolicPercentile: number;
      diastolicPercentile: number;
    };
    nighttime: {
      systolic: number;
      diastolic: number;
      systolicPercentile: number;
      diastolicPercentile: number;
    };
    "24h"?: {
      systolic: number;
      diastolic: number;
      systolicPercentile: number;
      diastolicPercentile: number;
    };
  };
  dipping: {
    systolic: {
      percentage: number;
      category: string;
      normal: boolean;
    };
    diastolic: {
      percentage: number;
      category: string;
      normal: boolean;
    };
  };
}

export function BedsideCard() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    studyDate: new Date().toISOString().split('T')[0],
    systolicDay: '',
    diastolicDay: '',
    systolicNight: '',
    diastolicNight: '',
    systolic24h: '',
    diastolic24h: ''
  });

  const [cardData, setCardData] = useState<BedsideCardData | null>(null);

  // Find closest height in reference data
  const findClosestHeight = (targetHeight: number, genderData: any) => {
    const heights = Object.keys(genderData.height).map(Number).sort((a, b) => a - b);
    return heights.reduce((prev, curr) =>
      Math.abs(curr - targetHeight) < Math.abs(prev - targetHeight) ? curr : prev
    );
  };

  // Calculate percentile for a given BP value
  const calculatePercentile = (value: number, referenceData: any): number => {
    if (value <= referenceData.p5) return 5;
    if (value <= referenceData.p10) return 5 + 5 * (value - referenceData.p5) / (referenceData.p10 - referenceData.p5);
    if (value <= referenceData.p25) return 10 + 15 * (value - referenceData.p10) / (referenceData.p25 - referenceData.p10);
    if (value <= referenceData.p50) return 25 + 25 * (value - referenceData.p25) / (referenceData.p50 - referenceData.p25);
    if (value <= referenceData.p75) return 50 + 25 * (value - referenceData.p50) / (referenceData.p75 - referenceData.p50);
    if (value <= referenceData.p90) return 75 + 15 * (value - referenceData.p75) / (referenceData.p90 - referenceData.p75);
    if (value <= referenceData.p95) return 90 + 5 * (value - referenceData.p90) / (referenceData.p95 - referenceData.p90);
    if (value <= referenceData.p99) return 95 + 4 * (value - referenceData.p95) / (referenceData.p99 - referenceData.p95);
    return Math.min(99.9, 99 + (value - referenceData.p99) / 5);
  };

  // Calculate nocturnal dipping
  const calculateDipping = (daytimeBP: number, nighttimeBP: number) => {
    const dipping = ((daytimeBP - nighttimeBP) / daytimeBP) * 100;
    let category: string;

    if (dipping >= 10) {
      category = "Normal dipper";
    } else if (dipping >= 0) {
      category = "Non-dipper";
    } else {
      category = "Reverse dipper";
    }

    return {
      percentage: dipping,
      category,
      normal: dipping >= 10
    };
  };

  const generateCard = () => {
    const { gender, height, age, systolicDay, diastolicDay, systolicNight, diastolicNight, systolic24h, diastolic24h } = formData;

    if (!height || !age || !systolicDay || !diastolicDay || !systolicNight || !diastolicNight) {
      alert('Please fill in all required fields');
      return;
    }

    // Get reference data
    const genderData = (ambulatoryBPData as any)[gender === 'male' ? 'boys' : 'girls'];
    const closestHeight = findClosestHeight(parseInt(height), genderData);
    const dayRef = genderData.height[closestHeight].day;
    const nightRef = genderData.height[closestHeight].night;
    const h24Ref = genderData.height[closestHeight]["24h"];

    const card: BedsideCardData = {
      patient: {
        name: formData.name,
        age: parseInt(age),
        gender: gender as 'male' | 'female',
        height: parseInt(height),
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        studyDate: formData.studyDate
      },
      measurements: {
        daytime: {
          systolic: parseInt(systolicDay),
          diastolic: parseInt(diastolicDay),
          systolicPercentile: calculatePercentile(parseInt(systolicDay), dayRef.systolic),
          diastolicPercentile: calculatePercentile(parseInt(diastolicDay), dayRef.diastolic)
        },
        nighttime: {
          systolic: parseInt(systolicNight),
          diastolic: parseInt(diastolicNight),
          systolicPercentile: calculatePercentile(parseInt(systolicNight), nightRef.systolic),
          diastolicPercentile: calculatePercentile(parseInt(diastolicNight), nightRef.diastolic)
        }
      },
      dipping: {
        systolic: calculateDipping(parseInt(systolicDay), parseInt(systolicNight)),
        diastolic: calculateDipping(parseInt(diastolicDay), parseInt(diastolicNight))
      }
    };

    // Add 24h data if provided
    if (systolic24h && diastolic24h) {
      card.measurements["24h"] = {
        systolic: parseInt(systolic24h),
        diastolic: parseInt(diastolic24h),
        systolicPercentile: calculatePercentile(parseInt(systolic24h), h24Ref.systolic),
        diastolicPercentile: calculatePercentile(parseInt(diastolic24h), h24Ref.diastolic)
      };
    }

    setCardData(card);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    if (!cardData) return;

    const text = generatePlainTextCard(cardData);
    navigator.clipboard.writeText(text);
    alert('Card data copied to clipboard!');
  };

  const generatePlainTextCard = (data: BedsideCardData): string => {
    const genderData = (ambulatoryBPData as any)[data.patient.gender === 'male' ? 'boys' : 'girls'];
    const closestHeight = findClosestHeight(data.patient.height, genderData);
    const dayRef = genderData.height[closestHeight].day;
    const nightRef = genderData.height[closestHeight].night;

    return `
═══════════════════════════════════════
    AMBULATORY BP REFERENCE CARD
═══════════════════════════════════════
Patient: ${data.patient.name}
Age: ${data.patient.age} years  |  Gender: ${data.patient.gender.toUpperCase()}
Height: ${data.patient.height}cm  |  Study: ${data.patient.studyDate}

MEASUREMENTS:
───────────────────────────────────────
📅 DAYTIME BP: ${data.measurements.daytime.systolic}/${data.measurements.daytime.diastolic}
   Percentiles: ${data.measurements.daytime.systolicPercentile.toFixed(0)}% / ${data.measurements.daytime.diastolicPercentile.toFixed(0)}%

🌙 NIGHTTIME BP: ${data.measurements.nighttime.systolic}/${data.measurements.nighttime.diastolic}
   Percentiles: ${data.measurements.nighttime.systolicPercentile.toFixed(0)}% / ${data.measurements.nighttime.diastolicPercentile.toFixed(0)}%

DIPPING ANALYSIS:
───────────────────────────────────────
📊 Systolic: ${data.dipping.systolic.percentage.toFixed(1)}% (${data.dipping.systolic.category})
📊 Diastolic: ${data.dipping.diastolic.percentage.toFixed(1)}% (${data.dipping.diastolic.category})

REFERENCE VALUES (Height: ${closestHeight}cm):
───────────────────────────────────────
DAYTIME:  5%=${dayRef.systolic.p5}/${dayRef.diastolic.p5} | 95%=${dayRef.systolic.p95}/${dayRef.diastolic.p95}
NIGHTTIME: 5%=${nightRef.systolic.p5}/${nightRef.diastolic.p5} | 95%=${nightRef.systolic.p95}/${nightRef.diastolic.p95}

Normal dipping: ≥10% decrease at night
Based on Wühl et al. 2002 / AAP 2017 Guidelines
═══════════════════════════════════════
    `;
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 95) return 'text-red-600 font-bold';
    if (percentile >= 90) return 'text-orange-500 font-semibold';
    if (percentile >= 75) return 'text-yellow-500';
    return 'text-green-600';
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ABPM Bedside Reference Card Generator
        </h1>
        <p className="text-gray-600">
          Generate printable ambulatory blood pressure reference cards for pediatric patients
        </p>
      </div>

      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">Input Data</TabsTrigger>
          <TabsTrigger value="preview" disabled={!cardData}>Preview Card</TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Information & ABPM Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Patient Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name">Patient Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter patient name"
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age (years)</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Age"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="Height"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg) - Optional</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="Weight"
                  />
                </div>
                <div>
                  <Label htmlFor="studyDate">Study Date</Label>
                  <Input
                    id="studyDate"
                    type="date"
                    value={formData.studyDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, studyDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* ABPM Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Daytime BP */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    Daytime Average BP
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="systolicDay">Systolic (mmHg)</Label>
                      <Input
                        id="systolicDay"
                        type="number"
                        value={formData.systolicDay}
                        onChange={(e) => setFormData(prev => ({ ...prev, systolicDay: e.target.value }))}
                        placeholder="Systolic"
                      />
                    </div>
                    <div>
                      <Label htmlFor="diastolicDay">Diastolic (mmHg)</Label>
                      <Input
                        id="diastolicDay"
                        type="number"
                        value={formData.diastolicDay}
                        onChange={(e) => setFormData(prev => ({ ...prev, diastolicDay: e.target.value }))}
                        placeholder="Diastolic"
                      />
                    </div>
                  </div>
                </div>

                {/* Nighttime BP */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    Nighttime Average BP
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="systolicNight">Systolic (mmHg)</Label>
                      <Input
                        id="systolicNight"
                        type="number"
                        value={formData.systolicNight}
                        onChange={(e) => setFormData(prev => ({ ...prev, systolicNight: e.target.value }))}
                        placeholder="Systolic"
                      />
                    </div>
                    <div>
                      <Label htmlFor="diastolicNight">Diastolic (mmHg)</Label>
                      <Input
                        id="diastolicNight"
                        type="number"
                        value={formData.diastolicNight}
                        onChange={(e) => setFormData(prev => ({ ...prev, diastolicNight: e.target.value }))}
                        placeholder="Diastolic"
                      />
                    </div>
                  </div>
                </div>

                {/* 24h BP - Optional */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    24-Hour Average BP (Optional)
                  </h3>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <div>
                      <Label htmlFor="systolic24h">Systolic (mmHg)</Label>
                      <Input
                        id="systolic24h"
                        type="number"
                        value={formData.systolic24h}
                        onChange={(e) => setFormData(prev => ({ ...prev, systolic24h: e.target.value }))}
                        placeholder="Systolic"
                      />
                    </div>
                    <div>
                      <Label htmlFor="diastolic24h">Diastolic (mmHg)</Label>
                      <Input
                        id="diastolic24h"
                        type="number"
                        value={formData.diastolic24h}
                        onChange={(e) => setFormData(prev => ({ ...prev, diastolic24h: e.target.value }))}
                        placeholder="Diastolic"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={generateCard} className="w-full" size="lg">
                Generate Bedside Card
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          {cardData && (
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex gap-2 print:hidden">
                <Button onClick={handlePrint} className="flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Print Card
                </Button>
                <Button onClick={handleCopyText} variant="outline" className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  Copy Text
                </Button>
              </div>

              {/* Printable Card */}
              <div className="print:shadow-none print:border-none">
                <Card className="max-w-4xl mx-auto print:shadow-none print:border-none">
                  <CardHeader className="text-center border-b print:pb-2">
                    <CardTitle className="text-lg font-bold">AMBULATORY BLOOD PRESSURE REFERENCE CARD</CardTitle>
                    <div className="text-sm text-gray-600 flex justify-center items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {cardData.patient.name}
                      </span>
                      <span>{cardData.patient.age}y, {cardData.patient.gender.toUpperCase()}</span>
                      <span>{cardData.patient.height}cm</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {cardData.patient.studyDate}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4">
                    {/* Measurements Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {/* Daytime */}
                      <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <Sun className="w-4 h-4 text-yellow-600" />
                          <span className="font-semibold text-sm">DAYTIME</span>
                        </div>
                        <div className="text-xl font-bold">
                          {cardData.measurements.daytime.systolic}/{cardData.measurements.daytime.diastolic}
                        </div>
                        <div className="text-xs">
                          <span className={getPercentileColor(cardData.measurements.daytime.systolicPercentile)}>
                            {cardData.measurements.daytime.systolicPercentile.toFixed(0)}%
                          </span>
                          {' / '}
                          <span className={getPercentileColor(cardData.measurements.daytime.diastolicPercentile)}>
                            {cardData.measurements.daytime.diastolicPercentile.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Nighttime */}
                      <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <Moon className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-sm">NIGHTTIME</span>
                        </div>
                        <div className="text-xl font-bold">
                          {cardData.measurements.nighttime.systolic}/{cardData.measurements.nighttime.diastolic}
                        </div>
                        <div className="text-xs">
                          <span className={getPercentileColor(cardData.measurements.nighttime.systolicPercentile)}>
                            {cardData.measurements.nighttime.systolicPercentile.toFixed(0)}%
                          </span>
                          {' / '}
                          <span className={getPercentileColor(cardData.measurements.nighttime.diastolicPercentile)}>
                            {cardData.measurements.nighttime.diastolicPercentile.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Dipping */}
                      <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <TrendingDown className="w-4 h-4 text-gray-600" />
                          <span className="font-semibold text-sm">DIPPING</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className={`font-semibold ${cardData.dipping.systolic.normal ? 'text-green-600' : 'text-orange-600'}`}>
                            SBP: {cardData.dipping.systolic.percentage.toFixed(1)}%
                          </div>
                          <div className={`font-semibold ${cardData.dipping.diastolic.normal ? 'text-green-600' : 'text-orange-600'}`}>
                            DBP: {cardData.dipping.diastolic.percentage.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-600">
                            {cardData.dipping.systolic.category}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reference Table */}
                    {(() => {
                      const genderData = (ambulatoryBPData as any)[cardData.patient.gender === 'male' ? 'boys' : 'girls'];
                      const closestHeight = findClosestHeight(cardData.patient.height, genderData);
                      const dayRef = genderData.height[closestHeight].day;
                      const nightRef = genderData.height[closestHeight].night;

                      return (
                        <div className="mt-4">
                          <h3 className="font-semibold text-sm mb-2 text-center">
                            Reference Percentiles (Height: {closestHeight}cm)
                          </h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border border-gray-300">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-gray-300 px-2 py-1">Period</th>
                                  <th className="border border-gray-300 px-2 py-1">5th %ile</th>
                                  <th className="border border-gray-300 px-2 py-1">50th %ile</th>
                                  <th className="border border-gray-300 px-2 py-1">90th %ile</th>
                                  <th className="border border-gray-300 px-2 py-1">95th %ile</th>
                                  <th className="border border-gray-300 px-2 py-1">99th %ile</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-gray-300 px-2 py-1 font-semibold bg-yellow-50">Daytime</td>
                                  <td className="border border-gray-300 px-2 py-1 text-center">{dayRef.systolic.p5}/{dayRef.diastolic.p5}</td>
                                  <td className="border border-gray-300 px-2 py-1 text-center">{dayRef.systolic.p50}/{dayRef.diastolic.p50}</td>
                                  <td className="border border-gray-300 px-2 py-1 text-center">{dayRef.systolic.p90}/{dayRef.diastolic.p90}</td>
                                  <td className="border border-gray-300 px-2 py-1 text-center font-semibold">{dayRef.systolic.p95}/{dayRef.diastolic.p95}</td>
                                  <td className="border border-gray-300 px-2 py-1 text-center">{dayRef.systolic.p99}/{dayRef.diastolic.p99}</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-2 py-1 font-semibold bg-blue-50">Nighttime</td>
                                  <td className="border border-gray-300 px-2 py-1 text-center">{nightRef.systolic.p5}/{nightRef.diastolic.p5}</td>
                                  <td className="border border-gray-300 px-2 py-1 text-center">{nightRef.systolic.p50}/{nightRef.diastolic.p50}</td>
                                  <td className="border border-gray-300 px-2 py-1 text-center">{nightRef.systolic.p90}/{nightRef.diastolic.p90}</td>
                                  <td className="border border-gray-300 px-2 py-1 text-center font-semibold">{nightRef.systolic.p95}/{nightRef.diastolic.p95}</td>
                                  <td className="border border-gray-300 px-2 py-1 text-center">{nightRef.systolic.p99}/{nightRef.diastolic.p99}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Footer Notes */}
                    <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>• Normal dipping: ≥10% decrease from day to night</span>
                        <span>• Values ≥95th percentile indicate ambulatory hypertension</span>
                      </div>
                      <div className="text-center">
                        <span>Reference: Wühl et al. J Hypertens 2002 | AAP 2017 Guidelines</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}