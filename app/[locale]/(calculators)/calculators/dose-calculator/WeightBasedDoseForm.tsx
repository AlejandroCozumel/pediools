"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Weight, Pill, Calculator, Info, Scale, Beaker } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from 'next-intl';

const weightBasedSchema = z.object({
  dose: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Enter valid dose",
  }),
  doseUnit: z.enum(["mg", "ml", "tablet"]),
  dosageType: z.enum(["/kg/day", "/kg/dose", "/day", "/dose"]),
  frequency: z.string(),
  weight: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Enter valid weight",
  }),
  weightUnit: z.enum(["kg", "lb"]),
  mass: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Enter valid mass",
  }),
  massUnit: z.enum(["mg", "g"]),
  volume: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Enter valid volume",
  }),
  volumeUnit: z.enum(["ml", "tablet"]),
});

type WeightBasedFormValues = z.infer<typeof weightBasedSchema>;

const InfoTooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent className="max-w-xs"><p>{content}</p></TooltipContent>
  </Tooltip>
);

const frequencyOptions = [
  { value: "qD", label: "qD (once a day)" },
  { value: "BID", label: "BID (twice a day)" },
  { value: "TID", label: "TID (thrice a day)" },
  { value: "QID", label: "QID (four times a day)" },
  { value: "q4hr", label: "q4hr (every 4 hours)" },
  { value: "q6hr", label: "q6hr (every 6 hours)" },
  { value: "q8hr", label: "q8hr (every 8 hours)" },
];

const dosageTypeOptions = [
  { value: "/kg/day", label: "/kg/day", description: "Per kilogram per day" },
  { value: "/kg/dose", label: "/kg/dose", description: "Per kilogram per dose" },
  { value: "/day", label: "/day", description: "Total per day" },
  { value: "/dose", label: "/dose", description: "Total per dose" },
];

