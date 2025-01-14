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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, Save, Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { PatientData } from "@/hooks/use-patient";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useMemo } from "react";

interface MedicalInfoTabProps {
  form: UseFormReturn<PatientData>;
  onSave: (data: Partial<PatientData>, section: string) => Promise<void>;
  isLoading: boolean;
}

const MedicalInfoTab = ({ form, onSave, isLoading }: MedicalInfoTabProps) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const medicalData = {
      bloodType: form.getValues("bloodType"),
      allergies: form.getValues("allergies"),
      medications: form.getValues("medications"),
      medicalNotes: form.getValues("medicalNotes"),
      insuranceInfo: {
        provider: form.getValues("insuranceInfo.provider"),
        policyNumber: form.getValues("insuranceInfo.policyNumber"),
        groupNumber: form.getValues("insuranceInfo.groupNumber"),
        expirationDate: form.getValues("insuranceInfo.expirationDate"),
      },
    };

    await onSave(medicalData, "Medical");
  };

  const isModified = useMemo(() => {
    const medicalFields: (keyof PatientData)[] = [
      "bloodType",
      "allergies",
      "medications",
      "medicalNotes",
    ];

    const insuranceFields = [
      "provider",
      "policyNumber",
      "groupNumber",
      "expirationDate",
    ];

    const modifications = [
      ...medicalFields.map((field) => {
        const currentValue = form.getValues(field);
        const originalValue = form.formState.defaultValues?.[field];
        const isChanged = (currentValue ?? "") !== (originalValue ?? "");
        return isChanged;
      }),
      ...insuranceFields.map((field) => {
        const currentValue = form.getValues(`insuranceInfo.${field}` as keyof PatientData);
        const originalValue = form.formState.defaultValues?.insuranceInfo?.[field];
        const isChanged = (currentValue ?? "") !== (originalValue ?? "");
        return isChanged;
      }),
    ];

    return modifications.some(Boolean);
  }, [
    form.getValues("bloodType"),
    form.getValues("allergies"),
    form.getValues("medications"),
    form.getValues("medicalNotes"),
    form.getValues("insuranceInfo.provider"),
    form.getValues("insuranceInfo.policyNumber"),
    form.getValues("insuranceInfo.groupNumber"),
    form.getValues("insuranceInfo.expirationDate"),
  ]);


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-medical-500" />
            <CardTitle className="text-xl font-heading text-medical-900">
              Medical Information
            </CardTitle>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!isModified || isLoading}
            className="bg-medical-600 hover:bg-medical-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
        <CardDescription>Patient's medical details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Blood Type */}
          <FormField
            control={form.control}
            name="bloodType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-medical-700">Blood Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
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

          {/* Insurance Provider */}
          <FormField
            control={form.control}
            name="insuranceInfo.provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-medical-700">Insurance Provider</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter insurance provider"
                    className="border-medical-200"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Policy Number */}
          <FormField
            control={form.control}
            name="insuranceInfo.policyNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-medical-700">Policy Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter policy number"
                    className="border-medical-200"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Group Number */}
          <FormField
            control={form.control}
            name="insuranceInfo.groupNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-medical-700">Group Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter group number"
                    className="border-medical-200"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Insurance Expiration Date */}
          <FormField
            control={form.control}
            name="insuranceInfo.expirationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-medical-700">Expiration Date</FormLabel>
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
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={field.onChange}
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

          {/* Allergies */}
          <FormField
            control={form.control}
            name="allergies"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel className="text-medical-700">Allergies</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="List any allergies"
                    className="border-medical-200 resize-none min-h-[100px]"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Current Medications */}
          <FormField
            control={form.control}
            name="medications"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel className="text-medical-700">Current Medications</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="List current medications"
                    className="border-medical-200 resize-none min-h-[100px]"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Medical Notes */}
          <FormField
            control={form.control}
            name="medicalNotes"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel className="text-medical-700">Medical Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional medical notes"
                    className="border-medical-200 resize-none min-h-[100px]"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicalInfoTab;