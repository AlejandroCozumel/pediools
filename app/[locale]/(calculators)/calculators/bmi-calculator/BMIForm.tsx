"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import DateInputs from "@/components/DateInputs";
import MeasurementInput from "@/components/MeasurementInput";
import cdcBmiData from "@/app/data/cdc-data-bmi.json";
import whoBmiData from "@/app/data/who-data-bmi.json";
import { Weight, Ruler, Baby } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RangeIndicator } from "@/components/RangeIndicator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from 'next-intl';

const bmiFormSchema = z.object({
  standard: z.enum(["who", "cdc"], { required_error: "Select a standard" }),
  gender: z.enum(["male", "female"], { required_error: "Select a gender" }),
  dateOfBirth: z.date({ required_error: "Date of birth required" }),
  dateOfMeasurement: z.date({ required_error: "Measurement date required" }),
  weight: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Enter valid weight in kg",
    }),
  height: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Enter valid height in cm",
    }),
});

type BMIFormValues = z.infer<typeof bmiFormSchema>;

const bmiStandards = [
  {
    id: "who",
    name: "WHO BMI Standard",
    description: "International BMI percentiles for children (0-24 months)",
    ageRange: "0-24 months",
    details: "Recommended by WHO for international use",
  },
  {
    id: "cdc",
    name: "CDC BMI Standard",
    description: "U.S. reference BMI percentiles for children and teens",
    ageRange: "2-20 years",
    details: "Most widely used in U.S. clinical practice",
  },
];

