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
  // Error function approximation
  const erf = (x: number) => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
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
  const sortedPoints = filteredPoints.sort(
    (a, b) =>
      Math.abs(a.Agemos - ageInMonths) - Math.abs(b.Agemos - ageInMonths)
  );
  const point1 = sortedPoints[0];
  const point2 = sortedPoints[1];
  if (point1.Agemos === ageInMonths || point1.Agemos === point2.Agemos) {
    return point1;
  }
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

// Calculate height percentile using combined WHO/CDC data
function calculateHeightPercentile(
  height: number,
  ageInMonths: number,
  gender: "male" | "female"
): number {
  const sex = gender === "male" ? 1 : 2;
  let heightDataPoint;

  if (ageInMonths < 36) {
    // Use CDC Infant data for ages 0-36 months
    heightDataPoint = interpolateDataPoint(
      ageInMonths,
      cdcInfantHeightData as CdcDataPoint[],
      sex
    );
  } else {
    // Use CDC Child data for ages 36+ months
    heightDataPoint = interpolateDataPoint(
      ageInMonths,
      cdcHeightData as CdcDataPoint[],
      sex
    );
  }

  const zScore = calculateZScore(
    height,
    heightDataPoint.L,
    heightDataPoint.M,
    heightDataPoint.S
  );
  return zScoreToPercentile(zScore);
}

// 2017 AAP Screening Table (Simplified screening values)
const aapScreeningTable: Record<
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

