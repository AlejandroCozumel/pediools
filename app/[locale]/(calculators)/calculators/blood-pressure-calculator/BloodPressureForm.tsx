"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  Baby,
  Loader2,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle,
  FileText,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { differenceInMonths, differenceInYears } from "date-fns";
import cdcHeightData from "@/app/data/cdc-data-height.json";
import cdcChildHeightData from "@/app/data/cdc-data-height.json";
import cdcInfantHeightData from "@/app/data/cdc-data-infant-height.json";
import aapBPData from "@/app/data/aap-blood-pressure-data.json";
import DateInputs from "@/components/DateInputs";
import { AmbulatoryReferenceCard } from "./AmbulatoryReferenceCard";
import { OfficeBPReferenceCard } from "./OfficeBPReferenceCard";

interface BPClassification {
  category: string;
  description: string;
  color: string;
  bgColor: string;
}

interface BPResult {
  systolic: {
    value: number;
    percentile: number;
    zScore: number;
  };
  diastolic: {
    value: number;
    percentile: number;
    zScore: number;
  };
  classification: BPClassification;
  heightPercentile: number;
}

interface CdcDataPoint {
  Sex: number;
  Agemos: number;
  L: number;
  M: number;
  S: number;
  P3: number;
  P5: number;
  P10: number;
  P25: number;
  P50: number;
  P75: number;
  P90: number;
  P95: number;
  P97: number;
}

const createFormSchema = (t: any) =>
  z
    .object({
      gender: z.enum(["male", "female"], {
        required_error: t("validation.selectGender"),
      }),
      // Make dates required again
      dateOfBirth: z.date({
        required_error: t("validation.dobRequired"),
      }),
      dateOfMeasurement: z.date({
        required_error: t("validation.measurementRequired"),
      }),
      // Keep height required
      height: z
        .string()
        .min(1, { message: t("validation.heightRequired") })
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
          message: t("validation.heightInvalid"),
        }),
      // Make BP fields optional
      systolicBP: z.string().optional(),
      diastolicBP: z.string().optional(),
    })
    .refine((data) => {
      // If both BP values are provided, validate them
      if (data.systolicBP && data.diastolicBP) {
        const systolic = parseFloat(data.systolicBP);
        const diastolic = parseFloat(data.diastolicBP);
        // Check ranges
        if (isNaN(systolic) || systolic < 50 || systolic > 250) return false;
        if (isNaN(diastolic) || diastolic < 30 || diastolic > 150) return false;
        // Check relationship
        if (systolic <= diastolic) return false;
      }
      // If only one BP value is provided, it's invalid
      if (
        (data.systolicBP && !data.diastolicBP) ||
        (!data.systolicBP && data.diastolicBP)
      ) {
        return false;
      }
      return true;
    });

// Calculate Z-Score using LMS method
const calculateZScore = (value: number, L: number, M: number, S: number) => {
  if (L === 0) {
    return Math.log(value / M) / S;
  }
  return (Math.pow(value / M, L) - 1) / (L * S);
};

// Convert Z-Score to Percentile
const zScoreToPercentile = (zScore: number) => {
  const erf = (x: number) => {
    const a1 = 0.254829592,
      a2 = -0.284496736,
      a3 = 1.421413741,
      a4 = -1.453152027,
      a5 = 1.061405429,
      p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1.0 / (1.0 + p * x);
    const y =
      1.0 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  };
  return 0.5 * (1 + erf(zScore / Math.sqrt(2))) * 100;
};

// Interpolate data point for exact age
const interpolateDataPoint = (
  ageInMonths: number,
  dataPoints: any[],
  sex: number
) => {
  const filteredPoints = dataPoints.filter((point) => point.Sex === sex);
  if (filteredPoints.length === 0) return null;
  const sortedPoints = filteredPoints.sort(
    (a, b) =>
      Math.abs(a.Agemos - ageInMonths) - Math.abs(b.Agemos - ageInMonths)
  );
  const point1 = sortedPoints[0],
    point2 = sortedPoints[1];
  if (!point1) return null;
  if (
    point1.Agemos === ageInMonths ||
    !point2 ||
    point1.Agemos === point2.Agemos
  )
    return point1;
  const factor =
    (ageInMonths - point1.Agemos) / (point2.Agemos - point1.Agemos);
  return {
    Sex: sex,
    Agemos: ageInMonths,
    L: point1.L + (point2.L - point1.L) * factor,
    M: point1.M + (point2.M - point1.M) * factor,
    S: point1.S + (point2.S - point1.S) * factor,
  };
};

