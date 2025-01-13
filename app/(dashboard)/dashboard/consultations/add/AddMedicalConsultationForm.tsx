"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Loader2,
  CalendarIcon,
  Stethoscope,
  Pill,
  X,
  Plus,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { usePremiumStore } from "@/stores/premiumStore";
import PatientSelectorConsultation from "@/components/premium/PatientSelectorConsultation";

// Consultation Status Enum
const ConsultationStatusEnum = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "FOLLOW_UP_NEEDED",
] as const;

// Medication Frequency Options
const MedicationFrequencyEnum = [
  "Once a day",
  "Twice a day",
  "Three times a day",
  "Four times a day",
  "As needed",
] as const;

// Study Type Options
const StudyTypeEnum = [
  "Blood test",
  "urine test",
  "Imaging",
  "Allergy test",
  "Other",
] as const;

type ConsultationPatient = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string;
  gender: "male" | "female";
};

// Zod Schema for Medical Consultation
const medicalConsultationSchema = z.object({
  // Patient Identification
  patientId: z.string().optional(),

  // Consultation Details
  consultationDate: z.date({
    required_error: "Consultation date is required",
  }),
  status: z.enum(ConsultationStatusEnum, {
    required_error: "Consultation status is required",
  }),

  // Consultation Specifics
  consultationMotive: z.string().optional(),
  presentedSymptoms: z.string().optional(),

  // Medical Assessment
  initialObservations: z.string().optional(),
  physicalExamFindings: z.string().optional(),

  // Diagnostic Information
  preliminaryDiagnosis: z.string().optional(),
  differentialDiagnosis: z.string().optional(),

  // Treatment Plan
  prescribedMedications: z
    .array(
      z.object({
        name: z.string().min(1, "Medication name is required"),
        dosage: z.string().optional(),
        frequency: z.enum(MedicationFrequencyEnum).optional(),
        duration: z.string().optional(),
        instructions: z.string().optional(),
      })
    )
    .optional(),

  // Recommended Studies
  recommendedStudies: z
    .array(
      z.object({
        type: z.enum(StudyTypeEnum, {
          required_error: "Study type is required",
        }),
        reason: z.string().optional(),
        additionalNotes: z.string().optional(),
      })
    )
    .optional(),

  // Follow-up Details
  followUpDate: z.date().optional(),
  followUpInstructions: z.string().optional(),

  // Additional Notes
  additionalNotes: z.string().optional(),
});

// Type inference for the consultation schema
export type MedicalConsultationData = z.infer<typeof medicalConsultationSchema>;

