"use client";
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import harrietLaneData from "@/app/data/lab-philadelphia.json";
import { differenceInMonths, differenceInDays } from "date-fns";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Info, Trash2, Plus, AlertTriangle, Search, User } from "lucide-react";
import DateInputs from "@/components/DateInputs";
import { useSubscriptionStore } from "@/stores/premiumStore";
import PatientSelector from "@/components/premium/PatientSelector";
import { useLocale } from "next-intl";

// TypeScript interfaces for Harriet Lane data
interface AgeRange {
  age: string;
  range: {
    min: number;
    max: number;
  };
}

interface TestData {
  unit: string;
  name?: string;
  nombre?: string;
  ageRanges: AgeRange[];
}

interface HarrietLaneData {
  metadata: {
    title: string;
    description: string;
    version: string;
    source: string;
    lastUpdated: string;
    units: string;
    disclaimer: string;
  };
  serumChemistries: Record<string, TestData>;
  hematology: Record<string, TestData>;
}

// Type assertion for the imported JSON
const typedHarrietLaneData = harrietLaneData as HarrietLaneData;

// Form schema for lab calculator - simplified to only what we need
const labFormSchema = z.object({
  dateOfBirth: z.date().optional(),
  dateOfMeasurement: z.date().optional(),
  gender: z.enum(["male", "female"]),
  labValues: z
    .array(
      z.object({
        testName: z.string().min(1, "Test name is required"),
        value: z.string().min(1, "Value is required"),
        unit: z.string().min(1, "Unit is required"),
      })
    )
    .min(1, "At least one lab value is required"),
});

// Interface for patient data - simplified
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string;
  gender: "male" | "female";
}

interface LabValue {
  testName: string;
  value: string;
  unit: string;
}

interface ReferenceRange {
  min: number | null;
  max: number | null;
}

interface LabResult {
  testName: string;
  displayName: string;
  value: number;
  unit: string;
  referenceRange: ReferenceRange;
  status: "normal" | "low" | "high" | "critical" | "unknown";
  ageGroup: string;
  interpretation: string;
}

// Helper function to determine age group from patient data
const getAgeGroup = (birthDate: Date, measurementDate: Date): string => {
  const ageInMonths = differenceInMonths(measurementDate, birthDate);
  const ageInDays = differenceInDays(measurementDate, birthDate);

  if (ageInDays <= 30) return "under_30days";
  if (ageInMonths < 1) return "newborn";
  if (ageInMonths < 3) return "1_to_3months";
  if (ageInMonths < 12) return "3months_to_1year";
  if (ageInMonths < 24) return "1_to_23months";
  if (ageInMonths < 36) return "1_to_3years";
  if (ageInMonths < 60) return "3_to_5years";
  if (ageInMonths < 108) return "2_to_9years";
  if (ageInMonths < 144) return "4_to_11years";
  if (ageInMonths < 180) return "10_to_15years";
  if (ageInMonths < 216) return "12_to_17years";
  return "18years_and_older";
};

// Helper function to find matching reference range
const findReferenceRange = (
  testData: TestData | undefined,
  ageGroup: string,
  gender: "male" | "female"
): ReferenceRange => {
  if (!testData?.ageRanges) return { min: null, max: null };

  // Try to find exact match first
  let matchingRange = testData.ageRanges.find(
    (range: AgeRange) =>
      range.age === ageGroup ||
      range.age === `${ageGroup}_${gender}` ||
      range.age.includes(ageGroup)
  );

  // If no exact match, try gender-specific ranges
  if (!matchingRange && gender) {
    matchingRange = testData.ageRanges.find(
      (range: AgeRange) =>
        range.age.includes(gender) && range.age.includes(ageGroup.split("_")[0])
    );
  }

  // If still no match, try broader age groups
  if (!matchingRange) {
    const ageGroupMappings: Record<string, string[]> = {
      under_30days: ["newborn", "all_ages"],
      newborn: ["1_to_3months", "all_ages"],
      "1_to_3months": ["3months_to_1year", "child", "all_ages"],
      "3months_to_1year": ["1_to_23months", "child", "all_ages"],
      "1_to_23months": ["child", "all_ages"],
      "1_to_3years": ["child", "all_ages"],
      "3_to_5years": ["child", "4_to_11years", "all_ages"],
      "2_to_9years": ["child", "4_to_11years", "all_ages"],
      "4_to_11years": ["child", "10_to_15years", "all_ages"],
      "10_to_15years": ["adolescent", "all_ages"],
      "12_to_17years": ["adolescent", "all_ages"],
      "18years_and_older": ["adult", "all_ages"],
    };

    const fallbacks = ageGroupMappings[
      ageGroup as keyof typeof ageGroupMappings
    ] || ["all_ages"];

    for (const fallback of fallbacks) {
      matchingRange = testData.ageRanges.find(
        (range: AgeRange) =>
          range.age === fallback || range.age === `${fallback}_${gender}`
      );
      if (matchingRange) break;
    }
  }

  if (!matchingRange) {
    // Last resort: use the first available range
    matchingRange = testData.ageRanges[0];
  }

  return {
    min: matchingRange?.range?.min ?? null,
    max: matchingRange?.range?.max ?? null,
  };
};

