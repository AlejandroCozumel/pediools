"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import {
  Weight,
  Pill,
  Calculator,
  Info,
  Scale,
  Beaker,
  AlertTriangle,
  Ruler,
  Activity,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClinicalDisclaimer } from "@/components/ClinicalDisclaimer";

const bsaBasedSchema = z.object({
  height: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Enter valid height",
    }),
  heightUnit: z.enum(["cm", "in"]),
  weight: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Enter valid weight",
    }),
  weightUnit: z.enum(["kg", "lb"]),
  dose: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Enter valid dose",
    }),
  doseUnit: z.enum(["mg", "mcg", "units"]),
  frequency: z.string().min(1, "Please select frequency"),
  concentration: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Enter valid concentration",
    }),
  concentrationUnit: z.enum(["mg/ml", "mcg/ml", "units/ml"]),
  maxDose: z.string().optional(),
  medicationName: z.string().optional(),
});

type BSABasedFormValues = z.infer<typeof bsaBasedSchema>;

const InfoTooltip: React.FC<{ children: React.ReactNode; content: string }> = ({
  children,
  content,
}) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p>{content}</p>
    </TooltipContent>
  </Tooltip>
);

const frequencyOptions = [
  { value: "qD", label: "qD", description: "Once daily" },
  { value: "BID", label: "BID", description: "Twice daily" },
  { value: "TID", label: "TID", description: "Three times daily" },
  { value: "q3weeks", label: "q3weeks", description: "Every 3 weeks" },
  { value: "weekly", label: "Weekly", description: "Once weekly" },
  { value: "q2weeks", label: "q2weeks", description: "Every 2 weeks" },
  {
    value: "continuous",
    label: "Continuous",
    description: "Continuous infusion",
  },
];