// Calculate height percentile using CDC data
function calculateHeightPercentile(
  height: number,
  ageInMonths: number,
  gender: "male" | "female"
): number {
  const sex = gender === "male" ? 1 : 2;
  let heightDataPoint;
  if (ageInMonths < 24) {
    heightDataPoint = interpolateDataPoint(
      ageInMonths,
      cdcInfantHeightData as CdcDataPoint[],
      sex
    );
  } else {
    heightDataPoint = interpolateDataPoint(
      ageInMonths,
      cdcHeightData as CdcDataPoint[],
      sex
    );
  }
  if (!heightDataPoint) return 50; // Fallback
  const zScore = calculateZScore(
    height,
    heightDataPoint.L,
    heightDataPoint.M,
    heightDataPoint.S
  );
  return zScoreToPercentile(zScore);
}

// Helper function to get BP thresholds from complete AAP data
function getBPThresholdsFromAAP(
  ageInYears: number,
  heightPercentile: number,
  gender: "male" | "female"
) {
  const genderData = (
    gender === "male" ? aapBPData.boys : aapBPData.girls
  ) as any;
  const ageData = genderData[String(ageInYears)];

  if (!ageData) return null;

  // Find closest height percentile from available data (5th, 10th, 25th, 50th, 75th, 90th, 95th)
  const heightPercentiles = [5, 10, 25, 50, 75, 90, 95];
  const closestHeightIndex = heightPercentiles.reduce(
    (prev, curr, index) =>
      Math.abs(curr - heightPercentile) <
      Math.abs(heightPercentiles[prev] - heightPercentile)
        ? index
        : prev,
    0
  );

  return {
    p50: {
      systolic: ageData.bp["50th"].systolic[closestHeightIndex],
      diastolic: ageData.bp["50th"].diastolic[closestHeightIndex],
    },
    p90: {
      systolic: ageData.bp["90th"].systolic[closestHeightIndex],
      diastolic: ageData.bp["90th"].diastolic[closestHeightIndex],
    },
    p95: {
      systolic: ageData.bp["95th"].systolic[closestHeightIndex],
      diastolic: ageData.bp["95th"].diastolic[closestHeightIndex],
    },
  };
}

function calculateAccuratePercentile(
  value: number,
  thresholds: Record<string, number>
): number {
  if (value <= thresholds.p3) return 3.0;
  if (value <= thresholds.p5)
    return 3 + 2 * ((value - thresholds.p3) / (thresholds.p5 - thresholds.p3));
  if (value <= thresholds.p10)
    return 5 + 5 * ((value - thresholds.p5) / (thresholds.p10 - thresholds.p5));
  if (value <= thresholds.p50)
    return (
      10 + 40 * ((value - thresholds.p10) / (thresholds.p50 - thresholds.p10))
    );
  if (value <= thresholds.p90)
    return (
      50 + 40 * ((value - thresholds.p50) / (thresholds.p90 - thresholds.p50))
    );
  if (value <= thresholds.p95)
    return (
      90 + 5 * ((value - thresholds.p90) / (thresholds.p95 - thresholds.p90))
    );
  return Math.min(
    99.9,
    95 + 4.9 * ((value - thresholds.p95) / (thresholds.p95 * 0.1))
  );
}

