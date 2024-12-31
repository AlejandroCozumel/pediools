"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Ruler, Weight, Baby, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DateInputs from "@/components/DateInputs";
import GestationalSelects from "@/components/GestationalSelects";
import { Badge } from "@/components/ui/badge";
import { differenceInMonths, differenceInDays } from "date-fns";
import MeasurementInput from "@/components/MeasurementInput";
import GrowthResults from "./GrowthResults";
import cdcChildWeightData from "@/app/data/cdc-data-weight.json";
import cdcChildHeightData from "@/app/data/cdc-data-height.json";
import cdcInfantWeightData from "@/app/data/cdc-data-infant-weight.json";
import cdcInfantHeightData from "@/app/data/cdc-data-infant-height.json";
import whoWeightData from "@/app/data/who-data-weight.json";
import whoHeightData from "@/app/data/who-data-height.json";
import cdcInfantHeightHead from "@/app/data/cdc-data-infant-head.json";
import whoHeadData from "@/app/data/who-data-head.json";

import MeasurementInputIntergrowth from "@/components/MeasurementInputIntergrowth";
import { usePremiumStore } from "@/stores/premiumStore";
import PatientSelector from "@/components/premium/PatientSelector";

interface StandardRange {
  min: number;
  max: number;
  validStandards: string[];
}

const growthStandards = [
  {
    id: "who",
    name: "WHO Growth Standard",
    description:
      "International standards for optimal growth (breastfed children from multiple countries)",
    ageRange: "0-24 months",
    details: "Recommended by WHO for international use",
  },
  {
    id: "cdc_infant",
    name: "CDC Growth (Infant)",
    description:
      "U.S. reference charts for tracking infant growth and development",
    ageRange: "0-36 months",
    details: "Based on U.S. national survey data",
  },
  {
    id: "cdc_child",
    name: "CDC Growth (Child)",
    description: "Standard U.S. pediatric growth charts for children and teens",
    ageRange: "2-20 years",
    details: "Most widely used in U.S. clinical practice",
  },
  {
    id: "intergrowth",
    name: "INTERGROWTH-21st",
    description: "International standards for newborn growth assessment",
    ageRange: "0-7 days",
    details: "Optimal for early postnatal growth monitoring",
  },
  // {
  //   id: "kromeyer",
  //   name: "Kromeyer-Hauschild",
  //   description:
  //     "German population-based reference for children and adolescents",
  //   ageRange: "0-18 years",
  //   details: "Standard reference in German-speaking countries",
  // },
];

