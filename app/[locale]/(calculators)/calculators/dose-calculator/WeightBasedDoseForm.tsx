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
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from "next-intl";
import { ClinicalDisclaimer } from "@/components/ClinicalDisclaimer";

const weightBasedSchema = z.object({
  dose: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Enter valid dose",
    }),
  doseUnit: z.enum(["mg", "ml", "tablet"]),
  dosageType: z.enum(["/kg/day", "/kg/dose", "/day", "/dose"]),
  frequency: z.string().min(1, "Please select frequency"),
  weight: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Enter valid weight",
    }),
  weightUnit: z.enum(["kg", "lb"]),
  concentration: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Enter valid concentration",
    }),
  concentrationUnit: z.enum(["mg/ml", "mg/tablet"]),
  maxDose: z.string().optional(),
});

type WeightBasedFormValues = z.infer<typeof weightBasedSchema>;

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
  { value: "QID", label: "QID", description: "Four times daily" },
  { value: "q4h", label: "q4h", description: "Every 4 hours" },
  { value: "q6h", label: "q6h", description: "Every 6 hours" },
  { value: "q8h", label: "q8h", description: "Every 8 hours" },
];

export function WeightBasedDoseForm() {
  const t = useTranslations("DoseCalculator");

  const form = useForm<WeightBasedFormValues>({
    resolver: zodResolver(weightBasedSchema),
    defaultValues: {
      dose: "",
      doseUnit: "mg",
      dosageType: "/kg/day",
      frequency: "BID",
      weight: "",
      weightUnit: "kg",
      concentration: "",
      concentrationUnit: "mg/ml",
      maxDose: "",
    },
    mode: "onChange",
  });

  // Watch form values
  const dose = parseFloat(form.watch("dose") || "0");
  const doseUnit = form.watch("doseUnit");
  const dosageType = form.watch("dosageType");
  const frequency = form.watch("frequency");
  const weight = parseFloat(form.watch("weight") || "0");
  const weightUnit = form.watch("weightUnit");
  const concentration = parseFloat(form.watch("concentration") || "0");
  const concentrationUnit = form.watch("concentrationUnit");
  const maxDose = parseFloat(form.watch("maxDose") || "0");

  // Calculations
  const calculations = React.useMemo(() => {
    if (!dose || !weight || !concentration) return null;

    // Convert weight to kg
    const weightInKg = weightUnit === "lb" ? weight * 0.453592 : weight;

    // Frequency multiplier
    const freqMap: { [key: string]: number } = {
      qD: 1,
      BID: 2,
      TID: 3,
      QID: 4,
      q4h: 6,
      q6h: 4,
      q8h: 3,
    };
    const timesPerDay = freqMap[frequency] || 1;

    let dailyDoseInMg = 0;
    let perDoseInMg = 0;
    let isOverMaxDose = false;

    // Calculate based on dosage type
    if (dosageType === "/kg/day") {
      dailyDoseInMg = dose * weightInKg;
      perDoseInMg = dailyDoseInMg / timesPerDay;
    } else if (dosageType === "/kg/dose") {
      perDoseInMg = dose * weightInKg;
      dailyDoseInMg = perDoseInMg * timesPerDay;
    } else if (dosageType === "/day") {
      dailyDoseInMg = dose;
      perDoseInMg = dailyDoseInMg / timesPerDay;
    } else if (dosageType === "/dose") {
      perDoseInMg = dose;
      dailyDoseInMg = perDoseInMg * timesPerDay;
    }

    // Check max dose
    if (
      maxDose &&
      (dailyDoseInMg > maxDose || perDoseInMg > maxDose / timesPerDay)
    ) {
      isOverMaxDose = true;
      dailyDoseInMg = Math.min(dailyDoseInMg, maxDose);
      perDoseInMg = Math.min(perDoseInMg, maxDose / timesPerDay);
    }

    // Calculate volume based on concentration
    let volumePerDose = 0;
    let volumePerDay = 0;
    let volumeUnit = "mL";

    if (concentrationUnit === "mg/ml") {
      volumePerDose = perDoseInMg / concentration;
      volumePerDay = dailyDoseInMg / concentration;
      volumeUnit = "mL";
    } else if (concentrationUnit === "mg/tablet") {
      volumePerDose = perDoseInMg / concentration;
      volumePerDay = dailyDoseInMg / concentration;
      volumeUnit = "tablets";
    }

    // Handle special cases where dose is already in volume units
    if (doseUnit === "ml") {
      if (dosageType === "/kg/day") {
        volumePerDay = dose * weightInKg;
        volumePerDose = volumePerDay / timesPerDay;
      } else if (dosageType === "/kg/dose") {
        volumePerDose = dose * weightInKg;
        volumePerDay = volumePerDose * timesPerDay;
      } else if (dosageType === "/day") {
        volumePerDay = dose;
        volumePerDose = volumePerDay / timesPerDay;
      } else if (dosageType === "/dose") {
        volumePerDose = dose;
        volumePerDay = volumePerDose * timesPerDay;
      }
      volumeUnit = "mL";
      // Calculate mg from volume
      dailyDoseInMg = volumePerDay * concentration;
      perDoseInMg = volumePerDose * concentration;
    } else if (doseUnit === "tablet") {
      if (dosageType === "/kg/day") {
        volumePerDay = dose * weightInKg;
        volumePerDose = volumePerDay / timesPerDay;
      } else if (dosageType === "/kg/dose") {
        volumePerDose = dose * weightInKg;
        volumePerDay = volumePerDose * timesPerDay;
      } else if (dosageType === "/day") {
        volumePerDay = dose;
        volumePerDose = volumePerDay / timesPerDay;
      } else if (dosageType === "/dose") {
        volumePerDose = dose;
        volumePerDay = volumePerDose * timesPerDay;
      }
      volumeUnit = "tablets";
      // Calculate mg from tablets
      dailyDoseInMg = volumePerDay * concentration;
      perDoseInMg = volumePerDose * concentration;
    }

    return {
      dailyDoseInMg,
      perDoseInMg,
      volumePerDose,
      volumePerDay,
      volumeUnit,
      timesPerDay,
      isOverMaxDose,
    };
  }, [
    dose,
    doseUnit,
    dosageType,
    frequency,
    weight,
    weightUnit,
    concentration,
    concentrationUnit,
    maxDose,
  ]);

  const shouldShowResults =
    calculations &&
    (calculations.perDoseInMg > 0 || calculations.volumePerDose > 0);

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form className="space-y-8">
          {/* Prescription Information */}
          <Card className="bg-medical-50/20 border-medical-100/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-medical-900">
                <Pill className="h-5 w-5" />
                {t("weightBased.title") || "Prescription Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 !pt-0">
              {/* First Row - Dose and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dose Amount */}
                <FormField
                  control={form.control}
                  name="dose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("weightBased.dose.label") || "Dose Amount"}
                        <InfoTooltip
                          content={
                            t("weightBased.dose.tooltip") ||
                            "Enter the prescribed dose amount"
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
                            <Pill className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
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
                                  <SelectItem value="mg">
                                    {t("weightBased.doseUnit.mg") || "mg"}
                                  </SelectItem>
                                  <SelectItem value="ml">
                                    {t("weightBased.doseUnit.ml") || "mL"}
                                  </SelectItem>
                                  <SelectItem value="tablet">
                                    {t("weightBased.doseUnit.tablet") ||
                                      "tablet"}
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

                {/* Dosage Type */}
                <FormField
                  control={form.control}
                  name="dosageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("weightBased.dosageType.label") || "Dosage Type"}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-100">
                            <SelectValue
                              placeholder={
                                t("weightBased.dosageType.placeholder") ||
                                "Select type"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="/kg/day">
                            <div className="flex flex-col">
                              <span>/kg/day</span>
                              <span className="text-xs text-muted-foreground">
                                Per kilogram per day
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="/kg/dose">
                            <div className="flex flex-col">
                              <span>/kg/dose</span>
                              <span className="text-xs text-muted-foreground">
                                Per kilogram per dose
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="/day">
                            <div className="flex flex-col">
                              <span>/day</span>
                              <span className="text-xs text-muted-foreground">
                                Total per day
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="/dose">
                            <div className="flex flex-col">
                              <span>/dose</span>
                              <span className="text-xs text-muted-foreground">
                                Total per dose
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Second Row - Frequency and Weight */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Frequency */}
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("weightBased.frequency.label") || "Frequency"}
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-100">
                            <SelectValue
                              placeholder={
                                t("weightBased.frequency.placeholder") ||
                                "Select frequency"
                              }
                            />
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

                {/* Patient Weight */}
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("weightBased.patientWeight.label") ||
                          "Patient Weight"}
                        <InfoTooltip
                          content={
                            t("weightBased.patientWeight.tooltip") ||
                            "Enter patient's current weight"
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
                                t("weightBased.patientWeight.placeholder") ||
                                "Enter weight"
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

              {/* Prescription Summary */}
              {dose > 0 && weight > 0 && (
                <Alert className="bg-medical-50/50 border-medical-200/50">
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-medical-900">
                        {t("weightBased.prescriptionSummary.title") ||
                          "Prescription Summary"}
                        :
                      </span>
                      <Badge
                        variant="outline"
                        className="border-medical-300 text-medical-800"
                      >
                        {dose} {doseUnit}
                        {dosageType} • {weight} {weightUnit} • {frequency}
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
                <Scale className="h-5 w-5" />
                {t("drugConcentration.title") || "Medication Concentration"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 !pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Concentration */}
                <FormField
                  control={form.control}
                  name="concentration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Concentration
                        <InfoTooltip content="Enter the concentration of the medication available">
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
                              placeholder="Enter concentration"
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
                                  <SelectItem value="mg/tablet">
                                    mg/tablet
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

                {/* Max Dose (Optional) */}
                <FormField
                  control={form.control}
                  name="maxDose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Maximum Daily Dose (optional)
                        <InfoTooltip content="Enter maximum safe daily dose in mg to enable safety checks">
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
                              placeholder="Enter max dose"
                            />
                            <AlertTriangle className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                          </div>
                          <span className="flex items-center text-sm text-medical-700 min-w-[40px]">
                            mg/day
                          </span>
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
                        Available Concentration:
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
                  {t("weightBased.results.title") || "Calculation Results"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 !pt-0">
                {/* Max Dose Warning */}
                {calculations?.isOverMaxDose && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Dose Limited:</strong> Calculated dose exceeds
                      maximum safe limit. Dose has been capped at the maximum
                      recommended amount.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Dose Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormItem>
                    <FormLabel>Per Dose</FormLabel>
                    <div className="flex gap-2 items-center">
                      <Input
                        value={calculations?.perDoseInMg.toFixed(1) || ""}
                        readOnly
                        className="bg-gray-50 border-medical-100 font-semibold"
                      />
                      <span className="text-sm font-medium text-medical-700 min-w-[40px]">
                        mg
                      </span>
                    </div>
                  </FormItem>

                  <FormItem>
                    <FormLabel>Daily Total</FormLabel>
                    <div className="flex gap-2 items-center">
                      <Input
                        value={calculations?.dailyDoseInMg.toFixed(1) || ""}
                        readOnly
                        className="bg-gray-50 border-medical-100 font-semibold"
                      />
                      <span className="text-sm font-medium text-medical-700 min-w-[40px]">
                        mg
                      </span>
                    </div>
                  </FormItem>
                </div>

                {/* Volume Results */}
                {calculations && calculations.volumePerDose > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Volume Per Dose
                        <InfoTooltip
                          content={`Based on ${concentration} ${concentrationUnit}`}
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
                        <span className="text-sm font-medium text-medical-700 min-w-[60px]">
                          {calculations.volumeUnit}
                        </span>
                      </div>
                    </FormItem>

                    <FormItem>
                      <FormLabel>Daily Volume</FormLabel>
                      <div className="flex gap-2 items-center">
                        <Input
                          value={calculations.volumePerDay.toFixed(2)}
                          readOnly
                          className="bg-gray-50 border-medical-100 font-semibold"
                        />
                        <span className="text-sm font-medium text-medical-700 min-w-[60px]">
                          {calculations.volumeUnit}
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
                          Administration:
                        </span>
                        <Badge
                          variant="outline"
                          className="border-medical-300 text-medical-800"
                        >
                          {frequency} - {calculations?.timesPerDay} times per
                          day
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-medical-900">
                          Concentration:
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
