"use client";
import React from "react";
import { usePatient } from "@/hooks/use-patient";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import AddPatientForm from "./AddPatientForm";

const AddPatient = () => {
  const { patient, isLoading, error, savePatient } = usePatient();

  // Add error handling
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-medical-600">
        Something went wrong loading your profile.
      </div>
    );
  }

  // Loading state

  if (isLoading) {
    return <LoaderSpinnner />;
  }

  return (
    <div>
      <AddPatientForm
        patient={patient}
        savePatient={savePatient}
        isSubmitting={savePatient.isPending}
      />
    </div>
  );
};

export default AddPatient;