function calculateBPPercentile(
  systolic: number,
  diastolic: number,
  ageInYears: number,
  heightPercentile: number,
  gender: "male" | "female",
  t: any
): BPResult | null {
  // 1. Age validation - using years for precision
  if (ageInYears < 1 || ageInYears > 17) {
    console.warn(
      `Age ${ageInYears} years is outside valid range (1 year - 17 years)`
    );
    return null;
  }
  // 2. BP validation (reasonable physiological ranges)
  if (systolic < 50 || systolic > 250 || diastolic < 30 || diastolic > 150) {
    console.warn(`BP ${systolic}/${diastolic} is outside reasonable range`);
    return null;
  }
  // 3. BP relationship validation
  if (diastolic >= systolic) {
    console.warn(
      `Diastolic (${diastolic}) should be less than systolic (${systolic})`
    );
    return null;
  }
  // 4. Height percentile validation and capping
  const clampedHeightPercentile = Math.max(1, Math.min(99.9, heightPercentile));
  if (heightPercentile !== clampedHeightPercentile) {
    console.warn(
      `Height percentile clamped from ${heightPercentile}% to ${clampedHeightPercentile}%`
    );
  }
  // Get screening values with fallback logic
  let screeningValues = aapScreeningTable[gender][String(ageInYears)];
  if (!screeningValues) {
    // Fallback strategy: use closest age
    const availableAges = Object.keys(aapScreeningTable[gender])
      .map(Number)
      .sort((a, b) => a - b);
    const closestAge = availableAges.reduce((prev, curr) =>
      Math.abs(curr - ageInYears) < Math.abs(prev - ageInYears) ? curr : prev
    );
    screeningValues = aapScreeningTable[gender][String(closestAge)];
    console.warn(
      `Using age ${closestAge} screening values for age ${ageInYears}`
    );
  }
  // Height adjustment with bounds
  const heightZScore = Math.max(
    -2.5,
    Math.min(2.5, (clampedHeightPercentile - 50) / 25)
  );
  const heightAdjustment = heightZScore * 1.5;
  // Calculate reference percentiles with bounds checking
  const adjustedSystolic95 = Math.max(
    80,
    screeningValues.systolic + heightAdjustment + 8
  );
  const adjustedDiastolic95 = Math.max(
    50,
    screeningValues.diastolic + heightAdjustment + 6
  );
  const adjustedSystolic90 = Math.max(
    75,
    screeningValues.systolic + heightAdjustment
  );
  const adjustedDiastolic90 = Math.max(
    45,
    screeningValues.diastolic + heightAdjustment
  );
  const adjustedSystolic50 = Math.max(60, adjustedSystolic90 - 15);
  const adjustedDiastolic50 = Math.max(35, adjustedDiastolic90 - 12);
  // Enhanced percentile calculation with bounds
  function calculatePercentileRobust(
    value: number,
    p50: number,
    p90: number,
    p95: number
  ): number {
    // Ensure reference points are in ascending order
    if (p50 >= p90 || p90 >= p95) {
      console.warn("Invalid reference percentiles, using fallback calculation");
      // Fallback: simple linear interpolation
      if (value <= p90) return Math.max(1, Math.min(89, 90 * (value / p90)));
      else
        return Math.max(
          90,
          Math.min(99, 90 + 9 * ((value - p90) / (p95 - p90)))
        );
    }
    if (value <= p50) {
      // Below 50th percentile
      return Math.max(1, 50 * (value / p50));
    } else if (value <= p90) {
      // Between 50th and 90th percentile
      return 50 + 40 * ((value - p50) / (p90 - p50));
    } else if (value <= p95) {
      // Between 90th and 95th percentile
      return 90 + 5 * ((value - p90) / (p95 - p90));
    } else {
      // Above 95th percentile
      const excessRatio = Math.min(2, (value - p95) / (p95 * 0.1));
      return Math.min(99.9, 95 + 4 * excessRatio);
    }
  }
  // Calculate percentiles
  const systolicPercentile = calculatePercentileRobust(
    systolic,
    adjustedSystolic50,
    adjustedSystolic90,
    adjustedSystolic95
  );
  const diastolicPercentile = calculatePercentileRobust(
    diastolic,
    adjustedDiastolic50,
    adjustedDiastolic90,
    adjustedDiastolic95
  );
  // Bounded z-score calculation
  const systolicZScore = Math.max(
    -3,
    Math.min(
      5,
      ((systolic - adjustedSystolic50) /
        (adjustedSystolic95 - adjustedSystolic50)) *
        1.645
    )
  );
  const diastolicZScore = Math.max(
    -3,
    Math.min(
      5,
      ((diastolic - adjustedDiastolic50) /
        (adjustedDiastolic95 - adjustedDiastolic50)) *
        1.645
    )
  );

  // ========== CLASSIFICATION WITH EDGE CASES ==========
  const maxPercentile = Math.max(systolicPercentile, diastolicPercentile);
  let classification: BPClassification;
  if (ageInYears >= 13) {
    // Adolescent classification (≥13 years)
    if (systolic >= 140 || diastolic >= 90) {
      classification = {
        category: t("classifications.stage2.category"),
        description: t("classifications.stage2.description", {
          description: t("classifications.stage2.adolescentDescription"),
        }),
        color: "text-red-700",
        bgColor: "bg-red-50 border-red-200",
      };
    } else if (systolic >= 130 || diastolic >= 80) {
      classification = {
        category: t("classifications.stage1.category"),
        description: t("classifications.stage1.description", {
          description: t("classifications.stage1.adolescentDescription"),
          action: t("classifications.stage1.adolescentAction"),
        }),
        color: "text-orange-700",
        bgColor: "bg-orange-50 border-orange-200",
      };
    } else if (systolic >= 120 && systolic < 130 && diastolic < 80) {
      classification = {
        category: t("classifications.elevated.category"),
        description: t("classifications.elevated.description", {
          description: t("classifications.elevated.adolescentDescription"),
          action: t("classifications.elevated.adolescentAction"),
        }),
        color: "text-yellow-700",
        bgColor: "bg-yellow-50 border-yellow-200",
      };
    } else {
      classification = {
        category: t("classifications.normal.category"),
        description: t("classifications.normal.description", {
          description: t("classifications.normal.adolescentDescription"),
        }),
        color: "text-green-700",
        bgColor: "bg-green-50 border-green-200",
      };
    }
  } else {
    // Pediatric classification (<13 years)
    // Stage 2 thresholds
    const stage2SystolicThreshold = adjustedSystolic95 + 12;
    const stage2DiastolicThreshold = adjustedDiastolic95 + 12;
    // Additional absolute thresholds for very young children
    const absoluteStage2Systolic = Math.min(140, stage2SystolicThreshold);
    const absoluteStage2Diastolic = Math.min(90, stage2DiastolicThreshold);
    if (
      systolic >= absoluteStage2Systolic ||
      diastolic >= absoluteStage2Diastolic
    ) {
      classification = {
        category: t("classifications.stage2.category"),
        description: t("classifications.stage2.description", {
          description: t("classifications.stage2.pediatricDescription"),
        }),
        color: "text-red-700",
        bgColor: "bg-red-50 border-red-200",
      };
    } else if (maxPercentile >= 95) {
      classification = {
        category: t("classifications.stage1.category"),
        description: t("classifications.stage1.description", {
          description: t("classifications.stage1.pediatricDescription"),
          action: t("classifications.stage1.pediatricAction"),
        }),
        color: "text-orange-700",
        bgColor: "bg-orange-50 border-orange-200",
      };
    } else if (maxPercentile >= 90) {
      // This is the block for "Elevated"
      let descriptionText = t("classifications.elevated.pediatricDescription");
      let actionText = t("classifications.elevated.pediatricAction");

      // Check which value is higher to provide a more specific reason
      if (systolicPercentile > 90 && diastolicPercentile < 90) {
        descriptionText = t("classifications.elevated.systolicReason");
      } else if (diastolicPercentile > 90 && systolicPercentile < 90) {
        descriptionText = t("classifications.elevated.diastolicReason");
      }

      classification = {
        category: t("classifications.elevated.category"),
        description: `${descriptionText} ${actionText}`,
        color: "text-yellow-700",
        bgColor: "bg-yellow-50 border-yellow-200",
      };
    } else {
      classification = {
        category: t("classifications.normal.category"),
        description: t("classifications.normal.description", {
          description: t("classifications.normal.pediatricDescription"),
        }),
        color: "text-green-700",
        bgColor: "bg-green-50 border-green-200",
      };
    }
  }
  return {
    systolic: {
      value: systolic,
      percentile: Math.round(systolicPercentile * 10) / 10, // Round to 1 decimal
      zScore: Math.round(systolicZScore * 100) / 100, // Round to 2 decimals
    },
    diastolic: {
      value: diastolic,
      percentile: Math.round(diastolicPercentile * 10) / 10,
      zScore: Math.round(diastolicZScore * 100) / 100,
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

  const ageInYears = differenceInYears(measurement, birth);
  return ageInYears >= minYears && ageInYears <= maxYears;
}

export function BloodPressureForm() {
  const t = useTranslations("BloodPressureCalculator");

  // Create form schema with translations
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

    // Age range check (dates are now required)
    const birthDate = values.dateOfBirth;
    const measurementDate = values.dateOfMeasurement;
    const inRange = isAgeInRange(birthDate, measurementDate, 1, 17);

    if (!inRange) {
      setAgeError(t("validation.ageRange"));
      setIsSubmitting(false);
      setResults(null);
      return;
    }

    // Calculate height percentile (age is always available now)
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
                  <>
                    {/* Growth Chart Source Info Banner */}
                    {ageInMonths >= 12 && ageInMonths < 24 && (
                      <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-2 mb-2 w-fit">
                        {t("dataSource.whoHeight")}
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
                              results.classification.category ===
                                t("classifications.normal.category") &&
                                "bg-green-50 border-green-200",
                              results.classification.category ===
                                t("classifications.elevated.category") &&
                                "bg-yellow-50 border-yellow-200",
                              results.classification.category ===
                                t("classifications.stage1.category") &&
                                "bg-orange-50 border-orange-200",
                              results.classification.category ===
                                t("classifications.stage2.category") &&
                                "bg-red-50 border-red-200"
                            )}
                          >
                            {results.classification.category ===
                              t("classifications.normal.category") && (
                              <CheckCircle className="w-6 h-6 text-green-600" />
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
                                    "text-red-800"
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
                                    "text-red-700"
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
                          />

                          {/* Clinical Interpretation */}
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-sm mb-2 text-blue-800">
                              {t("results.clinicalInterpretation.title")}
                            </h4>
                            <div className="text-xs text-blue-700">
                              <p>
                                <strong>
                                  {t(
                                    "results.clinicalInterpretation.currentBP"
                                  )}
                                </strong>{" "}
                                {results.systolic.value}/
                                {results.diastolic.value} mmHg
                              </p>
                              <p>
                                <strong>
                                  {t(
                                    "results.clinicalInterpretation.classification",
                                    {
                                      systolic:
                                        results.systolic.percentile.toFixed(1),
                                      diastolic:
                                        results.diastolic.percentile.toFixed(1),
                                    }
                                  )}
                                </strong>
                              </p>
                              <p>
                                <strong>
                                  {t(
                                    "results.clinicalInterpretation.heightAdjustment",
                                    {
                                      height:
                                        results.heightPercentile.toFixed(1),
                                    }
                                  )}
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
                                    ? t("results.footer.whoSource")
                                    : t("results.footer.cdcSource"),
                              })}
                            </p>
                            <p>{t("results.footer.reference")}</p>
                            <p>{t("results.footer.note")}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
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
                    />
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