const AddMedicalConsultationForm = ({
  initialPatientId,
}: {
  initialPatientId?: string;
}) => {
  const { isPremium, selectedPatient } = usePremiumStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form
  const form = useForm<MedicalConsultationData>({
    resolver: zodResolver(medicalConsultationSchema),
    defaultValues: {
      patientId: initialPatientId || selectedPatient?.id || "",
      consultationDate: new Date(),
      status: "SCHEDULED",
      prescribedMedications: [{ name: "" }],
      recommendedStudies: [{ type: "Blood test" }],
    },
  });

  // Use field arrays for dynamic medications and studies
  const {
    fields: medicationFields,
    append: appendMedication,
    remove: removeMedication,
  } = useFieldArray({
    control: form.control,
    name: "prescribedMedications",
  });

  const {
    fields: studyFields,
    append: appendStudy,
    remove: removeStudy,
  } = useFieldArray({
    control: form.control,
    name: "recommendedStudies",
  });

  // Handle patient selection
  const handlePatientSelect = (patient: ConsultationPatient | null) => {
    if (patient) {
      form.setValue("patientId", patient.id);
    } else {
      form.setValue("patientId", "");
    }
  };

  // Handle form submission
  const onSubmit = async (data: MedicalConsultationData) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement actual save logic
      console.log("Consultation Data:", data);

      toast({
        title: "Consultation Saved",
        description: "Medical consultation has been recorded successfully.",
      });

      // Reset form or navigate after successful submission
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save medical consultation",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl m-auto w-full my-6 px-4">
      {isPremium && !initialPatientId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Patient</CardTitle>
            <CardDescription>
              Choose a patient for this consultation
            </CardDescription>
          </CardHeader>
          <CardContent className="lg:pt-0">
            <PatientSelectorConsultation
              form={form}
              onPatientSelect={handlePatientSelect}
            />
          </CardContent>
        </Card>
      )}

      {(initialPatientId || selectedPatient) && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Consultation Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-medical-500" />
                  <CardTitle className="text-xl font-heading text-medical-900">
                    Medical Consultation
                  </CardTitle>
                </div>
                <CardDescription>
                  Record patient consultation details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Consultation Date and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Consultation Date */}
                  <FormField
                    control={form.control}
                    name="consultationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-medical-700">
                          Consultation Date
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal border-medical-200"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => field.onChange(date)}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Consultation Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-medical-700">
                          Consultation Status
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-medical-200">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ConsultationStatusEnum.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Consultation Motive and Symptoms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="consultationMotive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-medical-700">
                          Consultation Motive
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Reason for consultation"
                            className="border-medical-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="presentedSymptoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-medical-700">
                          Presented Symptoms
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe patient's symptoms"
                            className="border-medical-200 min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Prescribed Medications */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-medical-500" />
                    <CardTitle className="text-xl font-heading text-medical-900">
                      Prescribed Medications
                    </CardTitle>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendMedication({ name: "" })}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Medication
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {medicationFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center"
                  >
                    {/* Medication Name */}
                    <FormField
                      control={form.control}
                      name={`prescribedMedications.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-medical-700">
                            Medication Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Medication name"
                              className="border-medical-200"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Dosage */}
                    <FormField
                      control={form.control}
                      name={`prescribedMedications.${index}.dosage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-medical-700">
                            Dosage
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 500mg"
                              className="border-medical-200"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Frequency */}
                    <FormField
                      control={form.control}
                      name={`prescribedMedications.${index}.frequency`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-medical-700">
                            Frequency
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-medical-200">
                                <SelectValue placeholder="Frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MedicationFrequencyEnum.map((freq) => (
                                <SelectItem key={freq} value={freq}>
                                  {freq.replace("_", " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Remove Button */}
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeMedication(index)}
                        className="mt-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {medicationFields.length === 0 && (
                  <p className="text-medical-600 text-center">
                    No medications prescribed
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recommended Studies */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-medical-500" />
                    <CardTitle className="text-xl font-heading text-medical-900">
                      Recommended Studies
                    </CardTitle>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendStudy({ type: "Blood test" })}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Study
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {studyFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center"
                  >
                    {/* Study Type */}
                    <FormField
                      control={form.control}
                      name={`recommendedStudies.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-medical-700">
                            Study Type
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-medical-200">
                                <SelectValue placeholder="Select study type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {StudyTypeEnum.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.replace("_", " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Study Reason */}
                    <FormField
                      control={form.control}
                      name={`recommendedStudies.${index}.reason`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-medical-700">
                            Reason for Study
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Reason for recommended study"
                              className="border-medical-200"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Remove Button */}
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeStudy(index)}
                        className="mt-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {studyFields.length === 0 && (
                  <p className="text-medical-600 text-center">
                    No studies recommended
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Follow-up Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-medical-500" />
                  <CardTitle className="text-xl font-heading text-medical-900">
                    Follow-up Details
                  </CardTitle>
                </div>
                <CardDescription>
                  Next steps and follow-up instructions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Follow-up Date */}
                  <FormField
                    control={form.control}
                    name="followUpDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-medical-700">
                          Follow-up Date
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal border-medical-200"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Select follow-up date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => field.onChange(date)}
                              disabled={(date) => date <= new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Follow-up Instructions */}
                  <FormField
                    control={form.control}
                    name="followUpInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-medical-700">
                          Follow-up Instructions
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide specific instructions for follow-up"
                            className="border-medical-200 min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-medical-500" />
                  <CardTitle className="text-xl font-heading text-medical-900">
                    Additional Notes
                  </CardTitle>
                </div>
                <CardDescription>
                  Any additional remarks or observations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about the consultation"
                          className="border-medical-200 min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="submit"
                className="bg-medical-600 hover:bg-medical-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Consultation
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default AddMedicalConsultationForm;