export function BSABasedDoseForm() {
  const t = useTranslations("DoseCalculator");
  const [bsaMethod, setBsaMethod] = React.useState("actual");

  const form = useForm<BSABasedFormValues>({
    resolver: zodResolver(bsaBasedSchema),
    defaultValues: {
      height: "",
      heightUnit: "cm",
      weight: "",
      weightUnit: "kg",
      dose: "",
      doseUnit: "mg",
      frequency: "qD",
      concentration: "",
      concentrationUnit: "mg/ml",
      maxDose: "",
      medicationName: "",
    },
    mode: "onChange",
  });

  // Watch form values
  const height = parseFloat(form.watch("height") || "0");
  const heightUnit = form.watch("heightUnit");
  const weight = parseFloat(form.watch("weight") || "0");
  const weightUnit = form.watch("weightUnit");
  const dose = parseFloat(form.watch("dose") || "0");
  const doseUnit = form.watch("doseUnit");
  const frequency = form.watch("frequency");
  const concentration = parseFloat(form.watch("concentration") || "0");
  const concentrationUnit = form.watch("concentrationUnit");
  const maxDose = parseFloat(form.watch("maxDose") || "0");
  const medicationName = form.watch("medicationName");

  // BSA and dose calculations
  const calculations = React.useMemo(() => {
    if (!height || !weight || !dose || !concentration) return null;

    // Convert to metric units
    const heightInCm = heightUnit === "in" ? height * 2.54 : height;
    const weightInKg = weightUnit === "lb" ? weight * 0.453592 : weight;

    // Calculate BSA using Mosteller formula
    const bsa = Math.sqrt((heightInCm * weightInKg) / 3600);

    // Frequency multiplier (different for BSA medications)
    const freqMap: { [key: string]: number } = {
      qD: 1,
      BID: 2,
      TID: 3,
      weekly: 1 / 7,
      q2weeks: 1 / 14,
      q3weeks: 1 / 21,
      continuous: 1, // handled specially
    };

    // Calculate doses based on BSA method
    let effectiveBSA = bsa;
    if (bsaMethod === "normalized") {
      effectiveBSA = 1.73; // Standard normalized BSA
    }

    let totalDoseInMg = dose * effectiveBSA;
    let perDoseInMg = totalDoseInMg;
    let isOverMaxDose = false;
    let dosesPerDay = freqMap[frequency] || 1;

    // Handle different frequency types
    if (frequency === "continuous") {
      // For continuous infusions, dose is per day
      perDoseInMg = totalDoseInMg / 24; // hourly rate
      dosesPerDay = 24;
    } else if (dosesPerDay >= 1) {
      // Daily or more frequent dosing
      perDoseInMg = totalDoseInMg / dosesPerDay;
    } else {
      // Weekly/cycle dosing - total dose per cycle
      perDoseInMg = totalDoseInMg;
    }

    // Check max dose limits
    if (maxDose && totalDoseInMg > maxDose) {
      isOverMaxDose = true;
      totalDoseInMg = maxDose;
      perDoseInMg =
        frequency === "continuous"
          ? maxDose / 24
          : dosesPerDay >= 1
          ? maxDose / dosesPerDay
          : maxDose;
    }

    // Calculate volume based on concentration
    let volumePerDose = 0;
    let volumePerCycle = 0;

    // Convert dose units if needed for concentration matching
    let adjustedConcentration = concentration;
    if (doseUnit === "mcg" && concentrationUnit === "mg/ml") {
      adjustedConcentration = concentration * 1000; // Convert mg/ml to mcg/ml
    } else if (doseUnit === "mg" && concentrationUnit === "mcg/ml") {
      adjustedConcentration = concentration / 1000; // Convert mcg/ml to mg/ml
    }

    if (adjustedConcentration > 0) {
      volumePerDose = perDoseInMg / adjustedConcentration;
      volumePerCycle = totalDoseInMg / adjustedConcentration;
    }

    return {
      bsa: bsa,
      effectiveBSA: effectiveBSA,
      totalDoseInMg,
      perDoseInMg,
      volumePerDose,
      volumePerCycle,
      dosesPerDay,
      isOverMaxDose,
      heightInCm,
      weightInKg,
    };
  }, [
    height,
    heightUnit,
    weight,
    weightUnit,
    dose,
    doseUnit,
    frequency,
    concentration,
    concentrationUnit,
    maxDose,
    bsaMethod,
  ]);

  const shouldShowResults = calculations && calculations.totalDoseInMg > 0;

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form className="space-y-8">
          {/* BSA Calculator Section */}
          <Card className="bg-medical-50/20 border-medical-100/50">
            {/* <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-medical-900">
                <Activity className="h-5 w-5" />
                {t("bsaBased.bsaCalculator") || "Body Surface Area Calculator"}
              </CardTitle>
            </CardHeader> */}
            <CardContent className="space-y-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Height */}
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("bsaBased.patientHeight") || "Patient Height"}
                        <InfoTooltip
                          content={
                            t("bsaBased.heightTooltip") ||
                            "Enter the patient's height for BSA calculation"
                          }
                        >
                          <Info className="h-4 w-4 text-medical-400 ml-1" />
                        </InfoTooltip>
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              {...field}
                              type="number"
                              className="pl-8 border-medical-100"
                              min={0}
                              step="0.1"
                              placeholder={
                                t("bsaBased.enterHeight") || "Enter height"
                              }
                            />
                            <Ruler className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="heightUnit"
                            render={({ field: unitField }) => (
                              <Select
                                value={unitField.value}
                                onValueChange={unitField.onChange}
                              >
                                <SelectTrigger className="w-16 border-medical-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cm">cm</SelectItem>
                                  <SelectItem value="in">in</SelectItem>
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

                {/* Weight */}
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("byMedication.patientWeight") || "Patient Weight"}
                        <InfoTooltip
                          content={
                            t("byMedication.weightTooltip") ||
                            "Enter the patient's weight for BSA calculation"
                          }
                        >
                          <Info className="h-4 w-4 text-medical-400 ml-1" />
                        </InfoTooltip>
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              {...field}
                              type="number"
                              className="pl-8 border-medical-100"
                              min={0}
                              step="0.1"
                              placeholder={
                                t("byMedication.enterWeight") || "Enter weight"
                              }
                            />
                            <Weight className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="weightUnit"
                            render={({ field: unitField }) => (
                              <Select
                                value={unitField.value}
                                onValueChange={unitField.onChange}
                              >
                                <SelectTrigger className="w-16 border-medical-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="kg">kg</SelectItem>
                                  <SelectItem value="lb">lb</SelectItem>
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

              {/* BSA Display */}
              {calculations && calculations.bsa > 0 && (
                <Alert className="bg-blue-50/50 border-blue-200/50">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-900">
                        {t("bsaBased.calculatedBSA") ||
                          "Calculated BSA (Mosteller formula)"}
                        :
                      </span>
                      <Badge
                        variant="outline"
                        className="border-blue-300 text-blue-800 font-bold text-lg"
                      >
                        {calculations.bsa.toFixed(2)} m²
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      {t("bsaBased.basedOn") || "Based on"}{" "}
                      {calculations.heightInCm.toFixed(1)} cm{" "}
                      {t("bsaBased.and") || "and"}{" "}
                      {calculations.weightInKg.toFixed(1)} kg
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Prescription Information */}
          <Card className="bg-medical-50/20 border-medical-100/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-medical-900">
                <Pill className="h-5 w-5" />
                {t("bsaBased.bsaPrescription") || "BSA-Based Prescription"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 !pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Medication Name (Optional) */}
                <FormField
                  control={form.control}
                  name="medicationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("bsaBased.medicationName") ||
                          "Medication Name (optional)"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            className="pl-8 border-medical-100"
                            placeholder={
                              t("bsaBased.medicationPlaceholder") ||
                              "e.g., Doxorubicin, Methotrexate"
                            }
                          />
                          <Pill className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dose */}
                <FormField
                  control={form.control}
                  name="dose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("bsaBased.dosePerM2") || "Dose per m²"}
                        <InfoTooltip
                          content={
                            t("bsaBased.dosePerM2Tooltip") ||
                            "Enter the prescribed dose per square meter of body surface area"
                          }
                        >
                          <Info className="h-4 w-4 text-medical-400 ml-1" />
                        </InfoTooltip>
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              {...field}
                              type="number"
                              className="pl-8 border-medical-100"
                              min={0}
                              step="0.1"
                              placeholder={
                                t("weightBased.dose.placeholder") ||
                                "Enter dose"
                              }
                            />
                            <Scale className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="doseUnit"
                            render={({ field: unitField }) => (
                              <Select
                                value={unitField.value}
                                onValueChange={unitField.onChange}
                              >
                                <SelectTrigger className="w-20 border-medical-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mg">mg/m²</SelectItem>
                                  <SelectItem value="mcg">mcg/m²</SelectItem>
                                  <SelectItem value="units">
                                    units/m²
                                  </SelectItem>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Frequency */}
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-100">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {frequencyOptions.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {freq.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {freq.description}
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

                {/* Max Dose */}
                <FormField
                  control={form.control}
                  name="maxDose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("bsaBased.maximumDose") || "Maximum Dose (optional)"}
                        <InfoTooltip
                          content={
                            t("bsaBased.maxDoseTooltip") ||
                            "Enter maximum safe dose to enable safety checks"
                          }
                        >
                          <Info className="h-4 w-4 text-medical-400 ml-1" />
                        </InfoTooltip>
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              {...field}
                              type="number"
                              className="pl-8 border-medical-100"
                              min={0}
                              placeholder={
                                t("bsaBased.enterMaxDose") || "Enter max dose"
                              }
                            />
                            <AlertTriangle className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                          </div>
                          <span className="flex items-center text-sm text-medical-700 min-w-[50px]">
                            {doseUnit}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Prescription Summary */}
              {dose > 0 && calculations && (
                <Alert className="bg-medical-50/50 border-medical-200/50">
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-medical-900">
                        {t("byMedication.prescriptionSummary") ||
                          "Prescription Summary"}
                        :
                      </span>
                      <Badge
                        variant="outline"
                        className="border-medical-300 text-medical-800"
                      >
                        {medicationName ||
                          t("bsaBased.bsaBasedMedication") ||
                          "BSA-based medication"}{" "}
                        • {dose} {doseUnit}/m² • {frequency}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Medication Concentration */}
          <Card className="bg-medical-50/20 border-medical-100/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-medical-900">
                <Beaker className="h-5 w-5" />
                {t("drugConcentration.title") || "Medication Concentration"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 !pt-0">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {/* Concentration */}
                <FormField
                  control={form.control}
                  name="concentration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("bsaBased.availableConcentration") ||
                          "Available Concentration"}
                        <InfoTooltip
                          content={
                            t("bsaBased.concentrationTooltip") ||
                            "Enter the concentration of the medication preparation"
                          }
                        >
                          <Info className="h-4 w-4 text-medical-400 ml-1" />
                        </InfoTooltip>
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              {...field}
                              type="number"
                              className="pl-8 border-medical-100"
                              min={0}
                              step="0.1"
                              placeholder={
                                t("byMedication.enterConcentration") ||
                                "Enter concentration"
                              }
                            />
                            <Beaker className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="concentrationUnit"
                            render={({ field: unitField }) => (
                              <Select
                                value={unitField.value}
                                onValueChange={unitField.onChange}
                              >
                                <SelectTrigger className="w-24 border-medical-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mg/ml">mg/mL</SelectItem>
                                  <SelectItem value="mcg/ml">mcg/mL</SelectItem>
                                  <SelectItem value="units/ml">
                                    units/mL
                                  </SelectItem>
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
              {concentration > 0 && (
                <Alert className="bg-medical-50/50 border-medical-200/50">
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-medical-900">
                        {t("bsaBased.availableConcentration") ||
                          "Available Concentration"}
                        :
                      </span>
                      <Badge
                        variant="outline"
                        className="border-medical-300 text-medical-800"
                      >
                        {concentration} {concentrationUnit}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {shouldShowResults && (
            <Card className="bg-medical-50/20 border-medical-100/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-medical-900">
                  <Calculator className="h-5 w-5" />
                  BSA-Based Calculation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 !pt-0">
                {/* BSA Method Selection - Right in Results */}
                <div className="space-y-3">
                  <FormLabel className="text-base font-medium">
                    {t("bsaBased.bsaMethodLabel") || "BSA Calculation Method"}
                  </FormLabel>
                  <Tabs
                    value={bsaMethod}
                    onValueChange={setBsaMethod}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 bg-medical-50/30">
                      <TabsTrigger
                        value="actual"
                        className="data-[state=active]:bg-white"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium">
                            {t("bsaBased.actualBSA") || "Actual BSA"}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-blue-100 text-blue-800"
                          >
                            {calculations.bsa.toFixed(2)} m²
                          </Badge>
                        </div>
                      </TabsTrigger>
                      <TabsTrigger
                        value="normalized"
                        className="data-[state=active]:bg-white"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium">
                            {t("bsaBased.normalizedBSA") || "Normalized BSA"}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-800"
                          >
                            1.73 m²
                          </Badge>
                        </div>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="actual" className="mt-3">
                      <Alert className="bg-blue-50/30 border-blue-200/50">
                        <AlertDescription className="text-blue-800">
                          <strong>Actual BSA Method:</strong> Uses the patient's
                          calculated BSA of {calculations.bsa.toFixed(2)} m².
                          Standard for most oncology and specialty medications.
                        </AlertDescription>
                      </Alert>
                    </TabsContent>

                    <TabsContent value="normalized" className="mt-3">
                      <Alert className="bg-green-50/30 border-green-200/50">
                        <AlertDescription className="text-green-800">
                          <strong>Normalized BSA Method:</strong> Uses standard
                          adult BSA of 1.73 m². Common for renal dosing and some
                          pediatric protocols.
                        </AlertDescription>
                      </Alert>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Max Dose Warning */}
                {calculations?.isOverMaxDose && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>
                        {t("bsaBased.doseLimitExceeded") ||
                          "DOSE LIMIT EXCEEDED"}
                        :
                      </strong>{" "}
                      {t("bsaBased.doseLimitMessage") ||
                        "Calculated dose exceeds maximum safe limit. This is critical for BSA-based medications. Please verify with oncology/specialty team."}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Dose Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {t("bsaBased.totalDose") || "Total Dose"}
                      <InfoTooltip
                        content={`${dose} ${doseUnit}/m² × ${calculations.effectiveBSA.toFixed(
                          2
                        )} m² (${t(`bsaBased.${bsaMethod}`) || bsaMethod} BSA)`}
                      >
                        <Info className="h-4 w-4 text-medical-400 ml-1" />
                      </InfoTooltip>
                    </FormLabel>
                    <div className="flex gap-2 items-center">
                      <Input
                        value={calculations?.totalDoseInMg.toFixed(1) || ""}
                        readOnly
                        className="bg-gray-50 border-medical-100 font-semibold"
                      />
                      <span className="text-sm font-medium text-medical-700 min-w-[50px]">
                        {doseUnit}
                      </span>
                    </div>
                  </FormItem>

                  {frequency !== "continuous" &&
                    calculations.dosesPerDay >= 1 && (
                      <FormItem>
                        <FormLabel>
                          {t("byMedication.perDose") || "Per Dose"}
                        </FormLabel>
                        <div className="flex gap-2 items-center">
                          <Input
                            value={calculations?.perDoseInMg.toFixed(1) || ""}
                            readOnly
                            className="bg-gray-50 border-medical-100 font-semibold"
                          />
                          <span className="text-sm font-medium text-medical-700 min-w-[50px]">
                            {doseUnit}
                          </span>
                        </div>
                      </FormItem>
                    )}

                  {frequency === "continuous" && (
                    <FormItem>
                      <FormLabel>
                        {t("bsaBased.hourlyRate") || "Hourly Rate"}
                      </FormLabel>
                      <div className="flex gap-2 items-center">
                        <Input
                          value={calculations?.perDoseInMg.toFixed(2) || ""}
                          readOnly
                          className="bg-gray-50 border-medical-100 font-semibold"
                        />
                        <span className="text-sm font-medium text-medical-700 min-w-[60px]">
                          {doseUnit}/hr
                        </span>
                      </div>
                    </FormItem>
                  )}
                </div>

                {/* Volume Results */}
                {calculations && calculations.volumePerDose > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {frequency === "continuous"
                          ? t("bsaBased.volumePerHour") || "Volume per Hour"
                          : t("byMedication.volumePerDose") ||
                            "Volume per Dose"}
                        <InfoTooltip
                          content={`${
                            t("byMedication.basedOnConcentration") || "Based on"
                          } ${concentration} ${concentrationUnit}`}
                        >
                          <Info className="h-4 w-4 text-medical-400 ml-1" />
                        </InfoTooltip>
                      </FormLabel>
                      <div className="flex gap-2 items-center">
                        <Input
                          value={calculations.volumePerDose.toFixed(2)}
                          readOnly
                          className="bg-gray-50 border-medical-100 font-semibold"
                        />
                        <span className="text-sm font-medium text-medical-700 min-w-[40px]">
                          mL
                        </span>
                      </div>
                    </FormItem>

                    <FormItem>
                      <FormLabel>
                        {frequency === "continuous"
                          ? t("byMedication.dailyVolume") || "Volume per Day"
                          : t("bsaBased.totalVolumePerCycle") ||
                            "Total Volume per Cycle"}
                      </FormLabel>
                      <div className="flex gap-2 items-center">
                        <Input
                          value={calculations.volumePerCycle.toFixed(2)}
                          readOnly
                          className="bg-gray-50 border-medical-100 font-semibold"
                        />
                        <span className="text-sm font-medium text-medical-700 min-w-[40px]">
                          mL
                        </span>
                      </div>
                    </FormItem>
                  </div>
                )}

                {/* Administration Info */}
                <Alert className="bg-medical-50/50 border-medical-200/50">
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-medical-900">
                          {t("bsaBased.patientBSA") || "Patient BSA"}:
                        </span>
                        <Badge
                          variant="outline"
                          className="border-medical-300 text-medical-800"
                        >
                          {calculations.bsa.toFixed(2)} m² (
                          {t("bsaBased.actual") || "actual"})
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-medical-900">
                          {t("bsaBased.usedForCalculation") ||
                            "Used for Calculation"}
                          :
                        </span>
                        <Badge
                          variant="outline"
                          className={`border-medical-300 ${
                            bsaMethod === "normalized"
                              ? "bg-green-50 text-green-800"
                              : "bg-blue-50 text-blue-800"
                          }`}
                        >
                          {calculations.effectiveBSA.toFixed(2)} m² (
                          {t(`bsaBased.${bsaMethod}`) || bsaMethod})
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-medical-900">
                          {t("byMedication.administration") || "Administration"}
                          :
                        </span>
                        <Badge
                          variant="outline"
                          className="border-medical-300 text-medical-800"
                        >
                          {frequency}
                          {calculations.dosesPerDay > 1 &&
                            ` (${calculations.dosesPerDay}x/day)`}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-medical-900">
                          {t("byMedication.concentration") || "Concentration"}:
                        </span>
                        <Badge
                          variant="outline"
                          className="border-medical-300 text-medical-800"
                        >
                          {concentration} {concentrationUnit}
                        </Badge>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* BSA Method Comparison (when normalized is selected) */}
                {bsaMethod === "normalized" && (
                  <Alert className="bg-green-50/50 border-green-200/50">
                    <AlertDescription>
                      <div className="space-y-3">
                        <div className="font-semibold text-green-900">
                          {t("bsaBased.bsaMethodComparison") ||
                            "BSA Method Comparison"}
                          :
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-200/50">
                            <span className="text-sm font-medium">
                              {t("bsaBased.actualBSADose") || "Actual BSA Dose"}
                              :
                            </span>
                            <Badge
                              variant="outline"
                              className="border-blue-300 text-blue-800"
                            >
                              {(dose * calculations.bsa).toFixed(1)} {doseUnit}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-200/50">
                            <span className="text-sm font-medium">
                              {t("bsaBased.normalizedDoseUsed") ||
                                "Normalized Dose (Used)"}
                              :
                            </span>
                            <Badge
                              variant="outline"
                              className="border-green-300 text-green-800 font-semibold"
                            >
                              {(dose * 1.73).toFixed(1)} {doseUnit}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Safety Warning for BSA medications */}
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>BSA-Based Medication Safety:</strong> Always verify
                    calculations with another clinician. BSA-based medications
                    often have narrow therapeutic windows and require careful
                    monitoring.
                  </AlertDescription>
                </Alert>

                <ClinicalDisclaimer
                  title={
                    t("byMedication.disclaimer.title") || "Clinical Disclaimer"
                  }
                  points={[
                    t("byMedication.disclaimer.calculation") ||
                      "These calculations are for reference only and should not replace clinical judgment.",
                    t("byMedication.disclaimer.verification") ||
                      "Always verify dosages with another clinician and current clinical guidelines before administration.",
                    t("byMedication.disclaimer.responsibility") ||
                      "The prescribing clinician remains fully responsible for all dosing decisions.",
                  ]}
                  variant="warning"
                />
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
}
