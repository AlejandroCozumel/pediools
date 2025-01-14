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
import { UserPlus, Save, Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { PatientData } from "@/hooks/use-patient";
import { useMemo } from "react";

interface GuardianInfoTabProps {
  form: UseFormReturn<PatientData>;
  onSave: (data: Partial<PatientData>, section: string) => Promise<void>;
  isLoading: boolean;
}

const GuardianInfoTab = ({ form, onSave, isLoading }: GuardianInfoTabProps) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const guardianData = {
      guardianName: form.getValues("guardianName"),
      guardianRelation: form.getValues("guardianRelation"),
      guardianPhone: form.getValues("guardianPhone"),
      guardianEmail: form.getValues("guardianEmail"),
    };

    await onSave(guardianData, "Guardian");
  };

  const isModified = useMemo(() => {
    const guardianFields: (keyof PatientData)[] = [
      "guardianName",
      "guardianRelation",
      "guardianPhone",
      "guardianEmail",
    ];

    const modifications = guardianFields.map((field) => {
      const currentValue = form.getValues(field);
      const originalValue = form.formState.defaultValues?.[field];
      const isChanged = (currentValue ?? "") !== (originalValue ?? "");
      return isChanged;
    });

    return modifications.some(Boolean);
  }, [form.watch()]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-medical-500" />
            <CardTitle className="text-xl font-heading text-medical-900">
              Guardian Information
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
        <CardDescription>Parent or guardian details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guardian Name */}
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
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Guardian Relationship */}
          <FormField
            control={form.control}
            name="guardianRelation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-medical-700">Relationship</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger className="border-medical-200">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MOTHER">Mother</SelectItem>
                    <SelectItem value="FATHER">Father</SelectItem>
                    <SelectItem value="STEPMOTHER">Stepmother</SelectItem>
                    <SelectItem value="STEPFATHER">Stepfather</SelectItem>
                    <SelectItem value="GRANDMOTHER">Grandmother</SelectItem>
                    <SelectItem value="GRANDFATHER">Grandfather</SelectItem>
                    <SelectItem value="AUNT">Aunt</SelectItem>
                    <SelectItem value="UNCLE">Uncle</SelectItem>
                    <SelectItem value="SIBLING">Sibling</SelectItem>
                    <SelectItem value="LEGAL_GUARDIAN">
                      Legal Guardian
                    </SelectItem>
                    <SelectItem value="FOSTER_PARENT">Foster Parent</SelectItem>
                    <SelectItem value="CAREGIVER">Caregiver</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Guardian Phone */}
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
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Guardian Email */}
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
                    value={field.value || ""}
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

export default GuardianInfoTab;
