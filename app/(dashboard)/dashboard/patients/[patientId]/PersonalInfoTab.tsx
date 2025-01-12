"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Baby, Lock, CalendarIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { PatientData } from "@/hooks/use-patient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PersonalInfoTabProps {
  form: UseFormReturn<PatientData>;
  onSave: (data: Partial<PatientData>, section: string) => Promise<void>;
  isLoading: boolean;
}

const PersonalInfoTab = ({ form, onSave, isLoading }: PersonalInfoTabProps) => {
  // Generate years for the date selector
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 121 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-medical-500" />
            <CardTitle className="text-xl font-heading text-medical-900">
              Personal Information
            </CardTitle>
          </div>
        </div>
        <CardDescription>Basic patient information</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Alert for Unchangeable Fields */}
        <Alert variant="default" className="bg-blue-50/70 border-medical-100 rounded-lg shadow-sm overflow-hidden">
  <div className="flex items-center">
    <div className="p-4 flex items-center justify-center">
      <Lock className="h-8 w-8 text-red-600" />
    </div>
    <div className="ml-4 pr-4">
      <AlertTitle className="text-medical-900 font-semibold">Locked Information</AlertTitle>
      <AlertDescription className="text-medical-800 text-sm">
        Personal details like name, date of birth, and gender are locked to maintain
        accuracy for medical calculations and patient records. Contact support
        if these details need correction.
      </AlertDescription>
    </div>
  </div>
</Alert>

        {/* Names Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FormLabel className="text-medical-700 mb-2 block">First Name</FormLabel>
              <Input
                value={form.getValues("firstName")}
                readOnly
                className="border-medical-200 bg-muted cursor-not-allowed"
              />
            </div>

            <div>
              <FormLabel className="text-medical-700 mb-2 block">Last Name</FormLabel>
              <Input
                value={form.getValues("lastName")}
                readOnly
                className="border-medical-200 bg-muted cursor-not-allowed"
              />
            </div>
          </div>

          {/* Demographic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <FormLabel className="text-medical-700 mb-2 block">Date of Birth</FormLabel>
              <div className="flex gap-2">
                <Select
                  value={
                    form.getValues("dateOfBirth")
                      ? new Date(form.getValues("dateOfBirth")).getFullYear().toString()
                      : ""
                  }
                  disabled
                >
                  <SelectTrigger className="w-[110px] border-medical-200 bg-muted cursor-not-allowed">
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

                <Input
                  value={
                    form.getValues("dateOfBirth")
                      ? format(new Date(form.getValues("dateOfBirth")), "MMM d, yyyy")
                      : ""
                  }
                  readOnly
                  className="flex-1 border-medical-200 bg-muted cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <FormLabel className="text-medical-700 mb-2 block">Gender</FormLabel>
              <Input
                value={
                  form.getValues("gender") === "MALE" ? "Male" :
                  form.getValues("gender") === "FEMALE" ? "Female" : ""
                }
                readOnly
                className="border-medical-200 bg-muted cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoTab;