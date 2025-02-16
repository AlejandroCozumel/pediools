"use client";

import { useState, useMemo, useEffect } from "react";
import { Country, State } from "country-state-city";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  Palette,
  Save,
  Image,
  FileSignature,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { DoctorProfileData } from "@/hooks/use-doctor-profile";
import ImageUploader from "@/components/uploader/ImageUploader";
import { useUploadFile } from "@/hooks/use-upload-file";
import { FileUploader } from "@/components/uploader/FileUploader";

const doctorProfileSchema = z.object({
  // Professional Information
  prefix: z.string().optional().nullable(),
  specialty: z
    .string()
    .min(2, "Specialty must be at least 2 characters")
    .max(50),
  licenseNumber: z.string().min(2, "License number is required"),
  clinicName: z.string().min(2, "Clinic name is required"),

  // Contact Information
  phoneNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),

  // Branding
  logoUrl: z.string().optional().nullable(),
  signatureUrl: z.string().optional().nullable(),
  headerText: z.string().optional().nullable(),
  footerText: z.string().optional().nullable(),

  // Online Presence
  website: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  socialMedia: z
    .object({
      facebook: z
        .string()
        .url("Must be a valid URL")
        .optional()
        .nullable()
        .or(z.literal("")),
      twitter: z
        .string()
        .url("Must be a valid URL")
        .optional()
        .nullable()
        .or(z.literal("")),
      linkedin: z
        .string()
        .url("Must be a valid URL")
        .optional()
        .nullable()
        .or(z.literal("")),
      instagram: z
        .string()
        .url("Must be a valid URL")
        .optional()
        .nullable()
        .or(z.literal("")),
    })
    .optional()
    .nullable(),
});

interface DoctorProfileFormProps {
  profile: any;
  isSubmitting: boolean;
  saveProfile: any;
}