export function WeightBasedDoseForm() {
  const t = useTranslations('DoseCalculator');
  const form = useForm<WeightBasedFormValues>({
    resolver: zodResolver(weightBasedSchema),
    defaultValues: {
      dose: "",
      doseUnit: "mg",
      dosageType: "/kg/day",
      frequency: "qD",
      weight: "",
      weightUnit: "kg",
      mass: "",
      massUnit: "mg",
      volume: "",
      volumeUnit: "ml",
    },
    mode: "onChange",
  });

  const dose = parseFloat(form.watch("dose") || "0");
  const weight = parseFloat(form.watch("weight") || "0");
  const mass = parseFloat(form.watch("mass") || "0");
  const volume = parseFloat(form.watch("volume") || "0");
  const dosageType = form.watch("dosageType");
  const frequency = form.watch("frequency");
  const doseUnit = form.watch("doseUnit");
  const massUnit = form.watch("massUnit");
  const volumeUnit = form.watch("volumeUnit");
  const weightUnit = form.watch("weightUnit");

  // Calculate results with proper pediatric formulas
  const freqMap: { [key: string]: number } = {
    qD: 1, BID: 2, TID: 3, QID: 4, "q4hr": 6, "q6hr": 4, "q8hr": 3,
  };

  // Convert weight to kg if needed
  const weightInKg = weightUnit === "lb" ? weight * 0.453592 : weight;

  // Convert mass to mg if needed
  const massInMg = massUnit === "g" ? mass * 1000 : mass;

  // Calculate concentration (mg/ml or mg/tablet)
  let concentration = 0;
  if (mass && volume) {
    concentration = massInMg / volume;
  }

  // Calculate dosages based on type
  let dailyDosageInMg = 0;
  let perDosageInMg = 0;
  let perDoseVolume = 0;
  let tabletsPerDose = 0;
  let tabletsPerDay = 0;

  if (dosageType === "/kg/day") {
    dailyDosageInMg = dose * weightInKg;
    perDosageInMg = dailyDosageInMg / (freqMap[frequency] || 1);
  } else if (dosageType === "/kg/dose") {
    perDosageInMg = dose * weightInKg;
    dailyDosageInMg = perDosageInMg * (freqMap[frequency] || 1);
  } else if (dosageType === "/day") {
    dailyDosageInMg = dose;
    perDosageInMg = dailyDosageInMg / (freqMap[frequency] || 1);
  } else if (dosageType === "/dose") {
    perDosageInMg = dose;
    dailyDosageInMg = perDosageInMg * (freqMap[frequency] || 1);
  }

  // Calculate volume per dose and tablets
  if (concentration > 0) {
    if (doseUnit === "mg" && volumeUnit === "ml") {
      perDoseVolume = perDosageInMg / concentration;
    } else if (doseUnit === "mg" && volumeUnit === "tablet") {
      perDoseVolume = perDosageInMg / concentration;
      tabletsPerDose = perDoseVolume;
      tabletsPerDay = dailyDosageInMg / concentration;
    }
  }

  // Handle special cases
  if (doseUnit === "ml" && dosageType.includes("/kg")) {
    perDoseVolume = dosageType === "/kg/day"
      ? (dose * weightInKg) / (freqMap[frequency] || 1)
      : dose * weightInKg;
  } else if (doseUnit === "tablet" && dosageType.includes("/kg")) {
    perDoseVolume = dosageType === "/kg/day"
      ? (dose * weightInKg) / (freqMap[frequency] || 1)
      : dose * weightInKg;
    tabletsPerDose = perDoseVolume;
    tabletsPerDay = dose * weightInKg * (dosageType === "/kg/day" ? 1 : freqMap[frequency] || 1);
  }

  const dailyVolume = perDoseVolume * (freqMap[frequency] || 1);

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form className="space-y-8">

          {/* Dosage Prescribed Section */}
          <Card className="bg-medical-50/20 border-medical-100/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-medical-900">
                <Pill className="h-5 w-5" />
                {t('weightBased.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* First Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Dose Amount */}
                <FormField
                  control={form.control}
                  name="dose"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between gap-2">
                      <FormLabel className="flex items-center gap-2">
                        {t('weightBased.dose.label')}
                        <InfoTooltip content={t('weightBased.dose.tooltip')} />
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              {...field}
                              type="number"
                              className="pl-8 border-medical-100 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min={0}
                              placeholder={t('weightBased.dose.placeholder')}
                            />
                            <Pill className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="doseUnit"
                            render={({ field: unitField }) => (
                              <Select value={unitField.value} onValueChange={unitField.onChange}>
                                <SelectTrigger className="w-20 border-medical-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mg">{t('weightBased.doseUnit.mg')}</SelectItem>
                                  <SelectItem value="ml">{t('weightBased.doseUnit.ml')}</SelectItem>
                                  <SelectItem value="tablet">{t('weightBased.doseUnit.tablet')}</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dosage Type */}
                <FormField
                  control={form.control}
                  name="dosageType"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between gap-2">
                      <FormLabel>{t('weightBased.dosageType.label')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-medical-100">
                            <SelectValue placeholder={t('weightBased.dosageType.placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="/kg/day">{t('weightBased.dosageType.perKgPerDay.label')}</SelectItem>
                          <SelectItem value="/kg/dose">{t('weightBased.dosageType.perKgPerDose.label')}</SelectItem>
                          <SelectItem value="/day">{t('weightBased.dosageType.perDay.label')}</SelectItem>
                          <SelectItem value="/dose">{t('weightBased.dosageType.perDose.label')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Frequency */}
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between gap-2">
                      <FormLabel>{t('weightBased.frequency.label')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="border-medical-100">
                            <SelectValue placeholder={t('weightBased.frequency.placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="qD">{t('weightBased.frequency.options.qD')}</SelectItem>
                          <SelectItem value="BID">{t('weightBased.frequency.options.BID')}</SelectItem>
                          <SelectItem value="TID">{t('weightBased.frequency.options.TID')}</SelectItem>
                          <SelectItem value="QID">{t('weightBased.frequency.options.QID')}</SelectItem>
                          <SelectItem value="q4hr">{t('weightBased.frequency.options.q4hr')}</SelectItem>
                          <SelectItem value="q6hr">{t('weightBased.frequency.options.q6hr')}</SelectItem>
                          <SelectItem value="q8hr">{t('weightBased.frequency.options.q8hr')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Child Weight */}
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between gap-2">
                      <FormLabel>{t('weightBased.patientWeight.label')}</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              {...field}
                              type="number"
                              className="pl-8 border-medical-100 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min={0}
                              placeholder={t('weightBased.patientWeight.placeholder')}
                            />
                            <Weight className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="weightUnit"
                            render={({ field: unitField }) => (
                              <Select value={unitField.value} onValueChange={unitField.onChange}>
                                <SelectTrigger className="w-16 border-medical-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="kg">{t('weightBased.weightUnit.kg')}</SelectItem>
                                  <SelectItem value="lb">{t('weightBased.weightUnit.lb')}</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Prescription Summary */}
              {dose > 0 && dosageType && weight > 0 && (
                <Alert className="bg-medical-50/50 border-medical-200/50">
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-medical-900">{t('weightBased.prescriptionSummary.title')}:</span>
                      <Badge variant="outline" className="border-medical-300 text-medical-800">
                        {dose} {doseUnit}{dosageType} • {t('weightBased.prescriptionSummary.weight')}: {weight} {weightUnit}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Drug Concentration Section */}
          <Card className="bg-medical-50/20 border-medical-100/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-medical-900">
                <Scale className="h-5 w-5" />
                {t('drugConcentration.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Mass */}
                <FormField
                  control={form.control}
                  name="mass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t('weightBased.medication.mass.label')}
                        <InfoTooltip content={t('weightBased.medication.mass.tooltip')} />
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              {...field}
                              type="number"
                              className="pl-8 border-medical-100 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min={0}
                              placeholder={t('weightBased.medication.mass.placeholder')}
                            />
                            <Scale className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="massUnit"
                            render={({ field: unitField }) => (
                              <Select value={unitField.value} onValueChange={unitField.onChange}>
                                <SelectTrigger className="w-16 border-medical-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mg">{t('weightBased.medication.massUnit.mg')}</SelectItem>
                                  <SelectItem value="g">{t('weightBased.medication.massUnit.g')}</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Volume */}
                <FormField
                  control={form.control}
                  name="volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t('weightBased.medication.volume.label')}
                        <InfoTooltip content={t('weightBased.medication.volume.tooltip')} />
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              {...field}
                              type="number"
                              className="pl-8 border-medical-100 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min={0}
                              placeholder={t('weightBased.medication.volume.placeholder')}
                            />
                            <Beaker className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="volumeUnit"
                            render={({ field: unitField }) => (
                              <Select value={unitField.value} onValueChange={unitField.onChange}>
                                <SelectTrigger className="w-20 border-medical-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ml">{t('weightBased.medication.volumeUnit.ml')}</SelectItem>
                                  <SelectItem value="tablet">{t('weightBased.medication.volumeUnit.tablet')}</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Concentration Display */}
              {mass > 0 && volume > 0 && (
                <Alert className="bg-medical-50/50 border-medical-200/50">
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-medical-900">{t('weightBased.concentration.title')}:</span>
                      <Badge variant="outline" className="border-medical-300 text-medical-800">
                        {concentration.toFixed(2)} mg/{volumeUnit}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {dose > 0 && weight > 0 && mass > 0 && volume > 0 && perDoseVolume > 0 && (
            <Card className="bg-medical-50/20 border-medical-100/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-medical-900">
                  <Calculator className="h-5 w-5" />
                  {t('weightBased.results.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Per Dose Volume */}
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {t('weightBased.results.perDoseVolume.label')}
                      <InfoTooltip content={t('weightBased.results.perDoseVolume.tooltip')} />
                    </FormLabel>
                    <div className="flex gap-2 items-center">
                      <Input
                        value={perDoseVolume.toFixed(2)}
                        readOnly
                        className="bg-gray-50 border-medical-100 font-semibold"
                      />
                      <span className="text-sm font-medium text-medical-700 min-w-[80px]">{volumeUnit} {t('weightBased.results.perDoseVolume.unit')}</span>
                    </div>
                  </FormItem>

                  {/* Daily Volume */}
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {t('weightBased.results.dailyVolume.label')}
                      <InfoTooltip content={t('weightBased.results.dailyVolume.tooltip')} />
                    </FormLabel>
                    <div className="flex gap-2 items-center">
                      <Input
                        value={dailyVolume.toFixed(2)}
                        readOnly
                        className="bg-gray-50 border-medical-100 font-semibold"
                      />
                      <span className="text-sm font-medium text-medical-700 min-w-[80px]">{volumeUnit} {t('weightBased.results.dailyVolume.unit')}</span>
                    </div>
                  </FormItem>
                </div>

                {/* Dosage Information */}
                {perDosageInMg > 0 && (
                  <Alert className="bg-medical-50/50 border-medical-200/50">
                    <AlertDescription>
                      <div className="space-y-4">
                        <div className="font-semibold text-medical-900">
                          {t('weightBased.results.calculatedDosages.title')}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-medical-200/50">
                            <span className="text-sm font-medium">{t('weightBased.results.calculatedDosages.perDose')}:</span>
                            <Badge variant="outline" className="border-medical-300 text-medical-800">
                              {perDosageInMg.toFixed(1)} mg
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-medical-200/50">
                            <span className="text-sm font-medium">{t('weightBased.results.calculatedDosages.per24h')}:</span>
                            <Badge variant="outline" className="border-medical-300 text-medical-800">
                              {dailyDosageInMg.toFixed(1)} mg
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Tablet Information */}
                {tabletsPerDose > 0 && (
                  <Alert className="bg-medical-50/50 border-medical-200/50">
                    <AlertDescription>
                      <div className="space-y-4">
                        <div className="font-semibold text-medical-900">
                          {t('weightBased.results.tabletInformation.title', { mass: massInMg })}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-medical-200/50">
                            <span className="text-sm font-medium">{t('weightBased.results.tabletInformation.perDose')}:</span>
                            <Badge variant="outline" className="border-medical-300 text-medical-800">
                              {tabletsPerDose.toFixed(1)} {t('weightBased.results.tabletInformation.tablets')}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-medical-200/50">
                            <span className="text-sm font-medium">{t('weightBased.results.tabletInformation.per24h')}:</span>
                            <Badge variant="outline" className="border-medical-300 text-medical-800">
                              {tabletsPerDay.toFixed(1)} {t('weightBased.results.tabletInformation.tablets')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
}