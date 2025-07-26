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
  FormDescription,
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
  AlertTriangle,
  Clock,
  Beaker,
  Star,
  ExternalLink,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations, useLocale } from "next-intl";
import pediatricMeds from "@/app/data/pediatric-dose.json";
import { ClinicalDisclaimer } from "@/components/ClinicalDisclaimer";

// Dynamic schema based on selected medication
const createMedicationSchema = (medication: any) => {
  const baseSchema: any = {
    medicationId: z.string().min(1, "Please select a medication"),
  };

  // Only require concentration selection if there are multiple concentrations
  if (medication?.concentrations?.length > 1) {
    baseSchema.concentrationIndex = z
      .string()
      .min(1, "Please select a concentration");
  }

  if (medication?.inputs.includes("weight")) {
    baseSchema.weight = z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "Enter valid weight",
      });
    baseSchema.weightUnit = z.enum(["kg", "lb"]);
  }

  if (medication?.inputs.includes("age")) {
    baseSchema.age = z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "Enter valid age",
      });
    baseSchema.ageUnit = z.enum(["years", "months"]);
  }

  if (medication?.inputs.includes("frequency")) {
    baseSchema.frequency = z.string().min(1, "Please select frequency");
  }

  if (medication?.inputs.includes("duration")) {
    baseSchema.duration = z.string().optional();
  }

  // Optional custom dose override
  baseSchema.customDose = z.string().optional();

  return z.object(baseSchema);
};

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

