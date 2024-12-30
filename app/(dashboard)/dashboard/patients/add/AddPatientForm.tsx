"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
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
  Mail,
  Home,
  Heart,
  UserPlus,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { PatientData } from "@/hooks/use-patient";
import { useToast } from "@/hooks/use-toast";

// Zod schema with all patient fields
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
    .nullable()
});

interface AddPatientFormProps {
  patient: any;
  isSubmitting: boolean;
  savePatient: any;
}

const AddPatientForm = ({
  patient,
  isSubmitting,
  savePatient,
}: AddPatientFormProps) => {
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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 121 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  const handleYearSelect = (year: string) => {
    const currentDate = form.getValues("dateOfBirth") || new Date();
    const newDate = new Date(currentDate);
    newDate.setFullYear(parseInt(year));
    form.setValue("dateOfBirth", newDate);
  };

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
    <div className="max-w-4xl m-auto w-full my-6 px-4 md:px-0">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-medical-600 mb-6">
          <Link
            href="/dashboard/patients"
            className="inline-flex items-center gap-2 text-sm hover:text-medical-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </Link>
        </div>
        <h1 className="text-4xl font-bold tracking-tight font-heading text-medical-900">
          Add New Patient
        </h1>
        <p className="text-medical-600 text-lg leading-relaxed mt-2">
          Enter the patient's information to create a new record
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
                  Personal Information
                </CardTitle>
              </div>
              <CardDescription>Basic patient information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Names Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter first name"
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Last name"
                          className="border-medical-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Date of Birth and Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        Date of Birth
                      </FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={handleYearSelect}
                          value={
                            field.value
                              ? field.value.getFullYear().toString()
                              : ""
                          }
                        >
                          <SelectTrigger className="w-[110px] border-medical-200">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year.value} value={year.value}>
                                {year.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Popover open={dateOpen} onOpenChange={setDateOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal border-medical-200"
                              >
                                {field.value ? (
                                  format(field.value, "MMM d, yyyy")
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
                              onSelect={(date) => {
                                field.onChange(date);
                                setDateOpen(false);
                              }}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                              defaultMonth={field.value || new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-200">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
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
                <Contact className="h-5 w-5 text-medical-500" />
                <CardTitle className="text-xl font-heading text-medical-900">
                  Contact Information
                </CardTitle>
              </div>
              <CardDescription>Patient's contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter email"
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
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter phone number"
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
                        Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter full address"
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
                        <FormLabel className="text-medical-700">City</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter city"
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
                          State
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter state"
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
                          Zip Code
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter zip code"
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
                          Country
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter country"
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
                <Heart className="h-5 w-5 text-medical-500" />
                <CardTitle className="text-xl font-heading text-medical-900">
                  Medical Information
                </CardTitle>
              </div>
              <CardDescription>Patient's medical details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="bloodType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        Blood Type
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-200">
                            <SelectValue placeholder="Select blood type" />
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
                              {type.replace("_", " ")}
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
                        Allergies
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List any allergies"
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
                        Current Medications
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List current medications"
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
                        Medical Notes
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional medical notes"
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
                        Insurance Provider
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter insurance provider"
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
                        Policy Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter policy number"
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
                        Group Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter group number"
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
                        Expiration Date
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
                                <span>Pick a date</span>
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
                              // Only disable dates in the past
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
                <UserPlus className="h-5 w-5 text-medical-500" />
                <CardTitle className="text-xl font-heading text-medical-900">
                  Guardian Information
                </CardTitle>
              </div>
              <CardDescription>Parent or guardian details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="guardianName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        Guardian Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter guardian's name"
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
                        Relationship
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-200">
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Immediate Family */}
                          <SelectItem value="MOTHER">Mother</SelectItem>
                          <SelectItem value="FATHER">Father</SelectItem>
                          <SelectItem value="STEPMOTHER">Stepmother</SelectItem>
                          <SelectItem value="STEPFATHER">Stepfather</SelectItem>
                          <SelectItem value="GRANDMOTHER">
                            Grandmother
                          </SelectItem>
                          <SelectItem value="GRANDFATHER">
                            Grandfather
                          </SelectItem>

                          {/* Extended Family */}
                          <SelectItem value="AUNT">Aunt</SelectItem>
                          <SelectItem value="UNCLE">Uncle</SelectItem>
                          <SelectItem value="SIBLING">Sibling</SelectItem>

                          {/* Legal Guardians */}
                          <SelectItem value="LEGAL_GUARDIAN">
                            Legal Guardian
                          </SelectItem>
                          <SelectItem value="FOSTER_PARENT">
                            Foster Parent
                          </SelectItem>

                          {/* Other */}
                          <SelectItem value="CAREGIVER">Caregiver</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
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
                        Guardian Phone
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter guardian's phone"
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
                        Guardian Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter guardian's email"
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
                Cancel
              </Button>
            </Link>
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
                  Save Patient
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
