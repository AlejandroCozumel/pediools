"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  Loader2,
  Activity,
  Info,
  Droplet,
  TrendingUp,
  Repeat,
  ChevronsUp,
  FlaskConical,
  AlertTriangle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { differenceInHours } from "date-fns";
import {
  phototherapyThresholds,
  exchangeTransfusionThresholds,
} from "@/app/data/bilirubin-thresholds-data";
import DateInputsWithTime from "@/components/DateInputsWithTime";
import { BilirubinChart } from "./BilirubinChart";

// Interfaces for our results
interface BilirubinResult {
  ageInHours: number;
  riskCategory: string;
  totalBilirubin: number;
  gestationalAge: number;
  hasRiskFactors: boolean;
  phototherapyThreshold: number;
  exchangeTransfusionThreshold: number;
  escalationOfCareThreshold: number;
  confirmWithTSBThreshold: number;
  ETCOc?: string;
}

const createFormSchema = (t: any) =>
  z
    .object({
      birthDateTime: z.date({
        required_error: t("validation.dateTimeRequired.birth"),
      }),
      measurementDateTime: z.date({
        required_error: t("validation.dateTimeRequired.measurement"),
      }),
      totalBilirubin: z
        .string()
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
          message: t("validation.bilirubinValidation.validLevel"),
        })
        .refine((val) => parseFloat(val) <= 50, {
          message: t("validation.bilirubinValidation.tooHigh"),
        })
        .refine((val) => parseFloat(val) >= 0.1, {
          message: t("validation.bilirubinValidation.tooLow"),
        }),
      gestationalAge: z
        .string({
          required_error: t("validation.gestationalAgeValidation.required"),
        })
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 35, {
          message: t("validation.gestationalAgeValidation.minimum"),
        }),
      ETCOc: z.string().optional(),
      isoimmuneDisease: z.boolean().default(false),
      g6pdDeficiency: z.boolean().default(false),
      asphyxia: z.boolean().default(false),
      lethargy: z.boolean().default(false),
      temperatureInstability: z.boolean().default(false),
      sepsis: z.boolean().default(false),
      acidosis: z.boolean().default(false),
      lowAlbumen: z.boolean().default(false),
    })
    .refine((data) => data.measurementDateTime >= data.birthDateTime, {
      message: t("validation.timeValidation.measurementAfterBirth"),
      path: ["measurementDateTime"],
    })
    .refine(
      (data) => {
        const ageInHours = differenceInHours(
          data.measurementDateTime,
          data.birthDateTime
        );
        return ageInHours >= 12 && ageInHours <= 336;
      },
      {
        message: t("validation.timeValidation.ageRange"),
        path: ["measurementDateTime"],
      }
    );