export const formSchema = z
  .object({
    standard: z.string().min(1, "Please select a growth standard"),
    gender: z.enum(["male", "female"], {
      required_error: "Please select a gender",
    }),
    dateOfBirth: z.date().optional(),
    dateOfMeasurement: z.date().optional(),
    weight: z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "Please enter a valid weight in kg",
      }),
    height: z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "Please enter a valid height in cm",
      }),
    headCircumference: z.string().optional().default(""),
    gestationalAge: z
      .string()
      .optional()
      .refine(
        (val) => !val || (parseFloat(val) >= 24 && parseFloat(val) <= 42),
        {
          message: "Gestational age must be between 24 and 42 weeks",
        }
      ),
    gestationalWeeks: z.string().optional(),
    gestationalDays: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate non-intergrowth case
    if (data.standard !== "intergrowth") {
      if (!data.dateOfBirth) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date of birth is required for non-intergrowth standards",
          path: ["dateOfBirth"],
        });
      }
      if (!data.dateOfMeasurement) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Measurement date is required for non-intergrowth standards",
          path: ["dateOfMeasurement"],
        });
      }
    }

    // Validate intergrowth case
    if (data.standard === "intergrowth") {
      if (!data.gestationalWeeks) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Gestational weeks is required for Intergrowth",
          path: ["gestationalWeeks"],
        });
      }
      if (!data.gestationalDays) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Gestational days is required for Intergrowth",
          path: ["gestationalDays"],
        });
      }
      if (data.gestationalWeeks && data.gestationalDays) {
        const weeks = parseInt(data.gestationalWeeks);
        const days = parseInt(data.gestationalDays);
        if (weeks < 24 || weeks > 42) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Gestational weeks must be between 24 and 42",
            path: ["gestationalWeeks"],
          });
        }
        if (days < 0 || days > 6) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Gestational days must be between 0 and 6",
            path: ["gestationalDays"],
          });
        }
      }
    }
  })
  .refine(
    (data) => {
      if (
        data.standard !== "intergrowth" &&
        data.dateOfBirth &&
        data.dateOfMeasurement
      ) {
        return data.dateOfMeasurement >= data.dateOfBirth;
      }
      return true;
    },
    {
      message: "Measurement date must be after date of birth",
      path: ["dateOfMeasurement"],
    }
  )
  .refine(
    (data) => {
      if (data.standard === "intergrowth") return true;

      if (!data.dateOfBirth || !data.dateOfMeasurement) return true;

      const birthDate = new Date(
        data.dateOfBirth.getFullYear(),
        data.dateOfBirth.getMonth(),
        data.dateOfBirth.getDate() || 1
      );
      const measurementDate = new Date(
        data.dateOfMeasurement.getFullYear(),
        data.dateOfMeasurement.getMonth(),
        data.dateOfMeasurement.getDate() || 1
      );

      const ageInMonths = differenceInMonths(measurementDate, birthDate);

      switch (data.standard) {
        case "who":
          return ageInMonths >= 0 && ageInMonths <= 24;
        case "cdc_infant":
          return ageInMonths >= 0 && ageInMonths <= 36;
        case "cdc_child":
          return ageInMonths >= 24 && ageInMonths <= 240;
        // case "kromeyer":
        //   return ageInMonths >= 0 && ageInMonths <= 216;
      }
      return true;
    },
    {
      message: "Selected growth standard not appropriate for patient's age",
      path: ["standard"],
    }
  );

