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
import { Weight, Pill, Calculator, Info, Scale, Beaker, Ruler } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const bsaBasedSchema = z.object({
  dose: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Enter valid dose",
  }),
  doseUnit: z.enum(["mg", "ml", "tablet"]),
  dosageType: z.enum(["/m²/day", "/m²/dose", "/day", "/dose"]),
  frequency: z.string(),
  weight: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Enter valid weight",
  }),
  weightUnit: z.enum(["kg", "lb"]),
  height: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Enter valid height",
  }),
  heightUnit: z.enum(["cm", "in"]),
  mass: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Enter valid mass",
  }),
  massUnit: z.enum(["mg", "g"]),
  volume: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Enter valid volume",
  }),
  volumeUnit: z.enum(["ml", "tablet"]),
});

type BSABasedFormValues = z.infer<typeof bsaBasedSchema>;

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
  { value: "/m²/day", label: "/m²/day", description: "Per square meter per day" },
  { value: "/m²/dose", label: "/m²/dose", description: "Per square meter per dose" },
  { value: "/day", label: "/day", description: "Total per day" },
  { value: "/dose", label: "/dose", description: "Total per dose" },
];

// Mosteller formula for BSA calculation
function calculateBSA(weight: number, height: number): number {
  return Math.sqrt((height * weight) / 3600);
}