export function BilirubinThresholdsForm() {
  const t = useTranslations("BilirubinCalculator");
  const formSchema = useMemo(() => createFormSchema(t), [t]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<BilirubinResult | null>(null);
  const isMounted = useRef(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      birthDateTime: undefined,
      measurementDateTime: undefined,
    },
    mode: "onChange",
  });

  const watchedFormValues = form.watch();

  useEffect(() => {
    if (isMounted.current) {
      if (results) {
        setResults(null);
      }
    } else {
      isMounted.current = true;
    }
  }, [JSON.stringify(watchedFormValues)]);

  const birthDateTime = form.watch("birthDateTime");
  const measurementDateTime = form.watch("measurementDateTime");

  const ageInHours = useMemo(() => {
    if (!birthDateTime || !measurementDateTime) return null;
    return differenceInHours(measurementDateTime, birthDateTime);
  }, [birthDateTime, measurementDateTime]);

  const isFormValid = useMemo(() => {
    const totalBilirubin = form.watch("totalBilirubin");
    const gestationalAge = form.watch("gestationalAge");

    // Check if all required fields are filled
    const hasAllRequiredFields =
      birthDateTime &&
      measurementDateTime &&
      totalBilirubin &&
      totalBilirubin.trim() !== "" &&
      gestationalAge &&
      gestationalAge.trim() !== "";

    // Check if age is in valid range
    const isAgeInValidRange =
      ageInHours !== null && ageInHours >= 12 && ageInHours <= 336;

    // Check if bilirubin is a valid number AND within reasonable range
    const isBilirubinValid =
      totalBilirubin &&
      !isNaN(parseFloat(totalBilirubin)) &&
      parseFloat(totalBilirubin) > 0 &&
      parseFloat(totalBilirubin) >= 0.1 &&
      parseFloat(totalBilirubin) <= 50;

    return hasAllRequiredFields && isAgeInValidRange && isBilirubinValid;
  }, [
    birthDateTime,
    measurementDateTime,
    ageInHours,
    form.watch("totalBilirubin"),
    form.watch("gestationalAge"),
  ]);

  const gestationalAgeOptions = [
    { value: "35", label: t("form.gestationalAgeOptions.35weeks") },
    { value: "36", label: t("form.gestationalAgeOptions.36weeks") },
    { value: "37", label: t("form.gestationalAgeOptions.37weeks") },
    { value: "38", label: t("form.gestationalAgeOptions.38weeks") },
    { value: "39", label: t("form.gestationalAgeOptions.39weeks") },
    { value: "40", label: t("form.gestationalAgeOptions.40weeks") },
  ];

  function getRiskCategory2022(
    gestationalAge: number,
    hasRiskFactors: boolean
  ): string {
    let gestGroup;
    if (gestationalAge >= 40) {
      gestGroup = "40";
    } else {
      gestGroup = gestationalAge.toString();
    }
    const riskSuffix = hasRiskFactors ? "_withRisk" : "_noRisk";
    return gestGroup + riskSuffix;
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setResults(null);

    setTimeout(() => {
      const ageInHours = differenceInHours(
        values.measurementDateTime,
        values.birthDateTime
      );
      const totalBilirubin = parseFloat(values.totalBilirubin);
      const gestAge = parseFloat(values.gestationalAge);
      const ETCOc = values.ETCOc ? parseFloat(values.ETCOc) : undefined;

      const hasRiskFactors =
        values.isoimmuneDisease ||
        values.g6pdDeficiency ||
        values.asphyxia ||
        values.lethargy ||
        values.temperatureInstability ||
        values.sepsis ||
        values.acidosis ||
        values.lowAlbumen ||
        (ETCOc && ETCOc > 1.5);

      const riskCategory = getRiskCategory2022(gestAge, !!hasRiskFactors);

      const findThreshold = (
        thresholdData: typeof phototherapyThresholds,
        age: number,
        risk: string
      ) => {
        const thresholds = thresholdData[risk as keyof typeof thresholdData];
        if (!thresholds) {
          console.error(`No thresholds found for risk category: ${risk}`);
          return 0;
        }
        const ageKeys = Object.keys(thresholds)
          .map(Number)
          .sort((a, b) => a - b);
        const closestAgeKey = ageKeys.reduce(
          (prev, curr) => (curr <= age ? curr : prev),
          ageKeys[0]
        );
        return thresholds[closestAgeKey as unknown as keyof typeof thresholds];
      };

      const phototherapyThreshold = findThreshold(
        phototherapyThresholds,
        ageInHours,
        riskCategory
      );
      const exchangeTransfusionThreshold = findThreshold(
        exchangeTransfusionThresholds,
        ageInHours,
        riskCategory
      );

      setResults({
        ageInHours,
        riskCategory,
        totalBilirubin,
        gestationalAge: gestAge,
        hasRiskFactors: !!hasRiskFactors,
        phototherapyThreshold,
        exchangeTransfusionThreshold,
        escalationOfCareThreshold: exchangeTransfusionThreshold - 2,
        confirmWithTSBThreshold: Math.min(phototherapyThreshold - 3, 15.0),
        ETCOc: values.ETCOc || undefined,
      });
      setIsSubmitting(false);
    }, 1000);
  }

  const AgeValidationAlert = ({
    ageInHours,
  }: {
    ageInHours: number | null;
  }) => {
    if (ageInHours === null) return null;

    if (ageInHours < 12) {
      return (
        <Alert className="bg-red-50 border-red-200 text-red-800">
          <AlertTriangle className="h-4 w-4 text-red-700" />
          <AlertDescription>
            <strong>{t("alerts.ageValidation.tooYoung.title")}</strong>{" "}
            {t("alerts.ageValidation.tooYoung.description", {
              hours: ageInHours,
            })}
          </AlertDescription>
        </Alert>
      );
    }

    if (ageInHours > 336) {
      return (
        <Alert className="bg-red-50 border-red-200 text-red-800">
          <AlertTriangle className="h-4 w-4 text-red-700" />
          <AlertDescription>
            <strong>{t("alerts.ageValidation.tooOld.title")}</strong>{" "}
            {t("alerts.ageValidation.tooOld.description", {
              hours: ageInHours,
              days: Math.floor(ageInHours / 24),
            })}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="bg-blue-50 border-blue-200 text-blue-800">
        <Info className="h-4 w-4 text-blue-700" />
        <AlertDescription>
          {t("alerts.ageValidation.validAge.description", {
            hours: ageInHours,
          })}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="p-4 lg:p-6">
        <CardTitle className="text-2xl font-heading text-medical-900">
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 lg:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DateInputsWithTime
              form={form}
              translationNamespace="BilirubinCalculator"
            />

            {ageInHours !== null && (
              <AgeValidationAlert ageInHours={ageInHours} />
            )}

            <Card className="p-4 border-medical-100">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 mb-4 text-medical-800">
                <Droplet className="w-5 h-5" />
                {t("form.patientData.title")}
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                <FormField
                  control={form.control}
                  name="totalBilirubin"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between h-full">
                      <FormLabel>
                        {t("form.patientData.totalBilirubin")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder={t(
                            "form.patientData.totalBilirubinPlaceholder"
                          )}
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
                  name="gestationalAge"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between h-full">
                      <FormLabel>
                        {t("form.patientData.gestationalAge")}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-100">
                            <SelectValue
                              placeholder={t(
                                "form.patientData.gestationalAgePlaceholder"
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gestationalAgeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ETCOc"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between h-full">
                      <FormLabel>{t("form.patientData.ETCOc")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder={t("form.patientData.ETCOcPlaceholder")}
                          {...field}
                          className="border-medical-100"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-6">
                <FormLabel className="font-semibold text-base text-medical-800">
                  {t("form.patientData.neurotoxicityRiskFactors")}
                </FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 mt-3">
                  {[
                    "isoimmuneDisease",
                    "g6pdDeficiency",
                    "asphyxia",
                    "lethargy",
                    "temperatureInstability",
                    "sepsis",
                    "acidosis",
                    "lowAlbumen",
                  ].map((id) => (
                    <FormField
                      key={id}
                      control={form.control}
                      name={id as any}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {t(`riskFactors.${id}`)}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            </Card>

            {results && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-medical-800">
                      {t("results.patientSummary.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="!pt-0">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div className="flex justify-between border-b py-2">
                        <span className="text-muted-foreground">
                          {t("results.patientSummary.ageAtSampling")}
                        </span>
                        <strong>{results.ageInHours} hours</strong>
                      </div>
                      <div className="flex justify-between border-b py-2">
                        <span className="text-muted-foreground">
                          {t("results.patientSummary.totalBilirubin")}
                        </span>
                        <strong>{results.totalBilirubin} mg/dL</strong>
                      </div>
                      <div className="flex justify-between border-b py-2">
                        <span className="text-muted-foreground">
                          {t("results.patientSummary.gestationalAge")}
                        </span>
                        <strong>{results.gestationalAge} weeks</strong>
                      </div>
                      <div className="flex justify-between border-b py-2">
                        <span className="text-muted-foreground">
                          {t("results.patientSummary.ETCOc")}
                        </span>
                        <strong>
                          {results.ETCOc
                            ? `${results.ETCOc} ppm`
                            : t("results.patientSummary.notProvided")}
                        </strong>
                      </div>
                      <div className="flex justify-between border-b py-2 col-span-2">
                        <span className="text-muted-foreground">
                          {t("results.patientSummary.neurotoxicityRiskFactors")}
                        </span>
                        <strong
                          className={cn(
                            results.hasRiskFactors
                              ? "text-red-600"
                              : "text-green-600"
                          )}
                        >
                          {results.hasRiskFactors
                            ? t("results.patientSummary.yes")
                            : t("results.patientSummary.no")}
                        </strong>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-medical-800">
                      {t("results.recommendations.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="!pt-0">
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm table-fixed">
                        <thead>
                          <tr className="bg-medical-700 text-white">
                            <th className="p-3 font-semibold text-left w-[40%] min-w-0 truncate">
                              {t(
                                "results.recommendations.interventions.intervention"
                              )}
                            </th>
                            <th className="p-3 font-semibold text-center w-[25%] px-2 truncate">
                              {t(
                                "results.recommendations.interventions.recommendation"
                              )}
                            </th>
                            <th className="p-3 font-semibold text-center w-[35%] min-w-0 truncate">
                              {t(
                                "results.recommendations.interventions.threshold"
                              )}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {/* TcB Confirmation Row */}
                          <tr
                            className={cn(
                              results.totalBilirubin >=
                                results.confirmWithTSBThreshold
                                ? "bg-blue-50 border-l-4 border-l-blue-500"
                                : results.totalBilirubin >=
                                  results.confirmWithTSBThreshold * 0.9
                                ? "bg-yellow-50 border-l-4 border-l-yellow-500"
                                : "bg-green-50 border-l-4 border-l-green-500"
                            )}
                          >
                            <td className="p-3 text-left font-semibold flex items-center gap-2 min-w-0">
                              <FlaskConical className="w-4 h-4 flex-shrink-0" />
                              <span
                                className={cn(
                                  results.totalBilirubin >=
                                    results.confirmWithTSBThreshold
                                    ? "text-blue-800"
                                    : results.totalBilirubin >=
                                      results.confirmWithTSBThreshold * 0.9
                                    ? "text-yellow-800"
                                    : "text-green-800"
                                )}
                              >
                                {t(
                                  "results.recommendations.interventions.confirmTSB"
                                )}
                              </span>
                            </td>
                            <td
                              className={cn(
                                "p-3 text-center font-bold px-2 whitespace-nowrap",
                                results.totalBilirubin >=
                                  results.confirmWithTSBThreshold
                                  ? "text-blue-700"
                                  : results.totalBilirubin >=
                                    results.confirmWithTSBThreshold * 0.9
                                  ? "text-yellow-700"
                                  : "text-green-700"
                              )}
                            >
                              {results.totalBilirubin >=
                              results.confirmWithTSBThreshold
                                ? t("results.recommendations.actions.yes")
                                : results.totalBilirubin >=
                                  results.confirmWithTSBThreshold * 0.9
                                ? t("results.recommendations.actions.consider")
                                : t("results.recommendations.actions.no")}
                            </td>
                            <td className="p-3 text-center font-mono min-w-0">
                              <span className="block truncate">
                                {results.confirmWithTSBThreshold.toFixed(1)}{" "}
                                mg/dL
                              </span>
                            </td>
                          </tr>
                          {/* Phototherapy Row */}
                          <tr
                            className={cn(
                              results.totalBilirubin >=
                                results.phototherapyThreshold
                                ? "bg-red-50 border-l-4 border-l-red-500"
                                : results.totalBilirubin >=
                                  results.phototherapyThreshold * 0.9
                                ? "bg-yellow-50 border-l-4 border-l-yellow-500"
                                : "bg-green-50 border-l-4 border-l-green-500"
                            )}
                          >
                            <td className="p-3 text-left font-semibold flex items-center gap-2 min-w-0">
                              <TrendingUp className="w-4 h-4 flex-shrink-0" />
                              <span
                                className={cn(
                                  results.totalBilirubin >=
                                    results.phototherapyThreshold
                                    ? "text-red-800"
                                    : results.totalBilirubin >=
                                      results.phototherapyThreshold * 0.9
                                    ? "text-yellow-800"
                                    : "text-green-800"
                                )}
                              >
                                {t(
                                  "results.recommendations.interventions.phototherapy"
                                )}
                              </span>
                            </td>
                            <td
                              className={cn(
                                "p-3 text-center font-bold px-2 whitespace-nowrap",
                                results.totalBilirubin >=
                                  results.phototherapyThreshold
                                  ? "text-red-700"
                                  : results.totalBilirubin >=
                                    results.phototherapyThreshold * 0.9
                                  ? "text-yellow-700"
                                  : "text-green-700"
                              )}
                            >
                              {results.totalBilirubin >=
                              results.phototherapyThreshold
                                ? t("results.recommendations.actions.yes")
                                : results.totalBilirubin >=
                                  results.phototherapyThreshold * 0.9
                                ? t("results.recommendations.actions.consider")
                                : t("results.recommendations.actions.no")}
                            </td>
                            <td className="p-3 text-center font-mono min-w-0">
                              <span className="block truncate">
                                {results.phototherapyThreshold.toFixed(1)} mg/dL
                              </span>
                            </td>
                          </tr>
                          {/* Escalation of Care Row */}
                          <tr
                            className={cn(
                              results.totalBilirubin >=
                                results.escalationOfCareThreshold
                                ? "bg-red-50 border-l-4 border-l-red-500"
                                : results.totalBilirubin >=
                                  results.escalationOfCareThreshold * 0.9
                                ? "bg-yellow-50 border-l-4 border-l-yellow-500"
                                : "bg-green-50 border-l-4 border-l-green-500"
                            )}
                          >
                            <td className="p-3 text-left font-semibold flex items-center gap-2 min-w-0">
                              <ChevronsUp className="w-4 h-4 flex-shrink-0" />
                              <span
                                className={cn(
                                  results.totalBilirubin >=
                                    results.escalationOfCareThreshold
                                    ? "text-red-800"
                                    : results.totalBilirubin >=
                                      results.escalationOfCareThreshold * 0.9
                                    ? "text-yellow-800"
                                    : "text-green-800"
                                )}
                              >
                                {t(
                                  "results.recommendations.interventions.escalationOfCare"
                                )}
                              </span>
                            </td>
                            <td
                              className={cn(
                                "p-3 text-center font-bold px-2 whitespace-nowrap",
                                results.totalBilirubin >=
                                  results.escalationOfCareThreshold
                                  ? "text-red-700"
                                  : results.totalBilirubin >=
                                    results.escalationOfCareThreshold * 0.9
                                  ? "text-yellow-700"
                                  : "text-green-700"
                              )}
                            >
                              {results.totalBilirubin >=
                              results.escalationOfCareThreshold
                                ? t("results.recommendations.actions.yes")
                                : results.totalBilirubin >=
                                  results.escalationOfCareThreshold * 0.9
                                ? t("results.recommendations.actions.consider")
                                : t("results.recommendations.actions.no")}
                            </td>
                            <td className="p-3 text-center font-mono min-w-0">
                              <span className="block truncate">
                                {results.escalationOfCareThreshold.toFixed(1)}{" "}
                                mg/dL
                              </span>
                            </td>
                          </tr>
                          {/* Exchange Transfusion Row */}
                          <tr
                            className={cn(
                              results.totalBilirubin >=
                                results.exchangeTransfusionThreshold
                                ? "bg-red-50 border-l-4 border-l-red-500"
                                : results.totalBilirubin >=
                                  results.exchangeTransfusionThreshold * 0.9
                                ? "bg-yellow-50 border-l-4 border-l-yellow-500"
                                : "bg-green-50 border-l-4 border-l-green-500"
                            )}
                          >
                            <td className="p-3 text-left font-semibold flex items-center gap-2 min-w-0">
                              <Repeat className="w-4 h-4 flex-shrink-0" />
                              <span
                                className={cn(
                                  results.totalBilirubin >=
                                    results.exchangeTransfusionThreshold
                                    ? "text-red-800"
                                    : results.totalBilirubin >=
                                      results.exchangeTransfusionThreshold * 0.9
                                    ? "text-yellow-800"
                                    : "text-green-800"
                                )}
                              >
                                {t(
                                  "results.recommendations.interventions.exchangeTransfusion"
                                )}
                              </span>
                            </td>
                            <td
                              className={cn(
                                "p-3 text-center font-bold px-2 whitespace-nowrap",
                                results.totalBilirubin >=
                                  results.exchangeTransfusionThreshold
                                  ? "text-red-700"
                                  : results.totalBilirubin >=
                                    results.exchangeTransfusionThreshold * 0.9
                                  ? "text-yellow-700"
                                  : "text-green-700"
                              )}
                            >
                              {results.totalBilirubin >=
                              results.exchangeTransfusionThreshold
                                ? t("results.recommendations.actions.yes")
                                : results.totalBilirubin >=
                                  results.exchangeTransfusionThreshold * 0.9
                                ? t("results.recommendations.actions.consider")
                                : t("results.recommendations.actions.no")}
                            </td>
                            <td className="p-3 text-center font-mono min-w-0">
                              <span className="block truncate">
                                {results.exchangeTransfusionThreshold.toFixed(
                                  1
                                )}{" "}
                                mg/dL
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
                <Card className="mt-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-medical-800 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      {t("results.clinicalActionPlan.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="!pt-0 space-y-4">
                    {/* Compact Primary Action */}
                    {results.totalBilirubin >=
                    results.exchangeTransfusionThreshold ? (
                      <div className="bg-red-100 border-l-4 border-red-500 p-3 rounded-r">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-red-900 text-sm">
                              {t(
                                "results.clinicalActionPlan.urgentExchangeTransfusion.title"
                              )}
                            </p>
                            <p className="text-red-800 text-xs">
                              {t(
                                "results.clinicalActionPlan.urgentExchangeTransfusion.description"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : results.totalBilirubin >=
                      results.escalationOfCareThreshold ? (
                      <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-red-900 text-sm">
                              {t(
                                "results.clinicalActionPlan.escalationRequired.title"
                              )}
                            </p>
                            <p className="text-red-700 text-xs">
                              {t(
                                "results.clinicalActionPlan.escalationRequired.description"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : results.totalBilirubin >=
                      results.phototherapyThreshold ? (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-yellow-900 text-sm">
                              {t(
                                "results.clinicalActionPlan.startPhototherapy.title"
                              )}
                            </p>
                            <p className="text-yellow-800 text-xs">
                              {t(
                                "results.clinicalActionPlan.startPhototherapy.description"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : results.totalBilirubin >=
                      results.phototherapyThreshold * 0.85 ? (
                      <div className="bg-yellow-50 border-l-4 border-yellow-300 p-3 rounded-r">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-yellow-900 text-sm">
                              {t(
                                "results.clinicalActionPlan.closeMonitoring.title"
                              )}
                            </p>
                            <p className="text-yellow-700 text-xs">
                              {t(
                                "results.clinicalActionPlan.closeMonitoring.description"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded-r">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-green-900 text-sm">
                              {t(
                                "results.clinicalActionPlan.routineCare.title"
                              )}
                            </p>
                            <p className="text-green-700 text-xs">
                              {t(
                                "results.clinicalActionPlan.routineCare.description"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Action Plan Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-xs table-fixed font-semibold">
                        <thead>
                          <tr className="bg-medical-700 text-white">
                            <th className="p-2 font-semibold text-left w-1/2">
                              {t("results.clinicalActionPlan.nextSteps.title")}
                            </th>
                            <th className="p-2 font-semibold text-left w-1/2">
                              {t("results.clinicalActionPlan.keyPoints.title")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="divide-x divide-gray-200">
                            <td className="p-3 align-top">
                              <div className="space-y-1 text-gray-700">
                                {results.totalBilirubin >=
                                results.escalationOfCareThreshold ? (
                                  <>
                                    <div>
                                      {t(
                                        "results.clinicalActionPlan.nextSteps.recheckQ4_6h"
                                      )}
                                    </div>
                                    <div>
                                      {t(
                                        "results.clinicalActionPlan.nextSteps.vitalSigns"
                                      )}
                                    </div>
                                    <div>
                                      {t(
                                        "results.clinicalActionPlan.nextSteps.neuroChecks"
                                      )}
                                    </div>
                                  </>
                                ) : results.totalBilirubin >=
                                  results.phototherapyThreshold ? (
                                  <>
                                    <div>
                                      {t(
                                        "results.clinicalActionPlan.nextSteps.recheck12_24h"
                                      )}
                                    </div>
                                    <div>
                                      {t(
                                        "results.clinicalActionPlan.nextSteps.monitorHydration"
                                      )}
                                    </div>
                                    <div>
                                      {t(
                                        "results.clinicalActionPlan.nextSteps.assessFeeding"
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div>
                                      {t(
                                        "results.clinicalActionPlan.nextSteps.followUp24_48h"
                                      )}
                                    </div>
                                    <div>
                                      {t(
                                        "results.clinicalActionPlan.nextSteps.monitorFeedingOutput"
                                      )}
                                    </div>
                                    <div>
                                      {t(
                                        "results.clinicalActionPlan.nextSteps.watchJaundice"
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="p-3 align-top">
                              <div className="space-y-1 text-gray-700">
                                {results.hasRiskFactors && (
                                  <div>
                                    {t(
                                      "results.clinicalActionPlan.keyPoints.riskFactorsPresent"
                                    )}
                                  </div>
                                )}
                                {results.ageInHours < 24 && (
                                  <div>
                                    {t(
                                      "results.clinicalActionPlan.keyPoints.earlyOnset"
                                    )}
                                  </div>
                                )}
                                {results.totalBilirubin >=
                                  results.confirmWithTSBThreshold && (
                                  <div>
                                    {t(
                                      "results.clinicalActionPlan.keyPoints.confirmTcB"
                                    )}
                                  </div>
                                )}
                                <div>
                                  {t(
                                    "results.clinicalActionPlan.keyPoints.ensureFeeding"
                                  )}
                                </div>
                                <div>
                                  {t(
                                    "results.clinicalActionPlan.keyPoints.parentEducation"
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {/* Compact Risk Factor Alert */}
                    {results.hasRiskFactors && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-blue-800 text-sm">
                              {t(
                                "results.clinicalActionPlan.riskFactorAlert.title"
                              )}
                            </p>
                            <p className="text-blue-700 text-xs">
                              {t(
                                "results.clinicalActionPlan.riskFactorAlert.description"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <BilirubinChart
                  results={results}
                  phototherapyThresholds={phototherapyThresholds}
                  exchangeTransfusionThresholds={exchangeTransfusionThresholds}
                />
              </div>
            )}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting || results !== null || !isFormValid}
                size="lg"
                className="flex-1 bg-gradient-to-r from-medical-600 to-medical-700"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Activity className="mr-2 h-4 w-4" />
                )}
                {isSubmitting
                  ? t("buttons.calculating")
                  : t("buttons.calculate")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