function calculateBPPercentile(
  systolic: number,
  diastolic: number,
  ageInYears: number,
  heightPercentile: number,
  gender: "male" | "female",
  t: any
): BPResult | null {
  if (ageInYears < 1 || ageInYears > 17) return null;
  if (systolic < 50 || systolic > 250 || diastolic < 30 || diastolic > 150)
    return null;
  if (diastolic >= systolic) return null;

  const clampedHeightPercentile = Math.max(1, Math.min(99.9, heightPercentile));

  // Get BP thresholds from AAP data
  const bpThresholds = getBPThresholdsFromAAP(
    ageInYears,
    clampedHeightPercentile,
    gender
  );
  if (!bpThresholds) return null;

  const p50Systolic = bpThresholds.p50.systolic;
  const p50Diastolic = bpThresholds.p50.diastolic;
  const p90Systolic = bpThresholds.p90.systolic;
  const p90Diastolic = bpThresholds.p90.diastolic;
  const p95Systolic = bpThresholds.p95.systolic;
  const p95Diastolic = bpThresholds.p95.diastolic;

  // Calculate derived percentiles
  const p10Systolic = Math.round(p50Systolic - 12);
  const p10Diastolic = Math.round(p50Diastolic - 8);
  const p5Systolic = Math.round(p50Systolic - 16);
  const p5Diastolic = Math.round(p50Diastolic - 10);
  const p3Systolic = Math.round(p50Systolic - 20);
  const p3Diastolic = Math.round(p50Diastolic - 12);
  const stage2Systolic = Math.round(p95Systolic + 12);
  const stage2Diastolic = Math.round(p95Diastolic + 12);

  const systolicThresholds = {
    p3: p3Systolic,
    p5: p5Systolic,
    p10: p10Systolic,
    p50: p50Systolic,
    p90: p90Systolic,
    p95: p95Systolic,
  };

  const diastolicThresholds = {
    p3: p3Diastolic,
    p5: p5Diastolic,
    p10: p10Diastolic,
    p50: p50Diastolic,
    p90: p90Diastolic,
    p95: p95Diastolic,
  };

  const finalSystolicPercentile = calculateAccuratePercentile(
    systolic,
    systolicThresholds
  );
  const finalDiastolicPercentile = calculateAccuratePercentile(
    diastolic,
    diastolicThresholds
  );

  const percentileToZScore = (p: number): number => {
    if (p <= 0.0) return -4.0;
    if (p >= 100.0) return 4.0;
    let value = p / 100.0;
    let isLowerTail = true;
    if (value > 0.5) {
      isLowerTail = false;
      value = 1 - value;
    }
    const t = Math.sqrt(-2.0 * Math.log(value));
    const c = [2.515517, 0.802853, 0.010328];
    const d = [1.432788, 0.189269, 0.001308];
    let z =
      t -
      (c[0] + c[1] * t + c[2] * t * t) /
        (1 + d[0] * t + d[1] * t * t + d[2] * t * t * t);
    return isLowerTail ? -z : z;
  };

  const systolicZ = percentileToZScore(finalSystolicPercentile);
  const diastolicZ = percentileToZScore(finalDiastolicPercentile);

  let classification: BPClassification;
  if (ageInYears >= 13) {
    if (systolic >= 140 || diastolic >= 90)
      classification = {
        category: t("classifications.stage2.category"),
        description: t("classifications.stage2.description", {
          description: t("classifications.stage2.adolescentDescription"),
        }),
        color: "text-red-700",
        bgColor: "bg-red-50 border-red-200",
      };
    else if (systolic >= 130 || diastolic >= 80)
      classification = {
        category: t("classifications.stage1.category"),
        description: t("classifications.stage1.description", {
          description: t("classifications.stage1.adolescentDescription"),
          action: t("classifications.stage1.adolescentAction"),
        }),
        color: "text-orange-700",
        bgColor: "bg-orange-50 border-orange-200",
      };
    else if (systolic >= 120 && diastolic < 80)
      classification = {
        category: t("classifications.elevated.category"),
        description: t("classifications.elevated.description", {
          description: t("classifications.elevated.adolescentDescription"),
          action: t("classifications.elevated.adolescentAction"),
        }),
        color: "text-yellow-700",
        bgColor: "bg-yellow-50 border-yellow-200",
      };
    else
      classification = {
        category: t("classifications.normal.category"),
        description: t("classifications.normal.description", {
          description: t("classifications.normal.adolescentDescription"),
        }),
        color: "text-green-700",
        bgColor: "bg-green-50 border-green-200",
      };
  } else {
    if (systolic >= stage2Systolic || diastolic >= stage2Diastolic)
      classification = {
        category: t("classifications.stage2.category"),
        description: t("classifications.stage2.description", {
          description: t("classifications.stage2.pediatricDescription"),
        }),
        color: "text-red-700",
        bgColor: "bg-red-50 border-red-200",
      };
    else if (systolic >= p95Systolic || diastolic >= p95Diastolic)
      classification = {
        category: t("classifications.stage1.category"),
        description: t("classifications.stage1.description", {
          description: t("classifications.stage1.pediatricDescription"),
          action: t("classifications.stage1.pediatricAction"),
        }),
        color: "text-orange-700",
        bgColor: "bg-orange-50 border-orange-200",
      };
    else if (systolic >= p90Systolic || diastolic >= p90Diastolic)
      classification = {
        category: t("classifications.elevated.category"),
        description: t("classifications.elevated.description", {
          description: t("classifications.elevated.pediatricDescription"),
          action: t("classifications.elevated.pediatricAction"),
        }),
        color: "text-yellow-700",
        bgColor: "bg-yellow-50 border-yellow-200",
      };
    else if (systolic <= p5Systolic || diastolic <= p5Diastolic)
      classification = {
        category: t("classifications.hypotension.severe.category", {
          defaultValue: "Severe Hypotension",
        }),
        description: t("classifications.hypotension.severe.description", {
          defaultValue: "Severe hypotension - immediate evaluation needed",
        }),
        color: "text-red-700",
        bgColor: "bg-red-50 border-red-200",
      };
    else if (systolic <= p10Systolic || diastolic <= p10Diastolic)
      classification = {
        category: t("classifications.hypotension.mild.category", {
          defaultValue: "Mild Hypotension",
        }),
        description: t("classifications.hypotension.mild.description", {
          defaultValue: "Mild hypotension - monitor closely",
        }),
        color: "text-orange-700",
        bgColor: "bg-orange-50 border-orange-200",
      };
    else
      classification = {
        category: t("classifications.normal.category"),
        description: t("classifications.normal.description", {
          description: t("classifications.normal.pediatricDescription"),
        }),
        color: "text-green-700",
        bgColor: "bg-green-50 border-green-200",
      };
  }

  return {
    systolic: {
      value: systolic,
      percentile: Math.round(finalSystolicPercentile * 10) / 10,
      zScore: Math.round(systolicZ * 100) / 100,
    },
    diastolic: {
      value: diastolic,
      percentile: Math.round(finalDiastolicPercentile * 10) / 10,
      zScore: Math.round(diastolicZ * 100) / 100,
    },
    classification,
    heightPercentile: clampedHeightPercentile,
  };
}