export function BMIForm() {
  const t = useTranslations('BMICalculator');
  const [result, setResult] = useState<BMIFormValues | null>(null);
  const today = new Date();
  const form = useForm<BMIFormValues>({
    resolver: zodResolver(bmiFormSchema),
    defaultValues: {
      standard: "who",
      gender: "male",
      dateOfBirth: undefined,
      dateOfMeasurement: today,
      weight: "",
      height: "",
    },
    mode: "onChange",
  });

  const selectedStandard = form.watch("standard");
  const selectedGender = form.watch("gender");
  const birthDate = form.watch("dateOfBirth");
  const measurementDate = form.watch("dateOfMeasurement");
  const weight = form.watch("weight");
  const height = form.watch("height");

  // Calculate BMI, range, percentile, and z-score if all fields are filled and valid
  let bmi: number | null = null;
  let min: number | null = null;
  let max: number | null = null;
  let normal: number | null = null;
  let percentile: number | null = null;
  let zScore: number | null = null;
  if (
    birthDate &&
    measurementDate &&
    weight &&
    height &&
    !isNaN(parseFloat(weight)) &&
    !isNaN(parseFloat(height))
  ) {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    bmi = weightNum / ((heightNum / 100) * (heightNum / 100));
    // Find reference data for BMI range
    let ageInMonths: number | null = null;
    ageInMonths =
      (measurementDate.getFullYear() - birthDate.getFullYear()) * 12 +
      (measurementDate.getMonth() - birthDate.getMonth()) +
      (measurementDate.getDate() >= birthDate.getDate() ? 0 : -1);
    const sex = selectedGender === "male" ? 1 : 2;
    let dataPoint;
    if (selectedStandard === "cdc") {
      dataPoint = cdcBmiData.find(
        (d) =>
          Number(d.Sex) === sex &&
          Math.round(Number(d.Agemos)) === Math.round(ageInMonths)
      );
      if (dataPoint) {
        min = Number(dataPoint.P3);
        max = Number(dataPoint.P97);
        normal = Number(dataPoint.P50);
        // CDC: calculate z-score and percentile
        const L = Number(dataPoint.L);
        const M = Number(dataPoint.M);
        const S = Number(dataPoint.S);
        zScore =
          L === 0
            ? Math.log(bmi / M) / S
            : (Math.pow(bmi / M, L) - 1) / (L * S);
        percentile = 0.5 * (1 + erf(zScore / Math.sqrt(2))) * 100;
      }
    } else if (selectedStandard === "who") {
      dataPoint = whoBmiData.find(
        (d) =>
          Number(d.Sex) === sex &&
          Math.round(Number(d.Agemos)) === Math.round(ageInMonths)
      );
      if (dataPoint) {
        min = Number(dataPoint.P3);
        max = Number(dataPoint.P97);
        normal = Number(dataPoint.P50);
        // WHO: calculate z-score and percentile
        const L = Number(dataPoint.L);
        const M = Number(dataPoint.M);
        const S = Number(dataPoint.S);
        zScore =
          L === 0
            ? Math.log(bmi / M) / S
            : (Math.pow(bmi / M, L) - 1) / (L * S);
        percentile = 0.5 * (1 + erf(zScore / Math.sqrt(2))) * 100;
      }
    }
  }

  // Error function for percentile calculation
  function erf(x: number): number {
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
  }

  // Age validation for standards
  let ageError: string | null = null;
  let isStandardValid = true;
  let ageInMonths: number | null = null;
  if (birthDate && measurementDate) {
    ageInMonths =
      (measurementDate.getFullYear() - birthDate.getFullYear()) * 12 +
      (measurementDate.getMonth() - birthDate.getMonth()) +
      (measurementDate.getDate() >= birthDate.getDate() ? 0 : -1);
    if (selectedStandard === "who" && (ageInMonths < 0 || ageInMonths > 24)) {
      ageError = "WHO BMI Standard is only valid for 0-24 months.";
      isStandardValid = false;
    } else if (
      selectedStandard === "cdc" &&
      (ageInMonths < 24 || ageInMonths > 240)
    ) {
      ageError =
        "CDC BMI Standard is only valid for 2-20 years (24-240 months).";
      isStandardValid = false;
    }
  }

  function onSubmit(values: BMIFormValues) {
    setResult(values);
  }

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="p-4 lg:p-6 !pb-0">
        <CardTitle className="text-2xl font-heading text-medical-900">
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardDescription className="p-4 lg:p-6 pb-0 lg:pb-0">
        {/* Optionally add a subtitle or info here */}
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
                              }
                            `}
                          />
                          <span className="font-medium">{t('gender.male')}</span>
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
                              }
                            `}
                          />
                          <span className="font-medium">{t('gender.female')}</span>
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
                  <FormLabel>{t('standard.label')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-medical-100">
                        <SelectValue placeholder={t('standard.placeholder')}>
                          {field.value && (
                            <div className="flex items-center gap-2">
                              <span>
                                {t(`standards.${field.value}.name`)}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs bg-medical-50"
                              >
                                {t(`standards.${field.value}.ageRange`)}
                              </Badge>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bmiStandards.map((standard) => (
                        <SelectItem
                          key={standard.id}
                          value={standard.id}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col py-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {t(`standards.${standard.id}.name`)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {t(`standards.${standard.id}.ageRange`)}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">
                              {t(`standards.${standard.id}.description`)}
                            </span>
                            <span className="text-xs text-muted-foreground/75 mt-1">
                              {t(`standards.${standard.id}.details`)}
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
            <DateInputs form={form} gender={selectedGender} />
            {/* Date of Birth check and measurement inputs */}
            {!birthDate ? (
              <p className="text-muted-foreground text-xs mb-4">
                {t('validation.selectDob')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <MeasurementInput
                      label={t('measurements.weight')}
                      field={field}
                      icon={Weight}
                      gender={selectedGender}
                      birthDate={birthDate}
                      measurementDate={measurementDate}
                      selectedStandard={selectedStandard}
                      disabled={!birthDate}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <MeasurementInput
                      label={t('measurements.height')}
                      field={field}
                      icon={Ruler}
                      gender={selectedGender}
                      birthDate={birthDate}
                      measurementDate={measurementDate}
                      selectedStandard={selectedStandard}
                      disabled={!birthDate}
                    />
                  )}
                />
              </div>
            )}
            {/* Age validation error */}
            {ageError && (
              <Alert className="bg-red-50 border-blue-200 mt-4">
                <AlertTitle className="text-blue-800">
                  {t('alerts.invalidStandard.title')}
                </AlertTitle>
                <AlertDescription className="text-blue-700">
                  {ageError}
                </AlertDescription>
              </Alert>
            )}
            {/* BMI Result and Range Indicator */}
            {bmi !== null &&
              min !== null &&
              max !== null &&
              normal !== null &&
              isStandardValid && (
                <div className="mt-8">
                  <div className="text-md mb-2 flex items-baseline gap-1">
                    <span className="font-semibold">{t('results.bmi')}: </span>
                    <span className="font-semibold">{bmi.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground ml-0.5">
                      kg/m²
                    </span>
                    {percentile !== null && zScore !== null && (
                      <span className="ml-2 text-blue-700">
                        ({percentile.toFixed(1)}
                        <span className="text-xs">P</span>,
                        <span className="ml-1">
                          {zScore >= 0 ? "+" : ""}
                          {zScore.toFixed(2)}
                          <span className="text-xs">
                            z<sup>1</sup>
                          </span>
                        </span>
                        )
                      </span>
                    )}
                  </div>
                  <div className="mb-2 text-sm text-muted-foreground">
                    {t('results.referenceRange')}
                  </div>
                  <RangeIndicator
                    value={bmi}
                    min={min}
                    max={max}
                    normal={normal}
                  />
                  {/* Data source info */}
                  <div className="mt-4 text-xs text-muted-foreground">
                    <span className="font-semibold">
                      {t('results.dataSource')}<sup>1</sup>:
                    </span>{' '}
                    {selectedStandard === 'who'
                      ? t('results.dataSources.who')
                      : t('results.dataSources.cdc')}
                  </div>
                </div>
              )}
            {/* Graph button (disabled if errors or missing fields) */}
            {/* <Button
              type="button"
              className="w-full mt-6"
              disabled={
                !birthDate ||
                !measurementDate ||
                !weight ||
                !height ||
                !isStandardValid ||
                isNaN(parseFloat(weight)) ||
                isNaN(parseFloat(height))
              }
              onClick={() => {
              }}
            >
              {t('buttons.graph')}
            </Button> */}
          </form>
        </Form>
        {result && (
          <div className="mt-8">
            {/* The BMIResults component is no longer needed as the form is now a watch form */}
            {/* You might want to display the result here or remove this section if not needed */}
            <p>{t('results.bmi')}: {bmi?.toFixed(2) || 'N/A'}</p>
            <p>
              {t('results.referenceRange')}{' '}
              {min !== null && max !== null
                ? `${min.toFixed(2)} - ${max.toFixed(2)}`
                : 'N/A'}
            </p>
            <p>
              {t('results.dataSource')}: {normal !== null ? `${normal.toFixed(2)}` : 'N/A'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BMIForm;
