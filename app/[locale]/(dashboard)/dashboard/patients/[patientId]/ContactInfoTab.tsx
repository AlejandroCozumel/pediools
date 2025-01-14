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
import { Contact, Save, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { UseFormReturn } from "react-hook-form";
import { PatientData } from "@/hooks/use-patient";
import { useMemo } from "react";

interface ContactInfoTabProps {
  form: UseFormReturn<PatientData>;
  onSave: (data: Partial<PatientData>, section: string) => Promise<void>;
  isLoading: boolean;
}

const ContactInfoTab = ({ form, onSave, isLoading }: ContactInfoTabProps) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contactData = {
      email: form.getValues("email"),
      phoneNumber: form.getValues("phoneNumber"),
      secondaryPhone: form.getValues("secondaryPhone"),
      address: form.getValues("address"),
      city: form.getValues("city"),
      state: form.getValues("state"),
      zipCode: form.getValues("zipCode"),
      country: form.getValues("country"),
    };

    await onSave(contactData, "Contact");
  };

  // Check if any field has been modified
  const isModified = useMemo(() => {
    const contactFields: (keyof PatientData)[] = [
      "email",
      "phoneNumber",
      "secondaryPhone",
      "address",
      "city",
      "state",
      "zipCode",
      "country",
    ];

    const modifications = contactFields.map((field) => {
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
            <Contact className="h-5 w-5 text-medical-500" />
            <CardTitle className="text-xl font-heading text-medical-900">
              Contact Information
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
        <CardDescription>Patient's contact details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact Details Section */}
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
                    value={field.value || ""} // Handle null/undefined
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
                <FormLabel className="text-medical-700">Phone Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter phone number"
                    className="border-medical-200"
                    {...field}
                    value={field.value || ""} // Handle null/undefined
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-4" />

        {/* Address Section */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-medical-700">Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter full address"
                    className="border-medical-200"
                    {...field}
                    value={field.value || ""} // Handle null/undefined
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
                      value={field.value || ""} // Handle null/undefined
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
                  <FormLabel className="text-medical-700">State</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter state"
                      className="border-medical-200"
                      {...field}
                      value={field.value || ""} // Handle null/undefined
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
                  <FormLabel className="text-medical-700">Zip Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter zip code"
                      className="border-medical-200"
                      {...field}
                      value={field.value || ""} // Handle null/undefined
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
                  <FormLabel className="text-medical-700">Country</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter country"
                      className="border-medical-200"
                      {...field}
                      value={field.value || ""} // Handle null/undefined
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
  );
};

export default ContactInfoTab;
