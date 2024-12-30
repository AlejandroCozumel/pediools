import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";

// Zod schema for doctor profile validation
export const doctorProfileSchema = z.object({
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
  address: z.string().min(2, "Address is required"),
  country: z.string().min(2, "Please select a country"),
  state: z.string().min(2, "Please select a state"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().min(2, "Postal code is required"),

  // Branding
  logoUrl: z.string().optional().nullable(),
  signatureUrl: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Must be a valid hex color code",
  }),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Must be a valid hex color code",
  }),
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

// Type inference for the profile schema
export type DoctorProfileData = z.infer<typeof doctorProfileSchema>;

// Default profile values
const defaultProfileValues = {
  profile: {
    prefix: "",
    specialty: "",
    licenseNumber: "",
    clinicName: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    logoUrl: "",
    signatureUrl: "",
    primaryColor: "#2563EB",
    secondaryColor: "#1E40AF",
    headerText: "",
    footerText: "",
    website: "",
    socialMedia: {
      facebook: "",
      twitter: "",
      linkedin: "",
      instagram: "",
    },
  },
};

export function useDoctorProfile() {
  const queryClient = useQueryClient();

  // Fetch profile data
  const {
    data: profile,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["doctorProfile"],
    queryFn: async () => {
      try {
        const { data } = await axios.get("/api/dashboard/profile");
        return data || defaultProfileValues;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    retry: 1,
    throwOnError: (error) => {
      return !(axios.isAxiosError(error) && error.response?.status === 404);
    },
  });

  // Single mutation for both creating and updating profile
  const saveProfile = useMutation({
    mutationFn: async (profileData: DoctorProfileData) => {
      if (profile?.profile) {
        const { data } = await axios.patch("/api/dashboard/profile", profileData);
        return data;
      } else {
        const { data } = await axios.post("/api/dashboard/profile", profileData);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorProfile"] });
    },
  });

  // Mutation for deleting profile
  const deleteProfile = useMutation({
    mutationFn: async () => {
      await axios.delete("/api/dashboard/profile");
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["doctorProfile"] });
    },
  });

  return {
    profile,
    isLoading,
    isError,
    error,
    saveProfile,
    deleteProfile,
    refetch,
  };
}