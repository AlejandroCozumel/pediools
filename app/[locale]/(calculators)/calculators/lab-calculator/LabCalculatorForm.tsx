"use client";
import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { differenceInDays } from "date-fns";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import {
  Info,
  AlertTriangle,
  Baby,
  TestTube,
  FlaskConical,
  Microscope,
  Heart,
  Droplets,
  Activity,
  Calendar,
  Check,
  CheckCheckIcon,
  CheckCircleIcon,
} from "lucide-react";
import DateInputs from "@/components/DateInputs";
import { useLocale } from "next-intl";

// TypeScript interfaces
interface AgeRange {
  age: string;
  range?: {
    min: number;
    max: number;
  };
  male?: {
    min: number;
    max: number;
  };
  female?: {
    min: number;
    max: number;
  };
  unknown?: {
    min: number;
    max: number;
  };
}

interface TestData {
  name: string;
  nombre?: string;
  unit: string;
  ageRanges: AgeRange[];
}

interface CategoryData {
  name: string;
  nombre?: string;
  tests: Record<string, TestData>;
}

interface OrganizedLabData {
  metadata: {
    title: string;
    description: string;
    version: string;
    source: string;
    lastUpdated: string;
    units: string;
    disclaimer: string;
  };
  [key: string]: CategoryData | any;
}

interface LabResult {
  testKey: string;
  displayName: string;
  value: number;
  unit: string;
  referenceRange: {
    min: number | null;
    max: number | null;
  };
  status: "normal" | "low" | "high" | "critical" | "unknown";
  ageGroup: number | null;
  interpretation: string;
  category?: string;
  hasDateIssue?: boolean;
}

interface ParsedAgeRange {
  minDays: number | null;
  maxDays: number | null;
}

// Import our organized lab data
import organizedLabData from "@/app/data/lab-philadelphia.json";

// Type the imported data
const typedLabData = organizedLabData as OrganizedLabData;

// Form schema
const labFormSchema = z.object({
  dateOfBirth: z.date().optional(),
  dateOfMeasurement: z.date().optional(),
  gender: z.enum(["male", "female"]),
  labValues: z.record(z.string().optional()).optional(),
});

// Age parsing utility functions
const parseAgeRange = (ageString: string): ParsedAgeRange => {
  // Handle patterns like:
  // "≤ 3 days" → { minDays: null, maxDays: 3 }
  // "4-7 days" → { minDays: 4, maxDays: 7 }
  // "15d-6 months" → { minDays: 15, maxDays: 180 }
  // "6m-1 year" → { minDays: 180, maxDays: 365 }
  // "≥ 21 years" → { minDays: 7665, maxDays: null }

  const str = ageString.toLowerCase().trim();

  // Handle ≤ patterns
  if (str.includes("≤") || str.includes("<=")) {
    const match = str.match(/(≤|<=)\s*(\d+)\s*(day|month|year)s?/);
    if (match) {
      const value = parseInt(match[2]);
      const unit = match[3];
      return { minDays: null, maxDays: convertToDays(value, unit) };
    }
  }

  // Handle ≥ patterns
  if (str.includes("≥") || str.includes(">=")) {
    const match = str.match(/(≥|>=)\s*(\d+)\s*(day|month|year)s?/);
    if (match) {
      const value = parseInt(match[2]);
      const unit = match[3];
      return { minDays: convertToDays(value, unit), maxDays: null };
    }
  }

  // Handle range patterns like "4-7 days", "15d-6 months"
  const rangeMatch = str.match(
    /(\d+)([dm]?)\s*-\s*(\d+)\s*([dm]?)\s*(day|month|year)s?/
  );
  if (rangeMatch) {
    const minVal = parseInt(rangeMatch[1]);
    const minUnit = rangeMatch[2] || rangeMatch[5];
    const maxVal = parseInt(rangeMatch[3]);
    const maxUnit = rangeMatch[4] || rangeMatch[5];

    return {
      minDays: convertToDays(
        minVal,
        minUnit === "d" ? "day" : minUnit === "m" ? "month" : rangeMatch[5]
      ),
      maxDays: convertToDays(
        maxVal,
        maxUnit === "d" ? "day" : maxUnit === "m" ? "month" : rangeMatch[5]
      ),
    };
  }

  // Handle mixed patterns like "0d-6 years"
  const mixedMatch = str.match(/(\d+)d\s*-\s*(\d+)\s*(year|month)s?/);
  if (mixedMatch) {
    const minDays = parseInt(mixedMatch[1]);
    const maxVal = parseInt(mixedMatch[2]);
    const maxUnit = mixedMatch[3];

    return {
      minDays: minDays,
      maxDays: convertToDays(maxVal, maxUnit),
    };
  }

  // Default fallback
  return { minDays: null, maxDays: null };
};