export function BSABasedDoseForm() {
  const form = useForm<BSABasedFormValues>({
    resolver: zodResolver(bsaBasedSchema),
    defaultValues: {
      dose: "",
      doseUnit: "mg",
      dosageType: "/m²/day",
      frequency: "qD",
      weight: "",
      weightUnit: "kg",
      height: "",
      heightUnit: "cm",
      mass: "",
      massUnit: "mg",
      volume: "",
      volumeUnit: "ml",
    },
    mode: "onChange",
  });

  const dose = parseFloat(form.watch("dose") || "0");
  const weight = parseFloat(form.watch("weight") || "0");
  const height = parseFloat(form.watch("height") || "0");
  const mass = parseFloat(form.watch("mass") || "0");
  const volume = parseFloat(form.watch("volume") || "0");
  const dosageType = form.watch("dosageType");
  const frequency = form.watch("frequency");
  const doseUnit = form.watch("doseUnit");
  const massUnit = form.watch("massUnit");
  const volumeUnit = form.watch("volumeUnit");
  const weightUnit = form.watch("weightUnit");
  const heightUnit = form.watch("heightUnit");

  // Calculate results with BSA-based formulas
  const freqMap: { [key: string]: number } = {
    qD: 1, BID: 2, TID: 3, QID: 4, "q4hr": 6, "q6hr": 4, "q8hr": 3,
  };

  // Convert units
  const weightInKg = weightUnit === "lb" ? weight * 0.453592 : weight;
  const heightInCm = heightUnit === "in" ? height * 2.54 : height;
  const massInMg = massUnit === "g" ? mass * 1000 : mass;

  // Calculate BSA using Mosteller formula
  const bsa = (weight > 0 && height > 0) ? calculateBSA(weightInKg, heightInCm) : 0;

  // Calculate concentration
  let concentration = 0;
  if (mass && volume) {
    concentration = massInMg / volume;
  }

  // Calculate dosages based on BSA
  let dailyDosageInMg = 0;
  let perDosageInMg = 0;
  let perDoseVolume = 0;
  let tabletsPerDose = 0;
  let tabletsPerDay = 0;

  if (dosageType === "/m²/day") {
    dailyDosageInMg = dose * bsa;
    perDosageInMg = dailyDosageInMg / (freqMap[frequency] || 1);
  } else if (dosageType === "/m²/dose") {
    perDosageInMg = dose * bsa;
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
  if (doseUnit === "ml" && dosageType.includes("/m²")) {
    perDoseVolume = dosageType === "/m²/day"
      ? (dose * bsa) / (freqMap[frequency] || 1)
      : dose * bsa;
  } else if (doseUnit === "tablet" && dosageType.includes("/m²")) {
    perDoseVolume = dosageType === "/m²/day"
      ? (dose * bsa) / (freqMap[frequency] || 1)
      : dose * bsa;
    tabletsPerDose = perDoseVolume;
    tabletsPerDay = dose * bsa * (dosageType === "/m²/day" ? 1 : freqMap[frequency] || 1);
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
                BSA-Based Dosage Prescribed
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
                        Dose Amount
                        <InfoTooltip content="The amount of drug per square meter of body surface area">
                          <Info className="h-4 w-4 text-medical-500 cursor-pointer" />
                        </InfoTooltip>
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              {...field}
                              type="number"
                              className="pl-8 border-medical-100 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min={0}
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
                                  <SelectItem value="mg">mg</SelectItem>
                                  <SelectItem value="ml">ml</SelectItem>
                                  <SelectItem value="tablet">tablet</SelectItem>
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
                      <FormLabel>Dosage Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-medical-100">
                            <SelectValue placeholder="Select dosage type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dosageTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-xs text-muted-foreground">{option.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Frequency */}
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between gap-2">
                      <FormLabel>Frequency</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="border-medical-100">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {frequencyOptions.map((option) => (
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

                {/* Patient Weight */}
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between gap-2">
                      <FormLabel>Patient Weight</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              {...field}
                              type="number"
                              className="pl-8 border-medical-100 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min={0}
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

                {/* Patient Height */}
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between gap-2">
                      <FormLabel>Patient Height</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              {...field}
                              type="number"
                              className="pl-8 border-medical-100 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min={0}
                            />
                            <Ruler className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="heightUnit"
                            render={({ field: unitField }) => (
                              <Select value={unitField.value} onValueChange={unitField.onChange}>
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
              </div>

              {/* BSA Display */}
              {weight > 0 && height > 0 && (
                <Alert className="bg-medical-50/50 border-medical-200/50">
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-medical-900">Calculated BSA:</span>
                      <Badge variant="outline" className="border-medical-300 text-medical-800">
                        {bsa.toFixed(3)} m²
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Prescription Summary */}
              {dose > 0 && dosageType && weight > 0 && height > 0 && (
                <Alert className="bg-medical-50/50 border-medical-200/50">
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-medical-900">Prescription Summary:</span>
                      <Badge variant="outline" className="border-medical-300 text-medical-800">
                        {dose} {doseUnit}{dosageType} • BSA: {bsa.toFixed(3)} m²
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
                Drug Concentration
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
                        Mass
                        <InfoTooltip content="The amount of drug in a particular volume">
                          <Info className="h-4 w-4 text-medical-500 cursor-pointer" />
                        </InfoTooltip>
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              {...field}
                              type="number"
                              className="pl-8 border-medical-100 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min={0}
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
                                  <SelectItem value="mg">mg</SelectItem>
                                  <SelectItem value="g">g</SelectItem>
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
                        Volume
                        <InfoTooltip content="The amount of liquid or number of tablets containing the mass above">
                          <Info className="h-4 w-4 text-medical-500 cursor-pointer" />
                        </InfoTooltip>
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              {...field}
                              type="number"
                              className="pl-8 border-medical-100 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min={0}
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
                                  <SelectItem value="ml">ml</SelectItem>
                                  <SelectItem value="tablet">tablet</SelectItem>
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
                      <span className="font-semibold text-medical-900">Concentration:</span>
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
          {dose > 0 && weight > 0 && height > 0 && mass > 0 && volume > 0 && perDoseVolume > 0 && (
            <Card className="bg-medical-50/20 border-medical-100/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-medical-900">
                  <Calculator className="h-5 w-5" />
                  Calculated BSA-Based Dosage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Per Dose Volume */}
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Per Dose Volume
                      <InfoTooltip content="Calculated volume per dose based on BSA">
                        <Info className="h-4 w-4 text-medical-500 cursor-pointer" />
                      </InfoTooltip>
                    </FormLabel>
                    <div className="flex gap-2 items-center">
                      <Input
                        value={perDoseVolume.toFixed(2)}
                        readOnly
                        className="bg-gray-50 border-medical-100 font-semibold"
                      />
                      <span className="text-sm font-medium text-medical-700 min-w-[80px]">{volumeUnit} per dose</span>
                    </div>
                  </FormItem>

                  {/* Daily Volume */}
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Daily Volume
                      <InfoTooltip content="Calculated total volume per 24 hours">
                        <Info className="h-4 w-4 text-medical-500 cursor-pointer" />
                      </InfoTooltip>
                    </FormLabel>
                    <div className="flex gap-2 items-center">
                      <Input
                        value={dailyVolume.toFixed(2)}
                        readOnly
                        className="bg-gray-50 border-medical-100 font-semibold"
                      />
                      <span className="text-sm font-medium text-medical-700 min-w-[80px]">{volumeUnit} per 24h</span>
                    </div>
                  </FormItem>
                </div>

                {/* Dosage Information */}
                {perDosageInMg > 0 && (
                  <Alert className="bg-medical-50/50 border-medical-200/50">
                    <AlertDescription>
                      <div className="space-y-4">
                        <div className="font-semibold text-medical-900">
                          Calculated BSA-Based Dosages:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-medical-200/50">
                            <span className="text-sm font-medium">Per dose:</span>
                            <Badge variant="outline" className="border-medical-300 text-medical-800">
                              {perDosageInMg.toFixed(1)} mg
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-medical-200/50">
                            <span className="text-sm font-medium">Per 24h:</span>
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
                          Number of {massInMg} mg tablets needed:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-medical-200/50">
                            <span className="text-sm font-medium">Per dose:</span>
                            <Badge variant="outline" className="border-medical-300 text-medical-800">
                              {tabletsPerDose.toFixed(1)} tablets
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-medical-200/50">
                            <span className="text-sm font-medium">Per 24h:</span>
                            <Badge variant="outline" className="border-medical-300 text-medical-800">
                              {tabletsPerDay.toFixed(1)} tablets
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