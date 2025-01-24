"use client";
import React from "react";
import { usePatient } from "@/hooks/use-patient";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import AddPatientForm from "./AddPatientForm";
import ErrorMessage from "@/components/Error";

const AddPatient = () => {
  const { patient, isLoading, error, savePatient } = usePatient();

  // Add error handling
  if (error) {
    return <ErrorMessage message={error?.message} />;
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