const convertToDays = (value: number, unit: string): number => {
  switch (unit.toLowerCase()) {
    case "day":
    case "days":
    case "d":
      return value;
    case "month":
    case "months":
    case "m":
      return value * 30; // Approximate
    case "year":
    case "years":
    case "y":
      return value * 365; // Approximate
    default:
      return value;
  }
};

const isAgeInRange = (
  patientAgeDays: number,
  ageRangeString: string
): boolean => {
  const range = parseAgeRange(ageRangeString);

  if (range.minDays !== null && patientAgeDays < range.minDays) return false;
  if (range.maxDays !== null && patientAgeDays > range.maxDays) return false;

  return true;
};

// Helper function to find matching reference range
const findReferenceRange = (
  testData: TestData,
  patientAgeDays: number | null,
  gender: "male" | "female"
): { min: number | null; max: number | null } => {
  if (
    !testData?.ageRanges ||
    !Array.isArray(testData.ageRanges) ||
    testData.ageRanges.length === 0
  ) {
    return { min: null, max: null };
  }

  // If no age provided, try to find a general range
  if (patientAgeDays === null) {
    // Look for "all ages" or use first available range
    const allAgesRange = testData.ageRanges.find(
      (range) =>
        range.age.toLowerCase().includes("all ages") ||
        range.age.toLowerCase().includes("all")
    );

    if (allAgesRange) {
      if (allAgesRange.male && allAgesRange.female) {
        const genderData =
          gender === "male" ? allAgesRange.male : allAgesRange.female;
        return { min: genderData.min, max: genderData.max };
      } else if (allAgesRange.range) {
        return { min: allAgesRange.range.min, max: allAgesRange.range.max };
      }
    }

    // Fallback to first range
    const fallback = testData.ageRanges[0];
    if (fallback?.range) {
      return { min: fallback.range.min, max: fallback.range.max };
    }
    return { min: null, max: null };
  }

  // Find exact age and gender match
  let matched = false;
  for (const ageRange of testData.ageRanges) {
    if (isAgeInRange(patientAgeDays, ageRange.age)) {
      matched = true;
      // Check if this range has gender-specific values
      if (ageRange.male && ageRange.female) {
        const genderData = gender === "male" ? ageRange.male : ageRange.female;
        return { min: genderData.min, max: genderData.max };
      } else if (ageRange.range) {
        // Use generic range for both genders if male/female not present
        return { min: ageRange.range.min, max: ageRange.range.max };
      }
    }
  }

  // If no match, find the closest range by age
  let closestRange = null;
  let closestDiff = Infinity;
  for (const ageRange of testData.ageRanges) {
    // Parse min/max days for the range
    const parsed = parseAgeRange(ageRange.age);
    let diff = Infinity;
    if (parsed.minDays !== null && parsed.maxDays !== null) {
      // If patient is below min, diff is minDays - patient
      if (patientAgeDays < parsed.minDays)
        diff = parsed.minDays - patientAgeDays;
      // If patient is above max, diff is patient - maxDays
      else if (patientAgeDays > parsed.maxDays)
        diff = patientAgeDays - parsed.maxDays;
      else diff = 0; // Shouldn't happen, would have matched
    } else if (parsed.minDays !== null) {
      diff = Math.abs(patientAgeDays - parsed.minDays);
    } else if (parsed.maxDays !== null) {
      diff = Math.abs(patientAgeDays - parsed.maxDays);
    }
    if (diff < closestDiff) {
      closestDiff = diff;
      closestRange = ageRange;
    }
  }
  if (closestRange) {
    if (closestRange.male && closestRange.female) {
      const genderData =
        gender === "male" ? closestRange.male : closestRange.female;
      return { min: genderData.min, max: genderData.max };
    } else if (closestRange.range) {
      return { min: closestRange.range.min, max: closestRange.range.max };
    }
  }

  return { min: null, max: null };
};

