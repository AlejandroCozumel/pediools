"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, startOfMonth, isSameDay } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  Baby,
  Save,
  CalendarIcon,
  Contact,
  Heart,
  UserPlus,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { PatientData } from "@/hooks/use-patient";
import { useToast } from "@/hooks/use-toast";

const patientSchema = z.object({
  // Personal Information
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  gender: z.enum(["MALE", "FEMALE"], {
    required_error: "Please select a gender",
  }),

  // Contact Information (all optional)
  email: z.union([
    z.string().email(),
    z.string().length(0),
    z.null(),
    z.undefined(),
  ]),
  phoneNumber: z.string().optional().nullable(),
  secondaryPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),

  // Medical Information (all optional)
  bloodType: z
    .enum([
      "A_POSITIVE",
      "A_NEGATIVE",
      "B_POSITIVE",
      "B_NEGATIVE",
      "O_POSITIVE",
      "O_NEGATIVE",
      "AB_POSITIVE",
      "AB_NEGATIVE",
    ])
    .optional()
    .nullable(),
  allergies: z.string().optional().nullable(),
  medications: z.string().optional().nullable(),
  medicalNotes: z.string().optional().nullable(),
  insuranceInfo: z.record(z.any()).optional().nullable().or(z.literal("")),

  // Guardian Information (all optional)
  guardianName: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  guardianEmail: z.union([
    z.string().email(),
    z.string().length(0),
    z.null(),
    z.undefined(),
  ]),
  guardianRelation: z
    .enum([
      "MOTHER",
      "FATHER",
      "STEPMOTHER",
      "STEPFATHER",
      "GRANDMOTHER",
      "GRANDFATHER",
      "AUNT",
      "UNCLE",
      "SIBLING",
      "LEGAL_GUARDIAN",
      "FOSTER_PARENT",
      "CAREGIVER",
      "OTHER",
    ])
    .optional()
    .nullable(),
});

interface AddPatientFormProps {
  patient?: any;
  isSubmitting: boolean;
  savePatient: any;
}

