import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useCustomerPortal() {
  const router = useRouter();

  const createPortalSession = async () => {
    const response = await fetch("/api/create-portal-session", {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create portal session");
    }

    return response.json();
  };

  const { mutate: openPortal, isPending } = useMutation({
    mutationFn: createPortalSession,
    onSuccess: (data) => {
      if (data.url) {
        router.push(data.url);
      }
    },
    onError: (error) => {
      console.error("Portal session error:", error);
    }
  });

  return {
    openPortal,
    isLoading: isPending
  };
}