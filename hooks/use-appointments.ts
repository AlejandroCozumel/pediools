// hooks/use-appointments.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";

type BreakPeriod = {
  id: string;
  startTime: string;
  endTime: string;
};

type DaySchedule = {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
  breaks: BreakPeriod[];
};

type AvailabilityData = {
  weeklySchedule: DaySchedule[];
  daysOfOperation: number[];
  defaultStartTime: string;
  defaultEndTime: string;
};

// Zod schema for appointment validation
export const appointmentSchema = z.object({
  id: z.string().optional(),
  patientId: z.string(),
  doctorId: z.string(),
  datetime: z.string(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
  type: z.string().optional(),
  notes: z.record(z.any()).optional(),
  appointmentSlotId: z.string().optional(),
  // Additional fields from your schema
  consultationMotive: z.string().optional(),
  presentedSymptoms: z.record(z.any()).optional(),
  physicalExamFindings: z.record(z.any()).optional(),
  initialObservations: z.record(z.any()).optional(),
  diagnoses: z.record(z.any()).optional(),
  diagnosticNotes: z.string().optional(),
  treatments: z.record(z.any()).optional(),
  prescribedMedications: z.record(z.any()).optional(),
  requestedStudies: z.record(z.any()).optional(),
  studyResults: z.record(z.any()).optional(),
  followUpDate: z.string().optional(),
  followUpNotes: z.record(z.any()).optional(),
});

// Type inference
export type AppointmentData = z.infer<typeof appointmentSchema>;

// Type for appointments with additional info
export interface AppointmentWithPatient extends AppointmentData {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
  };
}

// Hook for fetching appointments
export function useAppointments(filters?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  patientId?: string;
}) {
  return useQuery({
    queryKey: ["appointments", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.patientId) params.append("patientId", filters.patientId);

      const { data } = await axios.get(
        `/api/dashboard/appointments?${params.toString()}`
      );
      return data;
    },
  });
}

// Hook for fetching a single appointment
export function useAppointment(appointmentId?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;
      const { data } = await axios.get(
        `/api/dashboard/appointments/${appointmentId}`
      );
      return data;
    },
    enabled: !!appointmentId,
  });

  const saveAppointment = useMutation({
    mutationFn: async (appointmentData: AppointmentData) => {
      if (appointmentId) {
        const { data } = await axios.patch(
          `/api/dashboard/appointments/${appointmentId}`,
          appointmentData
        );
        return data;
      } else {
        const { data } = await axios.post(
          "/api/dashboard/appointments",
          appointmentData
        );
        return data;
      }
    },
    onSuccess: (newAppointment) => {
      queryClient.invalidateQueries({
        queryKey: ["appointment", newAppointment.id],
      });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async () => {
      if (!appointmentId)
        throw new Error("Appointment ID is required for deletion");
      await axios.delete(`/api/dashboard/appointments/${appointmentId}`);
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["appointment", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  return {
    appointment: data,
    isLoading,
    error,
    saveAppointment,
    deleteAppointment,
  };
}

// Hook for doctor availability
export function useDoctorAvailability() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["doctorAvailability"],
    queryFn: async () => {
      const { data } = await axios.get(
        "/api/dashboard/appointments/availability"
      );
      return data;
    },
  });

  const saveAvailability = useMutation({
    mutationFn: async (availabilityData: any) => {
      console.log(
        "SENDING AVAILABILITY DATA:",
        JSON.stringify(
          {
            weeklySchedule: availabilityData.weeklySchedule.map(
              (day: DaySchedule) => ({
                ...day,
                breaks: day.breaks || [], // Ensure breaks is always an array
              })
            ),
            daysOfOperation: availabilityData.daysOfOperation,
            defaultStartTime: availabilityData.defaultStartTime,
            defaultEndTime: availabilityData.defaultEndTime,
          },
          null,
          2
        )
      );

      const { data } = await axios.post(
        "/api/dashboard/appointments/availability",
        {
          weeklySchedule: availabilityData.weeklySchedule.map(
            (day: DaySchedule) => ({
              ...day,
              breaks: day.breaks || [], // Ensure breaks is always an array
            })
          ),
          daysOfOperation: availabilityData.daysOfOperation,
          defaultStartTime: availabilityData.defaultStartTime,
          defaultEndTime: availabilityData.defaultEndTime,
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorAvailability"] });
      queryClient.invalidateQueries({ queryKey: ["appointmentSlots"] });
    },
  });

  const saveAvailabilityOverride = useMutation({
    mutationFn: async (overrideData: any) => {
      const { data } = await axios.post(
        "/api/dashboard/appointments/availability/override",
        overrideData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorAvailability"] });
      queryClient.invalidateQueries({ queryKey: ["appointmentSlots"] });
    },
  });

  return {
    availability: data,
    isLoading,
    error,
    saveAvailability,
    saveAvailabilityOverride,
  };
}

// Hook for appointment slots
export function useAppointmentSlots(filters?: {
  startDate?: string;
  endDate?: string;
  status?: "AVAILABLE" | "BOOKED" | "BLOCKED";
}) {
  return useQuery({
    queryKey: ["appointmentSlots", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);
      if (filters?.status) params.append("status", filters.status);

      const { data } = await axios.get(
        `/api/dashboard/appointments/slots?${params.toString()}`
      );
      return data;
    },
  });
}