const AddPatientForm = ({
  patient,
  isSubmitting,
  savePatient,
}: AddPatientFormProps) => {
  const t = useTranslations("AddPatient");
  const bt = useTranslations("Types.bloodTypes");
  const gr = useTranslations("Types.guardianRelations");
  const [dateOpen, setDateOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: patient || {
      firstName: "",
      lastName: "",
      dateOfBirth: undefined,
      gender: undefined,
      email: "",
      phoneNumber: "",
      secondaryPhone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      bloodType: undefined,
      allergies: "",
      medications: "",
      medicalNotes: "",
      insuranceInfo: "",
      guardianName: "",
      guardianPhone: "",
      guardianEmail: "",
      guardianRelation: undefined,
    },
  });

  // --- ADDED: State for Calendar Display Month ---
  const [calendarDisplayMonth, setCalendarDisplayMonth] = useState<Date>(
    // Initialize based on potential existing patient data or today
    startOfMonth(
      (patient?.dateOfBirth ? new Date(patient.dateOfBirth) : undefined) ||
        new Date()
    )
  );

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 121 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  // --- MODIFIED: Year Select Handler ---
  const handleYearSelect = (year: string) => {
    const currentDate = form.getValues("dateOfBirth") || new Date();
    const currentMonth = currentDate.getMonth(); // Store month before changing year

    const newDate = new Date(currentDate); // Clone
    newDate.setFullYear(parseInt(year));

    // Adjust day if month changed (e.g., Feb 29th to non-leap year)
    if (newDate.getMonth() !== currentMonth) {
      newDate.setDate(0); // Go to last valid day of the target month
    }

    form.setValue("dateOfBirth", newDate, {
      shouldValidate: true,
      shouldDirty: true,
    }); // Update form state

    // --- ADDED: Update Calendar Display Month ---
    setCalendarDisplayMonth(startOfMonth(newDate));
    // --- END OF ADDED LINE ---
  };
  // --- END OF MODIFIED HANDLER ---

  // --- ADDED: Handler for calendar's internal month navigation ---
  const handleCalendarMonthChange = (month: Date) => {
    setCalendarDisplayMonth(startOfMonth(month));
  };
  // --- END OF ADDED HANDLER ---

  const onSubmit = async (data: PatientData) => {
    try {
      await savePatient.mutateAsync(data);
      toast({
        title: "Patient saved successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  return (
    <div className="max-w-4xl m-auto w-full my-6 px-4">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-medical-600 mb-6">
          <Link
            href="/dashboard/patients"
            className="inline-flex items-center gap-2 text-sm hover:text-medical-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("navigation.backToPatients")}
          </Link>
        </div>
        <h1 className="text-4xl font-bold tracking-tight font-heading text-medical-900">
          {t("header.title")}
        </h1>
        <p className="text-medical-600 text-lg leading-relaxed mt-2">
          {t("header.subtitle")}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information Card */}
          <Card className="border-medical-100">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Baby className="h-5 w-5 text-medical-500" />
                <CardTitle className="text-xl font-heading text-medical-900">
                  {t("sections.personal.title")}
                </CardTitle>
              </div>
              <CardDescription>
                {t("sections.personal.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      <FormLabel className="text-medical-700">
                        {t("sections.personal.fields.firstName")}
                      </FormLabel>{" "}
                      <FormControl>
                        <Input
                          placeholder={t(
                            "sections.personal.fields.firstNamePlaceholder"
                          )}
                          className="border-medical-200"
                          {...field}
                        />
                      </FormControl>{" "}
                      <FormMessage />{" "}
                    </FormItem>
                  )}
                />
                {/* Last Name */}
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      <FormLabel className="text-medical-700">
                        {t("sections.personal.fields.lastName")}
                      </FormLabel>{" "}
                      <FormControl>
                        <Input
                          placeholder={t(
                            "sections.personal.fields.lastNamePlaceholder"
                          )}
                          className="border-medical-200"
                          {...field}
                        />
                      </FormControl>{" "}
                      <FormMessage />{" "}
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date of Birth Field */}
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.personal.fields.dateOfBirth")}
                      </FormLabel>
                      <div className="flex gap-2 items-start">
                        {" "}
                        {/* Using items-start */}
                        <Select
                          onValueChange={handleYearSelect}
                          value={
                            field.value
                              ? field.value.getFullYear().toString()
                              : ""
                          }
                        >
                          <SelectTrigger className="w-[110px] border-medical-200">
                            <SelectValue
                              placeholder={t(
                                "sections.personal.fields.yearPlaceholder"
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year.value} value={year.value}>
                                {year.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex-1">
                          <Popover open={dateOpen} onOpenChange={setDateOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal border-medical-200 justify-start"
                                >
                                  {field.value ? (
                                    format(field.value, "MMM d, yyyy") // Standard format
                                  ) : (
                                    <span>
                                      {t(
                                        "sections.personal.fields.datePlaceholder"
                                      )}
                                    </span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                // --- MODIFIED: onSelect handler ---
                                onSelect={(date) => {
                                  field.onChange(date); // Update form value
                                  // Sync display month if needed
                                  if (date) {
                                    const selectedMonthStart =
                                      startOfMonth(date);
                                    // Check if different before setting to avoid loop if using internal nav logic
                                    const currentDisplayMonthStart =
                                      startOfMonth(calendarDisplayMonth);
                                    if (
                                      !isSameDay(
                                        selectedMonthStart,
                                        currentDisplayMonthStart
                                      )
                                    ) {
                                      setCalendarDisplayMonth(
                                        selectedMonthStart
                                      );
                                    }
                                  }
                                  setDateOpen(false); // Close popover
                                }}
                                // --- ADDED: Calendar control props ---
                                month={calendarDisplayMonth}
                                onMonthChange={handleCalendarMonthChange}
                                // --- Other props ---
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                                // Removed captionLayout props to avoid duplicate controls
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <FormMessage /> {/* Message below the controls */}
                    </FormItem>
                  )}
                />
                {/* Gender Field */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.personal.fields.gender")}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-200">
                            <SelectValue
                              placeholder={t(
                                "sections.personal.fields.selectGender"
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">
                            {t("sections.personal.fields.genderOptions.male")}
                          </SelectItem>
                          <SelectItem value="FEMALE">
                            {t("sections.personal.fields.genderOptions.female")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card className="border-medical-100">
            <CardHeader>
              <div className="flex items-center gap-2">
                {" "}
                <Contact className="h-5 w-5 text-medical-500" />{" "}
                <CardTitle className="text-xl font-heading text-medical-900">
                  {t("sections.contact.title")}
                </CardTitle>{" "}
              </div>
              <CardDescription>
                {t("sections.contact.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.contact.fields.email")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t(
                            "sections.contact.fields.emailPlaceholder"
                          )}
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
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.contact.fields.phone")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "sections.contact.fields.phonePlaceholder"
                          )}
                          className="border-medical-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Separator className="my-4" />
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.contact.fields.address")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "sections.contact.fields.addressPlaceholder"
                          )}
                          className="border-medical-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-medical-700">
                          {t("sections.contact.fields.city")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              "sections.contact.fields.cityPlaceholder"
                            )}
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
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-medical-700">
                          {t("sections.contact.fields.state")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              "sections.contact.fields.statePlaceholder"
                            )}
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
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-medical-700">
                          {t("sections.contact.fields.zipCode")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              "sections.contact.fields.zipCodePlaceholder"
                            )}
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
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-medical-700">
                          {t("sections.contact.fields.country")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              "sections.contact.fields.countryPlaceholder"
                            )}
                            className="border-medical-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information Card */}
          <Card className="border-medical-100">
            <CardHeader>
              <div className="flex items-center gap-2">
                {" "}
                <Heart className="h-5 w-5 text-medical-500" />{" "}
                <CardTitle className="text-xl font-heading text-medical-900">
                  {t("sections.medical.title")}
                </CardTitle>{" "}
              </div>
              <CardDescription>
                {t("sections.medical.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="bloodType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.medical.fields.bloodType")}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-200">
                            <SelectValue
                              placeholder={t(
                                "sections.medical.fields.bloodTypePlaceholder"
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            "A_POSITIVE",
                            "A_NEGATIVE",
                            "B_POSITIVE",
                            "B_NEGATIVE",
                            "O_POSITIVE",
                            "O_NEGATIVE",
                            "AB_POSITIVE",
                            "AB_NEGATIVE",
                          ].map((type) => (
                            <SelectItem key={type} value={type}>
                              {bt(type)}
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
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.medical.fields.allergies")}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t(
                            "sections.medical.fields.allergiesPlaceholder"
                          )}
                          className="border-medical-200 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.medical.fields.medications")}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t(
                            "sections.medical.fields.medicationsPlaceholder"
                          )}
                          className="border-medical-200 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medicalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.medical.fields.notes")}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t(
                            "sections.medical.fields.notesPlaceholder"
                          )}
                          className="border-medical-200 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="insuranceInfo.provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.medical.fields.insurance.provider")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "sections.medical.fields.insurance.providerPlaceholder"
                          )}
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
                  name="insuranceInfo.policyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.medical.fields.insurance.policyNumber")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "sections.medical.fields.insurance.policyPlaceholder"
                          )}
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
                  name="insuranceInfo.groupNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.medical.fields.insurance.groupNumber")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "sections.medical.fields.insurance.groupPlaceholder"
                          )}
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
                  name="insuranceInfo.expirationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.medical.fields.insurance.expirationDate")}
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal border-medical-200"
                            >
                              {field.value ? (
                                format(new Date(field.value), "MMM d, yyyy")
                              ) : (
                                <span>
                                  {t(
                                    "sections.personal.fields.datePlaceholder"
                                  )}
                                </span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) => {
                              field.onChange(date);
                            }}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Guardian Information Card */}
          <Card className="border-medical-100">
            <CardHeader>
              <div className="flex items-center gap-2">
                {" "}
                <UserPlus className="h-5 w-5 text-medical-500" />{" "}
                <CardTitle className="text-xl font-heading text-medical-900">
                  {t("sections.guardian.title")}
                </CardTitle>{" "}
              </div>
              <CardDescription>
                {t("sections.guardian.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="guardianName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.guardian.fields.name")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "sections.guardian.fields.namePlaceholder"
                          )}
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
                  name="guardianRelation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.guardian.fields.relationship")}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-200">
                            <SelectValue
                              placeholder={t(
                                "sections.guardian.fields.relationshipPlaceholder"
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            "MOTHER",
                            "FATHER",
                            "STEPMOTHER",
                            "STEPFATHER",
                            "GRANDMOTHER",
                            "GRANDFATHER",
                            "AUNT",
                            "UNCLE",
                            "SIBLING",
                            "LEGAL_GUARDIAN",
                            "FOSTER_PARENT",
                            "CAREGIVER",
                            "OTHER",
                          ].map((relation) => (
                            <SelectItem key={relation} value={relation}>
                              {gr(relation)}
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
                  name="guardianPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.guardian.fields.phone")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "sections.guardian.fields.phonePlaceholder"
                          )}
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
                  name="guardianEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        {t("sections.guardian.fields.email")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t(
                            "sections.guardian.fields.emailPlaceholder"
                          )}
                          className="border-medical-200"
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

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Link href="/dashboard/patients">
              <Button
                type="button"
                variant="outline"
                className="border-medical-200 text-medical-700 hover:bg-medical-50"
              >
                {t("actions.cancel")}
              </Button>
            </Link>
            <Button
              type="submit"
              className="bg-medical-600 hover:bg-medical-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  {" "}
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                  {t("actions.saving")}{" "}
                </>
              ) : (
                <>
                  {" "}
                  <Save className="h-4 w-4 mr-2" /> {t("actions.save")}{" "}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddPatientForm;
