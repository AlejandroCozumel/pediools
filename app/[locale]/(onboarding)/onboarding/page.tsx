'use client';
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createDoctor } from "@/app/actions/createDoctor";

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setupDoctor = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await createDoctor();

      if (result.success) {
        router.push("/profile/myprofile");
      } else {
        setError(result.error || "Failed to setup your account");
      }
    } catch (error) {
      console.error("Error creating doctor:", error);
      setError("Failed to setup your account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    setupDoctor();
  }, [setupDoctor]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Setting up your account...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Error</h1>
        <p>{error}</p>
        <button
          className="mt-4 px-4 py-2 bg-medical-500 text-white rounded-md"
          onClick={() => setupDoctor()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return null;
}