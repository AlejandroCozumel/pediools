"use client";
import React, { useState, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import {
  Heart,
  Baby,
  Loader2,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { differenceInMonths, differenceInYears } from "date-fns";
import cdcHeightData from "@/app/data/cdc-data-height.json";
import whoHeightData from "@/app/data/who-data-height.json";
import DateInputs from "@/components/DateInputs";

// Blood Pressure Classification
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

interface WhoDataPoint {
  Sex: number;
  Agemos: number;
  L: number;
  M: number;
  S: number;
  SD: number;
  P01: number;
  P1: number;
  P3: number;
  P5: number;
  P10: number;
  P15: number;
  P25: number;
  P50: number;
  P75: number;
  P85: number;
  P90: number;
  P95: number;
  P97: number;
  P99: number;
  P999: number;
}

const formSchema = z
  .object({
    gender: z.enum(["male", "female"], {
      required_error: "Please select a gender",
    }),
    dateOfBirth: z.date({
      required_error: "Date of birth is required",
    }),
    dateOfMeasurement: z.date({
      required_error: "Measurement date is required",
    }),
    height: z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "Please enter a valid height in cm",
      }),
    systolicBP: z.string().refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 50 && num <= 250;
      },
      {
        message: "Systolic BP must be between 50-250 mmHg",
      }
    ),
    diastolicBP: z.string().refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 30 && num <= 150;
      },
      {
        message: "Diastolic BP must be between 30-150 mmHg",
      }
    ),
  })
  .refine(
    (data) => {
      // Cross-field validation: systolic must be higher than diastolic
      const systolic = parseFloat(data.systolicBP);
      const diastolic = parseFloat(data.diastolicBP);
      return systolic > diastolic;
    },
    {
      message: "Systolic BP must be higher than diastolic BP",
      path: ["diastolicBP"], // Show error on diastolic field
    }
  );

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
  if (ageInMonths < 24) {
    // Use WHO data for ages 0-24 months
    heightDataPoint = interpolateDataPoint(
      ageInMonths,
      whoHeightData as WhoDataPoint[],
      sex
    );
  } else {
    // Use CDC data for ages 24+ months
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
  ageInMonths: number
): BPResult | null {
  // 1. Age validation - using months for precision
  const minAgeMonths = 12; // 1 year
  const maxAgeMonths = 17 * 12 + 11; // 17 years 11 months (just before 18th birthday)

  if (ageInMonths < minAgeMonths || ageInMonths > maxAgeMonths) {
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    console.warn(
      `Age ${years} years ${months} months is outside valid range (1 year - 17 years 11 months)`
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
  const heightAdjustment = heightZScore * 1.5; // Reduced from 2 to be more conservative

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
        category: "Stage 2 HTN",
        description: "≥140/90 mmHg - Requires immediate medical attention",
        color: "text-red-700",
        bgColor: "bg-red-50 border-red-200",
      };
    } else if (systolic >= 130 || diastolic >= 80) {
      classification = {
        category: "Stage 1 HTN",
        description:
          "130/80 to 139/89 mmHg - Lifestyle modifications and monitoring needed",
        color: "text-orange-700",
        bgColor: "bg-orange-50 border-orange-200",
      };
    } else if (systolic >= 120 && systolic < 130 && diastolic < 80) {
      classification = {
        category: "Elevated BP",
        description:
          "120/<80 to 129/<80 mmHg - Lifestyle modifications recommended",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50 border-yellow-200",
      };
    } else {
      classification = {
        category: "Normal",
        description: "<120/<80 mmHg - Blood pressure is within normal range",
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
        category: "Stage 2 HTN",
        description:
          "≥95th percentile + 12mmHg or ≥140/90 - Requires immediate medical attention",
        color: "text-red-700",
        bgColor: "bg-red-50 border-red-200",
      };
    } else if (maxPercentile >= 95) {
      classification = {
        category: "Stage 1 HTN",
        description: "≥95th percentile - Requires medical evaluation",
        color: "text-orange-700",
        bgColor: "bg-orange-50 border-orange-200",
      };
    } else if (maxPercentile >= 90) {
      classification = {
        category: "Elevated BP",
        description: "90th-95th percentile - Monitoring recommended",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50 border-yellow-200",
      };
    } else {
      classification = {
        category: "Normal",
        description: "<90th percentile - Normal range",
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
  const y0 = birthDate.getFullYear(),
    m0 = birthDate.getMonth(),
    d0 = birthDate.getDate();
  const y1 = measurementDate.getFullYear(),
    m1 = measurementDate.getMonth(),
    d1 = measurementDate.getDate();
  // Calculate years difference
  let years = y1 - y0;
  if (m1 < m0 || (m1 === m0 && d1 < d0)) years--;
  // Calculate if at least minYears
  let minOk = false;
  if (years > minYears) minOk = true;
  else if (years === minYears) {
    if (m1 > m0 || (m1 === m0 && d1 >= d0)) minOk = true;
  }
  // Calculate if at most maxYears
  let maxOk = false;
  if (years < maxYears) maxOk = true;
  else if (years === maxYears) {
    if (m1 < m0 || (m1 === m0 && d1 <= d0)) maxOk = true;
  }
  return minOk && maxOk;
}

export function BloodPressureForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<BPResult | null>(null);
  const [ageError, setAgeError] = useState<string>("");

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
  const ageInMonths =
    birthDate && measurementDate
      ? differenceInMonths(measurementDate, birthDate)
      : 0;
  const ageInYears =
    birthDate && measurementDate
      ? differenceInYears(measurementDate, birthDate)
      : 0;

  // Real-time BP validation (use debounced values)
  const systolicValue = parseFloat(systolicBP || "0");
  const diastolicValue = parseFloat(diastolicBP || "0");
  const isBPInvalid =
    systolicValue > 0 && diastolicValue > 0 && diastolicValue >= systolicValue;

  // Compute if age is valid for input fields
  const ageIsValid =
    birthDate &&
    measurementDate &&
    isAgeInRange(birthDate, measurementDate, 1, 17);

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setAgeError("");
    // Age range check
    const birthDate = values.dateOfBirth;
    const measurementDate = values.dateOfMeasurement;
    console.log("onSubmit values:", values);
    console.log("birthDate:", birthDate, "measurementDate:", measurementDate);
    const inRange = isAgeInRange(birthDate, measurementDate, 1, 17);
    console.log("isAgeInRange:", inRange);
    if (!inRange) {
      setAgeError(
        "Patient age must be between 1 and 17 years at the time of measurement."
      );
      setIsSubmitting(false);
      setResults(null);
      return;
    }
    // Simulate API call
    setTimeout(() => {
      // Add debug log for calculation
      const result = calculateBPPercentile(
        parseFloat(values.systolicBP),
        parseFloat(values.diastolicBP),
        Math.floor(measurementDate.getFullYear() - birthDate.getFullYear()),
        50, // placeholder for heightPercentile
        values.gender,
        (measurementDate.getFullYear() - birthDate.getFullYear()) * 12 // placeholder for ageInMonths
      );
      console.log("calculateBPPercentile result:", result);
      if (!result) {
        console.log("calculateBPPercentile returned null.");
      }
      setResults(result);
      setIsSubmitting(false);
    }, 1000);
  }

  function getAgeSpecificReferences(
    ageInYears: number,
    gender: "male" | "female"
  ) {
    const screeningValues =
      aapScreeningTable[gender][ageInYears] || aapScreeningTable[gender][17];

    return {
      normal: `<90th percentile (approx. <${screeningValues.systolic}/<${screeningValues.diastolic})`,
      elevated: `90th-95th percentile (approx. ${screeningValues.systolic}-${
        screeningValues.systolic + 8
      }/${screeningValues.diastolic}-${screeningValues.diastolic + 6})`,
      stage1: `≥95th percentile (approx. ≥${screeningValues.systolic + 8}/${
        screeningValues.diastolic + 6
      })`,
      stage2: `≥95th percentile + 12mmHg (approx. ≥${
        screeningValues.systolic + 20
      }/${screeningValues.diastolic + 18})`,
    };
  }

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="p-4 lg:p-6 !pb-0">
        <CardTitle className="text-2xl font-heading text-medical-900">
          Blood Pressure Calculator
        </CardTitle>
        <CardDescription>
          Calculate pediatric blood pressure percentiles using 2017 AAP
          guidelines (Ages 1 year - 17 years)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 lg:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          <span className="font-medium">Male</span>
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
                          <span className="font-medium">Female</span>
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

            {/* Age Display */}
            {ageInYears > 0 && (
              <div className="p-3 bg-medical-50 rounded-lg">
                <p className="text-sm text-medical-700">
                  <strong>Age:</strong> {ageInYears} years, {ageInMonths % 12}{" "}
                  months
                </p>
                {(ageInMonths < 12 || ageInMonths > 215) && (
                  <p className="text-sm text-red-600 mt-1">
                    Calculator is designed for ages 1 year - 17 years (12-215
                    months)
                  </p>
                )}
              </div>
            )}

            {/* Age range info/warning */}
            {!birthDate || !measurementDate ? (
              <Alert
                variant="default"
                className="mb-4 bg-blue-50 border-blue-200 text-blue-800"
              >
                <AlertTitle className="font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4" /> Start Here
                </AlertTitle>
                <AlertDescription>
                  Please select both a <strong>date of birth</strong> and a{" "}
                  <strong>date of measurement</strong> to begin.
                </AlertDescription>
              </Alert>
            ) : (
              !ageIsValid && (
                <Alert className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-900">
                  <AlertTitle className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Invalid Age Range
                  </AlertTitle>
                  <AlertDescription>
                    Please select a date of birth and measurement date so that
                    the patient is <strong>between 1 and 17 years old</strong>{" "}
                    at the time of measurement.
                  </AlertDescription>
                </Alert>
              )
            )}

            {/* Educational Info Box */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Blood Pressure Format:</strong> Always enter as
                Systolic/Diastolic (e.g., 120/80)
                <br />• <strong>Systolic</strong> (top number): Pressure when
                heart beats
                <br />• <strong>Diastolic</strong> (bottom number): Pressure
                when heart rests
              </p>
            </div>

            {/* BP Invalid Warning */}
            {isBPInvalid && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">
                  Invalid Blood Pressure
                </AlertTitle>
                <AlertDescription className="text-red-700">
                  Systolic pressure must be higher than diastolic pressure.
                  Current: {systolicValue}/{diastolicValue} - Please check your
                  values.
                </AlertDescription>
              </Alert>
            )}

            {/* Measurements */}
            {ageIsValid && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="150"
                          {...field}
                          className="border-medical-100"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="systolicBP"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Systolic BP (mmHg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="120"
                          {...field}
                          className={cn(
                            "border-medical-100",
                            isBPInvalid && "border-red-500 focus:border-red-500"
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                      {isBPInvalid && (
                        <p className="text-sm text-red-600">
                          Systolic must be higher than diastolic
                        </p>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="diastolicBP"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diastolic BP (mmHg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="80"
                          {...field}
                          className={cn(
                            "border-medical-100",
                            isBPInvalid && "border-red-500 focus:border-red-500"
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                      {isBPInvalid && (
                        <p className="text-sm text-red-600">
                          Diastolic must be lower than systolic
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Real-time Results */}
            {results && (
              <>
                {/* Growth Chart Source Info Banner */}
                {ageInMonths >= 12 && ageInMonths < 24 && (
                  <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-2 mb-2 w-fit">
                    Height percentiles use <strong>WHO</strong> growth standards
                    for ages 1–2 years.
                  </div>
                )}
                {ageInMonths >= 24 && ageInMonths <= 215 && (
                  <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-2 mb-2 w-fit">
                    Height percentiles use <strong>CDC</strong> growth charts
                    for ages 2–17 years.
                  </div>
                )}
                <Card className="mt-6">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mt-6">
                        <h3 className="text-lg font-semibold">
                          Blood Pressure Assessment
                        </h3>
                        <Badge
                          className={cn(
                            "font-medium",
                            results.classification.bgColor,
                            results.classification.color
                          )}
                        >
                          {results.classification.category}
                        </Badge>
                      </div>

                      <div
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-lg border mb-4",
                          results.classification.category === "Normal" &&
                            "bg-green-50 border-green-200",
                          results.classification.category === "Elevated BP" &&
                            "bg-yellow-50 border-yellow-200",
                          results.classification.category === "Stage 1 HTN" &&
                            "bg-orange-50 border-orange-200",
                          results.classification.category === "Stage 2 HTN" &&
                            "bg-red-50 border-red-200"
                        )}
                      >
                        {results.classification.category === "Normal" && (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        )}
                        {(results.classification.category === "Elevated BP" ||
                          results.classification.category === "Stage 1 HTN" ||
                          results.classification.category ===
                            "Stage 2 HTN") && (
                          <AlertTriangle
                            className={cn(
                              "w-6 h-6",
                              results.classification.category ===
                                "Elevated BP" && "text-yellow-600",
                              results.classification.category ===
                                "Stage 1 HTN" && "text-orange-600",
                              results.classification.category ===
                                "Stage 2 HTN" && "text-red-600"
                            )}
                          />
                        )}
                        <div>
                          <div
                            className={cn(
                              "font-semibold text-lg",
                              results.classification.category === "Normal" &&
                                "text-green-800",
                              results.classification.category ===
                                "Elevated BP" && "text-yellow-800",
                              results.classification.category ===
                                "Stage 1 HTN" && "text-orange-800",
                              results.classification.category ===
                                "Stage 2 HTN" && "text-red-800"
                            )}
                          >
                            {results.classification.category}
                          </div>
                          <div
                            className={cn(
                              "text-sm",
                              results.classification.category === "Normal" &&
                                "text-green-700",
                              results.classification.category ===
                                "Elevated BP" && "text-yellow-700",
                              results.classification.category ===
                                "Stage 1 HTN" && "text-orange-700",
                              results.classification.category ===
                                "Stage 2 HTN" && "text-red-700"
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
                          Blood Pressure Details (
                          {selectedGender === "male" ? "Male" : "Female"})
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
                                Metric
                              </th>
                              <th className="py-2 px-4 text-left text-sm font-medium">
                                Systolic
                              </th>
                              <th className="py-2 px-4 text-left text-sm font-medium">
                                Diastolic
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t">
                              <td className="py-2 px-4 font-medium">
                                Value (mmHg)
                              </td>
                              <td className="py-2 px-4">
                                {results.systolic.value}
                              </td>
                              <td className="py-2 px-4">
                                {results.diastolic.value}
                              </td>
                            </tr>
                            <tr className="border-t">
                              <td className="py-2 px-4 font-medium">
                                Percentile (%)
                              </td>
                              <td className="py-2 px-4">
                                {results.systolic.percentile.toFixed(1)}%
                              </td>
                              <td className="py-2 px-4">
                                {results.diastolic.percentile.toFixed(1)}%
                              </td>
                            </tr>
                            <tr className="border-t">
                              <td className="py-2 px-4 font-medium">Z-Score</td>
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

                      {/* Clinical Interpretation */}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-sm mb-2 text-blue-800">
                          Clinical Interpretation
                        </h4>
                        <div className="text-xs text-blue-700">
                          <p>
                            <strong>Current BP:</strong>{" "}
                            {results.systolic.value}/{results.diastolic.value}{" "}
                            mmHg
                          </p>
                          <p>
                            <strong>Classification:</strong> Based on the higher
                            percentile (systolic:{" "}
                            {results.systolic.percentile.toFixed(1)}%,
                            diastolic: {results.diastolic.percentile.toFixed(1)}
                            %)
                          </p>
                          <p>
                            <strong>Height adjustment:</strong> Applied based on{" "}
                            {results.heightPercentile.toFixed(1)}th percentile
                            height
                          </p>
                        </div>
                      </div>

                      {(() => {
                        const references = getAgeSpecificReferences(
                          ageInYears,
                          selectedGender
                        );
                        return (
                          <div className="mt-4">
                            <div
                              className={cn(
                                "rounded-t-lg px-4 py-2 font-semibold text-white text-sm",
                                selectedGender === "male"
                                  ? "bg-medical-600"
                                  : "bg-medical-pink-600"
                              )}
                            >
                              Reference Ranges for Age {ageInYears} (
                              {selectedGender === "male" ? "Male" : "Female"})
                            </div>
                            <div className="border border-t-0 rounded-b-lg bg-white p-4">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Normal */}
                                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                  <div className="w-4 h-4 bg-green-500 rounded-full mt-0.5 flex-shrink-0"></div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-green-800 text-sm">
                                      Normal
                                    </div>
                                    <div className="text-green-700 text-xs mt-1 break-words">
                                      {references.normal}
                                    </div>
                                  </div>
                                </div>

                                {/* Elevated */}
                                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                  <div className="w-4 h-4 bg-yellow-500 rounded-full mt-0.5 flex-shrink-0"></div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-yellow-800 text-sm">
                                      Elevated
                                    </div>
                                    <div className="text-yellow-700 text-xs mt-1 break-words">
                                      {references.elevated}
                                    </div>
                                  </div>
                                </div>

                                {/* Stage 1 HTN */}
                                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                  <div className="w-4 h-4 bg-orange-500 rounded-full mt-0.5 flex-shrink-0"></div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-orange-800 text-sm">
                                      Stage 1 HTN
                                    </div>
                                    <div className="text-orange-700 text-xs mt-1 break-words">
                                      {references.stage1}
                                    </div>
                                  </div>
                                </div>

                                {/* Stage 2 HTN */}
                                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                  <div className="w-4 h-4 bg-red-500 rounded-full mt-0.5 flex-shrink-0"></div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-red-800 text-sm">
                                      Stage 2 HTN
                                    </div>
                                    <div className="text-red-700 text-xs mt-1 break-words">
                                      {references.stage2}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-gray-200">
                                <div className="flex items-start gap-2">
                                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-gray-600">
                                    These are approximate values based on 50th
                                    percentile height. Actual thresholds adjust
                                    for individual height percentile.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        <p>
                          Height percentile:{" "}
                          {results.heightPercentile.toFixed(1)}%
                        </p>
                        <p>
                          Height data:{" "}
                          {ageInMonths < 24
                            ? "WHO (1–2 years)"
                            : "CDC (2–17 years)"}
                        </p>
                        <p>
                          Reference: 2017 American Academy of Pediatrics
                          Clinical Practice Guideline
                        </p>
                        <p>
                          Note: Uses 2017 AAP screening table with quantile
                          regression approximation
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            {ageError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Invalid Age</AlertTitle>
                <AlertDescription>{ageError}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid || isBPInvalid}
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
                  Calculating...
                </>
              ) : (
                <>
                  Calculate Blood Pressure
                  <Activity className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
