import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export function useEmailNotifications(patientId?: string) {
  const queryClient = useQueryClient();

  // Query to fetch email notifications
  const { data, isLoading, error } = useQuery({
    queryKey: patientId
      ? ["patientEmailNotifications", patientId]
      : ["emailNotifications"],
    queryFn: async () => {
      const url = patientId
        ? `/api/dashboard/email-notifications/${patientId}`
        : "/api/dashboard/email-notifications";
      const { data } = await axios.get(url);
      return data;
    },
  });

  // Mutation to resend an email notification
  const resendNotification = useMutation({
    mutationFn: ({
      notificationId,
      patientId,
    }: {
      notificationId: string;
      patientId: string;
    }) =>
      axios.post(`/api/dashboard/email-notifications/${patientId}/resend`, {
        notificationId
      }),
    onSuccess: (_, variables) => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: ["patientEmailNotifications", variables.patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["emailNotifications"],
      });
    },
  });

  // Mutation to delete an email notification
  const deleteNotification = useMutation({
    mutationFn: ({
      notificationId,
      patientId,
    }: {
      notificationId: string;
      patientId: string;
    }) =>
      axios.delete(`/api/dashboard/email-notifications/${patientId}?notificationId=${notificationId}`),
    onSuccess: (_, variables) => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: ["patientEmailNotifications", variables.patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["emailNotifications"],
      });
    },
  });

  return {
    emailNotifications: data,
    isLoading,
    error,
    resendNotification,
    deleteNotification
  };
}