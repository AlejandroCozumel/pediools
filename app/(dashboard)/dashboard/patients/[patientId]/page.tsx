"use client";
import React from "react";
import { usePatient } from "@/hooks/use-patient";
import { useParams } from "next/navigation";
import LoaderSpinner from "@/components/LoaderSpinnner";
import PatientInformation from "./PatientInformation";

const Patient = () => {
  const params = useParams();
  const patientId = params.patientId as string;

  const {
    patient,
    isLoading: isPatientLoading,
    isError: isPatientError,
    savePatient, // Get the savePatient mutation from the hook
  } = usePatient(patientId);

  if (isPatientError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-medical-600">
        Error loading patient profile.
      </div>
    );
  }

  if (isPatientLoading) {
    return <LoaderSpinner />;
  }

  // Ensure patient exists before rendering
  if (!patient) {
    return <div>No patient found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PatientInformation
        patient={patient}
        savePatient={savePatient} // Pass the mutation to the component
      />
    </div>
  );
};

export default Patient;