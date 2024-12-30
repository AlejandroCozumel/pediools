import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";

// Zod schema for patient validation
export const patientSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  dateOfBirth: z.string(), // Will be converted to DateTime in the backend
  gender: z.enum(["MALE", "FEMALE"]),

  // Contact Information
  email: z.string().email().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  secondaryPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),

  // Medical Information
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
  insuranceInfo: z.record(z.any()).optional().nullable(),
  emergencyContact: z.record(z.any()).optional().nullable(),

  // Guardian Information
  guardianName: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  guardianEmail: z.string().email().optional().nullable(),
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

  // Dashboard Specific Fields
  id: z.string(),
  lastVisit: z.string().nullable(),
  lastCalculation: z.string().nullable(),
  status: z.enum(["Active", "Inactive"]).nullable(),
});

// Type inference for the patient schema
export type PatientData = z.infer<typeof patientSchema>;

// Default patient values
const defaultPatientValues = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "MALE" as const,
  email: "",
  phoneNumber: "",
  secondaryPhone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  bloodType: null,
  allergies: "",
  medications: "",
  medicalNotes: "",
  insuranceInfo: {},
  emergencyContact: {},
  guardianName: "",
  guardianPhone: "",
  guardianEmail: "",
  guardianRelation: null,
};

// Hook for fetching patients list
export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data } = await axios.get("/api/dashboard/patients");
      return data;
    },
    select: (patients) => {
      // Keep the existing structure of additional transformations
      return patients.map((patient: any) => ({
        ...patient,
        // Any additional client-side data processing
      }));
    },
  });
}

export function usePatient(patientId?: string) {
  const queryClient = useQueryClient();

  // Fetch patient data
  const {
    data: patient,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      if (!patientId) {
        return defaultPatientValues;
      }

      try {
        const { data } = await axios.get(
          `/api/dashboard/patients/${patientId}`
        );
        return data || defaultPatientValues;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!patientId,
  });

  // Mutation for saving/updating patient
  const savePatient = useMutation({
    mutationFn: async (patientData: PatientData) => {
      if (patientId) {
        const { data } = await axios.patch(
          `/api/dashboard/patients/${patientId}`,
          patientData
        );
        return data;
      } else {
        const { data } = await axios.post(
          "/api/dashboard/patients",
          patientData
        );
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      // Also invalidate the patients list if you have one
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  // Mutation for deleting patient
  const deletePatient = useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error("Patient ID is required for deletion");
      await axios.delete(`/api/dashboard/patients/${patientId}`);
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["patient", patientId] });
      // Also invalidate the patients list if you have one
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  return {
    patient,
    isLoading,
    isError,
    error,
    savePatient,
    deletePatient,
    refetch,
  };
}