export function ByMedicationForm() {
  const t = useTranslations("DoseCalculator");
  const locale = useLocale() as "en" | "es";

  // Get selected medication
  const [selectedMedId, setSelectedMedId] = React.useState<string>("");
  const selectedMed = pediatricMeds.medications.find(
    (med) => med.id === selectedMedId
  );

  const form = useForm({
    resolver: selectedMed
      ? zodResolver(createMedicationSchema(selectedMed))
      : undefined,
    defaultValues: {
      medicationId: "",
      concentrationIndex: "",
      weight: "",
      weightUnit: "kg" as "kg" | "lb",
      age: "",
      ageUnit: "years" as "years" | "months",
      frequency: "",
      duration: "",
      customDose: "",
    },
    mode: "onChange",
  });

  // Watch form values
  const medicationId = form.watch("medicationId");
  const concentrationIndex = form.watch("concentrationIndex");
  const weight = parseFloat(form.watch("weight") || "0");
  const age = parseFloat(form.watch("age") || "0");
  const frequency = form.watch("frequency");
  const duration = form.watch("duration");
  const customDose = form.watch("customDose");
  const weightUnit = form.watch("weightUnit");
  const ageUnit = form.watch("ageUnit");

  // Get selected concentration - handles both single and multiple concentration cases
  const selectedConcentration = React.useMemo(() => {
    if (!selectedMed?.concentrations?.length) return null;

    // If only one concentration, use it automatically
    if (selectedMed.concentrations.length === 1) {
      return selectedMed.concentrations[0];
    }

    // If multiple concentrations, use the selected index
    const index = parseInt(concentrationIndex);
    return isNaN(index) ? null : selectedMed.concentrations[index] || null;
  }, [selectedMed, concentrationIndex]);

  // Update selected medication when form changes
  React.useEffect(() => {
    if (medicationId !== selectedMedId) {
      setSelectedMedId(medicationId);
      const newMed = pediatricMeds.medications.find(
        (med) => med.id === medicationId
      );

      // Handle concentration index
      let defaultConcentrationIndex = "";
      if (newMed?.concentrations?.length === 1) {
        defaultConcentrationIndex = "";
      } else if ((newMed?.concentrations ?? []).length > 1) {
        const commonIndex =
          newMed?.concentrations?.findIndex((c) => c.common) ?? -1;
        defaultConcentrationIndex = (
          commonIndex >= 0 ? commonIndex : 0
        ).toString();
      }

      // Find common frequency
      const commonFrequency =
        newMed?.frequencies.find((f) => f.common)?.value ||
        newMed?.frequencies[0]?.value ||
        "";

      // Reset form when medication changes - use setTimeout to ensure it happens after validation
      setTimeout(() => {
        form.reset({
          medicationId,
          concentrationIndex: defaultConcentrationIndex,
          weight: "",
          weightUnit: "kg",
          age: "",
          ageUnit: "years",
          frequency: commonFrequency,
          duration: newMed?.durationDefault?.toString() || "",
          customDose: "",
        });
      }, 0);
    }
  }, [medicationId, selectedMedId, form]);

  // Calculations
  const calculations = React.useMemo(() => {
    if (!selectedMed || !selectedConcentration) return null;

    // Convert weight to kg
    const weightInKg = weightUnit === "lb" ? weight * 0.453592 : weight;

    // Convert age to years if needed for age-based dosing
    const ageInYears = ageUnit === "months" ? age / 12 : age;

    // Get dose - either custom or default
    const dose = customDose ? parseFloat(customDose) : selectedMed.doseDefault;

    // Get frequency multiplier
    const freqData = selectedMed.frequencies.find((f) => f.value === frequency);
    const globalFreqData =
      pediatricMeds.frequencyDefinitions[
        frequency as keyof typeof pediatricMeds.frequencyDefinitions
      ];
    const timesPerDay = globalFreqData?.timesPerDay || 1;

    let dailyDoseInMg = 0;
    let perDoseInMg = 0;
    let isOverMaxDose = false;

    // Calculate based on dosing type
    if (selectedMed.dosingType === "mg/kg/day" && weightInKg > 0) {
      dailyDoseInMg = (dose ?? 0) * weightInKg;
      perDoseInMg = dailyDoseInMg / timesPerDay;
    } else if (selectedMed.dosingType === "mg/kg/dose" && weightInKg > 0) {
      perDoseInMg = (dose ?? 0) * weightInKg;
      dailyDoseInMg = perDoseInMg * timesPerDay;
    } else if (selectedMed.dosingType === "weight_brackets" && weightInKg > 0) {
      const bracket = selectedMed.weightBrackets?.find(
        (b: any) => weightInKg >= b.minWeight && weightInKg <= b.maxWeight
      );
      if (bracket) {
        perDoseInMg = bracket.dose;
        dailyDoseInMg = perDoseInMg * timesPerDay;
      }
    } else if (selectedMed.dosingType === "age_brackets" && ageInYears > 0) {
      const bracket = selectedMed.ageBrackets?.find(
        (b: any) => ageInYears >= b.minAge && ageInYears <= b.maxAge
      );
      if (bracket) {
        perDoseInMg = bracket.dose;
        dailyDoseInMg = perDoseInMg * timesPerDay;
      }
    }

    const maxDailyDoseForPatient = selectedMed.maxDailyDose
      ? selectedMed.maxDailyDose * weightInKg
      : null;

    // Check max dose limits
    if (maxDailyDoseForPatient && dailyDoseInMg > maxDailyDoseForPatient) {
      isOverMaxDose = true;
      dailyDoseInMg = maxDailyDoseForPatient;
      perDoseInMg = dailyDoseInMg / timesPerDay;
    }

    // maxDose is typically an absolute value, not per kg
    const maxDoseForPatient = selectedMed.maxDose;

    if (maxDoseForPatient && perDoseInMg > maxDoseForPatient) {
      isOverMaxDose = true;
      perDoseInMg = maxDoseForPatient;
      dailyDoseInMg = perDoseInMg * timesPerDay;
    }

    // Calculate volume if concentration available
    let volumePerDose = 0;
    let volumePerDay = 0;

    if (selectedConcentration && perDoseInMg > 0) {
      volumePerDose =
        (perDoseInMg / selectedConcentration.mg) * selectedConcentration.mL;
      volumePerDay = volumePerDose * timesPerDay;
    }

    return {
      dailyDoseInMg,
      perDoseInMg,
      volumePerDose,
      volumePerDay,
      isOverMaxDose,
      timesPerDay,
      freqData,
      isTablet: selectedConcentration?.type === "tablet",
      volumeUnit: selectedConcentration?.type === "tablet" ? "tablets" : "mL",
      volumeLabel:
        selectedConcentration?.type === "tablet"
          ? "Tablets Per Dose"
          : "Volume Per Dose",
      dailyVolumeLabel:
        selectedConcentration?.type === "tablet"
          ? "Daily Tablets"
          : "Daily Volume",
    };
  }, [
    selectedMed,
    selectedConcentration,
    weight,
    weightUnit,
    age,
    ageUnit,
    frequency,
    customDose,
  ]);

  const shouldShowInputs = selectedMed && selectedMed.inputs.length > 0;
  const shouldShowResults =
    calculations &&
    (calculations.perDoseInMg > 0 || calculations.isOverMaxDose);

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form className="space-y-8">
          {/* Medication Selection */}
          <Card className="bg-medical-50/20 border-medical-100/50">
            {/* <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-medical-900">
                <Pill className="h-5 w-5" />
                {t("byMedication.selectMedication") || "Select Medication"}
              </CardTitle>
            </CardHeader> */}
            <CardContent className="space-y-6 pt-0">
              <FormField
                control={form.control}
                name="medicationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("byMedication.commonMedications") ||
                        "Common Pediatric Medications"}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-medical-100 text-left">
                          <SelectValue
                            placeholder={
                              t("byMedication.chooseMedication") ||
                              "Choose a medication..."
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pediatricMeds.medications.map((med) => (
                          <SelectItem key={med.id} value={med.id} className="select-item-complex">
                            <div className="select-item-content">
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate">
                                  {med.names[locale]}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {med.doseDefault}{" "}
                                  {med.dosingType.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Medication Info */}
              {selectedMed && (
                <Alert className="bg-medical-50/50 border-medical-200/50">
                  <AlertDescription>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-medical-900">
                          {selectedMed.names[locale]}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-medical-300 text-medical-800"
                        >
                          {selectedMed.doseDefault}{" "}
                          {selectedMed.dosingType.replace("_", " ")}
                        </Badge>
                      </div>
                      {selectedMed.notes && (
                        <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-3">
                          <p className="text-sm text-blue-900 leading-relaxed">
                            {selectedMed.notes[locale]}
                          </p>
                        </div>
                      )}
                      {/* Reference Link */}
                      {selectedMed.referenceUrl && (
                        <div className="flex items-center gap-2 pt-2 border-t border-medical-200/50">
                          <ExternalLink className="h-4 w-4 text-medical-600" />
                          <a
                            href={selectedMed.referenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-medical-700 hover:text-medical-900 hover:underline"
                          >
                            {t("byMedication.referenceSource") ||
                              "Clinical Reference & Dosing Guidelines"}
                          </a>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Concentration Selection - Only show if multiple concentrations */}
              {selectedMed && selectedMed.concentrations.length > 1 && (
                <FormField
                  control={form.control}
                  name="concentrationIndex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("byMedication.concentration") || "Concentration"}
                        <InfoTooltip
                          content={
                            t("byMedication.concentrationTooltip") ||
                            "Choose the concentration available"
                          }
                        >
                          <Info className="h-4 w-4 text-medical-400 ml-1" />
                        </InfoTooltip>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-100 text-left">
                            <SelectValue
                              placeholder={
                                t("byMedication.selectConcentration") ||
                                "Select concentration..."
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedMed.concentrations.map(
                            (concentration, index) => (
                              <SelectItem key={index} value={index.toString()} className="select-item-complex">
                                <div className="select-item-content">
                                  <div className="flex items-center gap-2">
                                    {concentration.common && (
                                      <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                    )}
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium truncate">
                                          {concentration.labels[locale]}
                                        </span>
                                        {concentration.common && (
                                          <Badge
                                            variant="secondary"
                                            className="select-item-badge text-xs bg-yellow-100 text-yellow-800"
                                          >
                                            {t("byMedication.common") || "Common"}
                                          </Badge>
                                        )}
                                      </div>
                                      <span className="text-xs text-muted-foreground truncate">
                                        {concentration.descriptions[locale]}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Show concentration info for single concentration medications */}
              {selectedMed && selectedMed.concentrations.length === 1 && (
                <Alert className="bg-blue-50/50 border-blue-200/50">
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-900">
                        {t("byMedication.concentration") || "Concentration"}:
                      </span>
                      <Badge
                        variant="outline"
                        className="border-blue-300 text-blue-800"
                      >
                        {selectedMed.concentrations[0].labels[locale]}
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      {selectedMed.concentrations[0].descriptions[locale]}
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Dynamic Input Fields */}
          {shouldShowInputs && (
            <Card className="bg-medical-50/20 border-medical-100/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-medical-900">
                  <Calculator className="h-5 w-5" />
                  {t("byMedication.patientInfo") || "Patient Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 !pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weight Input */}
                  {selectedMed.inputs.includes("weight") && (
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            {t("byMedication.patientWeight") ||
                              "Patient Weight"}
                            <InfoTooltip
                              content={
                                t("byMedication.weightTooltip") ||
                                "Enter the patient's current weight"
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
                                    t("byMedication.enterWeight") ||
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
                                    <SelectTrigger className="w-16 border-medical-100 text-left">
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
                  )}

                  {/* Age Input */}
                  {selectedMed.inputs.includes("age") && (
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            {t("byMedication.patientAge") || "Patient Age"}
                            <InfoTooltip
                              content={
                                t("byMedication.ageTooltip") ||
                                "Enter the patient's age"
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
                                    t("byMedication.enterAge") || "Enter age"
                                  }
                                />
                                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                              </div>
                              <FormField
                                control={form.control}
                                name="ageUnit"
                                render={({ field: unitField }) => (
                                  <Select
                                    value={unitField.value}
                                    onValueChange={unitField.onChange}
                                  >
                                    <SelectTrigger className="w-20 border-medical-100 text-left">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="years">
                                        {t("byMedication.years") || "years"}
                                      </SelectItem>
                                      <SelectItem value="months">
                                        {t("byMedication.months") || "months"}
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
                  )}

                  {/* Frequency */}
                  {selectedMed.inputs.includes("frequency") && (
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("byMedication.frequency") || "Frequency"}
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="border-medical-100 text-left">
                                <SelectValue
                                  placeholder={
                                    t("byMedication.selectFrequency") ||
                                    "Select frequency"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedMed.frequencies.map((freq) => (
                                                            <SelectItem key={freq.value} value={freq.value} className="select-item-complex">
                              <div className="select-item-content">
                                <div className="flex items-center gap-2">
                                  {freq.common && (
                                    <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                  )}
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium truncate">
                                        {freq.value} - {freq.labels[locale]}
                                      </span>
                                      {freq.common && (
                                        <Badge
                                          variant="secondary"
                                          className="select-item-badge text-xs bg-yellow-100 text-yellow-800"
                                        >
                                          {t("byMedication.common") ||
                                            "Common"}
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-xs text-muted-foreground truncate">
                                      {freq.descriptions[locale]}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Duration */}
                  {selectedMed.inputs.includes("duration") && (
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("byMedication.duration") || "Duration (days)"}
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="border-medical-100 text-left">
                                <SelectValue
                                  placeholder={
                                    t("byMedication.selectDuration") ||
                                    "Select duration"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedMed.durationOptions?.map((days) => (
                                <SelectItem key={days} value={days.toString()}>
                                  {days} {t("byMedication.days") || "days"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Enhanced Custom Dose Override */}
                {/* <FormField
                  control={form.control}
                  name="customDose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("byMedication.customDose") ||
                          "Custom Dose Override (optional)"}
                        <Badge variant="destructive" className="text-xs">
                          {t("byMedication.advanced") || "Advanced"}
                        </Badge>
                        <InfoTooltip
                          content={`${
                            t("byMedication.customDoseTooltip") ||
                            "Override the default dose of"
                          } ${selectedMed.doseDefault} ${
                            selectedMed.dosingType
                          }`}
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
                              placeholder={`${
                                t("byMedication.default") || "Default"
                              }: ${selectedMed.doseDefault}`}
                            />
                            <Beaker className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                          </div>
                          <span className="flex items-center text-sm text-medical-700 min-w-[80px]">
                            {selectedMed.dosingType.replace("_", " ")}
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-orange-600 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          {t("byMedication.customDoseWarning") ||
                            "Only override if you have specific clinical rationale. Safety limits will still apply."}
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {shouldShowResults && (
            <Card className="bg-medical-50/20 border-medical-100/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-medical-900">
                  <Calculator className="h-5 w-5" />
                  {t("byMedication.calculatedDosage") || "Calculated Dosage"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 !pt-0">
                {/* Max Dose Warning */}
                {calculations?.isOverMaxDose && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>
                        {t("byMedication.doseLimited") || "Dose Limited"}:
                      </strong>{" "}
                      {t("byMedication.doseExceeds") ||
                        "Calculated dose exceeds maximum safe limit. Dose has been capped at the maximum recommended amount."}
                      {/* Show maximum thresholds */}
                      <span className="block mt-1 text-sm">
                        <strong>
                          {t("byMedication.maximumLimits") || "Maximum limits"}:
                        </strong>{" "}
                        {selectedMed && selectedMed.maxDose && (
                          <span>
                            {selectedMed.maxDose} mg{" "}
                            {t("byMedication.perDose") || "per dose"}
                          </span>
                        )}
                        {selectedMed &&
                          selectedMed.maxDose &&
                          selectedMed.maxDailyDose &&
                          ", "}
                        {selectedMed && selectedMed.maxDailyDose && (
                          <span>
                            {selectedMed.maxDailyDose} mg/kg/
                            {t("byMedication.day") || "day"}
                          </span>
                        )}
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Dose Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <span className="text-sm font-medium text-medical-700 min-w-[40px]">
                        mg
                      </span>
                    </div>
                  </FormItem>

                  <FormItem>
                    <FormLabel>
                      {t("byMedication.dailyTotal") || "Daily Total"}
                    </FormLabel>
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
                {selectedConcentration && calculations?.volumePerDose > 0 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          {t("byMedication.volumePerDose") ||
                            calculations.volumeLabel}
                          <InfoTooltip
                            content={`${
                              t("byMedication.basedOnConcentration") ||
                              "Based on"
                            } ${selectedConcentration.labels[locale]}`}
                          >
                            <Info className="h-4 w-4 text-medical-400 ml-1" />
                          </InfoTooltip>
                        </FormLabel>
                        <div className="flex gap-2 items-center">
                          <Input
                            value={
                              calculations.isTablet
                                ? Math.ceil(
                                    calculations.perDoseInMg /
                                      selectedConcentration.mg
                                  ).toString()
                                : calculations.volumePerDose.toFixed(2)
                            }
                            readOnly
                            className="bg-gray-50 border-medical-100 font-semibold"
                          />
                          <span className="text-sm font-medium text-medical-700 min-w-[40px]">
                            {calculations.volumeUnit}
                          </span>
                        </div>
                      </FormItem>

                      <FormItem>
                        <FormLabel>
                          {t("byMedication.dailyVolume") ||
                            calculations.dailyVolumeLabel}
                        </FormLabel>
                        <div className="flex gap-2 items-center">
                          <Input
                            value={
                              calculations.isTablet
                                ? (
                                    Math.ceil(
                                      calculations.perDoseInMg /
                                        selectedConcentration.mg
                                    ) * calculations.timesPerDay
                                  ).toString()
                                : calculations.volumePerDay.toFixed(2)
                            }
                            readOnly
                            className="bg-gray-50 border-medical-100 font-semibold"
                          />
                          <span className="text-sm font-medium text-medical-700 min-w-[40px]">
                            {calculations.volumeUnit}
                          </span>
                        </div>
                      </FormItem>
                    </div>

                    {/* Concentration Info */}
                    <Alert className="bg-medical-50/50 border-medical-200/50">
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-medical-900">
                            {t("byMedication.concentration") || "Concentration"}
                            :
                          </span>
                          <Badge
                            variant="outline"
                            className="border-medical-300 text-medical-800"
                          >
                            {selectedConcentration.labels[locale]}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </>
                )}

                {/* Administration Info */}
                <Alert className="bg-medical-50/50 border-medical-200/50">
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-medical-900">
                          {t("byMedication.administration") || "Administration"}
                          :
                        </span>
                        <Badge
                          variant="outline"
                          className="border-medical-300 text-medical-800"
                        >
                          {frequency} -{" "}
                          {calculations?.freqData?.labels[locale] ||
                            calculations?.timesPerDay + " times per day"}
                        </Badge>
                      </div>
                      {duration && (
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-medical-900">
                            {t("byMedication.duration") || "Duration"}:
                          </span>
                          <Badge
                            variant="outline"
                            className="border-medical-300 text-medical-800"
                          >
                            {duration} {t("byMedication.days") || "days"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                <ClinicalDisclaimer
                  title={
                    t("byMedication.disclaimer.title") || "Clinical Disclaimer"
                  }
                  points={[
                    t("byMedication.disclaimer.calculation"),
                    t("byMedication.disclaimer.verification"),
                    t("byMedication.disclaimer.responsibility"),
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