// Lab status evaluation
const getLabStatus = (
  value: number,
  referenceRange: { min: number | null; max: number | null }
): "normal" | "low" | "high" | "critical" | "unknown" => {
  if (referenceRange.min === null && referenceRange.max === null) {
    return "unknown";
  }

  const { min, max } = referenceRange;

  if (min !== null && value < min) {
    return value < min * 0.5 ? "critical" : "low";
  }

  if (max !== null && value > max) {
    return value > max * 1.5 ? "critical" : "high";
  }

  return "normal";
};

const getInterpretation = (status: string): string => {
  switch (status) {
    case "normal":
      return "Within normal limits";
    case "low":
      return "Below reference range";
    case "high":
      return "Above reference range";
    case "critical":
      return "Critical value - requires immediate attention";
    case "unknown":
      return "Reference range not available";
    default:
      return "";
  }
};

// Category icons
const getCategoryIcon = (categoryKey: string): JSX.Element => {
  switch (categoryKey) {
    case "coreRoutineTests":
      return <TestTube className="h-4 w-4" />;
    case "coagulationTimes":
      return <Droplets className="h-4 w-4" />;
    case "basicMetabolicPanel":
      return <FlaskConical className="h-4 w-4" />;
    case "comprehensiveMetabolicPanel":
      return <Microscope className="h-4 w-4" />;
    case "liverFunctionTests":
      return <Activity className="h-4 w-4" />;
    case "additionalSpecializedTests":
      return <TestTube className="h-4 w-4" />;
    case "lipidPanel":
      return <Heart className="h-4 w-4" />;
    default:
      return <TestTube className="h-4 w-4" />;
  }
};

