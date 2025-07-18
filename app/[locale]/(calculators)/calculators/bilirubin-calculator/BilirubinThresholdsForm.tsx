"use client";
import React, { useState, useMemo } from "react";
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

// Updated Form Schema
const createFormSchema = (t: any) =>
  z
    .object({
      birthDateTime: z.date({
        required_error: "Date and time of birth are required",
      }),
      measurementDateTime: z.date({
        required_error: "Date and time of measurement are required",
      }),
      totalBilirubin: z
        .string()
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
          message: "Enter a valid bilirubin level",
        }),
      gestationalAge: z
        .string({ required_error: "Please select a gestational age" })
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 35, {
          message: "Must be ≥35 weeks",
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
      message: "Measurement time must be after birth time",
      path: ["measurementDateTime"],
    });

export function BilirubinThresholdsForm() {
  const t = useTranslations("BilirubinCalculator");
  const formSchema = useMemo(() => createFormSchema(t), [t]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<BilirubinResult | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      measurementDateTime: new Date(),
    },
    mode: "onChange",
  });

  const birthDateTime = form.watch("birthDateTime");
  const measurementDateTime = form.watch("measurementDateTime");

  const ageInHours = useMemo(() => {
    if (!birthDateTime || !measurementDateTime) return null;
    return differenceInHours(measurementDateTime, birthDateTime);
  }, [birthDateTime, measurementDateTime]);

  const gestationalAgeOptions = [
    { value: "35", label: "35 weeks" },
    { value: "36", label: "36 weeks" },
    { value: "37", label: "37 weeks" },
    { value: "38", label: "38 weeks" },
    { value: "39", label: "39 weeks" },
    { value: "40", label: "40+ weeks" },
  ];

  function getRiskCategory2022(
    gestationalAge: number,
    hasRiskFactors: boolean
  ): string {
    // Determine gestational age group
    let gestGroup;
    if (gestationalAge >= 38) {
      gestGroup = "38";
    } else {
      gestGroup = gestationalAge.toString();
    }

    // Add risk factor suffix
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

      // CORRECTED: ETCOc must be >1.5 to be a risk factor (not just any ETCOc value)
      const hasRiskFactors =
        values.isoimmuneDisease ||
        values.g6pdDeficiency ||
        values.asphyxia ||
        values.lethargy ||
        values.temperatureInstability ||
        values.sepsis ||
        values.acidosis ||
        values.lowAlbumen ||
        (ETCOc && ETCOc > 1.5); // Only ETCOc >1.5 is a risk factor

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

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="p-4 lg:p-6 !pb-0">
        <CardTitle className="text-2xl font-heading text-medical-900">
          Bilirubin Thresholds Calculator
        </CardTitle>
        <CardDescription>
          Assess hyperbilirubinemia and determine phototherapy need for newborns
          ≥35 weeks gestation (AAP 2022).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 lg:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DateInputsWithTime form={form} />
            {ageInHours !== null && ageInHours >= 0 && (
              <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <Info className="h-4 w-4 text-blue-700" />
                <AlertDescription>
                  Calculated age at time of measurement:{" "}
                  <strong>{ageInHours} hours</strong>.
                </AlertDescription>
              </Alert>
            )}
            <Card className="p-4 border-medical-100">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 mb-4 text-medical-800">
                <Droplet className="w-5 h-5" />
                Patient Data & Risk Factors
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                <FormField
                  control={form.control}
                  name="totalBilirubin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Serum Bilirubin (mg/dL)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="e.g., 15.2"
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
                    <FormItem>
                      <FormLabel>Gestational Age at Birth</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-100">
                            <SelectValue placeholder="Choose weeks..." />
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
                    <FormItem>
                      <FormLabel>ETCOc (ppm) - Optional</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="e.g., 1.2"
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
                  Neurotoxicity Risk Factors
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
                      Patient Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div className="flex justify-between border-b py-2">
                        <span className="text-muted-foreground">
                          Age at sampling:
                        </span>
                        <strong>{results.ageInHours} hours</strong>
                      </div>
                      <div className="flex justify-between border-b py-2">
                        <span className="text-muted-foreground">
                          Total Bilirubin:
                        </span>
                        <strong>{results.totalBilirubin} mg/dL</strong>
                      </div>
                      <div className="flex justify-between border-b py-2">
                        <span className="text-muted-foreground">
                          Gestational Age (GA):
                        </span>
                        <strong>{results.gestationalAge} weeks</strong>
                      </div>
                      <div className="flex justify-between border-b py-2">
                        <span className="text-muted-foreground">ETCOc:</span>
                        <strong>
                          {results.ETCOc
                            ? `${results.ETCOc} ppm`
                            : "Not provided"}
                        </strong>
                      </div>
                      <div className="flex justify-between border-b py-2 col-span-2">
                        <span className="text-muted-foreground">
                          Neurotoxicity Risk Factors Present:
                        </span>
                        <strong
                          className={cn(
                            results.hasRiskFactors
                              ? "text-red-600"
                              : "text-green-600"
                          )}
                        >
                          {results.hasRiskFactors ? "Yes" : "No"}
                        </strong>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-medical-800">
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-3 font-semibold text-left">
                              Intervention
                            </th>
                            <th className="p-3 font-semibold text-center">
                              Recommendation
                            </th>
                            <th className="p-3 font-semibold text-center">
                              Threshold
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr
                            className={cn(
                              results.totalBilirubin >=
                                results.confirmWithTSBThreshold && "bg-blue-50"
                            )}
                          >
                            <td className="p-3 text-left font-semibold flex items-center gap-2">
                              <FlaskConical className="w-4 h-4" />
                              If using TcB, confirm with TSB?
                            </td>
                            <td
                              className={cn(
                                "p-3 text-center font-bold",
                                results.totalBilirubin >=
                                  results.confirmWithTSBThreshold
                                  ? "text-blue-700"
                                  : "text-gray-500"
                              )}
                            >
                              {results.totalBilirubin >=
                              results.confirmWithTSBThreshold
                                ? "Yes"
                                : "No"}
                            </td>
                            <td className="p-3 text-center font-mono">
                              {results.confirmWithTSBThreshold.toFixed(1)} mg/dL
                            </td>
                          </tr>
                          <tr
                            className={cn(
                              results.totalBilirubin >=
                                results.phototherapyThreshold && "bg-red-50"
                            )}
                          >
                            <td className="p-3 text-left font-semibold flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              Phototherapy?
                            </td>
                            <td
                              className={cn(
                                "p-3 text-center font-bold",
                                results.totalBilirubin >=
                                  results.phototherapyThreshold
                                  ? "text-red-700"
                                  : "text-green-700"
                              )}
                            >
                              {results.totalBilirubin >=
                              results.phototherapyThreshold
                                ? "Yes"
                                : "No"}
                            </td>
                            <td className="p-3 text-center font-mono">
                              {results.phototherapyThreshold.toFixed(1)} mg/dL
                            </td>
                          </tr>
                          <tr
                            className={cn(
                              results.totalBilirubin >=
                                results.escalationOfCareThreshold &&
                                "bg-orange-50"
                            )}
                          >
                            <td className="p-3 text-left font-semibold flex items-center gap-2">
                              <ChevronsUp className="w-4 h-4" />
                              Escalation of Care?
                            </td>
                            <td
                              className={cn(
                                "p-3 text-center font-bold",
                                results.totalBilirubin >=
                                  results.escalationOfCareThreshold
                                  ? "text-orange-700"
                                  : "text-gray-500"
                              )}
                            >
                              {results.totalBilirubin >=
                              results.escalationOfCareThreshold
                                ? "Yes"
                                : "No"}
                            </td>
                            <td className="p-3 text-center font-mono">
                              {results.escalationOfCareThreshold.toFixed(1)}{" "}
                              mg/dL
                            </td>
                          </tr>
                          <tr
                            className={cn(
                              results.totalBilirubin >=
                                results.exchangeTransfusionThreshold &&
                                "bg-red-50"
                            )}
                          >
                            <td className="p-3 text-left font-semibold flex items-center gap-2">
                              <Repeat className="w-4 h-4" />
                              Exchange Transfusion?
                            </td>
                            <td
                              className={cn(
                                "p-3 text-center font-bold",
                                results.totalBilirubin >=
                                  results.exchangeTransfusionThreshold
                                  ? "text-red-700"
                                  : "text-green-700"
                              )}
                            >
                              {results.totalBilirubin >=
                              results.exchangeTransfusionThreshold
                                ? "Yes"
                                : "No"}
                            </td>
                            <td className="p-3 text-center font-mono">
                              {results.exchangeTransfusionThreshold.toFixed(1)}{" "}
                              mg/dL
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
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
                disabled={isSubmitting}
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
