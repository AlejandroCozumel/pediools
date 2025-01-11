import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";

// Zod schema for patient validation
export const patientSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  dateOfBirth: z.string(),
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
  bloodType: z.enum([
    "A_POSITIVE", "A_NEGATIVE",
    "B_POSITIVE", "B_NEGATIVE",
    "O_POSITIVE", "O_NEGATIVE",
    "AB_POSITIVE", "AB_NEGATIVE"
  ]).optional().nullable(),
  allergies: z.string().optional().nullable(),
  medications: z.string().optional().nullable(),
  medicalNotes: z.string().optional().nullable(),
  insuranceInfo: z.record(z.any()).optional().nullable(),
  emergencyContact: z.record(z.any()).optional().nullable(),

  // Guardian Information
  guardianName: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  guardianEmail: z.string().email().optional().nullable(),
  guardianRelation: z.enum([
    "MOTHER", "FATHER", "STEPMOTHER", "STEPFATHER",
    "GRANDMOTHER", "GRANDFATHER", "AUNT", "UNCLE",
    "SIBLING", "LEGAL_GUARDIAN", "FOSTER_PARENT",
    "CAREGIVER", "OTHER"
  ]).optional().nullable(),

  // Dashboard Specific Fields
  id: z.string(),
  lastVisit: z.string().nullable(),
  lastCalculation: z.string().nullable(),
  status: z.enum(["Active", "Inactive"]).nullable(),
});

// Type inference for the patient schema
export type PatientData = z.infer<typeof patientSchema>;

// Default patient values
export const defaultPatientValues: PatientData = {
  id: '',
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "MALE",
  email: null,
  phoneNumber: null,
  secondaryPhone: null,
  address: null,
  city: null,
  state: null,
  zipCode: null,
  country: null,
  bloodType: null,
  allergies: null,
  medications: null,
  medicalNotes: null,
  insuranceInfo: null,
  emergencyContact: null,
  guardianName: null,
  guardianPhone: null,
  guardianEmail: null,
  guardianRelation: null,
  lastVisit: null,
  lastCalculation: null,
  status: null
};

export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data } = await axios.get("/api/dashboard/patients");
      return data;
    },
    select: (data) => ({
      patients: data.patients.map((patient: PatientData) => ({
        ...patient,
      })),
      totalPatients: data.totalPatients,
      patientsWithCalculations: data.patientsWithCalculations,
      newPatientsThisMonth: data.newPatientsThisMonth,
      newPatientsLastMonth: data.newPatientsLastMonth,
    }),
  });
}

export function usePatient(patientId?: string) {
  const queryClient = useQueryClient();

  const {
    data: patient,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      if (!patientId) return defaultPatientValues;

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
    onSuccess: (newPatient) => {
      queryClient.invalidateQueries({ queryKey: ["patient", newPatient.id] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  const deletePatient = useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error("Patient ID is required for deletion");
      await axios.delete(`/api/dashboard/patients/${patientId}`);
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["patient", patientId] });
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