// Results component
const LabResults: React.FC<{
  results: LabResult[];
  gender: "male" | "female";
}> = ({ results, gender }) => {
  const t = useTranslations("LabCalculator");

  if (!results.length) {
    return (
      <Alert className="border-medical-200 bg-medical-50">
        <Info className="h-4 w-4 text-medical-500" />
        <AlertDescription>Enter lab values to see results</AlertDescription>
      </Alert>
    );
  }

  const criticalResults = results.filter((r) => r.status === "critical");
  const resultsWithDateIssues = results.filter((r) => r.hasDateIssue);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "high":
      case "low":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
            <AlertTriangle className="w-3 h-3" />
            LOW
          </span>
        );
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
            <AlertTriangle className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case "normal":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
            <CheckCircleIcon className="w-3 h-3" />
            NORMAL
          </span>
        );
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle
          className={cn(
            "transition-colors duration-300",
            gender === "male" ? "text-medical-700" : "text-medical-pink-700"
          )}
        >
          Lab Results ({results.length} test{results.length !== 1 ? "s" : ""})
        </CardTitle>

        {/* Date Warning */}
        {resultsWithDateIssues.length > 0 && (
          <Alert className="!mt-4 bg-yellow-50 border-yellow-200">
            <Calendar className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Age-specific ranges unavailable:</strong>{" "}
              {resultsWithDateIssues.length} result(s) are using general
              reference ranges because birth date or measurement date is
              missing. For accurate pediatric results, please enter both dates.
            </AlertDescription>
          </Alert>
        )}

        {/* Critical Values Alert */}
        {criticalResults.length > 0 && (
          <Alert className="!mt-4 bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Critical Values:</strong> {criticalResults.length}{" "}
              result(s) require immediate attention.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="!pt-0">
        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={cn(
                "border rounded-lg p-4 transition-all duration-200",
                getCardBg(result.status)
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4
                    className={cn(
                      "font-medium text-lg transition-colors duration-300",
                      gender === "male"
                        ? "text-medical-800"
                        : "text-medical-pink-800"
                    )}
                  >
                    {result.displayName}
                    {result.hasDateIssue && (
                      <span className="ml-2 text-xs text-yellow-600 font-normal">
                        (General range used)
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {result.ageGroup !== null
                      ? `Age: ${result.ageGroup} days • Gender: ${gender}`
                      : `Gender: ${gender} • Age: Not specified`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {result.hasDateIssue && (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      NO AGE
                    </Badge>
                  )}
                  {getStatusBadge(result.status)}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={cn(
                    "p-3 rounded-md transition-colors duration-300",
                    gender === "male" ? "bg-medical-50" : "bg-medical-pink-50"
                  )}
                >
                  <Label className="text-sm font-medium text-muted-foreground">
                    Patient Value
                  </Label>
                  <p
                    className={cn(
                      "text-lg font-semibold transition-colors duration-300",
                      gender === "male"
                        ? "text-medical-700"
                        : "text-medical-pink-700"
                    )}
                  >
                    {result.value.toFixed(2)} {result.unit}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-gray-50">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Reference Range
                  </Label>
                  <p className="text-sm font-medium text-gray-700">
                    {result.referenceRange.min !== null &&
                    result.referenceRange.max !== null
                      ? `${result.referenceRange.min} - ${result.referenceRange.max} ${result.unit}`
                      : result.referenceRange.min !== null
                      ? `> ${result.referenceRange.min} ${result.unit}`
                      : result.referenceRange.max !== null
                      ? `< ${result.referenceRange.max} ${result.unit}`
                      : "Range not available"}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-slate-50">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Interpretation
                  </Label>
                  <p className="text-sm font-medium text-slate-700">
                    {result.interpretation}
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {(() => {
                  // Find the age range used for this result
                  const testData = (() => {
                    for (const [catKey, category] of Object.entries(
                      typedLabData
                    )) {
                      if (catKey === "metadata") continue;
                      const categoryData = category as CategoryData;
                      if (
                        categoryData.tests &&
                        categoryData.tests[result.testKey]
                      ) {
                        return categoryData.tests[result.testKey];
                      }
                    }
                    return null;
                  })();
                  if (!testData) return null;
                  // Find the matching age range
                  const patientAgeDays = result.ageGroup;
                  let matchedRange = null;
                  if (patientAgeDays !== null) {
                    for (const ageRange of testData.ageRanges) {
                      if (isAgeInRange(patientAgeDays, ageRange.age)) {
                        matchedRange = ageRange;
                        break;
                      }
                    }
                  }
                  if (!matchedRange) matchedRange = testData.ageRanges[0];
                  // Age range label
                  const ageLabel = matchedRange?.age
                    ? `Age range: ${matchedRange.age}`
                    : "";
                  // Sex label
                  let sexLabel = "";
                  if (matchedRange?.male && matchedRange?.female) {
                    sexLabel = `Sex: ${gender === "male" ? "Boy" : "Girl"}`;
                  } else if (matchedRange?.range) {
                    sexLabel = "Sex: All";
                  }
                  let ageOutOfRange = false;
                  if (patientAgeDays !== null) {
                    ageOutOfRange = !testData.ageRanges.some((ageRange) =>
                      isAgeInRange(patientAgeDays, ageRange.age)
                    );
                  }
                  return (
                    <>
                      <div className="flex items-center gap-2 mt-2">
                        {ageOutOfRange ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            Closest range:{" "}
                            {matchedRange?.age || t("LabCalculator.noAgeBadge")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                            <Calendar className="w-3 h-3" />{" "}
                            {matchedRange?.age || t("LabCalculator.noAgeBadge")}
                          </span>
                        )}
                        {matchedRange?.male && matchedRange?.female ? (
                          gender === "male" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-medical-100 text-medical-800 text-xs font-semibold">
                              <Baby className="w-3 h-3" /> Boy
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-medical-pink-100 text-medical-pink-800 text-xs font-semibold">
                              <Baby className="w-3 h-3" /> Girl
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold">
                            <Baby className="w-3 h-3" /> All
                          </span>
                        )}
                      </div>
                      {ageOutOfRange && (
                        <div className="mt-1 text-xs text-yellow-700 bg-yellow-100 border border-yellow-300 rounded p-1">
                          <strong>Note:</strong> Patient age does not fit any
                          reference range for this test. The closest available
                          range is shown.
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground mt-6 p-4 bg-gray-50 rounded-md">
          <p className="font-medium mb-2">Reference Data Sources:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <a
                href="https://www.chop.edu/sites/default/files/2024-06/chop-labs-reference-ranges.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                CHOP Labs Reference Ranges - Children's Hospital of Philadelphia
              </a>
            </li>
          </ul>
          <p className="mt-2 text-xs">
            <strong>Disclaimer:</strong> These values are commonly accepted
            reference ranges compiled from multiple sources. Patient-specific
            goals may differ depending on age, sex, clinical condition and
            laboratory methodology used. Always consult with a healthcare
            professional for interpretation of laboratory results.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Add this helper function near your other helpers:
const getCardBg = (status: string) => {
  switch (status) {
    case "critical":
      return "bg-red-50 border-red-200";
    case "high":
    case "low":
      return "bg-yellow-50 border-yellow-200";
    case "normal":
    default:
      return "bg-white border-medical-200";
  }
};

// Main form component
const LabCalculatorForm: React.FC = () => {
  const t = useTranslations("LabCalculator");
  const locale = useLocale();

  const form = useForm<z.infer<typeof labFormSchema>>({
    resolver: zodResolver(labFormSchema),
    mode: "onChange",
    defaultValues: {
      gender: "male",
      dateOfMeasurement: new Date(),
      labValues: {},
    },
  });

  // Force validation/recalculation on mount
  React.useEffect(() => {
    form.trigger();
  }, []);

  const labValues =
    useWatch({ control: form.control, name: "labValues" }) || {};
  const dateOfBirth = useWatch({ control: form.control, name: "dateOfBirth" });
  const dateOfMeasurement = useWatch({
    control: form.control,
    name: "dateOfMeasurement",
  });
  const gender = useWatch({ control: form.control, name: "gender" });

  // Get display name based on locale
  const getDisplayName = (testData: TestData): string => {
    if (locale === "es" && testData.nombre) {
      return testData.nombre;
    }
    return testData.name || "Unknown Test";
  };

  // Calculate results - now works even without dates
  const results = useMemo((): LabResult[] => {
    if (!Object.keys(labValues).length) {
      return [];
    }

    // Calculate patient age in days (null if dates missing)
    let patientAgeDays: number | null = null;
    let hasDateIssue = false;

    if (dateOfBirth && dateOfMeasurement) {
      patientAgeDays = differenceInDays(dateOfMeasurement, dateOfBirth);
    } else {
      hasDateIssue = true;
    }

    return Object.entries(labValues)
      .filter(([_, value]) => value && !isNaN(parseFloat(value as string)))
      .map(([testKey, value]): LabResult => {
        const numericValue = parseFloat(value as string);

        // Find test data in our organized structure
        let testData: TestData | null = null;
        let categoryKey = "";

        for (const [catKey, category] of Object.entries(typedLabData)) {
          if (catKey === "metadata") continue;

          const categoryData = category as CategoryData;
          if (categoryData.tests && categoryData.tests[testKey]) {
            testData = categoryData.tests[testKey];
            categoryKey = catKey;
            break;
          }
        }

        if (!testData) {
          return {
            testKey,
            displayName: testKey,
            value: numericValue,
            unit: "",
            referenceRange: { min: null, max: null },
            status: "unknown",
            ageGroup: patientAgeDays,
            interpretation: "Test not found in reference data",
            hasDateIssue,
          };
        }

        const referenceRange = findReferenceRange(
          testData,
          patientAgeDays,
          gender
        );
        const status = getLabStatus(numericValue, referenceRange);

        return {
          testKey,
          displayName: getDisplayName(testData),
          value: numericValue,
          unit: testData.unit || "",
          referenceRange,
          status,
          ageGroup: patientAgeDays,
          interpretation: getInterpretation(status),
          category: categoryKey,
          hasDateIssue,
        };
      });
  }, [dateOfBirth, dateOfMeasurement, gender, labValues, locale]);

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="p-4 lg:p-6">
        <CardTitle className="text-2xl font-heading text-medical-900">
          Pediatric Lab Calculator
        </CardTitle>
        <CardDescription>
          Enter patient information and lab values to get age and
          gender-specific reference ranges. Age-specific ranges require both
          birth date and measurement date.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 lg:p-6 !pt-0">
        <div className="container mx-auto space-y-6">
          <Form {...form}>
            <form className="space-y-6">
              {/* Patient Demographics */}
              <Card
                className={cn(
                  "transition-colors duration-300",
                  gender === "male"
                    ? "border-medical-200 bg-medical-10"
                    : "border-medical-pink-200 bg-medical-pink-50"
                )}
              >
                <CardHeader>
                  <CardTitle
                    className={cn(
                      "transition-colors duration-300",
                      gender === "male"
                        ? "text-medical-700"
                        : "text-medical-pink-700"
                    )}
                  >
                    Patient Information
                  </CardTitle>
                  <CardDescription>
                    Dates are optional but recommended for accurate age-specific
                    reference ranges
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 !pt-0">
                  {/* Gender Selection */}
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="space-y-0 mb-6">
                        <Tabs
                          value={field.value}
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
                                  field.value === "male"
                                    ? "text-white"
                                    : "text-medical-600"
                                }
                              `}
                                />
                                <span className="font-medium">Boy</span>
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
                                  field.value === "female"
                                    ? "text-white"
                                    : "text-medical-pink-600"
                                }
                              `}
                                />
                                <span className="font-medium">Girl</span>
                              </div>
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date Inputs */}
                  <DateInputs form={form} gender={gender} />
                </CardContent>
              </Card>

              {dateOfBirth && dateOfMeasurement ? (
                <>
                  {/* Lab Values by Category */}
                  <Card
                    className={cn(
                      "transition-colors duration-300",
                      gender === "male"
                        ? "border-medical-200"
                        : "border-medical-pink-200"
                    )}
                  >
                    <CardHeader>
                      <CardTitle
                        className={cn(
                          "transition-colors duration-300",
                          gender === "male"
                            ? "text-medical-700"
                            : "text-medical-pink-700"
                        )}
                      >
                        Laboratory Tests
                      </CardTitle>
                      <CardDescription>
                        Enter values for the tests you want to analyze. All
                        sections are expanded by default.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="!pt-0">
                      <Accordion
                        type="multiple"
                        className="w-full"
                        defaultValue={Object.keys(typedLabData).filter(
                          (key) => key !== "metadata"
                        )}
                      >
                        {Object.entries(typedLabData)
                          .filter(([key]) => key !== "metadata")
                          .map(([categoryKey, category]) => {
                            const categoryData = category as CategoryData;
                            return (
                              <AccordionItem
                                key={categoryKey}
                                value={categoryKey}
                              >
                                <AccordionTrigger
                                  className={cn(
                                    "text-left transition-colors duration-300",
                                    gender === "male"
                                      ? "hover:text-medical-700"
                                      : "hover:text-medical-pink-700"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    {getCategoryIcon(categoryKey)}
                                    <span className="font-medium">
                                      {locale === "es" && categoryData.nombre
                                        ? categoryData.nombre
                                        : categoryData.name}
                                    </span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                    {categoryData.tests &&
                                      Object.entries(categoryData.tests).map(
                                        ([testKey, testData]) => (
                                          <div
                                            key={testKey}
                                            className={cn(
                                              "p-4 rounded-lg border transition-colors duration-300 flex flex-col justify-between h-full",
                                              gender === "male"
                                                ? "border-medical-200 bg-medical-50"
                                                : "border-medical-pink-200 bg-medical-pink-50"
                                            )}
                                          >
                                            <Label
                                              className={cn(
                                                "font-medium transition-colors duration-300",
                                                gender === "male"
                                                  ? "text-medical-700"
                                                  : "text-medical-pink-700"
                                              )}
                                            >
                                              {getDisplayName(testData)}
                                            </Label>
                                            <p className="text-xs text-muted-foreground mb-2">
                                              Unit: {testData.unit || "N/A"}
                                            </p>
                                            <Input
                                              type="number"
                                              step="0.01"
                                              placeholder="Enter value"
                                              className={cn(
                                                "transition-colors duration-300",
                                                gender === "male"
                                                  ? "border-medical-200 focus:ring-medical-500"
                                                  : "border-medical-pink-200 focus:ring-medical-pink-500"
                                              )}
                                              value={
                                                (labValues[
                                                  testKey
                                                ] as string) || ""
                                              }
                                              onChange={(e) => {
                                                form.setValue(
                                                  `labValues.${testKey}`,
                                                  e.target.value
                                                );
                                              }}
                                            />
                                          </div>
                                        )
                                      )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                      </Accordion>
                    </CardContent>
                  </Card>

                  {/* Results */}
                  <LabResults results={results} gender={gender} />
                </>
              ) : (
                // If dates are NOT selected, show a prompt message
                <Alert
                  variant="default"
                  className="mb-4 bg-blue-50 border-blue-200 text-blue-800 flex items-start"
                >
                  <Info className="w-5 h-5 mt-0.5 mr-2" />
                  <div>
                    <AlertTitle className="font-semibold">
                      Start Here
                    </AlertTitle>
                    <AlertDescription>
                      Please select both a <strong>Date of Birth</strong> and a{" "}
                      <strong>Date of Measurement</strong> to proceed.
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
};

export default LabCalculatorForm;