export function GrowthForm() {
  const { isPremium, selectedPatient } = usePremiumStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      standard: "cdc_child",
      gender: "male",
      dateOfMeasurement: new Date(),
    },
    mode: "onSubmit",
  });

  const [standardRecommendation, setStandardRecommendation] = useState<
    string | null
  >(null);

  const selectedStandard = form.watch("standard");
  const selectedGender = form.watch("gender") as "male" | "female";

  const birthDate = form.watch("dateOfBirth");
  const measurementDate = form.watch("dateOfMeasurement");

  // Calculate age in months
  const ageInMonths =
    birthDate && measurementDate
      ? differenceInMonths(measurementDate, birthDate)
      : 0;

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const timeoutId = setTimeout(() => {
      try {
        switch (selectedStandard) {
          case "cdc_child":
          case "cdc_infant":
          case "who":
            if (!values.dateOfBirth || !values.dateOfMeasurement) return;

            const normalizedBirthDate = new Date(
              values.dateOfBirth.getFullYear(),
              values.dateOfBirth.getMonth(),
              values.dateOfBirth.getDate() || 1,
              0,
              0,
              0
            );

            const normalizedMeasurementDate = new Date(
              values.dateOfMeasurement.getFullYear(),
              values.dateOfMeasurement.getMonth(),
              values.dateOfMeasurement.getDate() || 1,
              0,
              0,
              0
            );

            const weightData = {
              gender: values.gender,
              dateOfBirth: normalizedBirthDate.toISOString(),
              measurements: [
                {
                  date: normalizedMeasurementDate.toISOString(),
                  weight: parseFloat(values.weight),
                },
              ],
              type: "weight",
            };

            const heightData = {
              gender: values.gender,
              dateOfBirth: normalizedBirthDate.toISOString(),
              measurements: [
                {
                  date: normalizedMeasurementDate.toISOString(),
                  height: parseFloat(values.height),
                },
              ],
              type: "height",
            };

            const encodedWeightData = encodeURIComponent(
              JSON.stringify(weightData)
            );
            const encodedHeightData = encodeURIComponent(
              JSON.stringify(heightData)
            );

            switch (selectedStandard) {
              case "cdc_child":
                router.push(
                  `/charts/cdc-growth-chart?weightData=${encodedWeightData}&heightData=${encodedHeightData}`
                );
                break;
              case "cdc_infant":
                router.push(
                  `/charts/infant-cdc-growth-chart?weightData=${encodedWeightData}&heightData=${encodedHeightData}`
                );
                break;
              case "who":
                router.push(
                  `/charts/who-growth-chart?weightData=${encodedWeightData}&heightData=${encodedHeightData}`
                );
                break;
            }
            break;

          case "intergrowth":
            if (!values.gestationalWeeks || !values.gestationalDays) {
              return;
            }
            const intergrowthWeightData = {
              gender: values.gender,
              measurements: [
                {
                  value: parseFloat(values.weight),
                  gestationalAge: parseInt(values.gestationalWeeks),
                  gestationalDays: parseInt(values.gestationalDays),
                  type: "weight",
                },
              ],
            };
            const intergrowthHeightData = {
              gender: values.gender,
              measurements: [
                {
                  value: parseFloat(values.height),
                  gestationalAge: parseInt(values.gestationalWeeks),
                  gestationalDays: parseInt(values.gestationalDays),
                  type: "height",
                },
              ],
            };
            router.push(
              `/charts/intergrowth-growth-chart?weightData=${encodeURIComponent(
                JSON.stringify({
                  gender: values.gender,
                  measurements: [
                    {
                      value: parseFloat(values.weight),
                      gestationalAge: parseInt(values.gestationalWeeks),
                      gestationalDays: parseInt(values.gestationalDays),
                      type: "weight",
                    },
                  ],
                })
              )}&heightData=${encodeURIComponent(
                JSON.stringify({
                  gender: values.gender,
                  measurements: [
                    {
                      value: parseFloat(values.height),
                      gestationalAge: parseInt(values.gestationalWeeks),
                      gestationalDays: parseInt(values.gestationalDays),
                      type: "height",
                    },
                  ],
                })
              )}`
            );
            break;
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsSubmitting(false);
        clearTimeout(timeoutId);
      }
    }, 1500);
  }

  type GrowthStandardKey = "intergrowth" | "who" | "cdc_infant" | "cdc_child";
  // | "kromeyer";

  useEffect(() => {
    if (birthDate && measurementDate) {
      // Ensure we're comparing full dates
      const adjustedBirthDate = new Date(
        birthDate.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate() || 1
      );
      const adjustedMeasurementDate = new Date(
        measurementDate.getFullYear(),
        measurementDate.getMonth(),
        measurementDate.getDate() || 1
      );

      const ageInMonths = differenceInMonths(
        adjustedMeasurementDate,
        adjustedBirthDate
      );
      const ageInDays = differenceInDays(
        adjustedMeasurementDate,
        adjustedBirthDate
      );
      let recommendedStandard = null;

      // Define precise age ranges for each standard
      const standardRanges: Record<GrowthStandardKey, StandardRange> = {
        intergrowth: {
          min: 0,
          max: 7 / 30, // 0-7 days
          validStandards: ["intergrowth"],
        },
        who: {
          min: 0,
          max: 24,
          validStandards: ["who", "cdc_infant", "cdc_child"],
        },
        cdc_infant: {
          min: 0,
          max: 36,
          validStandards: ["cdc_infant", "cdc_child"],
        },
        cdc_child: {
          min: 24,
          max: 240,
          validStandards: ["cdc_child"],
        },
        // kromeyer: {
        //   min: 0,
        //   max: 216,
        //   validStandards: ["cdc_child"],
        // },
      };

      // Precise age checking function
      const isStandardValid = (standard: GrowthStandardKey) => {
        const range = standardRanges[standard];
        if (!range) return false;

        const ageToCheck =
          standard === "intergrowth"
            ? ageInDays / 30 // Convert to months for comparison
            : ageInMonths;

        return ageToCheck >= range.min && ageToCheck <= range.max;
      };

      // Check if current standard is valid
      const isCurrentStandardValid = isStandardValid(
        selectedStandard as GrowthStandardKey
      );

      // If current standard is not valid, find a recommendation
      if (!isCurrentStandardValid) {
        // Prioritize recommendations based on precise age
        const recommendationPriority = [
          {
            condition: ageInDays < 7,
            standard: "intergrowth",
            message: "INTERGROWTH-21st (0-7 days)",
          },
          {
            condition: ageInMonths < 24,
            standard: "who",
            message: "WHO Growth Standard (0-24 months)",
          },
          {
            condition: ageInMonths < 36,
            standard: "cdc_infant",
            message: "CDC Growth (Infant) (0-36 months)",
          },
          {
            condition: ageInMonths > 24 && ageInMonths < 240,
            standard: "cdc_child",
            message: "CDC Growth (Child) (2-20 years)",
          },
        ];

        // Find the first matching recommendation
        const recommendation = recommendationPriority.find(
          (r) => r.condition && r.standard !== selectedStandard
        );

        recommendedStandard = recommendation ? recommendation.message : null;
      }

      setStandardRecommendation(recommendedStandard);
    }
  }, [birthDate, measurementDate, selectedStandard]);

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="p-4 lg:p-6 !pb-0">
        <CardTitle className="text-2xl font-heading text-medical-900">
          Growth Percentile Calculator
        </CardTitle>
      </CardHeader>
      <CardDescription className="p-4 lg:p-6 pb-0 lg:pb-0">
        {isPremium && <PatientSelector form={form} />}
      </CardDescription>
      <CardContent className="p-4 lg:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                selectedGender === "female"
                                  ? "text-white"
                                  : "text-medical-pink-600"
                              }`}
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

            <FormField
              control={form.control}
              name="standard"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Growth Standard</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="border-medical-100">
                        <SelectValue placeholder="Select a growth standard">
                          {/* Custom selected value display */}
                          {field.value && (
                            <div className="flex items-center gap-2">
                              <span>
                                {
                                  growthStandards.find(
                                    (s) => s.id === field.value
                                  )?.name
                                }
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs bg-medical-50"
                              >
                                {
                                  growthStandards.find(
                                    (s) => s.id === field.value
                                  )?.ageRange
                                }
                              </Badge>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {growthStandards.map((standard) => (
                        <SelectItem
                          key={standard.id}
                          value={standard.id}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col py-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {standard.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {standard.ageRange}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">
                              {standard.description}
                            </span>
                            <span className="text-xs text-muted-foreground/75 mt-1">
                              {standard.details}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedStandard === "intergrowth" ? (
              <GestationalSelects form={form} />
            ) : (
              <DateInputs form={form} gender={selectedGender} />
            )}

            {standardRecommendation && (
              <Alert className="bg-red-50 border-blue-200">
                <AlertTitle className="text-blue-800">
                  Recommended Standard Change
                </AlertTitle>
                <AlertDescription className="text-blue-700">
                  Based on the patient's age, we recommend using the{" "}
                  {standardRecommendation} standard.
                </AlertDescription>
              </Alert>
            )}

            {selectedStandard !== "intergrowth" &&
              (birthDate ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <MeasurementInput
                        label="Weight (kg)"
                        field={field}
                        icon={Weight}
                        gender={selectedGender}
                        birthDate={birthDate}
                        measurementDate={measurementDate}
                        selectedStandard={selectedStandard}
                        cdcChildWeightData={cdcChildWeightData}
                        cdcChildHeightData={cdcChildHeightData}
                        cdcInfantWeightData={cdcInfantWeightData}
                        cdcInfantHeightData={cdcInfantHeightData}
                        whoWeightData={whoWeightData}
                        whoHeightData={whoHeightData}
                        // intergrowthWeightData={intergrowthWeightData}
                      />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <MeasurementInput
                        label="Height (cm)"
                        field={field}
                        icon={Ruler}
                        gender={selectedGender}
                        birthDate={birthDate}
                        measurementDate={measurementDate}
                        selectedStandard={selectedStandard}
                        cdcChildWeightData={cdcChildWeightData}
                        cdcChildHeightData={cdcChildHeightData}
                        cdcInfantWeightData={cdcInfantWeightData}
                        cdcInfantHeightData={cdcInfantHeightData}
                        whoWeightData={whoWeightData}
                        whoHeightData={whoHeightData}
                      />
                    )}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Please select a Date of Birth to enter measurements
                </p>
              ))}

            {selectedStandard === "intergrowth" &&
              form.watch("gestationalWeeks") &&
              form.watch("gestationalDays") && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <MeasurementInputIntergrowth
                          label="Weight (kg)"
                          field={field}
                          icon={Weight}
                          gender={selectedGender}
                          gestationalWeeks={form.watch("gestationalWeeks")}
                          gestationalDays={form.watch("gestationalDays")}
                        />
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <MeasurementInputIntergrowth
                          label="Height (cm)"
                          field={field}
                          icon={Ruler}
                          gender={selectedGender}
                          gestationalWeeks={form.watch("gestationalWeeks")}
                          gestationalDays={form.watch("gestationalDays")}
                        />
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="headCircumference"
                    render={({ field }) => (
                      <MeasurementInputIntergrowth
                        label="Head Circumference (cm)"
                        field={field}
                        icon={Baby}
                        gender={selectedGender}
                        gestationalWeeks={form.watch("gestationalWeeks")}
                        gestationalDays={form.watch("gestationalDays")}
                      />
                    )}
                  />
                </>
              )}

            {birthDate && (
              <>
                {(selectedStandard === "who" ||
                  selectedStandard === "cdc_infant" ||
                  selectedStandard === "intergrowth") && (
                  <FormField
                    control={form.control}
                    name="headCircumference"
                    render={({ field }) => (
                      <MeasurementInput
                        label="Head Circumference (cm)"
                        field={field}
                        icon={Baby}
                        gender={selectedGender}
                        birthDate={birthDate}
                        measurementDate={measurementDate}
                        selectedStandard={selectedStandard}
                        cdcChildWeightData={cdcChildWeightData}
                        cdcChildHeightData={cdcChildHeightData}
                        cdcInfantWeightData={cdcInfantWeightData}
                        cdcInfantHeightData={cdcInfantHeightData}
                        cdcInfantHeightHead={cdcInfantHeightHead}
                        whoHeadData={whoHeadData}
                        whoWeightData={whoWeightData}
                        whoHeightData={whoHeightData}
                      />
                    )}
                  />
                )}
                {/* {(selectedStandard === "who" ||
                  selectedStandard === "intergrowth") && (
                  <FormField
                    control={form.control}
                    name="gestationalAge"
                    render={({ field }) => (
                      <MeasurementInput
                        label="Gestational Age (weeks)"
                        field={field}
                        icon={Baby}
                        gender={selectedGender}
                        birthDate={birthDate}
                        measurementDate={measurementDate}
                        selectedStandard={selectedStandard}
                        whoWeightData={whoWeightData}
                        whoHeightData={whoHeightData}
                      />
                    )}
                  />
                )} */}
              </>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className={cn(
                "w-full transition-all duration-300 ease-in-out",
                selectedGender === "male"
                  ? "bg-gradient-to-r from-medical-600 to-medical-700 hover:from-medical-700 hover:to-medical-800"
                  : "bg-gradient-to-r from-medical-pink-600 to-medical-pink-700 hover:from-medical-pink-700 hover:to-medical-pink-800"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  Graph
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            {((birthDate &&
              form.watch("weight") &&
              form.watch("height") &&
              (selectedStandard !== "cdc_infant" ||
                form.watch("headCircumference") !== "")) ||
              (selectedStandard === "intergrowth" &&
                form.watch("gestationalWeeks") &&
                form.watch("gestationalDays") &&
                form.watch("weight") &&
                form.watch("height"))) && (
              <GrowthResults
                weight={form.watch("weight")}
                height={form.watch("height")}
                headCircumference={
                  selectedStandard === "cdc_infant" ||
                  selectedStandard === "who" ||
                  selectedStandard === "intergrowth"
                    ? form.watch("headCircumference")
                    : undefined
                }
                gender={form.watch("gender")}
                birthDate={birthDate}
                measurementDate={measurementDate}
                selectedStandard={selectedStandard}
                gestationalWeeks={form.watch("gestationalWeeks")}
                gestationalDays={form.watch("gestationalDays")}
                cdcChildWeightData={cdcChildWeightData}
                cdcChildHeightData={cdcChildHeightData}
                cdcInfantWeightData={cdcInfantWeightData}
                cdcInfantHeightData={cdcInfantHeightData}
                cdcInfantHeightHead={cdcInfantHeightHead}
                whoWeightData={whoWeightData}
                whoHeightData={whoHeightData}
                whoHeadData={whoHeadData}
              />
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