function isAgeInRange(
  birthDate: Date,
  measurementDate: Date,
  minYears: number,
  maxYears: number
) {
  const birth = new Date(
    birthDate.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );
  const measurement = new Date(
    measurementDate.getFullYear(),
    measurementDate.getMonth(),
    measurementDate.getDate()
  );
  const ageInYears = differenceInYears(measurement, birth);
  return ageInYears >= minYears && ageInYears <= maxYears;
}

export function BloodPressureForm() {
  const t = useTranslations("BloodPressureCalculator");
  const formSchema = useMemo(() => createFormSchema(t), [t]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<BPResult | null>(null);
  const [ageError, setAgeError] = useState<string>("");
  const [activeMainTab, setActiveMainTab] = useState("calculator");
  const [showReferenceCard, setShowReferenceCard] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gender: "male",
      dateOfMeasurement: new Date(),
    },
    mode: "onChange",
  });

  const selectedGender = form.watch("gender") as "male" | "female";
  const birthDate = form.watch("dateOfBirth");
  const measurementDate = form.watch("dateOfMeasurement");
  const height = form.watch("height");
  const systolicBP = form.watch("systolicBP");
  const diastolicBP = form.watch("diastolicBP");

  // Calculate age in months and years
  const ageInMonths = useMemo(() => {
    if (!birthDate || !measurementDate) return 0;
    // Normalize both dates to avoid timezone/hour issues
    const birth = new Date(
      birthDate.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );
    const measurement = new Date(
      measurementDate.getFullYear(),
      measurementDate.getMonth(),
      measurementDate.getDate()
    );
    return differenceInMonths(measurement, birth);
  }, [birthDate, measurementDate]);

  const ageInYears = useMemo(() => {
    if (!birthDate || !measurementDate) return 0;
    // Normalize both dates to avoid timezone/hour issues
    const birth = new Date(
      birthDate.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );
    const measurement = new Date(
      measurementDate.getFullYear(),
      measurementDate.getMonth(),
      measurementDate.getDate()
    );
    return differenceInYears(measurement, birth);
  }, [birthDate, measurementDate]);

  const isMounted = useRef(false);
  const watchedFormValues = form.watch();

  useEffect(() => {
    if (isMounted.current) {
      if (results) {
        setResults(null);
      }
      if (showReferenceCard) {
        setShowReferenceCard(false);
      }
    } else {
      isMounted.current = true;
    }
  }, [JSON.stringify(watchedFormValues)]);

  const hasHeight = height && parseFloat(height) > 0;
  const hasBothBP =
    systolicBP &&
    diastolicBP &&
    parseFloat(systolicBP) > 0 &&
    parseFloat(diastolicBP) > 0;
  const hasOnlyOneBP =
    (systolicBP && !diastolicBP) || (!systolicBP && diastolicBP);

  const systolicValue = parseFloat(systolicBP || "0");
  const diastolicValue = parseFloat(diastolicBP || "0");
  const isBPInvalid = hasBothBP && diastolicValue >= systolicValue;

  const systolicOutOfRange =
    systolicBP && (parseFloat(systolicBP) < 50 || parseFloat(systolicBP) > 250);
  const diastolicOutOfRange =
    diastolicBP &&
    (parseFloat(diastolicBP) < 30 || parseFloat(diastolicBP) > 150);

  // Compute if age is valid for input fields
  const ageIsValid =
    birthDate &&
    measurementDate &&
    isAgeInRange(birthDate, measurementDate, 1, 17);

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setAgeError("");

    // Age range check (dates are required)
    const birthDate = values.dateOfBirth;
    const measurementDate = values.dateOfMeasurement;
    const inRange = isAgeInRange(birthDate, measurementDate, 1, 17);

    if (!inRange) {
      setAgeError(t("validation.ageRange"));
      setIsSubmitting(false);
      setResults(null);
      return;
    }

    // Calculate height percentile (age is always available)
    const heightPercentile = calculateHeightPercentile(
      parseFloat(values.height),
      ageInMonths,
      values.gender
    );

    // Simulate processing
    setTimeout(() => {
      // If we have BP values, calculate full analysis
      if (hasBothBP && values.systolicBP && values.diastolicBP) {
        const result = calculateBPPercentile(
          parseFloat(values.systolicBP),
          parseFloat(values.diastolicBP),
          ageInYears,
          heightPercentile,
          values.gender,
          t
        );
        setResults(result);
      } else {
        // Just showing reference card - no full results
        setResults(null);
        setShowReferenceCard(true);
      }
      setIsSubmitting(false);
    }, 1000);
  }

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="p-4 lg:p-6 !pb-0">
        <CardTitle className="text-2xl font-heading text-medical-900">
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 lg:p-6">
        <Tabs
          value={activeMainTab}
          onValueChange={setActiveMainTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              {t("tabs.calculator")}
            </TabsTrigger>
            <TabsTrigger value="bedside" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t("tabs.bedside")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="calculator">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Gender Selection */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="space-y-0 mb-6">
                      <Tabs
                        value={field.value}
                        defaultValue="male"
                        className="w-full"
                        onValueChange={field.onChange}
                      >
                        <TabsList className="grid w-full grid-cols-2 bg-transparent border rounded-lg">
                          <TabsTrigger
                            value="male"
                            className={`rounded-md transition-colors duration-300 ease-in-out
                          hover:bg-medical-50/80
                          data-[state=active]:text-white
                          data-[state=active]:bg-medical-600
                          data-[state=active]:shadow-sm`}
                          >
                            <div className="flex items-center gap-2">
                              <Baby
                                className={`h-5 w-5 transition-colors duration-300 ease-in-out
                            ${
                              selectedGender === "male"
                                ? "text-white"
                                : "text-medical-600"
                            }`}
                              />
                              <span className="font-medium">
                                {t("gender.male")}
                              </span>
                            </div>
                          </TabsTrigger>
                          <TabsTrigger
                            value="female"
                            className={`rounded-md transition-colors duration-300 ease-in-out
                          hover:bg-medical-pink-50/80
                          data-[state=active]:text-white
                          data-[state=active]:bg-medical-pink-600
                          data-[state=active]:shadow-sm`}
                          >
                            <div className="flex items-center gap-2">
                              <Baby
                                className={`h-5 w-5 transition-colors duration-300 ease-in-out
                            ${
                              selectedGender === "female"
                                ? "text-white"
                                : "text-medical-pink-600"
                            }`}
                              />
                              <span className="font-medium">
                                {t("gender.female")}
                              </span>
                            </div>
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Date Inputs */}
                <DateInputs form={form} gender={selectedGender} />

                {/* Age range info/warning */}
                {!birthDate || !measurementDate ? (
                  <Alert
                    variant="default"
                    className="mb-4 bg-blue-50 border-blue-200 text-blue-800"
                  >
                    <AlertTitle className="font-semibold flex items-center gap-2">
                      <Info className="w-4 h-4" /> {t("alerts.startHere.title")}
                    </AlertTitle>
                    <AlertDescription>
                      {t("alerts.startHere.description")}
                    </AlertDescription>
                  </Alert>
                ) : (
                  !ageIsValid && (
                    <Alert className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-900">
                      <AlertTitle className="font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />{" "}
                        {t("alerts.invalidAge.title")}
                      </AlertTitle>
                      <AlertDescription>
                        {t("alerts.invalidAge.description")}
                      </AlertDescription>
                    </Alert>
                  )
                )}
                {/* Educational Info Box */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>{t("info.bpFormat.title")}</strong>{" "}
                    {t("info.bpFormat.description")}
                    <br />• <strong>{t("info.bpFormat.systolic")}</strong>
                    <br />• <strong>{t("info.bpFormat.diastolic")}</strong>
                  </p>
                </div>
                {/* BP Invalid Warning */}
                {/* Measurements */}
                {ageIsValid && (
                  <div className="space-y-6">
                    {/* Height Input */}
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("form.height")} *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder={t("form.heightPlaceholder")}
                              {...field}
                              className="border-medical-100"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* BP Section - Optional */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">
                          {t("form.bpSection")}
                        </h3>
                        <Info className="w-4 h-4 text-blue-500" />
                      </div>
                      <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                        <Info className="w-4 h-4" />
                        <AlertTitle>{t("alerts.bpOptional.title")}</AlertTitle>
                        <AlertDescription>
                          {t("alerts.bpOptional.description")}
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="systolicBP"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("form.systolicBP")}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder={t("form.systolicPlaceholder")}
                                  {...field}
                                  className={cn(
                                    "border-medical-100",
                                    (isBPInvalid || hasOnlyOneBP) &&
                                      "border-red-500 focus:border-red-500"
                                  )}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="diastolicBP"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("form.diastolicBP")}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder={t("form.diastolicPlaceholder")}
                                  {...field}
                                  className={cn(
                                    "border-medical-100",
                                    (isBPInvalid || hasOnlyOneBP) &&
                                      "border-red-500 focus:border-red-500"
                                  )}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* BP Validation Messages */}
                      {(hasOnlyOneBP ||
                        isBPInvalid ||
                        systolicOutOfRange ||
                        diastolicOutOfRange) && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>
                            {hasOnlyOneBP
                              ? t("alerts.incompleteBP.title")
                              : systolicOutOfRange || diastolicOutOfRange
                              ? t("alerts.bpOutOfRange.title")
                              : t("alerts.invalidBP.title")}
                          </AlertTitle>
                          <AlertDescription>
                            {hasOnlyOneBP && (
                              <p>{t("alerts.incompleteBP.description")}</p>
                            )}
                            {systolicOutOfRange && (
                              <p>
                                {t("alerts.bpOutOfRange.systolicRange", {
                                  value: systolicBP,
                                })}
                              </p>
                            )}
                            {diastolicOutOfRange && (
                              <p>
                                {t("alerts.bpOutOfRange.diastolicRange", {
                                  value: diastolicBP,
                                })}
                              </p>
                            )}
                            {isBPInvalid &&
                              !systolicOutOfRange &&
                              !diastolicOutOfRange && (
                                <p>
                                  {t("alerts.invalidBP.description", {
                                    systolic: systolicValue,
                                    diastolic: diastolicValue,
                                  })}
                                </p>
                              )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                )}

                {/* Real-time Results */}
                {results && (
                  <div className="results-section">
                    {/* Growth Chart Source Info Banner */}
                    {ageInMonths >= 0 && ageInMonths < 24 && (
                      <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-2 mb-2 w-fit">
                        {t("dataSource.cdcHeightInfant")}
                      </div>
                    )}
                    {ageInMonths >= 24 && ageInMonths <= 215 && (
                      <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-2 mb-2 w-fit">
                        {t("dataSource.cdcHeight")}
                      </div>
                    )}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                              {t("results.title")}
                            </h3>
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-lg border mb-4",
                              // Normal BP
                              results.classification.category ===
                                t("classifications.normal.category") &&
                                "bg-green-50 border-green-200",
                              // Elevated BP
                              results.classification.category ===
                                t("classifications.elevated.category") &&
                                "bg-yellow-50 border-yellow-200",
                              // Stage 1 Hypertension
                              results.classification.category ===
                                t("classifications.stage1.category") &&
                                "bg-orange-50 border-orange-200",
                              // Stage 2 Hypertension
                              results.classification.category ===
                                t("classifications.stage2.category") &&
                                "bg-red-50 border-red-200",
                              // ✅ ADD THESE: Hypotension categories
                              results.classification.category ===
                                t(
                                  "classifications.hypotension.mild.category"
                                ) && "bg-orange-50 border-orange-200",
                              results.classification.category ===
                                t(
                                  "classifications.hypotension.severe.category"
                                ) && "bg-red-50 border-red-200",
                              // Fallback for any unmapped categories
                              ![
                                t("classifications.normal.category"),
                                t("classifications.elevated.category"),
                                t("classifications.stage1.category"),
                                t("classifications.stage2.category"),
                                t("classifications.hypotension.mild.category"),
                                t(
                                  "classifications.hypotension.severe.category"
                                ),
                              ].includes(results.classification.category) &&
                                "bg-gray-50 border-gray-200"
                            )}
                          >
                            {/* Icon logic */}
                            {results.classification.category ===
                              t("classifications.normal.category") && (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            )}

                            {(results.classification.category ===
                              t("classifications.hypotension.mild.category") ||
                              results.classification.category ===
                                t(
                                  "classifications.hypotension.severe.category"
                                )) && (
                              <AlertTriangle
                                className={cn(
                                  "w-6 h-6",
                                  results.classification.category ===
                                    t(
                                      "classifications.hypotension.mild.category"
                                    ) && "text-orange-600",
                                  results.classification.category ===
                                    t(
                                      "classifications.hypotension.severe.category"
                                    ) && "text-red-600"
                                )}
                              />
                            )}

                            {(results.classification.category ===
                              t("classifications.elevated.category") ||
                              results.classification.category ===
                                t("classifications.stage1.category") ||
                              results.classification.category ===
                                t("classifications.stage2.category")) && (
                              <AlertTriangle
                                className={cn(
                                  "w-6 h-6",
                                  results.classification.category ===
                                    t("classifications.elevated.category") &&
                                    "text-yellow-600",
                                  results.classification.category ===
                                    t("classifications.stage1.category") &&
                                    "text-orange-600",
                                  results.classification.category ===
                                    t("classifications.stage2.category") &&
                                    "text-red-600"
                                )}
                              />
                            )}

                            <div>
                              <div
                                className={cn(
                                  "font-semibold text-lg",
                                  results.classification.category ===
                                    t("classifications.normal.category") &&
                                    "text-green-800",
                                  results.classification.category ===
                                    t("classifications.elevated.category") &&
                                    "text-yellow-800",
                                  results.classification.category ===
                                    t("classifications.stage1.category") &&
                                    "text-orange-800",
                                  results.classification.category ===
                                    t("classifications.stage2.category") &&
                                    "text-red-800",
                                  results.classification.category ===
                                    t(
                                      "classifications.hypotension.mild.category"
                                    ) && "text-orange-800",
                                  results.classification.category ===
                                    t(
                                      "classifications.hypotension.severe.category"
                                    ) && "text-red-800"
                                )}
                              >
                                {results.classification.category}
                              </div>
                              <div
                                className={cn(
                                  "text-sm",
                                  results.classification.category ===
                                    t("classifications.normal.category") &&
                                    "text-green-700",
                                  results.classification.category ===
                                    t("classifications.elevated.category") &&
                                    "text-yellow-700",
                                  results.classification.category ===
                                    t("classifications.stage1.category") &&
                                    "text-orange-700",
                                  results.classification.category ===
                                    t("classifications.stage2.category") &&
                                    "text-red-700",
                                  results.classification.category ===
                                    t(
                                      "classifications.hypotension.mild.category"
                                    ) && "text-orange-700",
                                  results.classification.category ===
                                    t(
                                      "classifications.hypotension.severe.category"
                                    ) && "text-red-700"
                                )}
                              >
                                {results.classification.description}
                              </div>
                            </div>
                          </div>
                          {/* Enhanced BP Details with Clinical Context */}
                          <div className="mt-4">
                            <div
                              className={cn(
                                "rounded-t-lg px-4 py-2 font-semibold text-white text-sm",
                                selectedGender === "male"
                                  ? "bg-medical-600"
                                  : "bg-medical-pink-600"
                              )}
                            >
                              {t("results.details")} (
                              {selectedGender === "male"
                                ? t("gender.male")
                                : t("gender.female")}
                              )
                            </div>
                            <table className="w-full border rounded-b-lg bg-white">
                              <thead>
                                <tr
                                  className={cn(
                                    selectedGender === "male"
                                      ? "bg-medical-50 text-medical-700"
                                      : "bg-medical-pink-50 text-medical-pink-700"
                                  )}
                                >
                                  <th className="py-2 px-4 text-left text-sm font-medium">
                                    {t("results.metrics.metric")}
                                  </th>
                                  <th className="py-2 px-4 text-left text-sm font-medium">
                                    {t("results.metrics.systolic")}
                                  </th>
                                  <th className="py-2 px-4 text-left text-sm font-medium">
                                    {t("results.metrics.diastolic")}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-t text-sm">
                                  <td className="py-2 px-4 font-medium">
                                    {t("results.metrics.value")}
                                  </td>
                                  <td className="py-2 px-4">
                                    {results.systolic.value}
                                  </td>
                                  <td className="py-2 px-4">
                                    {results.diastolic.value}
                                  </td>
                                </tr>
                                <tr className="border-t text-sm">
                                  <td className="py-2 px-4 font-medium">
                                    {t("results.metrics.percentile")}
                                  </td>
                                  <td className="py-2 px-4">
                                    {results.systolic.percentile.toFixed(1)}%
                                  </td>
                                  <td className="py-2 px-4">
                                    {results.diastolic.percentile.toFixed(1)}%
                                  </td>
                                </tr>
                                <tr className="border-t text-sm">
                                  <td className="py-2 px-4 font-medium">
                                    {t("results.metrics.zScore")}
                                  </td>
                                  <td className="py-2 px-4">
                                    {results.systolic.zScore.toFixed(2)}
                                  </td>
                                  <td className="py-2 px-4">
                                    {results.diastolic.zScore.toFixed(2)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <OfficeBPReferenceCard
                            ageInYears={ageInYears}
                            gender={selectedGender}
                            height={parseFloat(height)}
                            heightPercentile={results.heightPercentile}
                            cdcChildHeightData={cdcChildHeightData}
                            cdcInfantHeightData={cdcInfantHeightData}
                            patientSystolic={results.systolic.value}
                            patientDiastolic={results.diastolic.value}
                            aapBPData={aapBPData}
                          />

                          {/* Clinical Interpretation */}
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-sm mb-2 text-blue-800">
                              {t("results.clinicalInterpretation.title")}
                            </h4>
                            <div className="text-xs text-blue-700">
                              <p>
                                {t("results.clinicalInterpretation.currentBP")}
                                {": "}
                                <strong>
                                  {results.systolic.value}/
                                  {results.diastolic.value} mmHg
                                </strong>
                              </p>
                              <p>
                                {t(
                                  "results.clinicalInterpretation.classification"
                                )}
                                {": "}
                                <strong>
                                  {results.systolic.percentile.toFixed(1)}/
                                  {results.diastolic.percentile.toFixed(1)}%
                                </strong>
                              </p>
                              <p>
                                {t(
                                  "results.clinicalInterpretation.heightAdjustment"
                                )}
                                {": "}
                                <strong>
                                  {results.heightPercentile.toFixed(1)}%
                                </strong>
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground pt-2 border-t">
                            <p>
                              {t("results.footer.heightPercentile", {
                                percentile: results.heightPercentile.toFixed(1),
                              })}
                            </p>
                            <p>
                              {t("results.footer.heightData", {
                                source:
                                  ageInMonths < 24
                                    ? t("dataSource.cdcHeightInfant")
                                    : t("dataSource.cdcHeight"),
                              })}
                            </p>
                            <p>{t("results.footer.reference")}</p>
                            <p>{t("results.footer.note")}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {ageError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTitle>{t("alerts.invalidAge.title")}</AlertTitle>
                    <AlertDescription>{ageError}</AlertDescription>
                  </Alert>
                )}
                {!results &&
                  showReferenceCard &&
                  ageIsValid &&
                  hasHeight &&
                  !isSubmitting && (
                    <div className="results-section">
                      <OfficeBPReferenceCard
                        ageInYears={ageInYears}
                        gender={selectedGender}
                        heightPercentile={calculateHeightPercentile(
                          parseFloat(height),
                          ageInMonths,
                          selectedGender
                        )}
                        height={parseFloat(height)}
                        cdcChildHeightData={cdcHeightData}
                        cdcInfantHeightData={cdcInfantHeightData}
                        aapBPData={aapBPData}
                      />
                    </div>
                  )}
                <Button
                  type="submit"
                  disabled={
                    !!isSubmitting ||
                    !!results ||
                    !ageIsValid ||
                    !hasHeight ||
                    !!hasOnlyOneBP ||
                    !!isBPInvalid ||
                    !!systolicOutOfRange ||
                    !!diastolicOutOfRange
                  }
                  size="lg"
                  className={cn(
                    "w-full transition-all duration-300 ease-in-out",
                    selectedGender === "male"
                      ? "bg-gradient-to-r from-medical-600 to-medical-700 hover:from-medical-700 hover:to-medical-800"
                      : "bg-gradient-to-r from-medical-pink-600 to-medical-pink-700 hover:from-medical-pink-700 hover:to-medical-pink-800",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("button.calculating")}
                    </>
                  ) : (
                    <>
                      <Activity className="ml-2 h-4 w-4" />
                      {hasBothBP
                        ? t("button.calculate")
                        : t("button.showReference")}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="bedside">
            <AmbulatoryReferenceCard />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