const DoctorProfileForm = ({
  profile,
  isSubmitting,
  saveProfile,
}: DoctorProfileFormProps) => {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: profile?.profile,
  });

  const [selectedCountry, setSelectedCountry] = useState("");

  // Get countries and sort with Mexico and USA first
  const countries = useMemo(() => {
    const allCountries = Country.getAllCountries();
    const mexicoAndUsa = allCountries
      .filter((country) => ["MX", "US"].includes(country.isoCode))
      .sort((a, b) => a.isoCode.localeCompare(b.isoCode)); // MX first, then US

    const otherCountries = allCountries
      .filter((country) => !["MX", "US"].includes(country.isoCode))
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...mexicoAndUsa, ...otherCountries];
  }, []);

  // Get states for selected country
  const states = useMemo(() => {
    if (!selectedCountry) return [];
    return State.getStatesOfCountry(selectedCountry).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [selectedCountry]);

  const onSubmit = async (data: DoctorProfileData) => {
    try {
      console.log("Submitting profile data:", data); // Debug log
      await saveProfile.mutateAsync(data);
      toast({
        title: "Profile updated successfully",
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

  const {
    uploadFiles,
    uploadedFiles,
    progresses,
    isUploading,
    deleteUploadedFile,
  } = useUploadFile();
  const formValues = form.watch();

  useEffect(() => {
    console.log("Form values:", formValues);
  }, [formValues]);

  return (
    <div className="max-w-4xl m-auto w-full my-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-medical-600 mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm hover:text-medical-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        <h1 className="text-4xl font-bold tracking-tight font-heading text-medical-900">
          Doctor Profile
        </h1>
        <p className="text-medical-600 text-lg leading-relaxed mt-2">
          Update your professional information and clinic branding
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Professional Information */}
          <Card className="border-medical-100">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-medical-500" />
                <CardTitle className="text-xl font-heading text-medical-900">
                  Professional Information
                </CardTitle>
              </div>
              <CardDescription>
                Your medical credentials and specialties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="prefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        Title/Prefix
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-200">
                            <SelectValue placeholder="Select title" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Dr.">Dr.</SelectItem>
                          <SelectItem value="Prof.">Prof.</SelectItem>
                          <SelectItem value="Mr.">Mr.</SelectItem>
                          <SelectItem value="Mrs.">Mrs.</SelectItem>
                          <SelectItem value="Ms.">Ms.</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        Specialty
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-200">
                            <SelectValue placeholder="Select specialty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pediatrician">
                            Pediatrician
                          </SelectItem>
                          <SelectItem value="neonatologist">
                            Neonatologist
                          </SelectItem>
                          <SelectItem value="pediatric_surgeon">
                            Pediatric Surgeon
                          </SelectItem>
                          <SelectItem value="pediatric_neurologist">
                            Pediatric Neurologist
                          </SelectItem>
                          <SelectItem value="pediatric_cardiologist">
                            Pediatric Cardiologist
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        License Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter medical license number"
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
                  name="clinicName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        Clinic Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter clinic name"
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

          {/* Contact Information */}
          <Card className="border-medical-100">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-medical-500" />
                <CardTitle className="text-xl font-heading text-medical-900">
                  Contact Information
                </CardTitle>
              </div>
              <CardDescription>
                Your clinic's contact and location details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          placeholder="Enter clinic address"
                          className="border-medical-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-medical-700">
                        Country
                      </FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedCountry(value);
                          form.setValue("state", "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-200 [appearance:none] md:[appearance:revert]">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent
                          position="popper"
                          className="max-h-[300px] w-[--radix-select-trigger-width]"
                        >
                          <div className="hidden md:block sticky top-0 p-2 bg-white border-b z-10">
                            <Input
                              type="search"
                              placeholder="Search countries..."
                              className="border-medical-200"
                              onChange={(e) => {
                                // Filter implementation
                              }}
                            />
                          </div>
                          {countries.map((country) => (
                            <SelectItem
                              key={country.isoCode}
                              value={country.isoCode}
                              className={
                                ["MX", "US"].includes(country.isoCode)
                                  ? "font-medium text-medical-700"
                                  : ""
                              }
                            >
                              {country.name}
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
                  name="state"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-medical-700">State</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedCountry}
                      >
                        <FormControl>
                          <SelectTrigger className="border-medical-200 [appearance:none] md:[appearance:revert]">
                            <SelectValue
                              placeholder={
                                selectedCountry
                                  ? "Select state"
                                  : "Select country first"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent
                          position="popper"
                          className="max-h-[300px] w-[--radix-select-trigger-width]"
                        >
                          <div className="hidden md:block sticky top-0 p-2 bg-white border-b z-10">
                            <Input
                              type="search"
                              placeholder="Search states..."
                              className="border-medical-200"
                              onChange={(e) => {
                                // Filter implementation
                              }}
                            />
                          </div>
                          {states.map((state) => (
                            <SelectItem
                              key={state.isoCode}
                              value={state.isoCode}
                            >
                              {state.name}
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
                  name="city"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
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
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-medical-700">
                        Postal Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter postal code"
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

          {/* Branding */}
          <Card className="border-medical-100">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-medical-500" />
                <CardTitle className="text-xl font-heading text-medical-900">
                  Branding
                </CardTitle>
              </div>
              <CardDescription>
                Customize your clinic's visual identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="headerText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        Header Text
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter header text for documents"
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
                  name="footerText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        Footer Text
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter footer text for documents"
                          className="border-medical-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">Logo</FormLabel>
                      <FormControl>
                        <FileUploader
                          value={
                            field.value
                              ? [{ url: field.value, name: "logo" }]
                              : []
                          }
                          onValueChange={(files) => {
                            console.log("File value changed:", files);
                          }}
                          onUpload={async (files) => {
                            try {
                              const uploadedFiles = await uploadFiles(files);
                              console.log("Files uploaded:", uploadedFiles);
                              const newUrl = uploadedFiles[0]?.url || null;
                              console.log("Setting URL after upload:", newUrl);
                              field.onChange(newUrl);
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to upload file",
                                variant: "destructive",
                              });
                            }
                          }}
                          accept={{
                            "image/*": [".png", ".jpg", ".jpeg", ".gif"],
                          }}
                          maxSize={1024 * 1024 * 4}
                          maxFiles={1}
                          disabled={isUploading}
                          initialFiles={
                            field.value
                              ? [{ url: field.value, name: "logo" }]
                              : []
                          }
                          deleteUploadedFile={async (fileUrl) => {
                            field.onChange(null); // Clear the URL reference
                            // If you need to perform any asynchronous operation when deleting, do it here
                            // For example:
                            // await someAsyncDeleteOperation(fileUrl);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="signatureUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        Digital Signature
                      </FormLabel>
                      <FormControl>
                        <ImageUploader
                          onUpload={async (files) => {
                            await uploadFiles(files);
                            // Update the form field with the uploaded URL
                            if (uploadedFiles.length > 0) {
                              field.onChange(uploadedFiles[0].url);
                            }
                          }}
                          maxSize={1024 * 1024 * 4} // 4MB
                          maxFiles={1}
                          disabled={isUploading}
                          uploadedFiles={
                            field.value
                              ? [{ url: field.value, name: "signature" }]
                              : []
                          }
                          progresses={progresses}
                          deleteUploadedFile={deleteUploadedFile}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Online Presence */}
          <Card className="border-medical-100">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-medical-500" />
                <CardTitle className="text-xl font-heading text-medical-900">
                  Online Presence
                </CardTitle>
              </div>
              <CardDescription>
                Your website and social media links
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-medical-700">Website</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://www.example.com"
                        className="border-medical-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="socialMedia.facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        Facebook
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Facebook profile URL"
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
                  name="socialMedia.twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        Twitter
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Twitter profile URL"
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
                  name="socialMedia.linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        LinkedIn
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="LinkedIn profile URL"
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
                  name="socialMedia.instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-700">
                        Instagram
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Instagram profile URL"
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
            <Link href="/dashboard">
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
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default DoctorProfileForm;