// Helper function to determine lab value status
const getLabStatus = (
  value: number,
  referenceRange: ReferenceRange
): "normal" | "low" | "high" | "critical" | "unknown" => {
  if (referenceRange.min === null && referenceRange.max === null) {
    return "unknown";
  }

  const { min, max } = referenceRange;

  if (min !== null && value < min) {
    // Consider values 50% below minimum as critical
    if (value < min * 0.5) return "critical";
    return "low";
  }

  if (max !== null && value > max) {
    // Consider values 50% above maximum as critical
    if (value > max * 1.5) return "critical";
    return "high";
  }

  return "normal";
};

// Helper function to get interpretation
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

// Results component
const LabResults: React.FC<{
  results: LabResult[];
  gender: "male" | "female";
  isPremium: boolean;
}> = ({ results, gender, isPremium }) => {
  const t = useTranslations("LabCalculator");

  if (!results.length) {
    return (
      <Alert className="border-medical-200 bg-medical-50">
        <Info className="h-4 w-4 text-medical-500" />
        <AlertDescription>
          {t("noResults")}
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-green-100 text-green-800 border-green-200";
      case "low":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const criticalResults = results.filter((r) => r.status === "critical");

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span
            className={cn(
              "transition-colors duration-300",
              gender === "male" ? "text-medical-700" : "text-medical-pink-700"
            )}
          >
            {t("resultsTitle")}
          </span>
          <Badge
            variant={isPremium ? "default" : "secondary"}
            className={cn(
              gender === "male"
                ? "bg-medical-100 text-medical-700"
                : "bg-medical-pink-100 text-medical-pink-700"
            )}
          >
            {isPremium ? t("premium") : t("basic")}
          </Badge>
        </CardTitle>

        {/* Critical Values Alert */}
        {criticalResults.length > 0 && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>{t("criticalValues")}:</strong>{" "}
              {criticalResults.length} {t("result")}(s) {t("criticalResultsAttention")}.
            </AlertDescription>
          </Alert>
        )}

        {!isPremium && (
          <Alert className="bg-medical-50 border-medical-200">
            <Info className="h-4 w-4 text-medical-600" />
            <AlertDescription className="text-medical-700">
              {t("basicPlan")} {t("completeHarrietLaneReferenceDataset")} {t("with200SpecializedTests")}.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={cn(
                "border rounded-lg p-4 transition-all duration-200",
                result.status === "critical" && "border-red-300 bg-red-50",
                gender === "male"
                  ? "border-medical-200"
                  : "border-medical-pink-200"
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
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("ageGroup")}: {result.ageGroup.replace(/_/g, " ")} • {t("gender")}:{" "}
                    {gender}
                  </p>
                </div>
                <Badge className={cn("border", getStatusColor(result.status))}>
                  {result.status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={cn(
                    "p-3 rounded-md transition-colors duration-300",
                    gender === "male" ? "bg-medical-50" : "bg-medical-pink-50"
                  )}
                >
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("patientValue")}
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
                    {t("referenceRange")}
                  </Label>
                  <p className="text-sm font-medium text-gray-700">
                    {result.referenceRange.min !== null &&
                    result.referenceRange.max !== null
                      ? `${result.referenceRange.min} - ${result.referenceRange.max} ${result.unit}`
                      : result.referenceRange.min !== null
                      ? `> ${result.referenceRange.min} ${result.unit}`
                      : result.referenceRange.max !== null
                      ? `< ${result.referenceRange.max} ${result.unit}`
                      : t("interpretationUnknown")}
                  </p>
                </div>

                <div className="p-3 rounded-md bg-slate-50">
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("interpretation")}
                  </Label>
                  <p className="text-sm font-medium text-slate-700">
                    {result.interpretation}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="text-xs text-muted-foreground mt-4 p-4 bg-gray-50 rounded-md">
            <p className="font-medium mb-2">{t("referenceDataSources")}:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <a
                  href="https://www.chop.edu/sites/default/files/2024-06/chop-labs-reference-ranges.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {t("chopLabsReferenceRanges")} - {t("childrensHospitalOfPhiladelphia")}
                </a>
              </li>
            </ul>
            <p className="mt-2 text-xs">
              <strong>{t("disclaimer")}:</strong> {t("disclaimerText")}. {t("valuesAreCommonlyAcceptedReferenceRanges")} {t("compiledFromMultipleSources")}. {t("patientSpecificGoalsMayDiffer")} {t("dependingOnAgeSexClinicalConditionAndLaboratoryMethodologyUsed")}. {t("alwaysConsultWithAHealthcareProfessionalForInterpretationOfLaboratoryResults")}.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main form component
const LabCalculatorForm: React.FC = () => {
  const t = useTranslations("LabCalculator");
  const { isPremium } = useSubscriptionStore();
  const locale = useLocale(); // Add this to get current locale

  const form = useForm<z.infer<typeof labFormSchema>>({
    resolver: zodResolver(labFormSchema),
    defaultValues: {
      gender: "male",
      dateOfMeasurement: new Date(),
      labValues: [{ testName: "", value: "", unit: "" }],
    },
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const watchedValues = form.watch();
  const { dateOfBirth, dateOfMeasurement, gender, labValues } = watchedValues;

  // Helper function to get display name based on locale
  const getDisplayName = (testKey: string) => {
    const testData =
      typedHarrietLaneData.serumChemistries[testKey as keyof typeof typedHarrietLaneData.serumChemistries] ||
      typedHarrietLaneData.hematology[testKey as keyof typeof typedHarrietLaneData.hematology];

    if (testData) {
      // Use nombre for Spanish, name for English, fallback to testKey
      if (locale === "es" && testData.nombre) {
        return testData.nombre;
      } else if (testData.name) {
        return testData.name;
      }
    }
    // Fallback: convert snake_case to Title Case
    return testKey
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const results = useMemo<LabResult[]>(() => {
    if (
      !dateOfBirth ||
      !dateOfMeasurement ||
      !labValues.some((lv) => lv.testName && lv.value)
    ) {
      return [];
    }

    const ageGroup = getAgeGroup(dateOfBirth, dateOfMeasurement);

    return labValues
      .filter((lv) => lv.testName && lv.value)
      .map((labValue): LabResult => {
        const numericValue = parseFloat(labValue.value);

        if (isNaN(numericValue)) {
          return {
            testName: labValue.testName,
            displayName: getDisplayName(labValue.testName),
            value: numericValue,
            unit: labValue.unit,
            referenceRange: { min: null, max: null },
            status: "unknown",
            ageGroup,
            interpretation: t("interpretationUnknown"),
          };
        }

        // Find the test in our Harriet Lane dataset
        const testKey = labValue.testName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_");
        let testData: TestData | undefined = undefined;

        // Search in serum chemistry first
        if (typedHarrietLaneData.serumChemistries[testKey as keyof typeof typedHarrietLaneData.serumChemistries]) {
          testData = typedHarrietLaneData.serumChemistries[testKey as keyof typeof typedHarrietLaneData.serumChemistries];
        }
        // Then search in hematology
        else if (typedHarrietLaneData.hematology[testKey as keyof typeof typedHarrietLaneData.hematology]) {
          testData = typedHarrietLaneData.hematology[testKey as keyof typeof typedHarrietLaneData.hematology];
        }
        // Search for common test name variations
        else {
          const commonMappings: Record<string, string> = {
            glucose: "glucose",
            creatinine: "creatinine",
            bun: "bun",
            sodium: "sodium",
            potassium: "potassium",
            chloride: "chloride",
            hemoglobin: "hemoglobin",
            hematocrit: "hematocrit",
            wbc: "wbc",
            platelets: "platelets",
            alt: "alt",
            ast: "ast",
            alkaline_phosphatase: "alkaline_phosphatase",
            total_bilirubin: "bilirubin_total",
            albumin: "albumin",
            calcium: "calcium_total",
          };

          const mappedKey = commonMappings[testKey];
          if (mappedKey) {
            testData =
              typedHarrietLaneData.serumChemistries[mappedKey as keyof typeof typedHarrietLaneData.serumChemistries] ||
              typedHarrietLaneData.hematology[mappedKey as keyof typeof typedHarrietLaneData.hematology];
          }
        }

        const referenceRange = testData
          ? findReferenceRange(testData, ageGroup, gender)
          : { min: null, max: null };
        const status = getLabStatus(numericValue, referenceRange);

        return {
          testName: labValue.testName,
          displayName: getDisplayName(labValue.testName),
          value: numericValue,
          unit: labValue.unit,
          referenceRange,
          status,
          ageGroup,
          interpretation: getInterpretation(status),
        };
      });
  }, [dateOfBirth, dateOfMeasurement, gender, labValues, locale, t]);

  const addLabValue = () => {
    const currentValues = form.getValues("labValues");
    form.setValue("labValues", [
      ...currentValues,
      { testName: "", value: "", unit: "" },
    ]);
  };

  const removeLabValue = (index: number) => {
    const currentValues = form.getValues("labValues");
    if (currentValues.length > 1) {
      form.setValue(
        "labValues",
        currentValues.filter((_, i) => i !== index)
      );
    }
  };

  // Common test keys that exist in Harriet Lane data
  const commonTestKeys = [
    "glucose",
    "creatinine",
    "bun",
    "sodium",
    "potassium",
    "chloride",
    "hemoglobin",
    "hematocrit",
    "wbc",
    "platelets",
    "alt",
    "ast",
    "bilirubin_total",
    "albumin",
    "calcium_total",
  ];

  // Get common tests with localized names
  const commonTests = commonTestKeys.map(testKey => {
    const testData =
      typedHarrietLaneData.serumChemistries[testKey as keyof typeof typedHarrietLaneData.serumChemistries] ||
      typedHarrietLaneData.hematology[testKey as keyof typeof typedHarrietLaneData.hematology];

    return {
      key: testKey,
      name: getDisplayName(testKey),
      unit: testData?.unit || "mg/dL", // fallback unit
    };
  });

  // Convert test names from snake_case to Title Case
  // const formatTestName = (name: string) => {
  //   return name
  //     .split("_")
  //     .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  //     .join(" ");
  // };

    const allTestNames = [
    ...Object.keys(typedHarrietLaneData.serumChemistries),
    ...Object.keys(typedHarrietLaneData.hematology),
  ].sort();

  // 1. Patient removal logic
  // In PatientSelector onPatientSelect, update the else block:
  // ...

  // ...

  // 2. Manual entry improvements
  // Get all test names from Harriet Lane data
  // const allTestNames = [
  //   ...Object.keys(typedHarrietLaneData.serumChemistries),
  //   ...Object.keys(typedHarrietLaneData.hematology),
  // ].sort();

  // In the manual entry section, change Test Name to a select:
  // ...
  // For Unit, if not custom, make it read-only and auto-filled. If custom, allow input.
  // <FormField
  //   control={form.control}
  //   name={`labValues.${index}.unit`}
  //   render={({ field }) => (
  //     <FormItem>
  //       <FormLabel className="text-sm">Unit</FormLabel>
  //       <FormControl>
  //         <Input
  //           {...field}
  //           placeholder="e.g., mg/dL"
  //           readOnly={form.getValues(`labValues.${index}.testName`) !== "custom"}
  //         />
  //       </FormControl>
  //       <FormMessage />
  //     </FormItem>
  //   )}
  // />
  // ... existing code ...

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Patient Selector - Outside Form Component */}
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
            {t("patientInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Selector for Lab Calculator */}
          <div>
            <Label className="text-sm font-medium mb-2 block">{t("searchPatient")}</Label>
            <PatientSelector
              form={form as any}
              onPatientSelect={(patient) => {
                setSelectedPatient(patient);
                if (patient) {
                  const birthDate = typeof patient.dateOfBirth === 'string'
                    ? new Date(patient.dateOfBirth)
                    : patient.dateOfBirth;
                  form.setValue("dateOfBirth", birthDate);
                  form.setValue("gender", patient.gender);
                } else {
                  form.setValue("dateOfBirth", undefined);
                  form.setValue("gender", "male");
                  setSelectedPatient(null); // ensure fields are enabled
                }
              }}
            />
          </div>
          {/* Patient Information - Simplified for Lab Calculator */}
          <div className="text-sm text-muted-foreground mb-4">
            {t("patientInfoHint")}
          </div>
        </CardContent>
      </Card>

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
                {t("patientInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Gender Selection */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("gender")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!!selectedPatient}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={cn(
                            "transition-colors duration-300",
                            selectedPatient && "opacity-50",
                            gender === "male"
                              ? "border-medical-200 focus:ring-medical-500"
                              : "border-medical-pink-200 focus:ring-medical-pink-500"
                          )}
                        >
                          <SelectValue placeholder={t("selectGender")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">{t("male")}</SelectItem>
                        <SelectItem value="female">{t("female")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Inputs */}
              <DateInputs
                form={form}
                gender={gender}
                hasSelectedPatient={!!selectedPatient}
              />
            </CardContent>
          </Card>

          {/* Lab Values Input */}
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
                  "flex justify-between items-center transition-colors duration-300",
                  gender === "male"
                    ? "text-medical-700"
                    : "text-medical-pink-700"
                )}
              >
                {t("labValues")}
                <Button
                  type="button"
                  onClick={addLabValue}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "transition-colors duration-300",
                    gender === "male"
                      ? "border-medical-300 text-medical-600 hover:bg-medical-50"
                      : "border-medical-pink-300 text-medical-pink-600 hover:bg-medical-pink-50"
                  )}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addLabValue")}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">{t("manualEntry")}</TabsTrigger>
                  <TabsTrigger value="common">{t("commonTests")}</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4 mt-4">
                  {labValues.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg border transition-colors duration-300",
                        gender === "male"
                          ? "border-medical-200 bg-medical-50"
                          : "border-medical-pink-200 bg-medical-pink-50"
                      )}
                    >
                      {/* Test Name as Select */}
                      <FormField
                        control={form.control}
                        name={`labValues.${index}.testName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">{t("testName")}</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  const testData =
                                    typedHarrietLaneData.serumChemistries[value as keyof typeof typedHarrietLaneData.serumChemistries] ||
                                    typedHarrietLaneData.hematology[value as keyof typeof typedHarrietLaneData.hematology];
                                  if (testData) {
                                    form.setValue(`labValues.${index}.unit`, testData.unit);
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectTest")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {allTestNames.map((name) => (
                                    <SelectItem key={name} value={name}>
                                      {getDisplayName(name)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Value */}
                      <FormField
                        control={form.control}
                        name={`labValues.${index}.value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">{t("value")}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                placeholder={t("enterValue")}
                                className={cn(
                                  "transition-colors duration-300",
                                  gender === "male"
                                    ? "border-medical-200 focus:ring-medical-500"
                                    : "border-medical-pink-200 focus:ring-medical-pink-500"
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Unit (auto-filled and read-only) */}
                      <FormField
                        control={form.control}
                        name={`labValues.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">{t("unit")}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("example")}
                                readOnly={true}
                                className={cn(
                                  "transition-colors duration-300",
                                  gender === "male"
                                    ? "border-medical-200 focus:ring-medical-500"
                                    : "border-medical-pink-200 focus:ring-medical-pink-500"
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Remove button */}
                      <div className="flex items-end">
                        <Button
                          type="button"
                          onClick={() => removeLabValue(index)}
                          variant="destructive"
                          size="sm"
                          disabled={labValues.length === 1}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("remove")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="common" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {commonTests.map((test, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-lg border transition-colors duration-300",
                          gender === "male"
                            ? "border-medical-200 bg-medical-50"
                            : "border-medical-pink-200 bg-medical-pink-50"
                        )}
                      >
                        <h4
                          className={cn(
                            "font-medium transition-colors duration-300",
                            gender === "male"
                              ? "text-medical-700"
                              : "text-medical-pink-700"
                          )}
                        >
                          {test.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {t("unit")}: {test.unit}
                        </p>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={t("enterValue")}
                          className={cn(
                            "transition-colors duration-300",
                            gender === "male"
                              ? "border-medical-200 focus:ring-medical-500"
                              : "border-medical-pink-200 focus:ring-medical-pink-500"
                          )}
                          onChange={(e) => {
                            const currentValues = form.getValues("labValues");
                            const existingIndex = currentValues.findIndex(
                              (lv) => lv.testName === test.key
                            );

                            if (existingIndex >= 0) {
                              const updatedValues = [...currentValues];
                              updatedValues[existingIndex].value =
                                e.target.value;
                              form.setValue("labValues", updatedValues);
                            } else {
                              const firstEmptyIndex = currentValues.findIndex(
                                (lv) => !lv.testName
                              );
                              if (firstEmptyIndex >= 0) {
                                const updatedValues = [...currentValues];
                                updatedValues[firstEmptyIndex] = {
                                  testName: test.key,
                                  value: e.target.value,
                                  unit: test.unit,
                                };
                                form.setValue("labValues", updatedValues);
                              } else {
                                form.setValue("labValues", [
                                  ...currentValues,
                                  {
                                    testName: test.key,
                                    value: e.target.value,
                                    unit: test.unit,
                                  },
                                ]);
                              }
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Results */}
      <LabResults results={results} gender={gender} isPremium={isPremium} />
    </div>
  );
};

export default LabCalculatorForm;
