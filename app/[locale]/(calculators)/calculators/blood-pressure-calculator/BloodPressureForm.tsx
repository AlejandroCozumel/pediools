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

  // Get actual height values for this age/gender
  const heightValues = heightPercentileKeys.map(
    (key) => ageData.heights[key].cm
  );

  const minHeight = Math.min(...heightValues);
  const maxHeight = Math.max(...heightValues);

  // Determine if patient height is within, below, or above data range
  let heightStatus:
    | "within_range"
    | "below_range"
    | "above_range"
    | "extrapolated";
  let usedPercentile: number;
  let closestHeightIndex: number;
  let interpolationWarning: string | null = null;

  if (heightCm < minHeight) {
    // Below 5th percentile - extrapolate to 5th
    heightStatus = "below_range";
    usedPercentile = 5;
    closestHeightIndex = 0; // Use 5th percentile data
    interpolationWarning = "extrapolated_to_5th";
  } else if (heightCm > maxHeight) {
    // Above 95th percentile - extrapolate to 95th
    heightStatus = "above_range";
    usedPercentile = 95;
    closestHeightIndex = heightPercentileKeys.length - 1; // Use 95th percentile data
    interpolationWarning = "extrapolated_to_95th";
  } else {
    // Within range - find closest or interpolate
    heightStatus = "within_range";

    // Find closest height percentile
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

    // Check if we're exactly on a percentile or interpolated
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
    // Additional metadata for UI display
    heightRange: {
      min: minHeight,
      max: maxHeight,
      isWithinRange: heightStatus === "within_range",
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

function calculateBPPercentile(
  systolic: number,
  diastolic: number,
  ageInYears: number,
  heightCm: number,
  gender: "male" | "female",
  t: any
): BPResult | null {
  if (ageInYears < 1 || ageInYears > 17) return null;
  if (systolic < 50 || systolic > 250 || diastolic < 30 || diastolic > 150)
    return null;
  if (diastolic >= systolic) return null;

  const aapData = getAAPDataByHeight(ageInYears, heightCm, gender, aapBPData);
  if (!aapData) return null;

  // Get BP thresholds from AAP data
  const { thresholds, heightPercentile } = aapData;
  const { p50, p90, p95 } = thresholds;

  const p50Systolic = p50.systolic;
  const p50Diastolic = p50.diastolic;
  const p90Systolic = p90.systolic;
  const p90Diastolic = p90.diastolic;
  const p95Systolic = p95.systolic;
  const p95Diastolic = p95.diastolic;

  const scientificSystolic = calculateScientificPercentiles(
    p50Systolic,
    p90Systolic,
    p95Systolic
  );
  const scientificDiastolic = calculateScientificPercentiles(
    p50Diastolic,
    p90Diastolic,
    p95Diastolic
  );

  const systolicThresholds = {
    p3: scientificSystolic.p3,
    p5: scientificSystolic.p5,
    p10: scientificSystolic.p10,
    p50: p50Systolic,
    p90: p90Systolic,
    p95: p95Systolic,
  };

  const diastolicThresholds = {
    p3: scientificDiastolic.p3,
    p5: scientificDiastolic.p5,
    p10: scientificDiastolic.p10,
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
  const stage2Systolic = Math.round(p95Systolic + 12);
  const stage2Diastolic = Math.round(p95Diastolic + 12);

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
  else if (
    systolic <= scientificSystolic.p5 ||
    diastolic <= scientificDiastolic.p5
  )
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
  else if (
    systolic <= scientificSystolic.p10 ||
    diastolic <= scientificDiastolic.p10
  )
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
    heightPercentile: heightPercentile,
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
  console.log("Current locale:", t("gender.male")); // Should show "Niño" for Spanish
  console.log("Normal category:", t("classifications.normal.category"));
  console.log(
    "Normal description template:",
    t("classifications.normal.description")
  );
  console.log(
    "Pediatric description:",
    t("classifications.normal.pediatricDescription")
  );
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

    // Simulate processing
    setTimeout(() => {
      // If we have BP values, calculate full analysis
      if (hasBothBP && values.systolicBP && values.diastolicBP) {
        const result = calculateBPPercentile(
          parseFloat(values.systolicBP),
          parseFloat(values.diastolicBP),
          ageInYears,
          parseFloat(values.height),
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

  function calculateMAP(systolic: number, diastolic: number): number {
    return Math.round(diastolic + (systolic - diastolic) / 3);
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
                                  <th className="py-2 px-4 text-left text-sm font-medium">
                                    {t("results.metrics.map")}
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
                                  <td className="py-2 px-4">
                                    {calculateMAP(
                                      results.systolic.value,
                                      results.diastolic.value
                                    )}
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
                                  <td className="py-2 px-4 text-gray-400">—</td>
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
                                  <td className="py-2 px-4 text-gray-400">
                                    —
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <OfficeBPReferenceCard
                            ageInYears={ageInYears}
                            gender={selectedGender}
                            height={parseFloat(height)}
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
                                  {results.diastolic.value} mmHg (
                                  {t("results.metrics.map")}:{" "}
                                  {calculateMAP(
                                    results.systolic.value,
                                    results.diastolic.value
                                  )}
                                  )
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
                        height={parseFloat(height)}
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
